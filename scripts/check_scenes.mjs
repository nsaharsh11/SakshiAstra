import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { assertSceneConsistency } from './consistency.mjs';

// The fixture/API modules expose their browser diagnostics on window.
// Supply that surface for this deterministic Node check; no DOM is needed.
globalThis.window = globalThis;
const { api, evaluateClaim, replayEvidence, caseResult, weakestRoute } = await import('../src/api.js');
const { SCENES, CLAIM_TYPES, RULES, PROOF_LEVELS } = await import('../src/scenes.js');
const { BOARD_COPY } = await import('../src/copy.js');
const { PRESENTER } = await import('../src/presenter.js');
const { CLASSIFIER_LABELS, DATASET, HISTORICAL_DATA, textSimilarity, validateHistoricalData } = await import('../src/historical.js');
const { buildChain, verifyChain, canonicalJSON, sha256Hex, GENESIS, toSTIX, caseRows, toCSV, toJSONDoc, buildReportHTML } = await import('../src/ledger.js');

async function assertQueue() {
  const queue = await api.getQueue();
  for (const scene of SCENES) {
    const holds = (await api.getClaimBoard(scene.id)).filter(c => c.verdict === 'HOLD').map(c => c.name);
    assert.deepEqual(queue.find(q => q.scene === scene.id)?.holdClaims || [], holds, scene.id);
  }
}
const collect = api.collect.bind(api);
api.collect = async (...args) => {
  const result = await collect(...args);
  await assertQueue(); // Verify the complete queue after every collection in this suite.
  return result;
};

let checks = 0;
async function check(name, run) {
  await run();
  checks++;
  console.log(`PASS ${name}`);
}

await check('fixture consistency: status equals evaluator; ledger verdicts, missing effects, peaks, counts and dates agree', async () => {
  assertSceneConsistency(SCENES, evaluateClaim, CLAIM_TYPES, PRESENTER);
  const mutations = [
    scenes => { scenes[0].claims.persona_link.status = 'QUESTIONABLE'; },
    scenes => { scenes[0].ledger.find(r => r.act.includes('Persona Link =')).act = 'Verdict set: Persona Link = ASSERT'; },
    scenes => { scenes[0].claims.persona_link.missing[0].effect = 'REJECT → ASSERT'; },
    scenes => { scenes[0].claims.persona_link.peak = 'L3'; },
    scenes => { scenes[0].claims.persona_link.bundles[0].note = '9 signals, 1 origin'; },
    scenes => { scenes[2].claims.key_control.evidence[0].note = 'replayed — first seen 2016-01-06 on Market C'; },
    scenes => { scenes[2].claims.key_control.evidence[1].title = 'Block from 11 weeks earlier'; },
  ];
  for (const mutate of mutations) {
    const scenes = structuredClone(SCENES); mutate(scenes);
    assert.throws(() => assertSceneConsistency(scenes, evaluateClaim, CLAIM_TYPES, PRESENTER));
  }
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(pkg.scripts.prebuild, 'node scripts/check_consistency.mjs');
  const rejected = spawnSync(process.execPath, ['--input-type=module', '-e', `
    globalThis.window = globalThis;
    const { SCENES } = await import('./src/scenes.js');
    SCENES[0].claims.persona_link.status = 'QUESTIONABLE';
    await import('./scripts/check_consistency.mjs');
  `], { encoding: 'utf8' });
  assert.equal(rejected.status, 1);
  assert.match(rejected.stderr, /fixture status differs from evaluator/);
});

await check('replay data: QUESTIONABLE HOLD; all observations questionable; five-week dates and HOLD → ASSERT gaps', async () => {
  const fixture = SCENES.find(s => s.id === 'replay'), claim = fixture.claims.key_control;
  assert.equal(claim.status, 'QUESTIONABLE'); assert.equal(evaluateClaim(claim).verdict, 'HOLD');
  assert.ok(claim.evidence.every(e => e.status === 'questionable'));
  assert.ok(claim.missing.every(gap => gap.effect === 'HOLD → ASSERT'));
  assert.ok(fixture.ledger.some(row => row.act === 'Verdict set: Key Control = HOLD (replay, zero weight)'));
  assert.ok(fixture.caption.includes('5 weeks earlier'));
  assert.ok(fixture.ledger.some(row => row.act.includes('5 weeks earlier')));
  assert.ok(claim.evidence.filter(e => ['Byte comparison', 'Timestamp'].includes(e.kind)).every(e => e.title.includes('5 weeks earlier')));
  const source = readFileSync(new URL('../src/scenes.js', import.meta.url), 'utf8');
  assert.ok(source.includes('SCENE 3 — REPLAYED SIGNATURE  →  QUESTIONABLE / HOLD'));
});

await check('lookalike data: UNVERIFIED L0; one 88% → 24% pair; six observations folded into four signals', async () => {
  const scene = await api.getCase('lookalike'), claim = scene.claims.persona_link;
  assert.equal(claim.status, 'UNVERIFIED'); assert.equal(claim.peak, 'L0');
  assert.equal(SCENES[0].claims.persona_link.status, claim.status);
  const lens = claim.historicalLens;
  assert.deepEqual([lens.raw, lens.independent], [88, 24]);
  const description = claim.evidence.find(e => e.kind === 'Description text');
  assert.ok(description.title.includes('88% raw → 24% after template removal'));
  assert.equal(claim.bundles[0].title, '6 observations · 4 signals · 1 origin — counted once');
  assert.equal(claim.evidence.filter(e => e.origin === claim.bundles[0].id).length, 6);
  assert.equal(claim.bundles[0].items.length, 4);
  for (const file of ['scenes.js', 'presenter.js', 'historical.js', 'copy.js', 'primitives.jsx', 'claimcard.jsx']) {
    const source = readFileSync(new URL('../src/' + file, import.meta.url), 'utf8');
    assert.ok(!/96%|raw=\{96\}|raw = 96/.test(source));
  }
  const primitive = readFileSync(new URL('../src/primitives.jsx', import.meta.url), 'utf8');
  assert.ok(primitive.includes(`raw = ${lens.raw}, independent = ${lens.independent}`));
  const card = readFileSync(new URL('../src/claimcard.jsx', import.meta.url), 'utf8');
  assert.ok(card.includes(`raw={${lens.raw}} independent={${lens.independent}}`));
});

await check('captions: scene and presenter share exactly the same short caption; no scene-1 comparison', async () => {
  for (const scene of SCENES) {
    assert.equal(scene.caption, PRESENTER.find(p => p.scene === scene.id).caption);
    assert.ok(scene.caption.split(/\s+/).length <= 15);
  }
  assert.ok(!SCENES[1].caption.includes('three in scene 1'));
});

await check('hosting text: service-header descriptor inconsistency; ASSERT supported by certificate + server-status leak', async () => {
  const scene = SCENES.find(s => s.id === 'hosting'), claim = scene.claims.hosting_link;
  assert.equal(claim.evidence.find(e => e.kind === 'Descriptor').title, 'Descriptor inconsistency with service headers');
  assert.ok(!JSON.stringify(scene).includes('Onionoo'));
  for (const text of [scene.caption, claim.summary, BOARD_COPY.hosting]) {
    assert.match(text, /certificate \+ server-status leak/i); assert.ok(!text.includes('rare finding alone'));
  }
  assert.equal(evaluateClaim(claim).verdict, 'ASSERT');
});

await check('takeover documentation: outlined amber; no stale colour comments', async () => {
  for (const file of ['scenes.js', 'tokens.css', 'app.css']) {
    const source = readFileSync(new URL('../src/' + file, import.meta.url), 'utf8');
    assert.ok(!/\bviolet\b/i.test(source));
  }
  const css = readFileSync(new URL('../src/app.css', import.meta.url), 'utf8');
  assert.match(css, /\.v-takeover \{[^}]*background: var\(--color-surface\)[^}]*border: 1\.5px solid var\(--color-takeover\)/);
});

await check('repository hygiene: raw data and keys ignored; README records completed restyle and requirement-to-screen table', async () => {
  const targets = ['data/raw/Agora.csv', 'keys/private.asc', 'private.pem', 'private.key', 'private.p12', 'private.pfx', 'private.gpg', '.env', '.ssh/id_ed25519'];
  const ignored = spawnSync('git', ['check-ignore', '--no-index', '--stdin'], { input: targets.join('\n') + '\n', encoding: 'utf8' });
  assert.equal(ignored.status, 0, ignored.stderr);
  assert.deepEqual(ignored.stdout.trim().split(/\r?\n/), targets);
  const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8');
  assert.ok(readme.includes('The restyle is complete'));
  assert.ok(readme.includes('| Requirement | Screen |'));
  assert.ok(!readme.includes('ready for the later restyle round'));
});

await check('lookalike: HOLD; one copied bundle, max cost 0', async () => {
  const s = await api.getCase('lookalike');
  assert.equal(s.verdict, 'HOLD');
  const c = s.claims.persona_link;
  assert.equal(c.claimVerdict, 'HOLD');
  assert.equal(c.bundles.length, 1);
  assert.equal(c.bundles[0].countsOnce, true);
  const members = c.evidence.filter(e => e.origin === c.bundles[0].id);
  assert.equal(c.bundles[0].cost, Math.max(...members.map(e => e.cost)));
  assert.equal(c.bundles[0].cost, 0);
  const group = { bundles: [{ id: 'test', countsOnce: true, cost: 100 }],
    evidence: [1, 3, 4].map(cost => ({ cost, origin: 'test', level: 'L2', status: 'verified' })) };
  assert.match(evaluateClaim(group).why, /^1 persona-bound/);
});

await check('genuine: Key Control · ASSERT; weakest route = persona-bound signature, cost 4', async () => {
  const s = await api.getCase('genuine');
  assert.equal(s.claims.key_control.claimVerdict, 'ASSERT');
  assert.equal(caseResult(s).label, 'Key Control · ASSERT');
  assert.equal(weakestRoute(s).kind, 'Signed message');
  assert.equal(weakestRoute(s).level, 'L2');
  assert.equal(weakestRoute(s).cost, 4);
});

await check('replay: L0 HOLD; signature cost 0; first-seen date and market', async () => {
  const s = await api.getCase('replay');
  assert.equal(s.verdict, 'HOLD');
  const c = s.claims.key_control;
  assert.equal(c.claimVerdict, 'HOLD');
  assert.equal(c.peak, 'L0');
  for (const e of [c.evidence[0], replayEvidence('2016-08-21')]) {
    assert.equal(e.level, 'L0'); assert.equal(e.cost, 0);
    assert.ok(e.flags.includes('replayed_signature'));
    assert.match(e.note, /^replayed — first seen \d{4}-\d{2}-\d{2} on Market C$/);
  }
});

await check('wallet ladder: HOLD → ASSERT after fresh control collection', async () => {
  assert.equal((await api.getCase('ladder')).claims.wallet_control.claimVerdict, 'HOLD');
  assert.equal((await api.collect('ladder', 'wallet_control', 0)).ok, true);
  const c = (await api.getCase('ladder')).claims.wallet_control;
  assert.equal(c.claimVerdict, 'ASSERT'); assert.equal(c.peak, 'L3');
});

await check('takeover: Key Control · ASSERT; Same Operator L1 HOLD; change-point 14 March', async () => {
  const s = await api.getCase('takeover');
  assert.equal(s.claims.key_control.claimVerdict, 'ASSERT');
  assert.equal(s.claims.same_operator.claimVerdict, 'HOLD');
  assert.equal(caseResult(s).label, 'Key Control · ASSERT');
  assert.equal(s.claims.same_operator.peak, 'L1');
  assert.ok(s.claims.same_operator.evidence.every(e => e.level === 'L1' && e.kind !== 'Signed message'));
  assert.equal(s.continuity.changeLabel, '2016-03-14');
  assert.ok(s.claims.same_operator.evidence.some(e => e.kind === 'Change-point' && e.found === '2016-03-14'));
  assert.equal(s.caption, 'Key unchanged: key control holds. Behaviour changed: operator not confirmed.');
});

await check('hosting: Hosting Link · ASSERT; cert route cost 4; common asset discounted', async () => {
  const s = await api.getCase('hosting');
  assert.equal(s.claims.hosting_link.claimVerdict, 'ASSERT');
  assert.equal(caseResult(s).label, 'Hosting Link · ASSERT');
  assert.equal(weakestRoute(s).cost, 4);
  assert.equal(weakestRoute(s).kind, 'TLS certificate');
  const evidence = s.claims.hosting_link.evidence;
  assert.ok(evidence.some(e => e.detail.includes('/server-status') || e.title.includes('/server-status')));
  assert.ok(evidence.some(e => e.title.includes('203.0.113.14')));
  assert.ok(evidence.some(e => e.kind === 'Descriptor'));
  assert.match(evidence.find(e => e.kind === 'Favicon hash').title, /discounted — common asset/);
  assert.match(evidence.find(e => e.kind === 'Favicon hash').discount, /2\.3M hosts/);
});

await check('ring: Vouches discounted · trust weight 0; narration matches 5 graph nodes', async () => {
  const s = await api.getCase('ring');
  assert.equal(s.claims.persona_link.trustWeight, 0);
  assert.equal(s.verdict, 'HOLD');
  assert.equal(caseResult(s).label, 'Vouches discounted · trust weight 0');
  assert.equal(s.graph.nodes.length, 5);
  assert.ok(s.caption.startsWith(`${s.graph.nodes.length} graph nodes:`));
});

await check('resolve: item 1 changes Persona Link + Key Control HOLD → ASSERT', async () => {
  assert.equal((await api.getCase('resolve')).claims.persona_link.claimVerdict, 'HOLD');
  assert.equal((await api.getCase('resolve')).claims.key_control.claimVerdict, 'HOLD');
  assert.equal((await api.collect('resolve', 'persona_link', 0)).ok, true);
  const s = await api.getCase('resolve');
  assert.equal(s.verdict, 'ASSERT'); assert.equal(s.claims.persona_link.claimVerdict, 'ASSERT');
  assert.equal(s.claims.key_control.claimVerdict, 'ASSERT');
  assert.equal((await api.getClaimBoard('resolve')).find(c => c.id === 'persona_link').verdict, 'ASSERT');
});

await check('provenance: all planted items FIXTURE; markets anonymised A/B/C', async () => {
  for (const scene of SCENES) {
    const s = await api.getCase(scene.id);
    assert.equal(s.source_level, 'FIXTURE');
    for (const subject of s.subjects) assert.match(subject.market, /^Market [ABC]$/);
    for (const c of Object.values(s.claims)) for (const e of c.evidence) {
      assert.equal(e.source_level, 'FIXTURE');
      assert.equal(e.source.source_level, 'FIXTURE');
      assert.equal(e.source.label, 'FIXTURE');
      if (e.historical_text) {
        assert.equal(e.historical_text.source_level, 'HISTORICAL');
        assert.equal(e.historical_text.source, DATASET);
        assert.deepEqual(e.sources.map(source => source.label), ['FIXTURE', 'HISTORICAL']);
      }
    }
  }
});

await check('historical text: scrubbed identifiers; cited dataset; template_3; category never changes verdicts', async () => {
  assert.equal(validateHistoricalData(), true);
  assert.equal(HISTORICAL_DATA.template.group_id, 'template_3');
  assert.ok(HISTORICAL_DATA.template.variants.every(text => text.startsWith("!!! PLEASE READ !!! Dear Costumer ***ALL ORDER's REQUIERE FE***")));
  assert.ok(CLASSIFIER_LABELS.includes('terror_financing'));
  assert.ok(HISTORICAL_DATA.listings.every(row => row.category !== 'terror_financing'));
  const walk = value => {
    if (Array.isArray(value)) value.forEach(walk);
    else if (value && typeof value === 'object') {
      if (value.source_level === 'HISTORICAL') assert.equal(validateHistoricalData(value), true);
      Object.values(value).forEach(walk);
    }
  };
  for (const scene of SCENES) {
    walk(scene);
    const record = scene.listingContext;
    assert.match(record.market, /^Market [ABC]$/);
    assert.ok(scene.subjects.some(subject => subject.handle === record.persona));
    assert.equal(record.category, record.historical_text.category);
    assert.equal(record.supporting_terms.length, 3);
    for (const claim of Object.values(scene.claims)) {
      const before = evaluateClaim(claim);
      const after = evaluateClaim({ ...claim, category: 'terror_financing', listingContext: { category: 'arms' } });
      for (const field of ['verdict', 'status', 'peak', 'rule']) assert.equal(before[field], after[field]);
    }
  }
  const lens = SCENES[0].claims.persona_link.historicalLens;
  assert.equal(lens.raw, textSimilarity(...lens.texts));
  assert.equal(lens.independent, textSimilarity(...lens.texts.map(text => text.replace(lens.template, '').trim())));
  assert.ok(lens.raw > lens.independent);
  for (const bad of ['example@example.net', 'example.onion', '1BoatSLRHtKNngkdXEeobR76b53LETtpyT', 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', '-----BEGIN PGP PUBLIC KEY BLOCK-----']) {
    assert.throws(() => validateHistoricalData({ sample: bad }));
  }
  assert.throws(() => validateHistoricalData({ source_level: 'HISTORICAL', source: 'uncited', text: 'generic listing' }));
});

await check('locked rules: every cited rule has a short title, including R6 and R8', async () => {
  assert.ok(RULES.some(r => r.id === 'R6')); assert.ok(RULES.some(r => r.id === 'R8'));
  for (const r of RULES) assert.ok(r.title && r.title.split(/\s+/).length <= 6);
  for (const scene of SCENES) for (const c of Object.values((await api.getCase(scene.id)).claims)) {
    assert.ok(RULES.some(r => r.id === c.rule));
  }
});

await check('ladder: distinct pasted / signed-unbound / persona-bound / fresh labels', async () => {
  assert.deepEqual(PROOF_LEVELS.map(p => p.desc), ['pasted', 'signed, unbound', 'persona-bound', 'fresh (recent block hash / challenge)']);
});

await check('presenter: 8 distinct scenes; each caption single-line, at most 15 words', async () => {
  assert.equal(PRESENTER.length, 8); assert.equal(new Set(PRESENTER.map(p => p.scene)).size, 8);
  for (const p of PRESENTER) { assert.ok(!p.caption.includes('\n')); assert.ok(p.caption.split(/\s+/).length <= 15); }
});

await check('ledger: seq + canonical JSON; zero genesis; one-byte tamper fails at row', async () => {
  const { rows } = await buildChain([{ act: 'Original entry', actor: 'analyst.a' }, { act: 'Next entry', actor: 'system' }]);
  assert.equal(rows[0].prev_hash, GENESIS);
  assert.equal(GENESIS, '0'.repeat(64));
  assert.equal(rows[0].hash, await sha256Hex(GENESIS + canonicalJSON({ act: 'Original entry', actor: 'analyst.a', seq: 1 })));
  assert.equal((await verifyChain(rows)).verified, true);
  const tamper = await verifyChain(rows, 1);
  assert.equal(tamper.verified, false); assert.equal(tamper.firstBadIndex, 1);
});

await check('STIX: deterministic content IDs; relationship + opinion per opened claim', async () => {
  for (const fixture of SCENES) {
    const s = await api.getCase(fixture.id);
    const rows = await api.getLedger(fixture.id);
    const text = await toSTIX(s, rows);
    assert.equal(text, await toSTIX(s, rows));
    const bundle = JSON.parse(text);
    const count = Object.keys(s.claims).length;
    assert.equal(bundle.objects.filter(o => o.type === 'relationship').length, count);
    assert.equal(bundle.objects.filter(o => o.type === 'opinion').length, count);
    const ids = new Set(bundle.objects.map(o => o.id));
    for (const o of [bundle, ...bundle.objects]) {
      assert.match(o.id, /^[a-z-]+--[a-f0-9]{8}-[a-f0-9]{4}-5[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/);
      assert.equal(o.confidence, undefined);
      for (const ref of [...(o.object_refs || []), ...[o.source_ref, o.target_ref].filter(Boolean)]) assert.ok(ids.has(ref));
    }
  }
});

await check('queue: current HOLD claims in every scene and after every collect action', async () => {
  for (const scene of SCENES) await api.resetRedteam(scene.id);
  await assertQueue();
  for (const scene of SCENES) {
    const actions = Object.entries(scene.claims).flatMap(([id, claim]) =>
      (claim.missing || []).flatMap((gap, index) => gap.collectible === false ? [] : [[id, index]]));
    for (const [id, index] of actions) {
      assert.equal((await api.collect(scene.id, id, index)).ok, true);
      await api.resetRedteam(scene.id);
    }
  }
});

await check('all exports: every Agora record retains mixed provenance and dataset citation, including print/PDF', async () => {
  for (const fixture of SCENES) {
    const scene = await api.getCase(fixture.id), ledger = await api.getLedger(fixture.id);
    const outputs = [toJSONDoc(scene, ledger), toCSV(caseRows(scene)), await toSTIX(scene, ledger), buildReportHTML(scene, ledger, { ok: true })];
    const historical = [scene.listingContext, ...Object.values(scene.claims).flatMap(c => [...c.evidence.filter(e => e.historical_text), ...(c.historicalLens ? [c.historicalLens] : [])])];
    for (const output of outputs) {
      assert.ok(output.includes('FIXTURE'));
      assert.ok(output.includes('HISTORICAL · ' + DATASET));
      for (const record of historical) {
        // Both text and citation must survive in every format, including escaped CSV/STIX/HTML.
        const text = record.historical_text.text || record.historical_text.description;
        const fragment = text.slice(0, 30);
        const encoded = [fragment, JSON.stringify(fragment).slice(1, -1)];
        encoded.push(JSON.stringify(encoded[1]).slice(1, -1));
        assert.ok(encoded.some(value => output.includes(value) || output.includes(value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;'))), fixture.id + ': missing historical text');
        assert.ok(output.includes(DATASET));
      }
    }
    const json = JSON.parse(outputs[0]);
    assert.equal(json.listing_context.provenance, 'FIXTURE · HISTORICAL · ' + DATASET);
    const rows = caseRows(scene).filter(row => row.historical_text);
    assert.equal(rows.length, historical.length);
    for (const row of rows) assert.equal(row.source_badge, 'FIXTURE · HISTORICAL · ' + DATASET);
    const notes = JSON.parse(outputs[2]).objects.filter(o => o.type === 'note').map(o => JSON.parse(o.content));
    for (const note of notes) for (const record of [note.listing_context, note.historical_lens, ...(note.evidence || [])].filter(r => r?.historical_text))
      assert.equal(record.provenance, 'FIXTURE · HISTORICAL · ' + DATASET);
  }
});

await check('case 4 reset: evidence and tracking restored together; cases 1–3 and 5–8 unchanged', async () => {
  for (const scene of SCENES) await api.resetRedteam(scene.id);
  const initial = await api.getCase('ladder');
  await api.collect('lookalike', 'persona_link', 0);
  await api.collect('resolve', 'persona_link', 0);
  await api.collect('ladder', 'wallet_control', 0);
  const others = await Promise.all(SCENES.filter(s => s.id !== 'ladder').map(async s => ({ id: s.id, scene: await api.getCase(s.id), ledger: await api.getLedger(s.id) })));
  await api.redteam('ladder', 'replay-signature');
  const result = await api.resetRedteam('ladder');
  assert.deepEqual(await api.getCase('ladder'), initial);
  assert.deepEqual(result.collected, ['lookalike:persona_link:0', 'resolve:persona_link:0']);
  for (const before of others) {
    assert.deepEqual(await api.getCase(before.id), before.scene);
    assert.deepEqual(await api.getLedger(before.id), before.ledger);
  }
  // A fresh collection must add the evidence again, proving deduplication tracking reset too.
  assert.ok((await api.collect('ladder', 'wallet_control', 0)).added);
  assert.equal((await api.getCase('ladder')).claims.wallet_control.claimVerdict, 'ASSERT');
  assert.equal((await api.collect('lookalike', 'persona_link', 0)).added, null);
});

await check('lookalike: caption, board, bundle and presenter all count the four copied members', async () => {
  const scene = await api.getCase('lookalike'), bundle = scene.claims.persona_link.bundles[0];
  assert.equal(bundle.items.length, 4);
  const caption = '4 signals, 1 origin — counted once.';
  for (const text of [scene.caption, BOARD_COPY.lookalike, bundle.note, PRESENTER.find(p => p.scene === 'lookalike').caption]) {
    assert.ok(text.includes(caption));
    assert.equal(Number(text.match(/(\d+) signals/)[1]), bundle.items.length);
  }
});

console.log(`${checks}/${checks} checks passed.`);
