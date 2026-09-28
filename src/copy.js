// Presentation copy only. Fixtures and evaluation rules remain unchanged.
export const RULE_COPY = {
  R1: 'Contradiction requires REJECT.',
  R2: 'Changed behaviour keeps Same Operator on HOLD.',
  R3: 'Shared origin counts once.',
  R4: 'Persona-bound proof required for ASSERT.',
  R5: "Style alone can't prove. Max SUPPORTED.",
  R6: 'No independent proof binds this persona.',
  R7: 'Analyst confirms identity. Second analyst approves export.',
  R8: 'Replay carries zero proof.',
  R9: 'Cryptographic checks required.',
  R10: 'Common assets carry zero proof.',
};
export const BOARD_COPY = {
  lookalike: '4 signals, 1 origin — counted once.',
  genuine: 'Persona-bound signature confirms key control.',
  replay: 'Replayed signature carries zero proof.',
  ladder: 'Fresh wallet control resolves HOLD.',
  takeover: 'Key control holds; operator remains unconfirmed.',
  hosting: 'Certificate + server-status leak support Hosting Link · ASSERT.',
  ring: '5 graph nodes; shared origin counts once.',
  resolve: 'Collect persona-bound proof to resolve HOLD.',
};
export function shortReason(claim) {
  if (claim.rule === 'R4') {
    if (claim.claimVerdict === 'ASSERT') return 'Persona-bound proof verified; no questionable evidence.';
    if (claim.requiresFreshControl) return 'Fresh funds move required for ASSERT.';
    if (Number(String(claim.peak).slice(1)) >= 2) return 'Questionable evidence keeps this claim on HOLD.';
  }
  return RULE_COPY[claim.rule] || 'Evidence requires analyst review.';
}
export function evidenceDetail(text) {
  return String(text || '').replace(/Discrimination margin/gi, 'style similarity (not proof)');
}
export function citedRules(scene) {
  const ids = new Set(Object.values(scene.claims).map(c => c.rule));
  const visit = value => {
    if (typeof value === 'string') for (const id of value.match(/\bR(?:10|[1-9])\b/g) || []) ids.add(id);
    else if (Array.isArray(value)) value.forEach(visit);
    else if (value && typeof value === 'object') Object.values(value).forEach(visit);
  };
  visit(scene);
  for (const claim of Object.values(scene.claims)) {
    if ((claim.bundles || []).some(b => b.countsOnce)) ids.add('R3');
    for (const evidence of claim.evidence || []) {
      if ((evidence.flags || []).includes('common_indicator')) ids.add('R10');
      if ((evidence.flags || []).includes('replayed_signature')) ids.add('R8');
    }
  }
  if (Object.keys(scene.claims).length < 5) ids.add('R6');
  return ids;
}
