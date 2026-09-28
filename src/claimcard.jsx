import { shortReason, evidenceDetail } from './copy.js';
import React from 'react';
import { WalletLadderStep } from './primitives.jsx';
import { AttackCost, BoilerplateLens, ContinuityStrip, CopyOriginBundle, DataBadge, fmtStamp, Icon, KeyVal, PII, ProofLadder, SectionH, StatusWord, TakeoverFlag, VerdictChip } from './primitives.jsx';
import { lvl } from './api.js';
import { PROOF_LEVELS } from './scenes.js';
/* =====================================================================
   SakshiAstra — Claim Card + Evidence Inspector
   ---------------------------------------------------------------------
   THE CENTREPIECE. Everything else in the product is scaffolding around
   this component.

   Design rules this file enforces:
     · A claim is never a number. It is status + proof level + falsifier.
     · Contradicted evidence is rendered as REJECT, never averaged away.
     · Every item carries cost-to-forge next to strength — the two are
       different axes and the layout keeps them visibly separate.
     · Copy-origin bundles collapse above the items, so the fold is read
       before the individual signals.
     · "What would falsify this" is a first-class field, not a footnote.
   ===================================================================== */

function ClaimCard({ claim, claimType, onOpen, selected }) {
  const verdict = claim.claimVerdict || 'HOLD';
  return <div className={`claim-card sp-${verdict.toLowerCase()}${selected ? ' sel' : ''}`} data-screen-label={claimType?.name}>
    <div className="claim-card-top">
      <div className="claim-q" style={{ flex: 1 }}>{claimType?.question}</div>
      <VerdictChip verdict={verdict} /><StatusWord status={claim.status} />
    </div>
    <div className="claim-card-body">
      <p className="tiny muted-2">{shortReason(claim)}</p>
      <details className="evidence-fold"><summary>Show evidence</summary>
        <div className="stack" style={{ gap: 10 }}>
          <ProofLadder peak={claim.peak} />
          {(claim.bundles || []).map(b => <CopyOriginBundle key={b.id} bundle={b} />)}
          <button className="btn btn-sm" onClick={onOpen}>Open claim <Icon name="chevronRight" size={11} /></button>
        </div>
      </details>
    </div>
  </div>;
}

const SAMPLE_LISTING = 'Escrow accepted \u00b7 FE available \u00b7 24h dispatch. Worldwide shipping, discrete packaging is standard, no exceptions. Pale horse supply \u2014 five years in the trade.';

function calloutStyle(verdict) {
  if (verdict === 'REJECT') return { borderLeftColor: 'var(--reject-fg)', background: 'var(--reject-wash)' };
  if (verdict === 'ASSERT') return { borderLeftColor: 'var(--assert-fg)', background: 'var(--assert-wash)' };
  return {};
}
function ladderNote(claim) {
  const pk = lvl(claim.peak);
  if (claim.takeover) return 'Capped at HOLD by the takeover rule, whatever the evidence below does.';
  if (pk >= 2) return 'Reached ' + claim.peak + ': persona-bound or re-verifiable.';
  if (pk === 1) return 'Ceiling here is L1 — signed but unbound. L1 cannot carry ASSERT.';
  return 'Only L0 material: pasted strings. L0 cannot carry a claim.';
}

/* =====================================================================
   Evidence row — the atom of the whole product
   ===================================================================== */
function EvidenceRow({ ev, expanded, onToggle, redacted, onReveal }) {
  return (
    <div className="ev">
      <button className="ev-head" onClick={onToggle} aria-expanded={expanded}>
        <div className={`ev-rail s-${ev.status}`} />
        <div className="ev-main"><div className="ev-title">{ev.title}</div></div>
        <div className="ev-right">
          <span className="cost-chip">Cost {ev.cost}/5</span>
          <StatusWord status={ev.status} />
          <Icon name={expanded ? 'chevronDown' : 'chevronRight'} size={12} />
        </div>
      </button>
      {expanded && (
        <div className="ev-detail fade-in">
          <div className="ev-meta"><DataBadge source={ev.source} sources={ev.sources} /><span>{fmtStamp(ev.found)}</span><span>{ev.kind}</span></div>
          {ev.note && <div className="tiny muted">{ev.note}</div>}
          {(ev.flags || []).includes('replayed_signature') && (
            <div className="zero-note">
              R8 — excluded from proof weight and from the peak proof level. A replay is real cryptography applied to
              the wrong question: it was not made for this persona.
            </div>
          )}
          {(ev.flags || []).includes('common_indicator') && (
            <div className="zero-note">
              R10 — {ev.discount || 'common indicator'}. Counted at zero cost and zero weight; shown so the discount is visible rather than silent.
            </div>
          )}
          <div className="body-text" style={{ fontSize: 'var(--text-sm)', margin: 0 }}>{evidenceDetail(ev.detail)}</div>
          <div className="grid g3" style={{ gap: 'var(--s4)' }}>
            <KeyVal k="Proof level">
              <span className="mono">{ev.level}</span>{' '}
              <span className="muted">{PROOF_LEVELS[lvl(ev.level)].desc}</span>
            </KeyVal>
            <KeyVal k="Source">
              <span className="mono tiny">{ev.source.ref}</span>
            </KeyVal>
          </div>
          <div className="grid cols-2-1" style={{ gap: 'var(--s4)', alignItems: 'start' }}>
            <div>
              <div className="label" style={{ marginBottom: 5 }}>Copy origin</div>
              {ev.origin
                ? <div className="tiny">{ev.originLabel}</div>
                : <div className="tiny muted">independent observation</div>}
            </div>
          </div>
          <PiiLine ev={ev} redacted={redacted} onReveal={onReveal} />
        </div>
      )}
    </div>
  );
}

/* PII is redacted by default everywhere, in every view. Revealing is a
   logged action, so the component says so. */
function PiiLine({ ev, redacted, onReveal }) {
  const hasPii = /ops@example|@example|\.net|@/i.test((ev.title || '') + (ev.detail || ''));
  if (!hasPii) return null;
  return (
    <div className="row" style={{ gap: 'var(--s3)', paddingTop: 4, borderTop: 'var(--hair) solid var(--border)' }}>
      <Icon name="lock" size={12} style={{ color: 'var(--text-3)' }} />
      <span className="tiny mono muted-2">contact identifier</span>
      <PII value="ops@example.net" revealed={!redacted} onToggle={onReveal} />
      <span className="tiny muted" style={{ marginLeft: 'auto' }}>
        {redacted ? 'redacted by default · reveal is written to the ledger' : 'revealed · logged'}
      </span>
    </div>
  );
}

/* =====================================================================
   Missing-evidence panel — ranked, with the verdict delta attached
   ===================================================================== */
function MissingEvidence({ items, onCollect, collected, busy }) {
  if (!items || !items.length) {
    return (
      <div className="callout assert" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Icon name="check" size={13} />
        <span>No missing evidence for this claim.</span>
      </div>
    );
  }
  return (
    <div>
      {items.map((m, i) => {
        const done = collected && collected.has(i);
        return (
          <div className="missing" key={i} style={done ? { borderColor: 'var(--assert-fg)', background: 'var(--assert-wash)' } : {}}>
            <div className="missing-rank">{i + 1}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 'var(--text-sm)', textWrap: 'pretty' }}>{m.text}</div>
              <div className="row" style={{ gap: 'var(--s3)', marginTop: 5 }}>
                <span className="missing-effect">
                  would change {m.effect}
                </span>
                {m.tier === 1 && <span className="tiny mono" style={{ color: 'var(--text-3)' }}>decisive</span>}
              </div>
            </div>
            {done ? (
              <span className="vchip v-assert" style={{ alignSelf: 'center' }}>
                <Icon name="check" size={10} /><span>COLLECTED</span>
              </span>
            ) : m.collectible !== false ? (
              <button className="btn btn-sm" disabled={busy} onClick={() => onCollect(i)}
                style={{ alignSelf: 'center', whiteSpace: 'nowrap' }}>
                <Icon name="plus" size={11} /> Add to collection
              </button>
            ) : (
              <span className="tiny muted" style={{ alignSelf: 'center', maxWidth: 120 }}>
                no collection route
              </span>
            )}
          </div>
        );
      })}
      <div className="tiny muted" style={{ marginTop: 10, textWrap: 'pretty' }}>
        Ranked by the change each item would produce. Tier 1 items would move the verdict on their own.
      </div>
    </div>
  );
}

/* =====================================================================
   Evidence Inspector — the claim, opened. Slides over the board.
   ===================================================================== */
function ClaimEvidence({ claim, onCollect, collected, busy, redacted, onReveal, children }) {
  const [open, setOpen] = React.useState(-1);
  return <details className="evidence-fold"><summary>Show evidence</summary>
    <div className="stack" style={{ gap: 16 }}>
      <WalletLadderStep claim={claim} busy={busy} onCollect={onCollect} />
      {claim.continuity && <ContinuityStrip continuity={claim.continuity} />}
      {(claim.bundles || []).map(b => <CopyOriginBundle key={b.id} bundle={b} />)}
      {claim.historicalLens ? <BoilerplateLens raw={claim.historicalLens.raw} independent={claim.historicalLens.independent}
        text={claim.historicalLens.texts[0]} comparisonText={claim.historicalLens.texts[1]} labels={claim.historicalLens.fixture_context.personas}
        boiler={[claim.historicalLens.template]} indep={[claim.historicalLens.residuals[0]]}
        sources={claim.historicalLens.sources} /> : claim.evidence.some(e => e.origin === 'tpl-pack-v4') && <BoilerplateLens raw={96} independent={12} text={SAMPLE_LISTING}
        boiler={['Escrow accepted', 'FE available', '24h dispatch', 'Worldwide shipping, discrete packaging is standard, no exceptions']}
        indep={['pale horse supply', 'five years in the trade']} />}
      <div>{claim.evidence.map((ev,i) => <EvidenceRow key={i} ev={ev} expanded={open === i}
        onToggle={() => setOpen(open === i ? -1 : i)} redacted={redacted} onReveal={onReveal} />)}</div>
      <div><SectionH>Missing evidence</SectionH><MissingEvidence items={claim.missing} onCollect={onCollect} collected={collected} busy={busy} /></div>
      <div><SectionH>What would falsify this</SectionH><p className="tiny">{claim.falsify}</p></div>
      {children}
    </div>
  </details>;
}

function EvidenceInspector({ claim, claimType, onClose, onCollect, collected, busy, onReveal, redacted }) {
  if (!claim) return null;
  const verdict = claim.claimVerdict || 'HOLD';
  return <>
    <div className="drawer-scrim" onClick={onClose} />
    <div className="drawer" data-screen-label="Evidence Inspector" role="dialog" aria-label="Evidence inspector">
      <div className="drawer-head">
        <h2 className="sheet-title" style={{ flex: 1 }}>{claimType?.question}</h2>
        <VerdictChip verdict={verdict} /><StatusWord status={claim.status} />
        <button className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="x" size={14} /></button>
      </div>
      <div className="drawer-body stack" style={{ gap: 16 }}>
        <ProofLadder peak={claim.peak} />
        <div className="callout rule-brief">{claim.rule} · {shortReason(claim)}</div>
        <ClaimEvidence key={claim.id} claim={claim} onCollect={onCollect} collected={collected} busy={busy} redacted={redacted} onReveal={onReveal} />
      </div>
    </div>
  </>;
}

Object.assign(window, { ClaimCard, EvidenceRow, MissingEvidence, EvidenceInspector, ladderNote });

export { ClaimEvidence, ClaimCard, SAMPLE_LISTING, calloutStyle, ladderNote, EvidenceRow, PiiLine, MissingEvidence, EvidenceInspector };
