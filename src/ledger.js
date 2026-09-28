import { CLAIM_TYPES } from './scenes.js';
import { caseResult } from './api.js';
/* =====================================================================
   SakshiAstra — ledger, hash chain, exports
   ---------------------------------------------------------------------
   The chain is real. Each entry's hash is

       sha256( prevHash + canonicalJSON(entryWithoutHash) )

   Canonical JSON = keys sorted recursively, no whitespace, so the same
   entry always produces the same bytes and therefore the same hash. If
   any byte of any entry changes, every hash from that row onward fails
   to verify. That is what makes the tamper test meaningful rather than
   decorative.

   Nothing here fabricates a hash. If WebCrypto is unavailable the code
   says so and the UI reports the chain as unverifiable — it does not
   substitute a fake digest.
   ===================================================================== */

/* ---------- canonical JSON: sorted keys, no whitespace ---------- */
function canonicalJSON(v) {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : 'null';
  if (typeof v === 'boolean' || typeof v === 'string') return JSON.stringify(v);
  if (Array.isArray(v)) return '[' + v.map(canonicalJSON).join(',') + ']';
  const keys = Object.keys(v).sort();
  return '{' + keys.map((k) => JSON.stringify(k) + ':' + canonicalJSON(v[k])).join(',') + '}';
}

/* ---------- SHA-256, hex ---------- */
function sha256Available() {
  return typeof crypto !== 'undefined' && crypto.subtle && typeof crypto.subtle.digest === 'function';
}

async function sha256Hex(str) {
  const bytes = new TextEncoder().encode(str);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/* Hash one entry against the previous hash. Fields that are part of the
   chain envelope are excluded from the digest payload so that re-reading
   a stored entry reproduces its hash exactly. */
const CHAIN_ENVELOPE = ['hash', 'prev_hash', 'verified', 'tampered'];

function chainPayload(entry, prevHash) {
  const body = {};
  Object.keys(entry).forEach((k) => { if (!CHAIN_ENVELOPE.includes(k)) body[k] = entry[k]; });
  return prevHash + canonicalJSON(body);
}

/* ---------- build a chain from an ordered list of entry bodies ---------- */
const GENESIS = '0'.repeat(64);

async function buildChain(entries) {
  if (!sha256Available()) {
    return {
      ok: false,
      reason: 'WebCrypto (crypto.subtle) is unavailable in this context, so hashes cannot be computed. The ledger is displayed without digests rather than with fabricated ones.',
      rows: entries.map((e, i) => ({ ...e, seq: i + 1, prev_hash: null, hash: null })),
      verified: false,
      firstBadIndex: null,
    };
  }
  const rows = [];
  let prev = GENESIS;
  for (let i = 0; i < entries.length; i++) {
    const hash = await sha256Hex(chainPayload({ ...entries[i], seq: i + 1 }, prev));
    rows.push({ ...entries[i], seq: i + 1, prev_hash: prev, hash });
    prev = hash;
  }
  return { ok: true, rows, verified: true, firstBadIndex: null };
}

/* ---------- verify a chain, optionally with one row tampered ---------- */
async function verifyChain(rows, tamperIndex = -1) {
  if (!sha256Available()) return { verified: false, firstBadIndex: null, reason: 'crypto.subtle unavailable' };
  let prev = GENESIS;
  for (let i = 0; i < rows.length; i++) {
    const body = { ...rows[i] };
    delete body.hash; delete body.prev_hash; delete body.verified; delete body.tampered;
    if (rows[i].prev_hash !== prev || body.seq !== i + 1) {
      return { verified: false, firstBadIndex: i, expected: prev, stored: rows[i].prev_hash };
    }
    if (i === tamperIndex) {
      /* flip exactly one byte of a string field — the action text — so the
         tamper is real and minimal, not a fabricated failure flag */
      const key = typeof body.act === 'string' ? 'act' : Object.keys(body).find((k) => typeof body[k] === 'string');
      if (key) {
        const s = body[key];
        const at = Math.min(4, s.length - 1);
        const ch = s.charCodeAt(at) ^ 0x01;                 // flip one bit of one byte
        body[key] = s.slice(0, at) + String.fromCharCode(ch) + s.slice(at + 1);
      }
    }
    const expect = await sha256Hex(chainPayload(body, prev));
    if (expect !== rows[i].hash) {
      return { verified: false, firstBadIndex: i, expected: expect, stored: rows[i].hash };
    }
    prev = rows[i].hash;
  }
  return { verified: true, firstBadIndex: null };
}

/* =====================================================================
   Downloads — real files, built from the loaded case
   ===================================================================== */
function downloadBlob(filename, text, mime) {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return blob.size;
}

/* ---------- flatten a case into export rows ---------- */
function provenance(record) {
  return (record.sources || [record.source]).filter(Boolean).map(source =>
    source.label === 'HISTORICAL' ? `${source.label} · ${source.ref}` : source.label
  ).join(' · ');
}

function exportRecord(record) {
  return { ...record, provenance: provenance(record) };
}

function caseRows(scene) {
  const rows = [];
  Object.entries(scene.claims).forEach(([cid, c]) => {
    const ct = CLAIM_TYPES.find((t) => t.id === cid) || { name: cid };
    (c.evidence || []).forEach((e) => {
      rows.push({
        claim_id: cid, claim_name: ct.name,
        claim_verdict: c.claimVerdict, claim_status: c.status, claim_peak: c.peak,
        decisive_rule: c.rule,
        evidence_kind: e.kind, evidence_title: e.title,
        evidence_status: e.status, proof_level: e.level, cost_to_forge: e.cost,
        copy_origin: e.originLabel || 'independent observation',
        flags: (e.flags || []).join(' '),
        evidence_note: e.note || '',
        source_badge: provenance(e), source_ref: (e.sources || [e.source]).filter(Boolean).map(s => s.ref).join(' · '),
        historical_text: e.historical_text ? JSON.stringify(e.historical_text) : '',
        source_level: e.source_level || e.source?.source_level || '',
        observed: e.found,
      });
    });
    (c.missing || []).forEach((m, i) => {
      rows.push({
        claim_id: cid, claim_name: ct.name,
        claim_verdict: c.claimVerdict, claim_status: c.status, claim_peak: c.peak,
        decisive_rule: c.rule,
        evidence_kind: 'MISSING (rank ' + (i + 1) + ')', evidence_title: m.text,
        evidence_status: m.effect, proof_level: '', cost_to_forge: '',
        copy_origin: m.tier === 1 ? 'decisive' : 'non-decisive', flags: '', evidence_note: '',
        source_badge: '', source_ref: '', historical_text: '', source_level: '', observed: '',
      });
    });
    if (c.historicalLens) {
      const lens = c.historicalLens;
      const row = Object.fromEntries(Object.keys(rows[0]).map(key => [key, '']));
      rows.push({ ...row, claim_id: cid, claim_name: ct.name, evidence_kind: 'Boilerplate Lens',
        source_badge: provenance(lens), source_ref: lens.historical_text.source,
        source_level: lens.source_level, historical_text: JSON.stringify(lens.historical_text),
        evidence_note: JSON.stringify(exportRecord(lens)) });
    }
  });
  if (scene.listingContext && rows.length) {
    const context = scene.listingContext;
    const row = Object.fromEntries(Object.keys(rows[0]).map(key => [key, '']));
    rows.push({ ...row, evidence_kind: 'Listing context', evidence_title: context.historical_text.title,
      source_badge: provenance(context), source_ref: context.dataset, source_level: context.source_level,
      historical_text: JSON.stringify(context.historical_text), evidence_note: JSON.stringify(exportRecord(context)) });
  }
  return rows;
}

function toCSV(rows) {
  if (!rows.length) return '';
  const cols = Object.keys(rows[0]);
  const esc = (v) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  return [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');
}

function toJSONDoc(scene, ledgerRows) {
  return JSON.stringify({
    schema: 'sakshiastra.evidence-set/1',
    generated: scene.case.opened,
    case: { id: scene.case.id, title: scene.title, analyst: scene.case.analyst, question: scene.question },
    note: 'This document reports claim statuses, proof levels and falsifiers. It contains no scalar identity score by design.',
    subjects: scene.subjects,
    listing_context: scene.listingContext ? exportRecord(scene.listingContext) : null,
    claims: Object.entries(scene.claims).map(([cid, c]) => ({
      id: cid,
      name: (CLAIM_TYPES.find((t) => t.id === cid) || {}).name,
      verdict: c.claimVerdict,
      status: c.status,
      peak_proof_level: c.peak,
      decisive_rule: c.rule,
      reasoning: c.why,
      what_would_falsify: c.falsify,
      evidence: (c.evidence || []).map((e) => ({
        kind: e.kind, title: e.title, detail: e.detail,
        status: e.status, proof_level: e.level, cost_to_forge: e.cost,
        flags: e.flags || [], note: e.note || null,
        copy_origin: e.origin || null,
        source: e.source, sources: e.sources || [e.source], historical_text: e.historical_text || null,
        provenance: provenance(e),
        source_level: e.source_level || e.source?.source_level, observed: e.found,
      })),
      copy_origin_bundles: c.bundles || [],
      historical_lens: c.historicalLens ? exportRecord(c.historicalLens) : null,
      open_gaps: c.missing || [],
    })),
    chain_of_custody: ledgerRows,
  }, null, 2);
}

/* ---------- STIX 2.1 ---------- */
const VERDICT_OPINION = { ASSERT: 'agree', HOLD: 'neutral', REJECT: 'strongly-disagree' };

async function stixId(type, seed) {
  // RFC 4122 UUIDv5 using the DNS namespace; no random identifiers.
  const namespace = '6ba7b8109dad11d180b400c04fd430c8';
  const name = new TextEncoder().encode('sakshiastra:' + type + ':' + seed);
  const input = new Uint8Array(16 + name.length);
  input.set(namespace.match(/../g).map((s) => parseInt(s, 16)));
  input.set(name, 16);
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-1', input)).slice(0, 16);
  bytes[6] = (bytes[6] & 15) | 0x50;
  bytes[8] = (bytes[8] & 63) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return type + '--' + [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20)].join('-');
}

async function toSTIX(scene, ledgerRows) {
  const now = new Date(scene.case.opened.replace(' ', 'T') + ':00Z').toISOString();
  const modified = ledgerRows.reduce((latest, row) => {
    const date = new Date(row.at.replace(' ', 'T') + ':00Z').toISOString();
    return date > latest ? date : latest;
  }, now);
  const objs = [];
  const identityId = await stixId('identity', canonicalJSON({ case: scene.case.id, question: scene.question, subjects: scene.subjects }));

  objs.push({
    type: 'identity',
    spec_version: '2.1',
    id: identityId,
    created: now,
    modified,
    name: scene.case.id + ' actor cluster',
    description: scene.question + ' Handles: ' + scene.subjects.map((s) => s.handle).join(', ') + '.',
    identity_class: 'unknown',
    labels: ['dark-web-persona-cluster'],
  });

  for (const [cid, c] of Object.entries(scene.claims)) {
    const ct = CLAIM_TYPES.find((t) => t.id === cid) || { name: cid };
    const claimId = await stixId('note', scene.case.id + ':' + cid + ':' + canonicalJSON(c));

    objs.push({
      type: 'note',
      spec_version: '2.1',
      id: claimId,
      created: now,
      modified,
      abstract: ct.name + ' — ' + c.claimVerdict,
      labels: ['proof-level-' + c.peak, 'rule-' + c.rule],
      content: JSON.stringify({
          claim_id: cid,
          verdict: c.claimVerdict,
          status: c.status,
          peak_proof_level: c.peak,
          decisive_rule: c.rule,
          what_would_falsify: c.falsify,
          evidence_count: (c.evidence || []).length,
          reasoning: c.why,
          evidence: (c.evidence || []).map(exportRecord),
          copy_origin_bundles: c.bundles || [],
          historical_lens: c.historicalLens ? exportRecord(c.historicalLens) : null,
          open_gaps: (c.missing || []).map((m) => ({ text: m.text, effect: m.effect, tier: m.tier })),
      }, null, 2),
      authors: [scene.case.analyst],
      object_refs: [identityId],
    });

    objs.push({
      type: 'relationship', spec_version: '2.1',
      id: await stixId('relationship', canonicalJSON({ claimId, identityId, verdict: c.claimVerdict })),
      created: now, modified,
      relationship_type: 'related-to',
      source_ref: claimId, target_ref: identityId,
      description: ct.name + ' evaluated as ' + c.claimVerdict + ' under rule ' + c.rule + '.',
    });

    objs.push({
      type: 'opinion',
      spec_version: '2.1',
      id: await stixId('opinion', canonicalJSON({ claimId, verdict: c.claimVerdict, why: c.why })),
      created: now, modified,
      opinion: VERDICT_OPINION[c.claimVerdict] || 'neutral',
      explanation: c.why + ' Open gaps: ' + ((c.missing || []).length || 0) + '.',
      authors: ['sakshiastra rule engine'],
      object_refs: [claimId, identityId],
    });
  }

  /* provenance as a note object, hashes intact so the export is auditable */
  objs.push({
    type: 'note',
    spec_version: '2.1',
    id: await stixId('note', scene.case.id + ':provenance:' + canonicalJSON({ ledgerRows, listingContext: scene.listingContext })),
    created: now, modified,
    abstract: 'Chain of custody and source labelling',
    content: JSON.stringify({ listing_context: scene.listingContext ? exportRecord(scene.listingContext) : null, chain_of_custody: ledgerRows }, null, 2),
    authors: ['sakshiastra'],
    object_refs: [identityId],
  });

  return JSON.stringify({
    type: 'bundle',
    id: await stixId('bundle', scene.case.id + ':' + canonicalJSON(objs)),
    objects: objs,
  }, null, 2);
}

/* ---------- print-to-PDF report ---------- */
function buildReportHTML(scene, ledgerRows, chain) {
  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const claims = Object.entries(scene.claims).map(([cid, c]) => {
    const ct = CLAIM_TYPES.find((t) => t.id === cid) || { name: cid };
    const ev = (c.evidence || []).map((e) => `
      <tr>
        <td>${esc(e.kind)}</td>
        <td>${esc(e.title)}${(e.flags || []).length ? ' <b>[' + esc(e.flags.join(', ')) + ']</b>' : ''}${e.historical_text ? '<p>' + esc(JSON.stringify(e.historical_text)) + '</p>' : ''}</td>
        <td class="mono">${esc(e.level)}</td>
        <td class="mono">${esc(e.cost)}</td>
        <td class="mono">${esc(e.status)}</td>
        <td class="mono">${esc(provenance(e))}</td>
      </tr>`).join('');
    const gaps = (c.missing || []).map((m, i) =>
      `<li>${esc(m.text)} — <b>${esc(m.effect)}</b>${m.tier === 1 ? ' (decisive)' : ''}</li>`).join('');
    return `
      <section class="claim">
        <h3>${esc(ct.name)} <span class="v v-${c.claimVerdict}">${esc(c.claimVerdict)}</span>
          <span class="mono">${esc(c.status)} · peak ${esc(c.peak)} · rule ${esc(c.rule)}</span></h3>
        <p class="why">${esc(c.why)}</p>
        <p class="falsify"><b>What would falsify this:</b> ${esc(c.falsify)}</p>
        <table><thead><tr><th>Kind</th><th>Evidence</th><th>Proof</th><th>Cost</th><th>Status</th><th>Source</th></tr></thead>
        <tbody>${ev}</tbody></table>
        ${c.historicalLens ? '<p class="mono">Boilerplate Lens · ' + esc(provenance(c.historicalLens)) + '</p><p>' + esc(JSON.stringify(c.historicalLens)) + '</p>' : ''}
        ${gaps ? '<h4>Open gaps</h4><ol>' + gaps + '</ol>' : ''}
      </section>`;
  }).join('');

  const ledger = ledgerRows.map((r) => `
    <tr><td class="mono">${r.seq}</td><td>${esc(r.act)}</td><td class="mono">${esc(r.actor)}</td>
    <td class="mono">${esc((r.hash || 'no digest').slice(0, 16))}</td><td class="mono">${esc(r.at)}</td></tr>`).join('');

  /* the report is a standalone document; it uses the same tokens inline
     so a printed dossier and the app never diverge in colour */
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(scene.case.id)} — dossier</title>
<style>
  @page { margin: 18mm; }
  body { font: 10.5pt/1.5 "Inter", Helvetica, sans-serif; color: var(--color-text); }
  h1 { font-weight: 600; font-size: 22pt; line-height: 1.15; margin: 0 0 4mm; }
  h3 { font-weight: 600; font-size: 11.5pt; margin: 6mm 0 2mm; padding-bottom: 1.5mm; border-bottom: 1px solid var(--color-border-strong); }
  h4 { font-weight: 600; font-size: 10pt; margin: 3mm 0 1mm; text-transform: uppercase; letter-spacing: .04em; color: var(--color-text-3); }
  .mono { font-family: "JetBrains Mono", monospace; font-size: 8.5pt; }
  .meta { color: var(--color-text-3); font-size: 9pt; margin-bottom: 5mm; }
  .banner { border: 1px solid var(--color-border-strong); background: var(--color-surface-alt);
            padding: 2.5mm 3mm; font-size: 9pt; margin-bottom: 5mm; }
  table { width: 100%; border-collapse: collapse; margin: 1.5mm 0 0; }
  th { text-align: left; font-size: 8pt; text-transform: uppercase; letter-spacing: .04em;
       color: var(--color-text-3); border-bottom: 1px solid var(--color-border-strong); padding: 1mm 1.5mm; }
  td { padding: 1.2mm 1.5mm; border-bottom: .5px solid var(--color-border); vertical-align: top; }
  .v { font-family: "JetBrains Mono", monospace; font-size: 8.5pt; padding: .5mm 1.5mm;
       border: 1px solid currentColor; border-radius: 3px; }
  .v-ASSERT { color: var(--color-assert); background: var(--color-assert-bg); }
  .v-HOLD { color: var(--color-hold); background: var(--color-hold-bg); }
  .v-REJECT { color: var(--color-reject); background: var(--color-reject-bg); }
  .why { margin: 1.5mm 0; } .falsify { margin: 1.5mm 0; }
  .claim { break-inside: avoid; }
</style>
<style>
  :root {
    --color-text: #0F172A; --color-text-3: #64748B;
    --color-border: #E3E6EB; --color-border-strong: #CBD5E1; --color-surface-alt: #F1F5F9;
    --color-assert: #15803D; --color-assert-bg: #E7F4EC;
    --color-hold: #B45309; --color-hold-bg: #FBF0E2;
    --color-reject: #B91C1C; --color-reject-bg: #FBEBEB;
  }
</style></head><body>
<h1>${esc(scene.title)}</h1>
<div class="meta mono">${esc(scene.case.id)} · opened ${esc(scene.case.opened)} · analyst ${esc(scene.case.analyst)} · ${esc(caseResult(scene).label)}</div>
<p>${esc(scene.question)}</p>
<div class="banner"><b>This dossier reports claim statuses, proof levels and falsifiers.</b>
It contains no scalar identity score by design: a single number cannot say which evidence did the work,
what it would cost an attacker to fake, or what would change the verdict. Verdicts here are ASSERT, HOLD or REJECT.</div>
<p class="mono">Subjects: ${esc(scene.subjects.map((s) => s.handle + ' (' + s.market + ')').join(' · '))}</p>
${scene.listingContext ? '<h3>Listing context</h3><p class="mono">' + esc(provenance(scene.listingContext)) + '</p><p>' + esc(JSON.stringify(scene.listingContext)) + '</p>' : ''}
${claims}
<h3>Chain of custody</h3>
<p class="mono">${chain.ok ? 'All ' + ledgerRows.length + ' entries hash-chained with SHA-256.' : esc(chain.reason)}</p>
<table><thead><tr><th>Seq</th><th>Action</th><th>Actor</th><th>Hash</th><th>At</th></tr></thead><tbody>${ledger}</tbody></table>
<p class="mono">Real-world identity requires analyst confirmation and second-analyst approval. PII is redacted by default.</p>
</body></html>`;
}

function printReport(scene, ledgerRows, chain) {
  const html = buildReportHTML(scene, ledgerRows, chain);
  const w = window.open('', '_blank');
  if (!w) return false;
  w.document.open();
  w.document.write(html);
  w.document.close();
  setTimeout(() => { try { w.focus(); w.print(); } catch (e) { /* user can print manually */ } }, 350);
  return true;
}

Object.assign(window, {
  canonicalJSON, sha256Hex, sha256Available, buildChain, verifyChain, GENESIS,
  downloadBlob, caseRows, toCSV, toJSONDoc, toSTIX, buildReportHTML, printReport,
});

export { canonicalJSON, sha256Available, sha256Hex, CHAIN_ENVELOPE, chainPayload, GENESIS, buildChain, verifyChain, downloadBlob, caseRows, toCSV, toJSONDoc, VERDICT_OPINION, stixId, toSTIX, buildReportHTML, printReport };
