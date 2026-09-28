import { assertSceneConsistency } from './consistency.mjs';

globalThis.window = globalThis;
const { SCENES, CLAIM_TYPES } = await import('../src/scenes.js');
const { evaluateClaim } = await import('../src/api.js');
const { PRESENTER } = await import('../src/presenter.js');
assertSceneConsistency(SCENES, evaluateClaim, CLAIM_TYPES, PRESENTER);
console.log('PASS fixture consistency: status, verdict text, effects, peaks, counts, dates and captions');
