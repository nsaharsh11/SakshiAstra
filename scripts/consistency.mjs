import assert from 'node:assert/strict';

const strings = value => typeof value === 'string' ? [value]
  : Array.isArray(value) ? value.flatMap(strings)
  : value && typeof value === 'object' ? Object.entries(value).filter(([key]) => key !== 'historical_text').flatMap(([, child]) => strings(child)) : [];
const level = code => Number(code.slice(1));

export function assertSceneConsistency(scenes, evaluateClaim, claimTypes, presenter) {
  for (const scene of scenes) {
    const label = scene.id;
    assert.equal(scene.caption, presenter.find(p => p.scene === label)?.caption, `${label}: captions disagree`);
    assert.ok(!scene.caption.includes('\n') && scene.caption.split(/\s+/).length <= 15, `${label}: long caption`);
    const recordedDates = new Set();
    const gatherDates = value => {
      if (!value || typeof value !== 'object') return;
      for (const [key, child] of Object.entries(value)) {
        if (['found', 'first', 'last', 'opened', 'at', 'changeLabel', 'lastScan', 'nextScans', 'observationDates'].includes(key)) {
          for (const text of strings(child)) for (const date of text.match(/\d{4}-\d{2}-\d{2}/g) || []) {
            assert.equal(new Date(date).toISOString().slice(0, 10), date, `${label}: invalid record date`);
            recordedDates.add(date);
          }
        } else if (key !== 'historical_text') gatherDates(child);
      }
    };
    gatherDates(scene);
    for (const text of strings(scene)) for (const date of text.match(/\d{4}-\d{2}-\d{2}/g) || [])
      assert.ok(recordedDates.has(date), `${label}: text date ${date} has no matching record`);

    for (const [id, claim] of Object.entries(scene.claims)) {
      const evaluated = evaluateClaim(claim), name = claimTypes.find(c => c.id === id).name;
      if (claim.status) assert.equal(claim.status, evaluated.status, `${label}/${id}: fixture status differs from evaluator`);
      assert.equal(claim.peak, evaluated.peak, `${label}/${id}: fixture peak differs from evaluator`);
      const verdictRows = scene.ledger.filter(row => row.act.startsWith(`Verdict set: ${name} = `));
      assert.ok(verdictRows.length, `${label}/${id}: no ledger verdict`);
      for (const row of verdictRows) assert.equal(row.act.match(/= (ASSERT|HOLD|REJECT)\b/)?.[1], evaluated.verdict, `${label}/${id}: ledger verdict differs`);
      for (const gap of claim.missing || []) assert.ok(gap.effect.startsWith(evaluated.verdict + ' →'), `${label}/${id}: stale missing effect ${gap.effect}`);

      // Contradictions can reject a claim but do not supply positive proof.
      // Replay origins, common/context observations and zero-cost folds supply no proof.
      const replayOrigins = new Set(claim.evidence.filter(e => e.flags?.includes('replayed_signature')).map(e => e.origin));
      const eligible = claim.evidence.filter(e => e.status !== 'contradicted' && !replayOrigins.has(e.origin)
        && !e.flags?.some(flag => ['replayed_signature', 'common_indicator', 'context_only'].includes(flag))
        && !(claim.bundles || []).some(b => b.id === e.origin && b.countsOnce
          && Math.max(...claim.evidence.filter(member => member.origin === b.id).map(member => member.cost || 0)) === 0));
      assert.equal(evaluated.peak, 'L' + Math.max(0, ...eligible.map(e => level(e.level))), `${label}/${id}: peak exceeds eligible proof`);

      const countWords = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 };
      for (const bundle of claim.bundles || []) {
        const texts = [bundle.title, bundle.note, ...(scene.id === 'lookalike' ? [scene.caption, ...scene.ledger.map(row => row.act)] : [])];
        for (const text of texts.filter(Boolean)) for (const match of text.matchAll(/\b(\d+|one|two|three|four|five|six) signals\b/gi))
          assert.equal(Number(match[1]) || countWords[match[1].toLowerCase()], bundle.items.length, `${label}: signal count differs from bundle`);
        if (scene.id === 'lookalike' && bundle.id === 'tpl-pack-v4') {
          const observations = claim.evidence.filter(e => e.origin === bundle.id).length;
          assert.equal(Number(bundle.title.match(/(\d+) observations/)?.[1]), observations, `${label}: observation count differs`);
        }
      }
    }
  }
  const replay = scenes.find(s => s.id === 'replay');
  const original = replay.subjects.find(s => s.handle === 'halcyon.vault').first;
  const profile = replay.subjects.find(s => s.handle === 'halcyon_vault').first;
  const weeks = Math.round((Date.parse(profile) - Date.parse(original)) / (7 * 86400000));
  assert.equal(weeks, 5);
  for (const text of strings(replay)) {
    for (const match of text.matchAll(/(\d+) weeks earlier/g)) assert.equal(Number(match[1]), weeks);
    assert.ok(!/11 months|eleven months/i.test(text), 'replay: stale time gap');
  }
  const signature = replay.claims.key_control.evidence.find(e => e.flags?.includes('replayed_signature'));
  assert.ok(signature.note.includes(original) && signature.found === profile, 'replay: first-seen dates disagree');
}
