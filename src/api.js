import { ATTACKS, CLAIM_TYPES, COST, PROOF_LEVELS, RULES, SCENES, SRC } from './scenes.js';
import { buildChain, buildReportHTML, caseRows, downloadBlob, printReport, sha256Available, sha256Hex, toCSV, toJSONDoc, toSTIX, verifyChain } from './ledger.js';
/* =====================================================================
   SakshiAstra — data layer
   ---------------------------------------------------------------------
   The ONLY place the UI touches data. In the prototype it resolves from
   local fixtures; set MOCK = false and every call goes to the real API.
   Response shapes are identical either way, so no screen code changes.

   Determinism: every id
   is derived from a seeded 32-bit FNV-1a hash of a stable string, so a
   given case always produces the same job ids, ledger hashes and
   decision references. Two runs of the demo are byte-identical, which is
   what makes the pytest scenarios in SPEC.md assertable.
   ===================================================================== */

const MOCK = true;
const API_BASE = '/api';

const delay = (ms) => new Promise((r) => setTimeout(r, ms));
function clone(v) { return JSON.parse(JSON.stringify(v)); }

/* ---------- deterministic ids ---------- */
function fnv1a(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}
function seededHex(seed, len = 8) {
  let out = '';
  let h = fnv1a(seed);
  while (out.length < len) {
    h = Math.imul(h ^ (h >>> 13), 0x5bd1e995) >>> 0;
    out += h.toString(16).padStart(8, '0');
  }
  return out.slice(0, len);
}
function jobId(seed) { return 'job_' + seededHex(seed, 10); }

const store = {
  scenes: SCENES,
  applied: new Set(),
  collected: new Set(),
  /* per-case append-only event log. These are the entry BODIES; the
     hashes are computed for real in getLedger(). */
  events: {},
  approvals: {},
  revealed: new Set(),
};
const initialScenes = new Map(SCENES.map(scene => [scene.id, clone(scene)]));

/* ---------- seed events, derived from the scene, deterministically ---------- */
function seedEvents(scene) {
  if (store.events[scene.id]) return;
  const ev = [];
  let t = 0;
  const stamp = (base) => {
    const d = new Date(base.replace(' ', 'T') + ':00Z');
    d.setUTCMinutes(d.getUTCMinutes() + t);
    t += 1;
    return d.toISOString().replace('T', ' ').slice(0, 16);
  };
  ev.push({ act: 'Case opened', actor: scene.case.analyst, at: stamp(scene.case.opened), case_id: scene.case.id });
  (scene.ledger || []).forEach((r) => {
    ev.push({ act: r.act, actor: r.actor, at: r.at, case_id: scene.case.id });
  });
  ev.push({ act: 'Result recorded: ' + caseResult(scene).label, actor: 'system', at: stamp(scene.case.opened), case_id: scene.case.id });
  store.events[scene.id] = ev.map((entry, index) => ({ ...entry, seq: index + 1 }));
}

function logEvent(sceneId, act, actor) {
  const scene = store.scenes.find((s) => s.id === sceneId);
  if (!scene) return null;
  seedEvents(scene);
  const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
  const entry = { act, actor, at: now, case_id: scene.case.id, seq: store.events[sceneId].length + 1 };
  store.events[sceneId].push(entry);
  return entry;
}

/* =====================================================================
   Verdict engine — rule-based. Never a weighted sum, never a scalar.
   ===================================================================== */
function evaluateClaim(claim) {
  const all = claim.evidence || [];

  /* flagged-zero: evidence carrying a zero-weight flag is EXCLUDED from
     evaluation entirely. It is still displayed, because showing it is the
     point, but it cannot contribute proof weight or raise the peak proof
     level. A replayed signature is the canonical case: it verifies
     cryptographically and establishes nothing, because it was not made
     for this persona. */
  const replayOrigins = new Set(all.filter((e) => (e.flags || []).includes('replayed_signature')).map((e) => e.origin));
  const zero = all.filter((e) => (e.flags || []).includes('replayed_signature') || replayOrigins.has(e.origin));
  const counted = new Set();
  const ev = all.filter((e) => !zero.includes(e) && !(e.flags || []).some((flag) => ['common_indicator', 'context_only'].includes(flag))).flatMap((e) => {
    const bundle = (claim.bundles || []).find((b) => b.id === e.origin && b.countsOnce);
    if (!bundle) return [e];
    if (counted.has(bundle.id)) return [];
    counted.add(bundle.id);
    const members = all.filter((item) => item.origin === bundle.id);
    const cost = Math.max(...members.map((item) => item.cost || 0));
    if (cost === 0) return [];
    const status = members.some((item) => item.status === 'contradicted') ? 'contradicted'
      : members.some((item) => item.status === 'questionable') ? 'questionable'
      : members.some((item) => item.status === 'verified') ? 'verified' : e.status;
    return [{ ...e, cost, level: peakLevel(members), status }];
  });

  const zeroNote = zero.length
    ? ' Replayed signatures and their artifact observations are excluded from proof weight: a replay verifies but was not made for this persona.'
    : '';

  if (!ev.length) {
    return {
      status: zero.length ? 'QUESTIONABLE' : 'UNVERIFIED', verdict: 'HOLD',
      peak: 'L0', rule: zero.length ? 'R8' : 'R6', zero,
      why: (zero.length
        ? 'The only material here is a replayed signature. A replay is real cryptography applied to the wrong question, so it cannot carry the claim.'
        : 'No evidence in the claim. Absence is not assent.') + zeroNote,
    };
  }

  const contra = ev.filter((e) => e.status === 'contradicted');
  if (contra.length) {
    return {
      status: 'CONTRADICTED', verdict: 'REJECT', peak: peakLevel(ev), rule: 'R1', zero,
      why: `${contra.length} piece${contra.length > 1 ? 's' : ''} of evidence ${contra.length > 1 ? 'contradict' : 'contradicts'} this claim. Contradiction is not averaged against supporting weight.` + zeroNote,
    };
  }

  if (claim.takeover) {
    return {
      status: claim.status, verdict: 'HOLD', peak: peakLevel(ev), rule: 'R2', zero,
      why: 'A takeover flag caps this claim at HOLD: the key is valid, continuity of the operator is not established.' + zeroNote,
    };
  }

  const carriesWeight = ev.some((e) => e.status === 'verified' || e.status === 'supported');
  if (!carriesWeight) {
    return {
      status: zero.length ? 'QUESTIONABLE' : 'UNVERIFIED', verdict: 'HOLD',
      peak: peakLevel(ev), rule: zero.length ? 'R8' : 'R6', zero,
      why: `${ev.length} item${ev.length > 1 ? 's' : ''} present, none of them verified or supported. A pasted string carries no weight until something binds it. Absence is not assent.` + zeroNote,
    };
  }

  const bound = ev.filter((e) => lvl(e.level) >= 2 && e.status === 'verified');
  const allCopyable = ev.every((e) => e.cost <= 3);
  if (!bound.length && allCopyable) {
    return {
      status: ev.some((e) => e.status === 'questionable') ? 'QUESTIONABLE' : 'SUPPORTED',
      verdict: 'HOLD', peak: peakLevel(ev), rule: 'R5', zero,
      why: 'Every item here is copyable — text, style or timing. Copyable evidence is capped at SUPPORTED by rule and cannot reach ASSERT.' + zeroNote,
    };
  }

  if (claim.requiresFreshControl && !ev.some((e) => e.level === 'L3' && e.status === 'verified')) {
    return { status: 'SUPPORTED', verdict: 'HOLD', peak: peakLevel(ev), rule: 'R4', zero,
      why: 'Wallet control is attested but not demonstrated. A fresh funds move is required before ASSERT.' + zeroNote };
  }

  if (bound.length && !ev.some((e) => e.status === 'questionable')) {
    return {
      status: 'VERIFIED', verdict: 'ASSERT', peak: peakLevel(ev), rule: 'R4', zero,
      why: `${bound.length} persona-bound or fresher bundle${bound.length > 1 ? 's' : ''}, and nothing questionable. This is what ASSERT requires.` + zeroNote,
    };
  }

  return {
    status: 'SUPPORTED', verdict: 'HOLD', peak: peakLevel(ev), rule: 'R4', zero,
    why: (bound.length
      ? 'Something in this claim is still QUESTIONABLE, so it cannot reach ASSERT even though a bound bundle is present.'
      : 'Supporting evidence only. Nothing here binds a persona, so the claim cannot reach ASSERT.') + zeroNote,
  };
}

function lvl(code) { return parseInt(String(code).replace('L', ''), 10) || 0; }
function peakLevel(ev) { return ev.filter((e) => e.status !== 'contradicted').reduce((m, e) => (lvl(e.level) > lvl(m) ? e.level : m), 'L0'); }

function caseResult(scene) {
  const primary = { lookalike: 'persona_link', genuine: 'key_control', replay: 'key_control',
    ladder: 'wallet_control', takeover: 'key_control', hosting: 'hosting_link', resolve: 'persona_link' };
  const claimId = primary[scene.id] || Object.keys(scene.claims)[0];
  const claim = scene.claims[claimId];
  const verdict = evaluateClaim(claim).verdict;
  const name = CLAIM_TYPES.find((ct) => ct.id === claimId).name;
  return { claimId, verdict, label: `${name} · ${verdict}` };
}

function weakestRoute(scene) {
  const result = caseResult(scene);
  const claim = scene.claims[result.claimId];
  const evidence = claim ? claim.evidence : Object.values(scene.claims).flatMap(c => c.evidence || []);
  const eligible = result.verdict === 'ASSERT'
    ? evidence.filter(e => e.status === 'verified' && lvl(e.level) >= 2 && e.cost > 0 &&
      !(e.flags || []).some(flag => ['common_indicator', 'context_only', 'replayed_signature'].includes(flag)))
    : evidence;
  return eligible.slice().sort((a, b) => a.cost - b.cost || lvl(a.level) - lvl(b.level))[0] || null;
}

/* =====================================================================
   Suspect-entity ladder.
   Mentioned → Low-cost link → High-cost link → Analyst-confirmed.
   The last step is human-only: the system can compute the first three and
   must refuse to produce the fourth on its own.
   ===================================================================== */
const SUSPECT_STEPS = [
  { id: 'mentioned', label: 'Mentioned', by: 'system', note: 'Handle appears in the record. Nothing is asserted about who is behind it.' },
  { id: 'low_cost', label: 'Low-cost link', by: 'system', note: 'Linked by evidence that is cheap to fake. Enough to open a line of enquiry.' },
  { id: 'high_cost', label: 'High-cost link', by: 'system', note: 'Linked by evidence requiring a private key or an un-forgeable signature.' },
  { id: 'confirmed', label: 'Analyst-confirmed', by: 'human', note: 'A named analyst has confirmed the link. Two signatures are required to release it.' },
];

function suspectLadder(scene) {
  /* the rung reached is the highest rung the evidence genuinely supports —
     driven by the strongest ASSERT across the case, never by a score */
  const verdicts = Object.values(scene.claims).map((c) => c.claimVerdict);
  const peaks = Object.values(scene.claims).map((c) => c.peak);
  const costs = Object.values(scene.claims).flatMap((c) => (c.evidence || []).map((e) => e.cost));
  const anyAssert = verdicts.includes('ASSERT');
  const maxPeak = peaks.reduce((m, p) => (lvl(p) > lvl(m) ? p : m), 'L0');
  let reached = 'mentioned';
  if (costs.some((c) => c <= 3)) reached = 'low_cost';
  if (anyAssert && lvl(maxPeak) >= 2) reached = 'high_cost';
  return {
    reached,
    steps: SUSPECT_STEPS.map((s, i) => ({ ...s, index: i, done: SUSPECT_STEPS.findIndex((x) => x.id === reached) >= i, blocked: s.by === 'human' })),
    note: 'The system computes the first three rungs. The fourth is a human act and has no automated route — an identity conclusion is not a computation.',
  };
}

/* =====================================================================
   Actor profile + collection schedule
   ===================================================================== */
function actorProfile(scene) {
  const ids = [];
  const infra = [];
  const linkages = [];
  (scene.graph ? scene.graph.nodes : []).forEach((n) => {
    const row = { label: n.label, kind: n.kind, market: n.market || null };
    if (n.kind === 'persona') ids.push(row);
    else if (n.kind === 'key') ids.push(row);
    else if (n.kind === 'wallet') ids.push(row);
    else if (n.kind === 'artifact') linkages.push(row);
  });
  (scene.candidateOrigins || []).forEach((o) => infra.push(o));
  (scene.graph ? scene.graph.edges : []).forEach((e) => {
    linkages.push({ from: e.from, to: e.to, label: e.label, status: e.status });
  });
  const categories = scene.listingContext ? [scene.listingContext.category] : (scene.category || ['unspecified activity']);
  return {
    caseId: scene.case.id,
    identifiers: ids,
    infrastructure: infra,
    linkages,
    claims: Object.entries(scene.claims).map(([cid, c]) => ({
      id: cid,
      name: (CLAIM_TYPES.find((t) => t.id === cid) || {}).name,
      verdict: c.claimVerdict, status: c.status, peak: c.peak, rule: c.rule,
    })),
    category: categories,
    categoryTerms: scene.listingContext?.supporting_terms || [],
    listingContext: scene.listingContext || null,
    lastScan: scene.lastScan || scene.case.opened,
    sources: [...new Set(['FIXTURE', ...(scene.listingContext ? ['HISTORICAL'] : []), ...Object.values(scene.claims).flatMap((c) => (c.evidence || []).flatMap((e) => (e.sources || [e.source]).map(source => source?.label))).filter(Boolean)])],
    piiRedacted: true,
  };
}

/* Collection schedule. Scans are fixture-labelled and their ordering is
   computed, not authored: a scan is ranked by how many HOLD claims it
   would resolve, which is why the list can change when evidence lands. */
function collectionSchedule(scene) {
  const holds = Object.entries(scene.claims).filter(([, c]) => c.claimVerdict === 'HOLD');
  const targetOf = {
    key_control: 'keyserver + recent signed blocks',
    wallet_control: 'chain activity on declared addresses',
    persona_link: 'forum archive for signed attestations',
    hosting_link: 'clearnet origin scan (authorised ranges)',
    same_operator: 'behavioural continuity window',
  };
  const scans = Object.entries(scene.claims).map(([cid, c], i) => {
    const resolves = holds.filter(([hcid]) => hcid === cid).length;
    const tier1 = (c.missing || []).filter((m) => m.tier === 1).length;
    return {
      id: 'scan_' + seededHex(scene.id + cid, 6),
      claim: cid,
      claimName: (CLAIM_TYPES.find((t) => t.id === cid) || {}).name,
      target: targetOf[cid] || 'evidence collection',
      resolves,
      tier1,
      lastRun: scene.case.opened,
      nextRun: scene.nextScans ? scene.nextScans[i % (scene.nextScans.length || 1)] : scene.case.opened,
      status: resolves ? 'queued' : 'idle',
      source: SRC.fixture,
    };
  });
  scans.sort((a, b) => (b.resolves - a.resolves) || (b.tier1 - a.tier1));
  return { scans, holdCount: holds.length, basis: 'Ranked by the number of HOLD claims the scan would resolve.' };
}

/* =====================================================================
   Intake scope allow-list.
   Anything outside the list is refused, with a reason, and the refusal is
   logged. The list is short on purpose.
   ===================================================================== */
const INTAKE_SCOPE = [
  { id: 'pgp', label: 'OpenPGP signed message or key block', test: /-----BEGIN PGP|pub\s+[0-9a-f]{16}|BEGIN PGP SIGNED MESSAGE/i },
  { id: 'wallet', label: 'Bitcoin address or signed wallet declaration', test: /\b(bc1[a-z0-9]{8,}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})\b/ },
  { id: 'handle', label: 'Marketplace or forum handle', test: /\b(alias|handle|vendor|nick)\b/i },
  { id: 'listing', label: 'Vendor listing or market page excerpt', test: /\b(escrow|listing|dispatch|FE available|shipping)\b/i },
  { id: 'onionoo', label: 'Onionoo relay metadata', test: /\b(onionoo|relay family|fingerprint)\b/i },
  { id: 'cert', label: 'TLS certificate or certificate transparency entry', test: /\b(certificate|SAN|CN=|x509|serial)\b/i },
  { id: 'analyst_note', label: 'Analyst note', test: /\b(note|observation|analyst)\b/i },
];

const OUT_OF_SCOPE_PATTERNS = [
  { id: 'live_scrape', label: 'live marketplace scrape request', test: /\b(scrape|crawl live|log in to|my account on)\b/i },
  { id: 'real_pii', label: 'real personal data (name, address, phone, government id)', test: /\b(phone|address|passport|aadhaar|ssn|national id|residential)\b/i },
  { id: 'face', label: 'facial image or biometric input', test: /\b(photo|selfie|face|biometric|fingerprint image)\b/i },
  { id: 'other_case', label: 'record belonging to another case', test: /\bcase[- ]sa-26151-000[1-9]\b(?!.*this)/i },
];

Object.assign(window, { SUSPECT_STEPS, INTAKE_SCOPE });

/* =====================================================================
   The mocked API
   ===================================================================== */
const api = {
  async listCases() {
    await delay(40);
    return store.scenes.map((s) => ({
      id: s.case.id, scene: s.id, title: s.title, verdict: s.verdict,
      claims: Object.keys(s.claims).length, opened: s.case.opened, analyst: s.case.analyst,
    }));
  },

  async getCase(sceneId) {
    await delay(60);
    const scene = store.scenes.find((s) => s.id === sceneId) || store.scenes[0];
    const out = clone(scene);
    out.piiRevealed = store.revealed.has(sceneId);
    out.claims = Object.fromEntries(
      Object.entries(out.claims).map(([k, c]) => {
        const folded = applyFolds(c, store.applied, scene.id, null);
        const ev = evaluateClaim(folded);
        const missing = ev.rule === 'R2'
          ? (folded.missing || []).map(gap => ({ ...gap, effect: 'HOLD → HOLD (capped by R2)' }))
          : folded.missing;
        return [k, { ...folded, missing, claimVerdict: ev.verdict, rule: ev.rule, why: ev.why, peak: ev.peak, status: ev.status, zeroWeight: ev.zero }];
      }),
    );
    out.suspectLadder = suspectLadder(out);
    // Resolve changes the case only after collected evidence clears the rule engine.
    if (scene.id === 'resolve') out.verdict = out.claims.persona_link.claimVerdict;
    if (scene.id === 'replay') out.verdict = out.claims.key_control.claimVerdict;
    if (scene.id === 'ladder') out.verdict = out.claims.wallet_control.claimVerdict;
    if (scene.id === 'ring') out.verdict = caseResult(out).verdict;
    return out;
  },

  async getClaimBoard(sceneId) {
    const s = await api.getCase(sceneId);
    return CLAIM_TYPES.map((ct) => {
      const c = s.claims[ct.id];
      const present = !!c;
      /* Every claim held at HOLD gets a ranked would-change list — including
         claims that were never opened on this case, because an unexamined
         question still has a cheapest next step. */
      const verdict = c ? c.claimVerdict : 'HOLD';
      const missing = c && c.missing && c.missing.length
        ? c.missing
        : defaultMissing(ct.id);
      return {
        ...ct,
        present,
        verdict,
        peak: c ? c.peak : 'L0',
        status: c ? c.status : 'UNVERIFIED',
        takeover: c ? !!c.takeover : false,
        summary: c ? c.summary : 'GAP — no evidence. Claim not yet opened for this type on this case.',
        evidenceCount: c ? c.evidence.length : 0,
        bundleCount: c ? (c.bundles || []).length : 0,
        missing,
        missingCount: missing.filter((m) => m.tier === 1).length,
        decisive: c ? c.why : 'No claim opened. The gap is that the question has not been examined.',
        wouldChangeTo: verdict !== 'HOLD' || c?.rule === 'R2' ? null
          : !c ? 'claim not opened'
          : missing.some(gap => gap.tier === 1 && /→ ASSERT\b/.test(gap.effect)) ? 'HOLD → ASSERT' : null,
      };
    });
  },

  async getClaim(sceneId, claimId) {
    const s = await api.getCase(sceneId);
    const c = s.claims[claimId];
    if (!c) return null;
    return { ...c, claimType: CLAIM_TYPES.find((t) => t.id === claimId) };
  },

  async getActorProfile(sceneId) {
    const s = await api.getCase(sceneId);
    return actorProfile(s);
  },

  async getCollection(sceneId) {
    const s = await api.getCase(sceneId);
    return collectionSchedule(s);
  },

  /* ---------- intake, with a scope allow-list ---------- */
  async intake(sceneId, raw) {
    await delay(520);
    const text = String(raw || '');

    const refusedBy = OUT_OF_SCOPE_PATTERNS.find((p) => p.test.test(text));
    if (refusedBy) {
      logEvent(sceneId, 'Intake refused: ' + refusedBy.label + ' (out of scope)', 'system');
      return {
        refused: true,
        reason: refusedBy.label,
        scopeRule: 'Requests outside the intake scope are refused and logged rather than processed.',
        accepted: [],
        note: 'Nothing was extracted. The refusal is recorded in the chain of custody.',
      };
    }

    const accepted = INTAKE_SCOPE.filter((k) => k.test.test(text));
    if (!accepted.length) {
      logEvent(sceneId, 'Intake refused: no in-scope material detected', 'system');
      return {
        refused: true,
        reason: 'no in-scope material detected',
        scopeRule: 'Intake accepts only the record types on the scope list.',
        accepted: [], note: 'Nothing was extracted. The refusal is recorded in the chain of custody.',
      };
    }

    /* deterministic extraction: values are read from the text, ids from the seed */
    const found = [];
    if (accepted.some((a) => a.id === 'pgp')) {
      const signed = /BEGIN PGP SIGNED MESSAGE/i.test(text);
      found.push({
        type: 'PGP block',
        value: signed ? 'signed message present' : 'key block only',
        level: signed ? 'L1' : 'L0',
        cost: signed ? 4 : 1,
        flags: [],
        note: signed ? 'Signed. Signature verification decides what it binds — see SPEC R9.' : 'A key block on a page is a paste.',
      });
    }
    if (accepted.some((a) => a.id === 'wallet')) {
      const m = text.match(/\b(bc1[a-z0-9]{6,}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})\b/);
      found.push({
        type: 'Wallet', value: m ? m[0].slice(0, 12) + '…' : 'address present',
        level: 'L0', cost: 1, flags: [], note: 'An address in text is not control of it.',
      });
    }
    if (accepted.some((a) => a.id === 'handle')) {
      const m = text.match(/Alias:\s*(\S+)/i) || text.match(/handle:\s*(\S+)/i);
      found.push({ type: 'Handle', value: m ? m[1] : 'handle present', level: 'L0', cost: 1, flags: [], note: 'A name is a label, not a link.' });
    }
    if (accepted.some((a) => a.id === 'listing')) {
      found.push({
        type: 'Template text', value: 'escrow / dispatch block', level: 'L0', cost: 0,
        flags: [], origin: 'tpl-pack-v4',
        note: 'Matches the resale template pack. Folded, not counted.',
      });
    }
    if (accepted.some((a) => a.id === 'onionoo')) {
      found.push({ type: 'Onionoo family', value: 'relay family present', level: 'L1', cost: 2, flags: [], note: 'Narrows the search space; names no operator.' });
    }
    if (accepted.some((a) => a.id === 'cert')) {
      found.push({ type: 'TLS certificate', value: 'certificate fields present', level: 'L1', cost: 4, flags: [], note: 'Rare signal — worth its weight if it verifies.' });
    }

    const folded = found.filter((f) => f.origin);
    logEvent(sceneId, 'Intake accepted: ' + accepted.map((a) => a.label).join(', '), 'analyst.a');

    return {
      refused: false,
      accepted,
      extracted: found,
      ladder: peakLevel(found.map((f) => ({ level: f.level }))),
      folded: folded.length
        ? { origin: 'tpl-pack-v4', title: 'Resale template pack v4', count: folded.length, note: 'Grouped before scoring — counted once.' }
        : null,
      note: 'Extraction reads what is present in the submitted text. It does not resolve identity.',
    };
  },

  async collect(sceneId, claimId, itemIndex) {
    await delay(600);
    const scene = store.scenes.find((s) => s.id === sceneId);
    const claim = scene?.claims[claimId];
    const gap = claim?.missing?.[itemIndex];
    if (!gap || gap.collectible === false) return { ok: false, error: 'No collection route for this gap.' };
    const key = `${sceneId}:${claimId}:${itemIndex}`;
    if (store.collected.has(key)) return { ok: true, jobId: jobId(key), added: null };
    store.collected.add(key);
    logEvent(sceneId, 'Collection requested: ' + claimId + ' gap #' + (itemIndex + 1), 'analyst.a');
    const demo = scene.resolveDemo;
    let added = demo && ['persona_link', 'key_control'].includes(claimId) && itemIndex === demo.missingIndex ? clone(demo.collected) : null;
    if (sceneId === 'ladder' && claimId === 'wallet_control' && itemIndex === 0) {
      added = { kind: 'Funds move', title: 'Fresh funds move from the declared wallet',
        detail: 'A controlled fixture funds move matches the declared address and current challenge.',
        status: 'verified', level: 'L3', cost: 5, origin: 'wallet-live-move',
        originLabel: 'Fresh control demonstration', source_level: 'FIXTURE', source: SRC.fixture, found: '2016-06-26' };
    }
    if (added) {
      claim.evidence.push(added);
      claim.missing = [];
      if (sceneId === 'resolve') {
        const otherId = claimId === 'persona_link' ? 'key_control' : 'persona_link';
        const other = scene.claims[otherId];
        if (!other.evidence.some(e => e.origin === added.origin)) other.evidence.push(clone(added));
        other.missing = [];
        logEvent(sceneId, 'Verdict recorded: ' + otherId + ' · ' + evaluateClaim(other).verdict, 'system');
      }
      const evaluated = evaluateClaim(claim);
      logEvent(sceneId, 'Evidence collected: ' + added.title, 'system');
      logEvent(sceneId, 'Verdict recorded: ' + evaluated.verdict, 'system');
    }
    return {
      ok: true,
      jobId: jobId(sceneId + ':' + claimId + ':' + itemIndex),
      after: evaluateClaim(claim),
      added,
    };
  },

  async redteam(sceneId, attackId) {
    await delay(420);
    const attack = ATTACKS.find((a) => a.id === attackId);
    store.applied.add(`${sceneId}:${attackId}`);
    const scene = store.scenes.find((s) => s.id === sceneId);
    const targetId = scene.claims[attack.target] ? attack.target : Object.keys(scene.claims)[0];
    const claim = scene.claims[targetId];
    const ev = applyFolds(claim, store.applied, sceneId, attackId);
    const res = evaluateClaim(ev);
    const baseVerdict = evaluateClaim(clone(claim)).verdict;
    const changed = res.verdict !== baseVerdict;
    logEvent(sceneId, 'Red-team attack applied: ' + attack.name + ' — ' + (changed ? baseVerdict + ' -> ' + res.verdict : 'verdict unchanged'), 'analyst.a');
    return {
      attack, targetId,
      ours: { verdict: res.verdict, status: res.status, peak: res.peak, rule: res.rule, why: res.why },
      theirs: { score: attack.theirs.score, because: attack.theirs.because },
      changed,
      delta: changed ? `${baseVerdict} → ${res.verdict}` : 'verdict unchanged',
    };
  },

  async resetRedteam(sceneId) {
    const scene = store.scenes.find(s => s.id === sceneId);
    if (!scene) return { ok: false };
    Object.assign(scene, clone(initialScenes.get(sceneId)));
    for (const keys of [store.applied, store.collected]) {
      for (const key of keys) if (key.startsWith(`${sceneId}:`)) keys.delete(key);
    }
    delete store.events[sceneId];
    store.revealed.delete(sceneId);
    for (const key of Object.keys(store.approvals)) {
      if (key.startsWith(`${sceneId}:`)) delete store.approvals[key];
    }
    if (sceneId) logEvent(sceneId, 'Red-team attacks cleared; case re-derived', 'analyst.a');
    return { ok: true, collected: [...store.collected] };
  },

  async getQueue() {
    await delay(50);
    return (await Promise.all(store.scenes
      .map(async (s) => {
        const board = await api.getClaimBoard(s.id);
        const holds = board.filter((b) => b.verdict === 'HOLD');
        return { s, board, holds };
      })))
      .filter((x) => x.holds.length)
      .map(({ s, board, holds }) => ({
        caseId: s.case.id, scene: s.id, title: s.title,
        opened: s.case.opened, analyst: s.case.analyst,
        holdClaims: holds.map((h) => h.name),
        blockers: holds.flatMap((h) => h.missing.filter((m) => m.tier === 1)).map((m) => m.text).slice(0, 6),
        decisive: Object.values(s.claims)[0].summary,
        takeover: Object.values(s.claims).some((c) => c.takeover),
        wouldChange: holds.length,
      }))
      .sort((a, b) => b.wouldChange - a.wouldChange);
  },

  async decide(sceneId, decision, rationale) {
    await delay(320);
    const entry = logEvent(sceneId, 'Analyst decision: ' + decision + (rationale ? ' — ' + rationale : ''), 'analyst.a');
    return {
      ok: true,
      hash: seededHex(sceneId + decision + (rationale || ''), 8),
      decision, rationale,
      at: entry ? entry.at : null,
      gates: decision === 'confirm' ? ['second-analyst approval required before export'] : [],
    };
  },

  /* ---------- exports ---------- */
  async exportDossier(sceneId, format) {
    await delay(600);
    const scene = await api.getCase(sceneId);
    const ledger = await api.getLedger(sceneId);
    const chain = await verifyChain(ledger);
    let filename, size, mime, content;
    try {
      if (format === 'json') {
        const doc = toJSONDoc(scene, ledger);
        content = doc;
        filename = scene.case.id + '.evidence.json';
        mime = 'application/json';
        size = downloadBlob(filename, doc, mime);
      } else if (format === 'csv') {
        const csv = toCSV(caseRows(scene));
        content = csv;
        filename = scene.case.id + '.evidence.csv';
        mime = 'text/csv';
        size = downloadBlob(filename, csv, mime);
      } else if (format === 'stix') {
        const stix = await toSTIX(scene, ledger);
        content = stix;
        filename = scene.case.id + '.stix21.json';
        mime = 'application/json';
        size = downloadBlob(filename, stix, mime);
      } else if (format === 'pdf') {
        const opened = printReport(scene, ledger, chain);
        filename = scene.case.id + '.report (print dialog)';
        mime = 'text/html';
        size = opened ? buildReportHTML(scene, ledger, chain).length : 0;
        if (!opened) return { ok: false, error: 'Allow the report tab to open, then try again.' };
        content = buildReportHTML(scene, ledger, chain);
      } else {
        return { ok: false, error: 'Unsupported export format.' };
      }
    } catch (e) {
      return { ok: false, error: String(e && e.message || e) };
    }
    logEvent(sceneId, 'Export composed: ' + format.toUpperCase() + ' (' + filename + ')', 'analyst.a');
    return { ok: true, format, filename, mime, bytes: size, approval: 'pending', gates: ['second-analyst approval'], sha: sha256Available() ? await sha256Hex(content) : null };
  },

  async approveExport(sceneId, format) {
    await delay(300);
    const scene = store.scenes.find((s) => s.id === sceneId);
    const key = sceneId + ':' + format;
    if (!store.approvals[key]) store.approvals[key] = { a: 'analyst.a', b: null };
    store.approvals[key].b = 'analyst.b';
    logEvent(sceneId, 'Export approved by analyst.b for ' + format.toUpperCase(), 'analyst.b');
    return { ok: true, approvals: ['analyst.a', 'analyst.b'], released: true, at: new Date().toISOString().replace('T', ' ').slice(0, 16) };
  },

  /* ---------- PII reveal: requires a typed reason, appends to the ledger ---------- */
  async revealPII(sceneId, reason) {
    if (!reason || !reason.trim()) {
      return { ok: false, error: 'A reason is required before PII can be revealed.' };
    }
    await delay(220);
    logEvent(sceneId, 'PII revealed — reason: ' + reason.trim(), 'analyst.a');
    store.revealed.add(sceneId);
    return { ok: true, reason: reason.trim(), at: new Date().toISOString().replace('T', ' ').slice(0, 16) };
  },

  /* ---------- ledger: real hash chain ---------- */
  async getLedger(sceneId) {
    const scene = store.scenes.find((s) => s.id === sceneId);
    if (!scene) return [];
    seedEvents(scene);
    const built = await buildChain(store.events[sceneId]);
    if (!built.ok) return built.rows;
    return built.rows;
  },

  async verifyLedger(sceneId, tamperIndex = -1) {
    const rows = await api.getLedger(sceneId);
    const res = await verifyChain(rows, tamperIndex);
    if (tamperIndex >= 0) {
      logEvent(sceneId, 'Tamper test run on ledger entry seq ' + (tamperIndex + 1) + ' — chain verification reported FAIL at that row', 'analyst.a');
    }
    return { ...res, rows, tamperIndex };
  },
};

/* Default missing-evidence suggestions for a claim that was never opened.
   An unexamined question still has a cheapest next step, so the board can
   always rank something. */
function defaultMissing(claimId) {
  const table = {
    key_control: [
      { text: 'Any message signed with the published key', effect: 'claim not opened → SUPPORTED', tier: 1, collectible: true },
      { text: 'A signed message whose body names the handle', effect: 'claim not opened → ASSERT', tier: 1, collectible: true },
    ],
    wallet_control: [
      { text: 'A signed declaration binding the address to the handle', effect: 'claim not opened → SUPPORTED', tier: 1, collectible: true },
      { text: 'A funds move from the declared address', effect: 'claim not opened → ASSERT', tier: 1, collectible: true },
    ],
    persona_link: [
      { text: 'A signed attestation naming the other handle', effect: 'claim not opened → ASSERT', tier: 1, collectible: true },
      { text: 'Shared counterparties with independent history', effect: 'claim not opened → SUPPORTED', tier: 2, collectible: false },
    ],
    hosting_link: [
      { text: 'A certificate whose SAN names the service', effect: 'claim not opened → ASSERT', tier: 1, collectible: true },
      { text: 'A second independent rare finding on the same host', effect: 'claim not opened → SUPPORTED', tier: 2, collectible: false },
    ],
    same_operator: [
      { text: 'An out-of-band continuity signal agreed in advance', effect: 'claim not opened → ASSERT', tier: 1, collectible: false },
      { text: 'A signed message from the original operator confirming or denying transfer', effect: 'claim not opened → ASSERT', tier: 1, collectible: false },
    ],
  };
  return table[claimId] || [];
}

/* Fold applied red-team attacks into one claim's evidence set. Only the
   attacked claim is touched: an attack on key control says nothing about
   hosting. */
function applyFolds(claim, applied, sceneId, attackId) {
  const c = clone(claim);
  if (!attackId || !c.evidence) return c;

  if (attackId === 'copy-boilerplate') {
    c.evidence.forEach((e) => { if (e.origin === 'tpl-pack-v4') e.status = 'questionable'; });
  }
  if (attackId === 'imitate-voice') {
    c.evidence.push({
      kind: 'Writing sample', title: 'New posts matching the target’s register',
      detail: 'Register match. Writing is copyable, so this is capped at SUPPORTED by rule R5.',
      status: 'supported', level: 'L1', cost: 3, flags: [], origin: 'imitated',
      originLabel: 'Imitated sample', source_level: 'FIXTURE', source: SRC.fixture, found: '2016-08-20',
    });
  }
  if (attackId === 'replay-signature') {
    c.evidence.push(replayEvidence('2016-08-21'));
  }
  return c;
}

/* The canonical replayed-signature record. Zero proof weight, L0, cost 0.
   Excluded from the verdict by evaluateClaim via its flag. */
function replayEvidence(date) {
  return {
    kind: 'Signature',
    title: 'Signed message reposted byte-for-byte',
    detail: 'The signature verifies cryptographically. It is byte-identical to a block published earlier and its signed body names a different handle, so it was not made for this persona. Carries zero proof weight.',
    status: 'questionable',
    level: 'L0',
    cost: 0,
    flags: ['replayed_signature'],
    note: 'replayed — first seen 2016-01-05 on Market C',
    origin: 'replay',
    originLabel: 'Replayed block',
    source: SRC.fixture,
    source_level: 'FIXTURE',
    found: date,
  };
}

Object.assign(window, {
  api, MOCK, evaluateClaim, CLAIM_TYPES, COST, SRC, SCENES, ATTACKS, RULES, PROOF_LEVELS,
  lvl, seedEvents, logEvent, suspectLadder, actorProfile, collectionSchedule,
  defaultMissing, replayEvidence, fnv1a, seededHex, jobId, caseResult, weakestRoute,
});

export { MOCK, API_BASE, delay, clone, fnv1a, seededHex, jobId, store, seedEvents, logEvent, evaluateClaim, lvl, peakLevel, caseResult, weakestRoute, SUSPECT_STEPS, suspectLadder, actorProfile, collectionSchedule, INTAKE_SCOPE, OUT_OF_SCOPE_PATTERNS, api, defaultMissing, applyFolds, replayEvidence };
