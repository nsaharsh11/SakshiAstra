import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const sceneNames = ['Lookalike vendor', 'Genuine migration', 'Replayed signature',
  'Pasted vs signed wallet', 'Takeover with change-point', 'Cert leak vs template favicon',
  'Sock-puppet vouch ring', 'HOLD resolving to ASSERT'];
const scenes = ['lookalike', 'genuine', 'replay', 'ladder', 'takeover', 'hosting', 'ring', 'resolve'];

async function enter(page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Enter the workbench' }).click();
  await expect(page.locator('.case-name')).toContainText(sceneNames[0]);
  await expect(page.locator('.claim-counters')).toContainText('5 claims');
}

async function pickScene(page, index) {
  await page.getByRole('button', { name: `${index + 1} ${sceneNames[index]}`, exact: true }).click();
  await expect(page.locator('.rail-item[aria-current="true"]').filter({ hasText: sceneNames[index] })).toBeVisible();
  await expect(page.locator('.main .skel')).toHaveCount(0);
}

async function nav(page, name) {
  await page.locator('.rail').getByRole('button', { name: new RegExp(name) }).click();
}

test('viewport fills the available width without a scaled frame', async ({ page }) => {
  await enter(page);
  for (const width of [1920, 1440, 1280, 900, 768, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const size = await page.locator('.app').evaluate((el) => ({
      width: el.getBoundingClientRect().width,
      transform: getComputedStyle(el).transform,
      zoom: getComputedStyle(el).zoom,
      overflow: document.documentElement.scrollWidth,
    }));
    expect(size.width).toBe(width);
    expect(size.transform).toBe('none');
    expect(size.zoom).toBe('1');
    expect(size.overflow).toBeLessThanOrEqual(width);
  }
});

test('presenter advances through exactly eight distinct scenes', async ({ page }) => {
  await enter(page);
  await page.getByTitle('Presenter mode', { exact: true }).click();
  for (let index = 0; index < scenes.length; index++) {
    await expect(page.locator('.pres-scene')).toContainText(`${index + 1} / 8`);
    await expect(page.locator('.pres-scene')).toContainText(sceneNames[index]);
    await expect(page.locator('.main .skel')).toHaveCount(0);
    const layout = await page.evaluate(() => ({
      mainBottom: document.querySelector('.main').getBoundingClientRect().bottom,
      barTop: document.querySelector('.presentation-bar').getBoundingClientRect().top,
      barBottom: document.querySelector('.presentation-bar').getBoundingClientRect().bottom,
      height: window.innerHeight,
      captionWrap: getComputedStyle(document.querySelector('.pres-caption')).whiteSpace,
    }));
    expect(layout.mainBottom).toBeLessThanOrEqual(layout.barTop);
    expect(layout.barBottom).toBeLessThanOrEqual(layout.height);
    expect(layout.captionWrap).toBe('nowrap');
    if (index < 7) await page.getByRole('button', { name: 'Next scene', exact: true }).click();
  }
  await expect(page.getByRole('button', { name: 'Next scene', exact: true })).toBeDisabled();
  expect(await page.evaluate('PRESENTER.map(p => p.scene)')).toEqual(scenes);
});

test('wallet final step animates to L3 and claim-specific ASSERT', async ({ page }) => {
  await enter(page);
  await pickScene(page, 3);
  await nav(page, 'Evidence inspector');
  await expect(page.locator('.main .sheet-head .vchip')).toHaveText('HOLD');
  await page.locator('.main .evidence-fold > summary').click();
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.getByRole('button', { name: 'Run signed challenge / funds move', exact: true }).click();
  await expect(page.locator('.main .sheet-head .vchip')).toHaveText('ASSERT');
  await expect(page.getByText('Fresh challenge verified · Wallet Control · ASSERT', { exact: true })).toBeVisible();
  await expect(page.locator('.ladder[data-peak="L3"]')).not.toHaveCount(0);
  const animation = await page.locator('.ladder[data-peak="L3"] .rung').first().evaluate(el => getComputedStyle(el).animationName);
  expect(animation).toBe('rungIn');
});

test('decided claim badges, qualifying weakest routes, fixture labels and complete rules agree', async ({ page }) => {
  await enter(page);
  for (const [index, label] of [[1, 'Key Control · ASSERT'], [4, 'Key Control · ASSERT'], [5, 'Hosting Link · ASSERT']]) {
    await pickScene(page, index);
    await nav(page, 'Case workspace');
    await expect(page.locator('.case-block')).toHaveCount(0);
    await expect(page.locator('.hero .vchip').first()).toHaveText(label);
    await expect(page.locator('.hero-side')).toContainText('cost 4/5');
  }
  const rules = page.locator('.aside .sheet').filter({ hasText: 'Locked rules' });
  await rules.getByText('All rules', { exact: true }).click();
  await expect(rules).toContainText('R6'); await expect(rules).toContainText('R8');
  await expect(rules.locator('.row')).toHaveCount(10);
  await pickScene(page, 6);
  await expect(page.locator('.hero .vchip').first()).toHaveText('Persona Link · REJECT');
  await expect(page.getByRole('button', { name: '7 Sock-puppet vouch ring', exact: true }).locator('.vchip')).toHaveClass(/v-reject/);
  await expect(page.locator('.main .claim-card .vchip').first()).toHaveText('REJECT');
  const ring = await page.evaluate(async () => ({
    verdict: (await api.getCase('ring')).verdict,
    holds: (await api.getQueue()).find(q => q.scene === 'ring').holdClaims,
    acts: (await api.getLedger('ring')).map(row => row.act),
  }));
  expect(ring.verdict).toBe('REJECT');
  expect(ring.holds).not.toContain('Persona Link');
  expect(ring.acts).toContain('Result recorded: Persona Link · REJECT');
  await expect(page.locator('.hero-reason')).toContainText('5 graph nodes');
  for (const badge of await page.locator('.dbadge').allTextContents()) expect(badge).toBe('FIXTURE');
});

test('compact counters label checked and waiting claims and include waiting HOLD', async ({ page }) => {
  await enter(page);
  await expect(page.locator('.claim-counters')).toContainText('5 claims · 2 checked · 3 waiting');
  expect(await page.locator('.claim-counters .vchip').allTextContents()).toEqual(['0 ASSERT', '5 HOLD', '0 REJECT']);
  await expect(page.locator('.stat-fig')).toHaveCount(0);
});

test('Same Operator gaps respect the R2 HOLD cap on screen and board', async ({ page }) => {
  await enter(page);
  await pickScene(page, 4);
  await nav(page, 'Evidence inspector');
  await page.getByRole('tab', { name: 'Same Operator', exact: true }).click();
  await expect(page.locator('.main .sheet-head .vchip')).toHaveText('HOLD');
  await page.locator('.main .evidence-fold > summary').click();
  const effects = page.locator('.main .missing-effect');
  expect(await effects.count()).toBeGreaterThan(0);
  for (const effect of await effects.allTextContents()) {
    expect(effect).toContain('HOLD → HOLD (capped by R2)');
    expect(effect).not.toContain('ASSERT');
  }
  expect(await page.evaluate(async () => (await api.getClaimBoard('takeover')).find(c => c.id === 'same_operator').wouldChangeTo)).toBeNull();
});

test('case load failures show an error, end the skeleton and recover on retry', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await enter(page);
  const methods = ['getCase', 'getClaimBoard', 'getLedger', 'getQueue', 'getActorProfile', 'getCollection', 'verifyLedger'];
  for (const [i, method] of methods.entries()) {
    await page.evaluate(method => {
      window.restoreLoad = () => { api[method] = original; };
      const original = api[method];
      api[method] = async () => { throw new Error('Injected load failure'); };
    }, method);
    const index = i % 2 === 0 ? 1 : 0;
    await page.getByRole('button', { name: `${index + 1} ${sceneNames[index]}`, exact: true }).click();
    await expect(page.getByRole('alert')).toHaveText('Could not load this case. Please try again.');
    await expect(page.locator('.main .skel')).toHaveCount(0);
    await page.evaluate(() => window.restoreLoad());
    await page.getByRole('button', { name: 'Try again', exact: true }).click();
    await expect(page.locator('.case-name')).toContainText(sceneNames[index]);
    await expect(page.getByRole('alert')).toHaveCount(0);
  }
  expect(errors).toEqual([]);
});

test('bundled Agora text is cited, mixed records show both badges, category stays separate and lens removes the template', async ({ page }) => {
  const requested = [];
  page.on('request', request => requested.push(request.url()));
  await enter(page);
  await expect(page.locator('.prov')).toHaveText('ProvenanceFixture scenariosAgora 2014-15 (Kaggle), text only');
  await nav(page, 'Evidence inspector');
  await page.locator('.main .evidence-fold > summary').click();
  const lens = await page.evaluate("(async () => (await api.getCase('lookalike')).claims.persona_link.historicalLens)()");
  await expect(page.locator('.lens .dbadge')).toHaveText(['FIXTURE', 'HISTORICAL']);
  await expect(page.locator('.lens-legend')).toContainText(`${lens.raw}% raw similarity → ${lens.independent}% after template removal`);
  await expect(page.locator('.lens-text')).toContainText("!!! PLEASE READ !!! Dear Costumer ***ALL ORDER's REQUIERE FE***");
  await expect(page.locator('.lens').getByRole('button', { name: 'Raw', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.locator('.lens').getByRole('button', { name: 'Independent', exact: true }).click();
  await expect(page.locator('.lens .boiler')).toHaveCount(2);
  await expect(page.locator('.lens .dbadge.hist')).toHaveAttribute('title', 'Agora 2014-15 (Kaggle), text only');
  await page.locator('.ev-head').first().click();
  await expect(page.locator('.ev-detail .dbadge')).toHaveText(['FIXTURE', 'HISTORICAL']);
  await nav(page, 'Actor profile');
  const record = await page.evaluate("(async () => (await api.getCase('lookalike')).listingContext)()");
  await expect(page.locator('.main')).toContainText(record.category);
  for (const term of record.supporting_terms) await expect(page.locator('.main')).toContainText(term);
  await page.getByText('Show listing text', { exact: true }).click();
  await expect(page.locator('.main')).toContainText(record.historical_text.description);
  await expect(page.locator('.main')).toContainText('Category is never used in attribution.');
  await page.getByText('Classifier labels', { exact: true }).click();
  await expect(page.locator('.main')).toContainText('terror_financing: no historical examples.');
  expect(requested.filter(url => /agora_sample|agora_templates|Agora\.csv|\/data\//i.test(url))).toEqual([]);
  expect(requested.every(url => url.startsWith('http://127.0.0.1:5174/'))).toBe(true);
  await page.setViewportSize({ width: 390, height: 844 });
  const provenance = await page.locator('.prov-dataset').evaluate(el => ({
    right: el.getBoundingClientRect().right, width: window.innerWidth,
    clipped: el.scrollWidth > el.clientWidth,
  }));
  expect(provenance.right).toBeLessThanOrEqual(provenance.width);
  expect(provenance.clipped).toBe(false);
});

test('compact cards and inspector show one question, ladder and short reason; details stay collapsed', async ({ page }) => {
  await enter(page);
  for (let index = 0; index < scenes.length; index++) {
    await pickScene(page, index);
    await nav(page, 'Case workspace');
    for (const card of await page.locator('.main .claim-card').all()) {
      expect((await card.innerText()).trim().split(/\s+/).length).toBeLessThanOrEqual(40);
      await expect(card.locator('details[open]')).toHaveCount(0);
      await expect(card.locator('.claim-q')).toHaveCount(1);
      await expect(card.locator('.vchip')).toHaveCount(1);
      await expect(card.locator('.status-word')).toHaveCount(1);
      const reason = await card.locator('.claim-card-body').evaluate(el => el.querySelector('p')?.textContent || el.textContent);
      expect(reason.trim().split(/\s+/).length).toBeLessThanOrEqual(10);
    }
    await nav(page, 'Evidence inspector');
    await expect(page.locator('.main .proof-ladder .ladder')).toHaveCount(1);
    await expect(page.locator('.main .rule-brief')).toHaveCount(1);
    await expect(page.locator('.main .evidence-fold[open]')).toHaveCount(0);
    const question = await page.locator('.main .sheet-title').innerText();
    expect((await page.locator('.main').innerText()).split(question).length - 1).toBe(1);
    for (const tab of await page.getByRole('tab').all()) {
      expect(await tab.evaluate(el => getComputedStyle(el).textOverflow)).not.toBe('ellipsis');
    }
    await page.locator('.main .evidence-fold > summary').click();
    await expect(page.locator('.ev-head')).not.toHaveCount(0);
    await expect(page.locator('.ev-detail')).toHaveCount(0);
    for (const row of await page.locator('.ev-head').all()) {
      await expect(row.locator('.ev-title')).toHaveCount(1);
      await expect(row.locator('.cost-chip')).toHaveCount(1);
      await expect(row.locator('.status-word')).toHaveCount(1);
      await expect(row.locator('.ev-meta')).toHaveCount(0);
    }
  }
  expect(await page.evaluate("fmtStamp('2026-09-24 11:02')")).toBe('24 Sep 2026 · 11:02');
});

test('replay fixture and generated signatures carry zero proof', async ({ page }) => {
  await enter(page);
  const result = await page.evaluate(`(async () => {
    const s = await api.getCase('replay');
    const c = s.claims.key_control;
    const generated = replayEvidence('2016-08-21');
    return { signature: c.evidence[0], peak: c.peak, verdict: c.claimVerdict,
      generated, evaluated: evaluateClaim({ evidence: [generated] }) };
  })()`);
  for (const signature of [result.signature, result.generated]) {
    expect(signature.flags).toContain('replayed_signature');
    expect(signature.level).toBe('L0');
    expect(signature.cost).toBe(0);
    expect(signature.note).toMatch(/^replayed — first seen \d{4}-\d{2}-\d{2}/);
  }
  expect(result.peak).toBe('L0');
  expect(result.verdict).toBe('HOLD');
  expect(result.evaluated.peak).toBe('L0');
  expect(result.evaluated.verdict).toBe('HOLD');
});

test('copied identity bundle counts once and cannot assert', async ({ page }) => {
  await enter(page);
  const result = await page.evaluate(`(async () => {
    const s = await api.getCase('lookalike');
    const c = s.claims.persona_link;
    const copies = c.evidence.filter(e => e.origin === 'tpl-pack-v4');
    const inflated = { ...c, evidence: copies.flatMap(e => Array(10).fill({ ...e, status: 'verified', level: 'L2' })) };
    return { c, copies, inflated: evaluateClaim(inflated) };
  })()`);
  expect(result.c.claimVerdict).toBe('HOLD');
  expect(result.c.bundles).toHaveLength(1);
  expect(result.c.bundles[0]).toMatchObject({ cost: 0, countsOnce: true });
  expect(result.c.bundles[0].title).toBe('6 observations · 4 signals · 1 origin — counted once');
  expect(result.copies.every(e => e.cost === 0)).toBe(true);
  expect(result.inflated.verdict).toBe('HOLD');
  expect(result.inflated.peak).toBe('L0');
});

test('graph nodes open claim cards in every scene', async ({ page }) => {
  await enter(page);
  for (let index = 0; index < scenes.length; index++) {
    await pickScene(page, index);
    await nav(page, 'Relationship graph');
    await expect(page.locator('.gnode-hit')).not.toHaveCount(0);
    const count = await page.locator('.gnode-hit').count();
    expect(count).toBeGreaterThan(0);
    for (let node = 0; node < count; node++) {
      await page.locator('.gnode-hit').nth(node).click();
      await expect(page.getByRole('dialog', { name: 'Evidence inspector', exact: true })).toBeVisible();
      await expect(page.locator('.drawer .sheet-title')).not.toBeEmpty();
      await page.keyboard.press('Escape');
      await nav(page, 'Relationship graph');
    }
  }
});

test('collection targets selected claims and resolve persists through navigation and export', async ({ page }) => {
  await enter(page);
  await nav(page, 'Evidence inspector');
  await page.getByRole('tab', { name: 'Key Control', exact: true }).click();
  await page.locator('.main .evidence-fold > summary').click();
  await page.getByRole('button', { name: 'Add to collection' }).first().click();
  await expect(page.getByRole('button', { name: 'Add to collection' })).toHaveCount(0);
  expect(await page.evaluate("(async () => (await api.getLedger('lookalike')).some(r => r.act.includes('key_control gap #1')))()")).toBe(true);
  await pickScene(page, 7);
  await nav(page, 'Evidence inspector');
  await page.locator('.main .evidence-fold > summary').click();
  await page.getByRole('button', { name: 'Add to collection' }).first().click();
  await expect(page.locator('.main .sheet-head .vchip')).toContainText('ASSERT');
  await expect(page.getByRole('button', { name: 'Add to collection' })).toHaveCount(0);
  await nav(page, 'Case workspace');
  await expect(page.locator('.hero .vchip')).toContainText('ASSERT');
  const json = await page.evaluate("(async () => JSON.parse(toJSONDoc(await api.getCase('resolve'), await api.getLedger('resolve'))))()");
  expect(json.claims[0].verdict).toBe('ASSERT');
  expect(json.claims[0].evidence.filter(e => e.proof_level === 'L2')).toHaveLength(1);
  await pickScene(page, 0);
  await pickScene(page, 7);
  await expect(page.locator('.hero .vchip')).toContainText('ASSERT');
});

test('reveal requires a reason, logs it, and remains scoped to the case', async ({ page }) => {
  await enter(page);
  await nav(page, 'Dossier & custody');
  await page.getByRole('button', { name: 'Reveal PII', exact: true }).click();
  await expect(page.locator('.reason-prompt')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Record reason and reveal', exact: true })).toBeDisabled();
  await page.locator('.reason-prompt textarea').fill('Authorised prototype verification');
  await page.getByRole('button', { name: 'Record reason and reveal', exact: true }).click();
  await expect(page.locator('.pii.revealed')).toHaveText('ops@example.net');
  await expect(page.locator('.ledger')).toContainText('PII revealed — reason: Authorised prototype verification');
  await pickScene(page, 1);
  await expect(page.locator('.pii.revealed')).toHaveCount(0);
  await pickScene(page, 0);
  await expect(page.locator('.pii.revealed')).toHaveText('ops@example.net');
});

test('JSON, CSV, and STIX exports download populated real files; custody and approval work', async ({ page }, testInfo) => {
  await enter(page);
  await nav(page, 'Dossier & custody');
  await expect(page.locator('.chain-badge')).toHaveText('CHAIN VERIFIED');
  await page.getByRole('button', { name: 'Tamper test', exact: true }).click();
  await expect(page.locator('.chain-badge')).toHaveText('CHAIN FAILS');
  await page.getByRole('button', { name: 'Clear tamper test', exact: true }).click();
  await expect(page.locator('.chain-badge')).toHaveText('CHAIN VERIFIED');
  for (const [label, suffix] of [
    ['JSON evidence set', '.evidence.json'], ['CSV evidence table', '.evidence.csv'], ['STIX 2.1 bundle', '.stix21.json'],
  ]) {
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: new RegExp(label) }).click();
    const download = await pending;
    expect(download.suggestedFilename()).toBe('SA-26151-0001' + suffix);
    const path = testInfo.outputPath(download.suggestedFilename());
    await download.saveAs(path);
    const content = readFileSync(path, 'utf8');
    expect(content.length).toBeGreaterThan(500);
    expect(content).toContain('FIXTURE');
    expect(content).toContain('HISTORICAL · Agora 2014-15 (Kaggle), text only');
    await expect(page.locator('.callout').filter({ hasText: 'EXPORT HELD FOR APPROVAL' })).toContainText(createHash('sha256').update(content).digest('hex'));
    if (suffix === '.evidence.json') {
      const doc = JSON.parse(content);
      expect(doc.claims).toHaveLength(2);
      expect(doc.chain_of_custody.every(r => /^[a-f0-9]{64}$/.test(r.hash))).toBe(true);
    } else if (suffix === '.evidence.csv') {
      expect(content.split('\n')[0]).toContain('claim_verdict');
      expect(content).toContain('HOLD');
    } else {
      const bundle = JSON.parse(content);
      expect(bundle.type).toBe('bundle');
      expect(bundle.spec_version).toBeUndefined();
      const ids = new Set(bundle.objects.map(o => o.id));
      for (const obj of [bundle, ...bundle.objects]) {
        expect(obj.id).toMatch(/^[a-z-]+--[a-f0-9]{8}-[a-f0-9]{4}-5[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/);
        expect(obj.confidence).toBeUndefined();
        for (const ref of obj.object_refs || []) expect(ids.has(ref)).toBe(true);
        if (obj.type !== 'bundle') {
          expect(obj.spec_version).toBe('2.1');
          expect(Date.parse(obj.modified)).toBeGreaterThanOrEqual(Date.parse(obj.created));
        }
      }
      expect(bundle.objects.filter(o => o.type === 'opinion')).toHaveLength(2);
      expect(bundle.objects.filter(o => o.type === 'relationship')).toHaveLength(2);
    }
  }
  await page.getByRole('button', { name: 'Approve as analyst.b', exact: true }).click();
  await expect(page.getByText('Approved. This export may now be released.', { exact: true })).toBeVisible();
});

test('all screens render without console errors; forbidden wording and identity score stay absent', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await enter(page);
  for (let scene = 0; scene < scenes.length; scene++) {
    await pickScene(page, scene);
    for (const name of ['Case workspace', 'Evidence inspector', 'Relationship graph', 'Migration timeline',
      'Intake studio', 'Actor profile', 'Collection', 'Verification queue', 'Red team', 'Dossier & custody']) {
      await nav(page, name);
      await expect(page.locator('.main .sheet, .main .hero')).not.toHaveCount(0);
      const text = await page.locator('.main').innerText();
      expect(text).not.toContain('UN' + 'PROVEN');
      if (text.includes('94%')) {
        await expect(page.locator('.split-side').last()).toContainText('What a weighted-score system reports');
        expect(await page.locator('.split-side.us').innerText()).not.toMatch(/\d+%/);
      }
    }
  }
  expect(errors).toEqual([]);
});


test('Actor Profile names appear once; collection timestamps use the shared display format', async ({ page }) => {
  await enter(page);
  for (let index = 0; index < scenes.length; index++) {
    await pickScene(page, index);
    await nav(page, 'Actor profile');
    await expect(page.locator('.main .sheet-title').first()).not.toBeEmpty();
    await page.getByText('Show listing text', { exact: true }).click();
    const subjects = await page.evaluate(async id => (await api.getCase(id)).subjects, scenes[index]);
    const text = await page.locator('.app').innerText();
    const names = subjects.map(s => s.handle).sort((a, b) => b.length - a.length);
    const matches = text.match(new RegExp(names.map(name => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g')) || [];
    for (const subject of subjects) {
      expect(matches.filter(name => name === subject.handle).length, subject.handle).toBe(1);
      await expect(page.locator('.main .sheet-title').first()).toContainText(subject.handle);
    }
    await nav(page, 'Collection');
    const timestamps = await page.locator('.main .tbl tbody tr').evaluateAll(rows =>
      rows.flatMap(row => [row.cells[4].textContent, row.cells[5].textContent]));
    expect(timestamps.length).toBeGreaterThan(0);
    for (const timestamp of timestamps) expect(timestamp).toMatch(/^\d{1,2} [A-Z][a-z]{2} \d{4} · \d{2}:\d{2}$/);
  }
});

test('printed PDF preserves both provenance badges and historical text', async ({ page }, testInfo) => {
  await enter(page);
  await nav(page, 'Dossier & custody');
  const pending = page.waitForEvent('popup');
  await page.getByRole('button', { name: /PDF dossier/ }).click();
  const report = await pending;
  await report.waitForLoadState('domcontentloaded');
  const records = await page.evaluate(async () => {
    const scene = await api.getCase('lookalike');
    return [scene.listingContext.historical_text, scene.claims.persona_link.historicalLens.historical_text];
  });
  const text = await report.locator('body').innerText();
  expect(text).toContain('FIXTURE · HISTORICAL · Agora 2014-15 (Kaggle), text only');
  for (const record of records) expect(text).toContain(record.description || record.text);
  const pdf = await report.pdf({ path: testInfo.outputPath('dossier.pdf') });
  expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
  expect(pdf.length).toBeGreaterThan(1000);
});

test('case reset refreshes evidence and collection controls while preserving another resolved case', async ({ page }) => {
  await enter(page);
  await pickScene(page, 7);
  await nav(page, 'Evidence inspector');
  await page.getByRole('tab', { name: 'Persona Link', exact: true }).click();
  await page.locator('.main .evidence-fold > summary').click();
  await page.getByRole('button', { name: 'Add to collection' }).first().click();
  await expect(page.locator('.main .sheet-head .vchip')).toContainText('ASSERT');
  await pickScene(page, 3);
  await page.getByRole('tab', { name: 'Wallet Control', exact: true }).click();
  await page.locator('.main .evidence-fold > summary').click();
  await page.getByRole('button', { name: 'Add to collection' }).first().click();
  await expect(page.locator('.main .sheet-head .vchip')).toContainText('ASSERT');
  await nav(page, 'Dossier & custody');
  await page.getByRole('button', { name: 'Reveal PII', exact: true }).click();
  await page.locator('.reason-prompt textarea').fill('Reveal before reset');
  await page.getByRole('button', { name: 'Record reason and reveal', exact: true }).click();
  await expect(page.locator('.pii.revealed')).toBeVisible();
  await nav(page, 'Red team');
  await page.getByRole('button', { name: /Reset/ }).click();
  await expect.poll(() => page.evaluate(async () => (await api.getCase('ladder')).claims.wallet_control.claimVerdict)).toBe('HOLD');
  const reset = await page.evaluate(async () => ({
    revealed: (await api.getCase('ladder')).piiRevealed,
    acts: (await api.getLedger('ladder')).map(row => row.act),
    verified: (await api.verifyLedger('ladder')).verified,
  }));
  expect(reset.revealed).toBe(false);
  expect(reset.verified).toBe(true);
  expect(reset.acts.join('\n')).not.toMatch(/Collection requested:|Evidence collected:|PII revealed/);
  await nav(page, 'Dossier & custody');
  await expect(page.locator('.pii.revealed')).toHaveCount(0);
  await nav(page, 'Evidence inspector');
  await page.getByRole('tab', { name: 'Wallet Control', exact: true }).click();
  await page.locator('.main .evidence-fold > summary').click();
  await expect(page.getByRole('button', { name: 'Add to collection' }).first()).toBeEnabled();
  await page.getByRole('button', { name: 'Add to collection' }).first().click();
  await expect(page.locator('.main .sheet-head .vchip')).toContainText('ASSERT');
  expect(await page.evaluate(async () => (await api.getCase('resolve')).claims.persona_link.claimVerdict)).toBe('ASSERT');
  const queue = await page.evaluate(async () => api.getQueue());
  expect(queue.find(q => q.scene === 'ladder').holdClaims).not.toContain('Wallet Control');
  expect(queue.find(q => q.scene === 'resolve').holdClaims).not.toContain('Persona Link');
});


test('takeover remains an outlined amber badge; fixture statuses match the evaluator and screen', async ({ page }) => {
  await enter(page);
  for (const id of scenes) {
    const claims = await page.evaluate(async id => {
      const fixture = SCENES.find(s => s.id === id), scene = await api.getCase(id);
      return Object.entries(fixture.claims).map(([claimId, claim]) => ({ fixture: claim.status, evaluated: evaluateClaim(claim).status, rendered: scene.claims[claimId].status }));
    }, id);
    for (const claim of claims) { expect(claim.fixture).toBe(claim.evaluated); expect(claim.rendered).toBe(claim.evaluated); }
  }
  await pickScene(page, 0);
  await nav(page, 'Evidence inspector');
  await expect(page.locator('.main .sheet-head')).toContainText('UNVERIFIED');
  await pickScene(page, 2);
  await expect(page.locator('.main .sheet-head')).toContainText('QUESTIONABLE');
  await expect(page.locator('.main .sheet-head .vchip')).toContainText('HOLD');
  await pickScene(page, 4);
  await nav(page, 'Actor profile');
  const badge = page.locator('.v-takeover').first();
  await expect(badge).toBeVisible();
  const style = await badge.evaluate(el => {
    const css = getComputedStyle(el);
    const surface = getComputedStyle(el.closest('.sheet')).backgroundColor;
    const amber = getComputedStyle(document.querySelector('.main .v-hold')).color;
    return { colour: css.color, background: css.backgroundColor, border: css.borderTopColor, width: parseFloat(css.borderTopWidth), surface, amber };
  });
  expect(style.colour).toBe(style.amber); expect(style.border).toBe(style.amber);
  expect(style.width).toBeGreaterThan(0); expect(style.background).toBe(style.surface);
});
