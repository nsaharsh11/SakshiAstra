import DATA from './data/agora.json' with { type: 'json' };

export const DATASET = 'Agora 2014-15 (Kaggle), text only';
export const HISTORICAL_SOURCE = { source_level: 'HISTORICAL', badge: 'hist', label: 'HISTORICAL', ref: DATASET };
export const CLASSIFIER_LABELS = ['drugs', 'arms', 'hacking', 'laundering', 'stolen_data', 'terror_financing'];
export const HISTORICAL_DATA = DATA;

// Character edit similarity. Both empty residuals are zero evidence, not 100%.
export function textSimilarity(left, right) {
  if (!left || !right) return 0;
  let previous = Array.from({ length: right.length + 1 }, (_, i) => i);
  for (let i = 1; i <= left.length; i++) {
    const current = [i];
    for (let j = 1; j <= right.length; j++) current[j] = Math.min(
      current[j - 1] + 1, previous[j] + 1, previous[j - 1] + (left[i - 1] === right[j - 1] ? 0 : 1));
    previous = current;
  }
  return Math.round(100 * (1 - previous[right.length] / Math.max(left.length, right.length)));
}

export function attachHistoricalText(scenes, fixtureSource) {
  for (const [index, scene] of scenes.entries()) {
    // Category comes directly from a supplied sample row; it never enters a claim.
    const row = DATA.listings[index % DATA.listings.length];
    scene.listingContext = {
      category: row.category, supporting_terms: row.supporting_terms,
      source_level: 'FIXTURE', sources: [fixtureSource, HISTORICAL_SOURCE],
      historical_text: { ...row }, dataset: DATASET,
      persona: scene.subjects[0].handle, market: scene.subjects[0].market,
    };
  }
  const scene = scenes.find(s => s.id === 'lookalike');
  const template = DATA.template.variants[0];
  const residuals = ['Small catalogue; five years trading.', 'Seasonal offers; bulk lots available.'];
  const texts = residuals.map(text => `${template} ${text}`);
  const lens = {
    group_id: DATA.template.group_id, template, texts, residuals,
    raw: textSimilarity(...texts), independent: textSimilarity(...residuals),
    metric: 'normalised character edit similarity', metrics_source: 'deterministic computation',
    sources: [fixtureSource, HISTORICAL_SOURCE], source_level: 'FIXTURE',
    historical_text: { text: template, source_level: 'HISTORICAL', source: DATASET },
    fixture_context: { residuals, personas: scene.subjects.map(s => s.handle), source_level: 'FIXTURE' },
  };
  scene.claims.persona_link.historicalLens = lens;
  const evidence = scene.claims.persona_link.evidence.find(e => e.kind === 'Description text');
  evidence.title = `Listing description, ${lens.raw}% raw → ${lens.independent}% after template removal`;
  evidence.sources = lens.sources;
  evidence.source = fixtureSource;
  evidence.historical_text = lens.historical_text;
  // The planted copying/comparison event, its timestamp and zero proof remain FIXTURE.
  evidence.source_level = 'FIXTURE';
}

export function validateHistoricalData(data = DATA) {
  const forbidden = [
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
    /\.onion\b/i,
    /\b[13][a-km-zA-HJ-NP-Z1-9]{25,34}\b/,
    /\bbc1[ac-hj-np-z02-9]{11,87}\b/i,
    /-----BEGIN PGP/i,
  ];
  const visit = value => {
    if (typeof value === 'string') {
      if (forbidden.some(re => re.test(value))) throw new Error('Historical text contains a forbidden identifier');
    } else if (Array.isArray(value)) value.forEach(visit);
    else if (value && typeof value === 'object') {
      if (value.source_level === 'HISTORICAL' && value.source !== DATASET && value.source?.ref !== DATASET && value.ref !== DATASET)
        throw new Error('Historical record lacks dataset citation');
      Object.values(value).forEach(visit);
    }
  };
  visit(data);
  for (const row of data.listings || []) {
    if (row.category === 'terror_financing') throw new Error('No historical terror-financing examples are supplied');
    if (row.supporting_terms.length !== 3 || row.supporting_terms.some(t =>
      !`${row.title} ${row.description}`.toLowerCase().includes(t))) throw new Error('Category needs three supporting text terms');
  }
  return true;
}
