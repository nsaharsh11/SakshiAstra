import React from 'react';
import { caseResult, lvl } from './api.js';
import { COST, PROOF_LEVELS } from './scenes.js';
/* =====================================================================
   SakshiAstra — primitives
   The vocabulary components. Every screen is built from these, so a
   verdict is rendered the same way everywhere it appears.
   ===================================================================== */

/* ---------- icons: geometric, 1.6px stroke, no fills ---------- */
const ICON_PATHS = {
  chevronRight: 'M6 3.5 L10.5 8 L6 12.5',
  chevronDown: 'M3.5 6 L8 10.5 L12.5 6',
  chevronLeft: 'M10 3.5 L5.5 8 L10 12.5',
  check: 'M3.5 8.5 L6.5 11.5 L12.5 4.5',
  x: 'M4 4 L12 12 M12 4 L4 12',
  plus: 'M8 3.5 L8 12.5 M3.5 8 L12.5 8',
  minus: 'M3.5 8 L12.5 8',
  search: 'M7.2 12.5 A5.3 5.3 0 1 0 7.2 1.9 A5.3 5.3 0 1 0 7.2 12.5 M11.2 11.2 L14.5 14.5',
  link: 'M6.6 9.4 L9.4 6.6 M5.6 7 A2.4 2.4 0 0 1 5.6 3.6 L7 2.2 M10.4 9 A2.4 2.4 0 0 0 10.4 12.4 L9 13.8',
  dot: 'M8 8 m-1.6 0 a1.6 1.6 0 1 0 3.2 0 a1.6 1.6 0 1 0 -3.2 0',
  seal: 'M8 1.8 L10.1 4 L13.2 4.6 L12.6 7.7 L12.6 8.3 L13.2 11.4 L10.1 12 L8 14.2 L5.9 12 L2.8 11.4 L3.4 8.3 L3.4 7.7 L2.8 4.6 L5.9 4 Z',
  flag: 'M4 13.5 L4 2.5 M4 3 L11.5 3 L10 6 L11.5 9 L4 9',
  arrowRight: 'M2.5 8 L13.5 8 M9.5 4 L13.5 8 L9.5 12',
  arrowDown: 'M8 2.5 L8 13.5 M4 9.5 L8 13.5 L12 9.5',
  grid: 'M2.5 2.5 L6.5 2.5 L6.5 6.5 L2.5 6.5 Z M9.5 2.5 L13.5 2.5 L13.5 6.5 L9.5 6.5 Z M2.5 9.5 L6.5 9.5 L6.5 13.5 L2.5 13.5 Z M9.5 9.5 L13.5 9.5 L13.5 13.5 L9.5 13.5 Z',
  layers: 'M8 2 L14 5.5 L8 9 L2 5.5 Z M2 9 L8 12.5 L14 9',
  clock: 'M8 8 m-6 0 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0 M8 4.5 L8 8 L10.8 9.8',
  route: 'M3 12.5 L3 6.5 M3 6.5 A2 2 0 0 1 5 4.5 L11 4.5 M11 4.5 A2 2 0 0 1 13 6.5 L13 12.5',
  shield: 'M8 1.9 L13.5 4 L13.5 8 C13.5 11 11 13 8 14.2 C5 13 2.5 11 2.5 8 L2.5 4 Z',
  doc: 'M4 2 L9.5 2 L12 4.5 L12 14 L4 14 Z M9.5 2 L9.5 4.5 L12 4.5',
  bolt: 'M9 1.5 L3.5 9 L7.5 9 L7 14.5 L12.5 7 L8.5 7 Z',
  scan: 'M2.5 5 L2.5 2.5 L5 2.5 M11 2.5 L13.5 2.5 L13.5 5 M13.5 11 L13.5 13.5 L11 13.5 M5 13.5 L2.5 13.5 L2.5 11 M2.5 8 L13.5 8',
  target: 'M8 8 m-5.5 0 a5.5 5.5 0 1 0 11 0 a5.5 5.5 0 1 0 -11 0 M8 8 m-2 0 a2 2 0 1 0 4 0 a2 2 0 1 0 -4 0',
  play: 'M4.5 2.8 L12.5 8 L4.5 13.2 Z',
  pause: 'M5.5 3 L5.5 13 M10.5 3 L10.5 13',
  eye: 'M1.5 8 C4 3.5 12 3.5 14.5 8 C12 12.5 4 12.5 1.5 8 M8 8 m-2.2 0 a2.2 2.2 0 1 0 4.4 0 a2.2 2.2 0 1 0 -4.4 0',
  sliders: 'M3 4.5 L13 4.5 M3 11.5 L13 11.5 M6 4.5 m-1.6 0 a1.6 1.6 0 1 0 3.2 0 a1.6 1.6 0 1 0 -3.2 0 M10.5 11.5 m-1.6 0 a1.6 1.6 0 1 0 3.2 0 a1.6 1.6 0 1 0 -3.2 0',
  filter: 'M2.5 3.5 L13.5 3.5 L9.5 8.5 L9.5 13 L6.5 11.5 L6.5 8.5 Z',
  history: 'M2.5 8 A5.5 5.5 0 1 1 8 13.5 M2.5 8 L2.5 4 M2.5 8 L6.5 8',
  user: 'M8 8 m-2.8 0 a2.8 2.8 0 1 0 5.6 0 a2.8 2.8 0 1 0 -5.6 0 M3 14 C3 11.5 5.2 10 8 10 C10.8 10 13 11.5 13 14',
  lock: 'M4 7.5 L12 7.5 L12 14 L4 14 Z M5.5 7.5 L5.5 5 A2.5 2.5 0 0 1 10.5 5 L10.5 7.5',
  warn: 'M8 2.2 L14.5 13.5 L1.5 13.5 Z M8 6.5 L8 10 M8 11.6 L8 12.2',
  command: 'M5 3 A1.8 1.8 0 1 0 6.8 4.8 L6.8 11.2 A1.8 1.8 0 1 0 8.5 13 L5 6.8 L11 6.8 A1.8 1.8 0 1 0 11.2 4.8 L9.5 4.8 L9.5 11.2 A1.8 1.8 0 1 0 11 13',
};

/* Lucide conventions: 18px default, 1.5 stroke, neutral ink */
function Icon({ name, size = 18, style, className, strokeWidth = 1.5 }) {
  const d = ICON_PATHS[name] || ICON_PATHS.dot;
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
      stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flex: 'none', color: 'var(--color-text-3)', ...style }} className={className}
      aria-hidden="true">
      {d.split(' M').map((seg, i) => <path key={i} d={(i ? 'M' : '') + seg} />)}
    </svg>
  );
}

/* ---------- verdict chip ---------- */
const V_LABEL = { ASSERT: 'ASSERT', HOLD: 'HOLD', REJECT: 'REJECT', TAKEOVER: 'TAKEOVER' };
function VerdictChip({ verdict, label, solid, onChrome, icon = true }) {
  const v = (verdict || 'HOLD').toLowerCase();
  return (
    <span className={`vchip v-${v}${solid ? ' solid' : ''}${onChrome ? ' on-chrome' : ''}`}>
      {icon && <span className="dot" />}
      <span>{label || V_LABEL[verdict] || verdict}</span>
    </span>
  );
}
function CaseResult({ scene, onChrome }) {
  const result = caseResult(scene);
  return <VerdictChip verdict={result.verdict} label={result.label} onChrome={onChrome} />;
}
function TakeoverFlag({ compact }) {
  return (
    <span className="vchip v-takeover">
      <Icon name="warn" size={11} />
      <span>{compact ? 'TAKEOVER' : 'TAKEOVER · key valid, operator not confirmed'}</span>
    </span>
  );
}

/* claim status. Deliberately a word with a rule under it, not a coloured
   badge: colour belongs to verdicts, and status is a different axis. */
const STATUS_SHORT = {
  VERIFIED: 'VERIFIED', SUPPORTED: 'SUPPORTED', UNVERIFIED: 'UNVERIFIED',
  QUESTIONABLE: 'QUESTIONABLE', CONTRADICTED: 'CONTRADICTED',
};
/* Status is a separate axis from verdict and is rendered in NEUTRAL INK.
   Colour belongs to verdicts; status is carried by weight and rule style
   so the two never compete for the same signal. */
const STATUS_WEIGHT = {
  VERIFIED: 'strong', SUPPORTED: '', UNVERIFIED: 'weak',
  QUESTIONABLE: 'weak', CONTRADICTED: 'strong',
};
function StatusWord({ status, muted }) {
  return (
    <span className={`status-word ${STATUS_WEIGHT[status] || ''}`}
      style={muted ? { color: 'var(--text-3)' } : undefined}>
      {STATUS_SHORT[status] || status}
    </span>
  );
}

/* ---------- proof ladder ---------- */
function ProofLadder({ peak, compact, note }) {
  const pk = lvl(peak);
  return (
    <div className="stack proof-ladder" style={{ gap: 5 }}>
      <div className="ladder" key={peak} data-peak={peak}>
        {PROOF_LEVELS.map((p, i) => (
          <div key={p.code}
            className={`rung${i <= pk ? ' on' : ''}${i === pk ? ' peak' : ''}`}
            title={`${p.code} — ${p.desc}`}>
            <div className="rung-code">
              {p.code}
              {i === pk && <Icon name="check" size={10} />}
            </div>
            {!compact && <div className="rung-desc">{p.desc}</div>}
          </div>
        ))}
      </div>
      {note && <div className="tiny" style={{ color: 'var(--text-3)' }}>{note}</div>}
    </div>
  );
}

function WalletLadderStep({ claim, onCollect, busy }) {
  if (!claim.requiresFreshControl) return null;
  const complete = claim.peak === 'L3' && claim.claimVerdict === 'ASSERT';
  return (
    <div className="callout" aria-live="polite">
      <div className="label">Final ladder step · L3 fresh</div>
      {complete ? <div>Fresh challenge verified · Wallet Control · ASSERT</div> : (
        <button className="btn btn-sm" disabled={busy} onClick={() => onCollect(0)}>
          {busy ? 'Collecting fresh control…' : 'Run signed challenge / funds move'}
        </button>
      )}
    </div>
  );
}

/* ---------- attack-cost meter ---------- */
function AttackCost({ cost, compact, showCap = true }) {
  const c = COST[cost] || COST[0];
  return (
    <div className="cost" title={c.cap}>
      <div className="cost-meter" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={`cost-bar${i <= c.bars ? ' f' : ''}${cost >= 4 ? ' hi' : ''}`}
            style={{ height: `${5 + i * 3.2}px` }} />
        ))}
      </div>
      {!compact && (
        <div className="stack" style={{ gap: 1 }}>
          <div className="cost-fig">{c.cap}</div>
          <div className="cost-cap">{c.level}</div>
        </div>
      )}
      {compact && showCap && (
        <div className="cost-cap" style={{ color: 'var(--text-3)' }}>
          {c.level}
        </div>
      )}
    </div>
  );
}

/* ---------- persistent provenance strip ---------- */
function ProvenanceStrip() {
  return (
    <div className="prov">
      <span className="prov-key" style={{ color: 'var(--text-2)' }}>
        <Icon name="layers" size={11} /> Provenance
      </span>
      <span className="prov-rule" />
      <span>Fixture scenarios</span>
      <span className="prov-rule" />
      <span className="prov-dataset">Agora 2014-15 (Kaggle), text only</span>
    </div>
  );
}

function DataBadge({ source, sources }) {
  if (sources) return <>{sources.map(s => <DataBadge key={s.label} source={s} />)}</>;
  if (!source) return null;
  return (
    <span className={`dbadge ${source.badge}`} title={source.ref}>
      {source.label}
    </span>
  );
}

/* ---------- PII: redacted by default, click to reveal, audited ---------- */
function PII({ value, revealed, onToggle }) {
  return (
    <span className={`pii${revealed ? ' revealed' : ''}`}
      title={revealed ? 'Revealed — this action is written to the ledger' : 'Redacted by default. Reveal is logged.'}
      onClick={(e) => { e.stopPropagation(); onToggle && onToggle(); }}>
      {revealed ? value : '▮▮▮▮▮▮▮'}
    </span>
  );
}

/* ---------- copy-origin bundle ---------- */
function CopyOriginBundle({ bundle, defaultOpen }) {
  const [open, setOpen] = React.useState(!!defaultOpen);
  return (
    <div className="bundle">
      <button className="bundle-head" onClick={() => setOpen(!open)}>
        <Icon name={open ? 'chevronDown' : 'chevronRight'} size={11} style={{ color: 'var(--text-3)' }} />
        <span className="bundle-fold">{bundle.items.length}→1</span>
        <span className="bundle-title">{bundle.title}</span>
        <span className="bundle-count">
          {bundle.items.length} signals · one origin
        </span>
      </button>
      {open && (
        <div className="bundle-items fade-in">
          {bundle.items.map((it, i) => (
            <div className="bundle-item" key={i}>
              <Icon name="dot" size={9} style={{ color: 'var(--text-3)' }} />
              <span style={{ flex: 1 }}>{it}</span>
              <span className="bundle-origin">same origin</span>
            </div>
          ))}
          <div className="bundle-item" style={{ background: 'var(--surface)' }}>
            <Icon name="warn" size={11} style={{ color: 'var(--hold-fg)' }} />
            <span style={{ flex: 1, color: 'var(--text-2)' }}>{bundle.note}</span>
            {bundle.occurrencesElsewhere > 1 && (
              <span className="bundle-origin">seen on {bundle.occurrenceLabel || `${bundle.occurrencesElsewhere.toLocaleString()} records`}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- boilerplate lens ---------- */
function BoilerplateLens({ raw = 88, independent = 24, text, comparisonText, labels = [], boiler = [], indep = [], sources }) {
  const [mode, setMode] = React.useState('raw');
  const [expanded, setExpanded] = React.useState(false);
  const segs = buildSegments(text, boiler, indep);
  return (
    <div className="lens">
      <div className="lens-head">
        <Icon name="scan" size={11} />
        <span>Boilerplate lens</span>
        <DataBadge sources={sources} />
        <div className="btn-group" style={{ marginLeft: 'auto' }}>
          <button className="btn btn-sm" aria-pressed={mode === 'raw'}
            style={mode === 'raw' ? { background: 'var(--text)', color: 'var(--surface)', borderColor: 'var(--text)' } : {}}
            onClick={() => setMode('raw')}>Raw</button>
          <button className="btn btn-sm" aria-pressed={mode === 'independent'}
            style={mode === 'independent' ? { background: 'var(--text)', color: 'var(--surface)', borderColor: 'var(--text)' } : {}}
            onClick={() => setMode('independent')}>Independent</button>
        </div>
      </div>
      <div className="lens-text" style={{ maxHeight: comparisonText || expanded ? 'none' : 118, overflow: 'hidden' }}>
        {labels[0] && <div className="tiny muted">{labels[0]} · Market A</div>}
        {segs.map((s, i) => (
          <span key={i} className={
            mode === 'independent' && s.kind === 'boiler' ? 'boiler'
              : mode === 'independent' && s.kind === 'indep' ? 'indep'
              : ''}>{s.t}</span>
        ))}
        {comparisonText && <div style={{ marginTop: 12 }}>
          <div className="tiny muted">{labels[1]} · Market B</div>
          {buildSegments(comparisonText, boiler, []).map((s, i) => <span key={i}
            className={mode === 'independent' && s.kind === 'boiler' ? 'boiler' : ''}>{s.t}</span>)}
        </div>}
      </div>
      <div className="lens-legend">
        <span className="lens-key"><b>{raw}%</b> raw similarity → <b>{independent}%</b> after template removal</span>
        {!comparisonText && <span className="lens-key">
          <Icon name="chevronDown" size={10} style={{ color: 'var(--text-3)' }} />
          <button className="btn-ghost btn btn-sm" style={{ height: 17, padding: '0 4px' }}
            onClick={() => setExpanded(!expanded)}>{expanded ? 'collapse' : 'expand'}</button>
        </span>}
        <span className="lens-key" style={{ marginLeft: 'auto', color: 'var(--text-3)' }}>
          template text struck through · uncounted
        </span>
      </div>
    </div>
  );
}
function buildSegments(text, boiler, indep) {
  if (!text) return [];
  const marks = [];
  boiler.forEach((b) => { const i = text.indexOf(b); if (i >= 0) marks.push([i, i + b.length, 'boiler']); });
  indep.forEach((b) => { const i = text.indexOf(b); if (i >= 0) marks.push([i, i + b.length, 'indep']); });
  marks.sort((a, b) => a[0] - b[0]);
  const out = []; let cur = 0;
  marks.forEach(([s, e, k]) => {
    if (s > cur) out.push({ t: text.slice(cur, s), kind: 'plain' });
    out.push({ t: text.slice(s, e), kind: k });
    cur = e;
  });
  if (cur < text.length) out.push({ t: text.slice(cur), kind: 'plain' });
  return out;
}

/* ---------- continuity strip ---------- */
function ContinuityStrip({ continuity, compact }) {
  if (!continuity) return null;
  return (
    <div className="cont">
      <div className="tiny label" style={{ marginBottom: 6 }}>Continuity</div>
      <div className="cont-track">
        {continuity.segments.map((s, i) => (
          <div key={i} className={`cont-seg ${s.kind === 'gap' ? 'gap' : s.kind === 'solid' ? 'solid' : ''}`}
            style={{ width: `${s.w * 100}%` }}>
            {!compact && s.label}
          </div>
        ))}
        <div className="cont-changepoint" style={{ left: `${continuity.changePoint * 100}%` }}
          title={`Change-point ${continuity.changeLabel}`} />
      </div>
      <div className="cont-axis">
        <span>{continuity.from}</span>
        <span style={{ color: 'var(--takeover-fg)' }}>
          ▲ change-point {continuity.changeLabel}
        </span>
        <span>{continuity.to}</span>
      </div>
      {continuity.note && (
        <div className="tiny" style={{ color: 'var(--text-2)', marginTop: 6, textWrap: 'pretty' }}>
          {continuity.note}
        </div>
      )}
    </div>
  );
}

/* ---------- formatters ---------- */
/* fingerprints and long hashes grouped in fours, machine strings only */
function group4(s) {
  const t = String(s || '').replace(/[^0-9a-fA-F]/g, '');
  return t.replace(/(.{4})/g, '$1 ').trim();
}
/* Display dates and timestamps without changing stored values. */
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function fmtStamp(input) {
  if (!input) return '';
  const m = String(input).match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/);
  if (!m) return String(input);
  const [, y, mo, d, hh, mm] = m;
  const mon = MONTHS[parseInt(mo, 10) - 1] || mo;
  const day = String(parseInt(d, 10));
  return day + ' ' + mon + ' ' + y + (hh ? ' · ' + hh + ':' + mm : '');
}

/* ---------- empty state ---------- */
function EmptyState({ title, body, action }) {
  return (
    <div className="empty">
      <div className="empty-title">{title}</div>
      {body && <p className="empty-body">{body}</p>}
      {action && <div style={{ marginTop: 'var(--space-4)' }}>{action}</div>}
    </div>
  );
}

/* ---------- fingerprint chip ---------- */
function Fingerprint({ value, title }) {
  return <span className="fp" title={title || value}>{group4(value)}</span>;
}

/* ---------- small helpers ---------- */
function Stat({ fig, cap, color }) {
  return (
    <div>
      <div className="stat-fig" style={{ color: color || 'var(--text)' }}>{fig}</div>
      <div className="stat-cap">{cap}</div>
    </div>
  );
}
function SectionH({ children, right }) {
  return (
    <div className="section-h">
      <span>{children}</span>
      {right}
    </div>
  );
}
function Ident({ children, title }) {
  return <span className="ident" title={title}>{children}</span>;
}
function KeyVal({ k, children }) {
  return (
    <div className="stack" style={{ gap: 2 }}>
      <div className="label">{k}</div>
      <div style={{ fontSize: 'var(--text-xs)' }}>{children}</div>
    </div>
  );
}

Object.assign(window, {
  Icon, VerdictChip, TakeoverFlag, StatusWord, ProofLadder, AttackCost,
  ProvenanceStrip, DataBadge, PII, CopyOriginBundle, BoilerplateLens,
  ContinuityStrip, Stat, SectionH, Ident, KeyVal, V_LABEL,
  group4, fmtStamp, EmptyState, Fingerprint, MONTHS,
});

export { ICON_PATHS, Icon, V_LABEL, VerdictChip, CaseResult, TakeoverFlag, STATUS_SHORT, STATUS_WEIGHT, StatusWord, ProofLadder, WalletLadderStep, AttackCost, ProvenanceStrip, DataBadge, PII, CopyOriginBundle, BoilerplateLens, buildSegments, ContinuityStrip, group4, MONTHS, fmtStamp, EmptyState, Fingerprint, Stat, SectionH, Ident, KeyVal };
