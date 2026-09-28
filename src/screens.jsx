import { BOARD_COPY } from './copy.js';
import React from 'react';
import { AttackCost, CaseResult, ContinuityStrip, CopyOriginBundle, DataBadge, EmptyState, Fingerprint, Icon, PII, ProofLadder, Stat, StatusWord, TakeoverFlag, VerdictChip, fmtStamp } from './primitives.jsx';
import { CLAIM_TYPES, SRC } from './scenes.js';
import { ClaimCard } from './claimcard.jsx';
import { INTAKE_SCOPE, api, weakestRoute } from './api.js';
/* =====================================================================
   DATE-RANGE FILTER
   Filters graph edges and timeline events. A filter that hides evidence
   must say so — it never silently changes a verdict, and it states how
   many records it is excluding.
   ===================================================================== */
function DateFilter({ from, to, onFrom, onTo, onReset, matched, total, scope }) {
  return (
    <div className="datefilter">
      <Icon name="filter" size={12} style={{ color: 'var(--text-3)' }} />
      <label htmlFor="df-from">From</label>
      <input id="df-from" type="date" value={from} onChange={(e) => onFrom(e.target.value)} />
      <label htmlFor="df-to">To</label>
      <input id="df-to" type="date" value={to} onChange={(e) => onTo(e.target.value)} />
      <span className="datefilter-note">
        {matched} of {total} {scope}
      </span>
      <div className="btn-group">
        <button className="btn btn-sm" onClick={onReset}>Clear</button>
      </div>
    </div>
  );
}

/* returns true when an ISO-ish date string falls inside the range */
function inRange(dateStr, from, to) {
  if (!from && !to) return true;
  const d = String(dateStr || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return true;   // undated records are not filtered out
  if (from && d < from) return false;
  if (to && d > to) return false;
  return true;
}

/* =====================================================================
   SakshiAstra — screens
   Case workspace · Intake studio · HOLD queue · Migration timeline ·
   Dossier & chain-of-custody
   ===================================================================== */

/* =====================================================================
   1. CASE WORKSPACE — the claim board
   The five claims at a glance. Never a single score.
   ===================================================================== */
function ClaimBoard({ scene, board, onOpenClaim, onGoto }) {
  const openClaims = board.filter((c) => c.present);
  /* counts run over OPENED claims only — an unopened claim contributes HOLD
     but must not inflate the HOLD count, or the tally stops describing the
     work that has actually been done on this case. */
  const counts = openClaims.reduce((a, c) => { a[c.verdict] = (a[c.verdict] || 0) + 1; return a; }, {});
  const totalClaims = board.length;
  const unopened = totalClaims - openClaims.length;
  const allHolds = (counts.HOLD || 0) + unopened;

  /* the weakest route: the cheapest evidence an attacker would attack first.
     Cost is already carried per item, so this is a lookup, not a score. */
  const weakest = weakestRoute(scene);

  return (
    <div className="stack" style={{ gap: 'var(--gap)' }}>

      {/* ---------------- HERO: the verdict block ---------------- */}
      <div className="hero">
        <div className="hero-main">
          <div className="eyebrow case-name">{scene.title} · {scene.case.id}</div>
          <div className="row" style={{ gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
            <CaseResult scene={scene} />
            
          </div>
          <p className="hero-reason" style={{ margin: 0 }}>{BOARD_COPY[scene.id]}</p>
        </div>
        <div className="hero-side">
          {weakest && (
            <div className="stack" style={{ gap: 4, alignItems: 'flex-end' }}>
              <div className="label">Cost to fake</div>
              <div className="hero-figure" style={{ fontSize: 'var(--text-card)' }}>
                {weakest.cost === 0 ? 'cost 0' : 'cost ' + weakest.cost + '/5'}
              </div>
              <div className="tiny mono muted" style={{ textAlign: 'right', maxWidth: 220 }}>
                {weakest.originLabel || weakest.kind}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="sheet"><div className="section claim-counters">
        <div>{totalClaims} claims · {openClaims.length} checked · {unopened} waiting</div>
        <div className="row" style={{ gap: 8, marginTop: 8 }}>
          <VerdictChip verdict="ASSERT" label={`${counts.ASSERT || 0} ASSERT`} />
          <VerdictChip verdict="HOLD" label={`${allHolds} HOLD`} />
          <VerdictChip verdict="REJECT" label={`${counts.REJECT || 0} REJECT`} />
        </div>
      </div></div>

      {/* ---------------- the five claims ---------------- */}
      <div className="stack" style={{ gap: 'var(--space-3)' }}>
        <div className="section-h" style={{ margin: 0 }}>
          Claims
        </div>
        {board.map((b) => {
          if (!b.present) {
            return (
              <div key={b.id} className="claim-card not-opened">
                <div className="claim-card-top" style={{ borderBottom: 'none' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    
                    <div className="claim-q">{b.question}</div>
                  </div>
                  <VerdictChip verdict="HOLD" /><StatusWord status="unverified" />
                </div>
                <div className="claim-card-body tiny muted"><p>GAP — no evidence</p>
                  <details className="evidence-fold"><summary>Show evidence</summary>No records collected.</details>
                </div>
              </div>
            );
          }
          const claim = scene.claims[b.id];
          return (
            <ClaimCard key={b.id} claim={claim} claimType={{ name: b.name, question: b.question }}
              onOpen={() => onOpenClaim(b.id)} />
          );
        })}

      </div>
    </div>
  );
}

/* =====================================================================
   2. INTAKE STUDIO — paste raw material, watch it land on the ladder
   ===================================================================== */
function IntakeStudio({ scene, onIngested }) {
  const [raw, setRaw] = React.useState(SAMPLE_RAW);
  const [result, setResult] = React.useState(null);
  const [busy, setBusy] = React.useState(false);
  const [stage, setStage] = React.useState(0);

  async function run() {
    setBusy(true); setResult(null); setStage(1);
    await sleep(220); setStage(2);
    const r = await api.intake(scene.id, raw);
    await sleep(160);
    setResult(r); setStage(3); setBusy(false);
    onIngested && onIngested(r);
  }

  return (
    <div className="cols-2-1 grid" style={{ alignItems: 'start' }}>
      <div className="stack" style={{ gap: 'var(--s4)' }}>
        <div className="sheet">
          <div className="sheet-head">
            <div style={{ flex: 1 }}>
              <div className="eyebrow">Intake studio</div>
              <h2 className="sheet-title">Two steps: extraction, then a decision by a human.</h2>
            </div>
            <VerdictChip verdict="HOLD" label="AWAITING ANALYST" />
          </div>
          <div className="sheet-body">
            <div className="stack" style={{ gap: 'var(--s3)' }}>
              <div className="label">Step 1 · raw material</div>
              <textarea className="raw" style={{ maxHeight: 232, minHeight: 168, fontFamily: 'var(--f-mono)' }}
                value={raw} onChange={(e) => setRaw(e.target.value)} spellCheck="false"
                aria-label="Raw material to ingest" />
              <div className="row" style={{ gap: 'var(--s3)' }}>
                <span className="tiny muted" style={{ flex: 1, textWrap: 'pretty' }}>
                  Paste a vendor page, a PGP block, a wallet declaration, or a forum post. Extraction reads what is
                  present in the text. It does not resolve identity, and it never merges personas on its own.
                </span>
                <button className="btn btn-primary" onClick={run} disabled={busy}>
                  {busy ? <><Icon name="history" size={12} className="pulse" /> Extracting…</> : <><Icon name="scan" size={12} /> Extract</>}
                </button>
              </div>
            </div>

            <div className="hr" />

            <div className="stack" style={{ gap: 'var(--s3)' }}>
              <div className="label">Step 2 · what was found</div>
              {!result && !busy && (
                <EmptyState
                  title="Nothing extracted yet"
                  body="Paste a vendor page, PGP block, wallet declaration or forum post above, then run extraction. Only record types on the scope list are accepted." />
              )}
              {busy && <PipelineStages stage={stage} />}
              {result && result.refused && (
                <div className="scope-refusal fade-in">
                  <div className="row" style={{ gap: 8, marginBottom: 6 }}>
                    <Icon name="x" size={12} style={{ color: 'var(--reject-fg)' }} />
                    <span className="mono tiny" style={{ fontWeight: 600, color: 'var(--reject-fg)' }}>
                      REFUSED — OUT OF SCOPE
                    </span>
                  </div>
                  <div className="tiny" style={{ textWrap: 'pretty' }}>
                    This intake was not processed: <b>{result.reason}</b>. {result.scopeRule}
                  </div>
                  <div className="tiny muted" style={{ marginTop: 6 }}>
                    The refusal is recorded in the chain of custody with the actor and the time.
                  </div>
                </div>
              )}
              {result && !result.refused && (
                <div className="stack fade-in" style={{ gap: 'var(--s3)' }}>
                  <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                    <span className="label">Accepted as</span>
                    {(result.accepted || []).map((a) => (
                      <span className="dbadge" key={a.id}>{a.label}</span>
                    ))}
                  </div>
                  <div className="claim-card" style={{ background: 'var(--surface)' }}>
                    {result.extracted.map((e, i) => (
                      <div className="extract-row" key={i} style={{ padding: '8px var(--s4)' }}>
                        <span className="extract-type">{e.type}</span>
                        <span className="mono" style={{ fontSize: 'var(--text-xs)' }}>{e.value}</span>
                        <span className="row" style={{ gap: 10, justifyContent: 'flex-end' }}>
                          <span className="mono tiny" style={{ color: 'var(--text-3)' }}>{e.level}</span>
                          <AttackCost cost={e.cost} compact />
                        </span>
                      </div>
                    ))}
                  </div>
                  {result.folded && <CopyOriginBundle defaultOpen bundle={{
                    id: 'fold', title: result.folded.title, note: result.folded.note,
                    items: ['template text block', 'escrow policy line'], occurrencesElsewhere: 412,
                  }} />}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="stack" style={{ gap: 'var(--s4)' }}>
        <div className="sheet">
          <div className="sheet-body tight stack" style={{ gap: 'var(--s4)' }}>
            <div>
              <div className="label" style={{ marginBottom: 8 }}>Peak proof level</div>
              <ProofLadder peak={result ? result.ladder : 'L0'} />
            </div>
            <div className="hr" />
            <div>
              <div className="label" style={{ marginBottom: 6 }}>In scope — the allow-list</div>
              <div className="stack" style={{ gap: 0 }}>
                {INTAKE_SCOPE.map((k) => (
                  <div className="scope-item" key={k.id}>
                    <Icon name="check" size={10} style={{ color: 'var(--text-3)', flex: 'none' }} />
                    <span style={{ color: 'var(--text-2)' }}>{k.label}</span>
                  </div>
                ))}
              </div>
              <div className="tiny muted" style={{ marginTop: 8, textWrap: 'pretty' }}>
                Anything outside this list is refused with a reason and the refusal is written to the ledger.
              </div>
            </div>
            <div className="hr" />
            <div>
              <div className="label" style={{ marginBottom: 6 }}>What extraction will not do</div>
              <div className="stack" style={{ gap: 7 }}>
                {[
                  'merge two personas into one without an analyst decision',
                  'produce a confidence percentage, because a scalar discards the thing that matters',
                  'discount a source to make a target look stronger',
                  'treat a pasted string as proof of control',
                ].map((t, i) => (
                  <div key={i} className="row" style={{ gap: 7, alignItems: 'flex-start' }}>
                    <Icon name="x" size={11} style={{ color: 'var(--reject-fg)', marginTop: 3, flex: 'none' }} />
                    <span className="tiny" style={{ color: 'var(--text-2)', textWrap: 'pretty' }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="sheet">
          <div className="sheet-head" style={{ padding: 'var(--s3) var(--s4)' }}>
            <h3 className="sheet-title" style={{ fontSize: 'var(--text-card)' }}>Provenance of this intake</h3>
          </div>
          <div className="sheet-body tight">
            <div className="stack" style={{ gap: 8 }}>
              <div className="row" style={{ gap: 8 }}><DataBadge source={SRC.analyst} /><span className="tiny muted">submitted text</span></div>
              <div className="row" style={{ gap: 8 }}><DataBadge source={SRC.evolution} /><span className="tiny muted">matched against archive</span></div>
              <div className="row" style={{ gap: 8 }}><DataBadge source={SRC.fixture} /><span className="tiny muted">mock hidden service, team-controlled</span></div>
            </div>
            <div className="tiny muted" style={{ marginTop: 10, textWrap: 'pretty' }}>
              Intake is labelled at source level when it is written to the ledger, so nothing historical can later be
              read as a live scan.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const SAMPLE_RAW = `Alias: quillmark_
PGP block:
  -----BEGIN PGP SIGNED MESSAGE-----
  Hash: SHA256
  I am quillmark_, wallet bc1q...q7vd is mine.
  -----BEGIN PGP SIGNATURE-----
Escrow: Escrow accepted - FE available - 24h dispatch
Contact: ops@example.net
Onionoo: relay family cinderbox`;

function PipelineStages({ stage }) {
  const steps = ['Reading text', 'Matching against archive', 'Folding copy-origins'];
  return (
    <div className="drop stack" style={{ gap: 8 }}>
      {steps.map((s, i) => (
        <div className="row" style={{ gap: 8 }} key={i}>
          {i + 1 < stage
            ? <Icon name="check" size={12} style={{ color: 'var(--assert-fg)' }} />
            : i + 1 === stage
              ? <Icon name="dot" size={12} style={{ color: 'var(--hold-fg)' }} className="pulse" />
              : <Icon name="dot" size={12} style={{ color: 'var(--border-strong)' }} />}
          <span className="tiny" style={{ color: i + 1 <= stage ? 'var(--text)' : 'var(--text-3)' }}>{s}</span>
        </div>
      ))}
    </div>
  );
}

/* =====================================================================
   3. HOLD QUEUE — the analyst decision surface
   ===================================================================== */
function HoldQueue({ items, onOpen, onDecide, decisions }) {
  const [sel, setSel] = React.useState(items[0]?.scene);
  const current = items.find((i) => i.scene === sel) || items[0];
  return (
    <div className="cols-2-1 grid" style={{ alignItems: 'start' }}>
      <div className="sheet">
        <div className="sheet-head">
          <div style={{ flex: 1 }}>
            <div className="eyebrow">Verification queue</div>
            <h2 className="sheet-title">Every case stopped at HOLD, and exactly what is blocking it.</h2>
          </div>
          <VerdictChip verdict="HOLD" label={`${items.length} IN QUEUE`} />
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Case</th><th>Subject</th><th>Decisive gap</th>
              <th>Takeover</th><th style={{ textAlign: 'right' }}>Opened</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => {
              const d = decisions[it.scene];
              return (
                <tr key={it.scene} onClick={() => setSel(it.scene)} style={{ cursor: 'pointer' }}>
                  <td>
                    <div className="mono" style={{ fontSize: 'var(--text-xs)' }}>{it.caseId}</div>
                    <div className="tiny muted" style={{ marginTop: 2 }}>{it.title}</div>
                  </td>
                  <td className="mono tiny">{it.analyst}</td>
                  <td style={{ maxWidth: 330 }}>
                    <div className="tiny" style={{ color: 'var(--text-2)', textWrap: 'pretty' }}>
                      {it.blockers[0] || 'no decisive blocker recorded'}
                    </div>
                  </td>
                  <td>{it.takeover ? <TakeoverFlag compact /> : <span className="tiny muted">—</span>}</td>
                  <td style={{ textAlign: 'right' }}>
                    {d
                      ? <span className={`vchip v-${d.decision === 'confirm' ? 'assert' : d.decision === 'reject' ? 'reject' : 'hold'}`}>
                          <span className="dot" /><span>{d.decision.toUpperCase()}</span>
                        </span>
                      : <span className="mono tiny muted">{fmtStamp(it.opened)}</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {current && (
        <div className="stack" style={{ gap: 'var(--s4)' }}>
          <div className="sheet">
            <div className="sheet-head" style={{ padding: 'var(--s3) var(--s4)' }}>
              <div style={{ flex: 1 }}>
                <span className="label">Decision</span>
                <h3 className="sheet-title" style={{ fontSize: 'var(--text-card)', marginTop: 3 }}>{current.title}</h3>
              </div>
              <button className="btn btn-sm" onClick={() => onOpen(current.scene)}>
                Open case <Icon name="chevronRight" size={11} />
              </button>
            </div>
            <div className="sheet-body tight stack" style={{ gap: 'var(--s4)' }}>
              <div>
                <div className="label" style={{ marginBottom: 6 }}>Why it is held</div>
                <div className="body-text" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-2)' }}>{current.decisive}</div>
              </div>
              <div>
                <div className="label" style={{ marginBottom: 6 }}>Decisive blockers</div>
                <div className="stack" style={{ gap: 5 }}>
                  {current.blockers.slice(0, 3).map((b, i) => (
                    <div className="row" key={i} style={{ gap: 7, alignItems: 'flex-start' }}>
                      <span className="mono tiny" style={{ color: 'var(--text-3)', flex: 'none' }}>{i + 1}</span>
                      <span className="tiny" style={{ textWrap: 'pretty' }}>{b}</span>
                    </div>
                  ))}
                  {!current.blockers.length && <span className="tiny muted">No tier-1 blocker: the gap is in evidence quality, not evidence absence.</span>}
                </div>
              </div>
              <div className="hr" />
              <div className="stack" style={{ gap: 7 }}>
                <div className="label">Analyst decision</div>
                <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                  <button className="btn btn-sm" onClick={() => onDecide(current.scene, 'hold')}>
                    Keep at HOLD
                  </button>
                  <button className="btn btn-sm" onClick={() => onDecide(current.scene, 'collect')}>
                    <Icon name="plus" size={11} /> Collect evidence
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => onDecide(current.scene, 'reject')}>
                    Reject claim
                  </button>
                </div>
                <div className="tiny muted" style={{ textWrap: 'pretty' }}>
                  There is no “confirm identity” control here by design. Attribution to a real person requires the
                  case to reach ASSERT and then two analysts to sign.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =====================================================================
   4. MIGRATION TIMELINE — continuity, honestly marked
   ===================================================================== */
function MigrationTimeline({ scene, onOpenClaim, dateRange, setDateRange }) {
  const all = [];
  Object.entries(scene.claims).forEach(([cid, c]) => {
    (c.evidence || []).forEach((e) => all.push({ ...e, cid, cname: CLAIM_TYPES.find((t) => t.id === cid)?.name }));
  });
  all.sort((a, b) => String(a.found).localeCompare(String(b.found)));
  const { from, to } = dateRange;
  const evs = all.filter((e) => inRange(e.found, from, to));

  const cont = scene.continuity || {
    from: scene.subjects[0]?.first, to: scene.subjects[0]?.last,
    segments: [{ label: 'continuous record', w: 0.7, kind: 'solid' }, { label: 'GAP — no evidence', w: 0.3, kind: 'gap' }],
    changePoint: 0.7, changeLabel: 'no change-point detected',
    note: 'No datable break found in this record. Silence between posts is not continuity of the operator.',
  };

  return (
    <div className="stack" style={{ gap: 'var(--s4)' }}>
      <div className="sheet">
        <div className="sheet-head">
          <div style={{ flex: 1 }}>
            <div className="eyebrow">Migration timeline</div>
            <h2 className="sheet-title">{scene.title}</h2>
            <div className="tiny muted-2" style={{ marginTop: 4 }}>
              Evidence placed on the record’s own timeline. Gaps are marked, never smoothed.
            </div>
          </div>
          <CaseResult scene={scene} />
        </div>
        <div className="sheet-body">
          <ContinuityStrip continuity={cont} />
          <div className="hr" />
          <DateFilter from={from} to={to}
            onFrom={(v) => setDateRange({ ...dateRange, from: v })}
            onTo={(v) => setDateRange({ ...dateRange, to: v })}
            onReset={() => setDateRange({ from: '', to: '' })}
            matched={evs.length} total={all.length} scope="events in range" />
          {evs.length === 0 && (
            <div className="callout" style={{ marginTop: 'var(--s3)' }}>
              No evidence inside this range. The filter hides records from view; it does not reduce them, and it never
              changes a verdict.
            </div>
          )}
          <div className="hr" />
          <div className="cols-2-1 grid" style={{ gap: '20px' }}>
            <div className="stack" style={{ gap: 'var(--s3)' }}>
              <div className="label">Evidence on the record{from || to ? ' (filtered)' : ''}</div>
              <div className="stack" style={{ gap: 'var(--s3)', maxHeight: 300, overflowY: 'auto', paddingRight: 4 }}>
              {evs.map((e, i) => (
                <div key={i} className="row" style={{ gap: 'var(--s3)', alignItems: 'flex-start' }}>
                  <span className="mono tiny" style={{ color: 'var(--text-3)', width: 168, flex: 'none' }}>{fmtStamp(e.found)}</span>
                  <div className={`ev-rail s-${e.status}`} style={{ minHeight: 30 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="tiny" style={{ fontWeight: 500, textWrap: 'pretty' }}>{e.title}</div>
                    <div className="row" style={{ gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
                      <span className="tiny mono muted" style={{ whiteSpace: 'nowrap' }}>{e.cname}</span>
                      <span className="tiny mono muted">{e.level}</span>
                      <DataBadge source={e.source} />
                    </div>
                  </div>
                  <AttackCost cost={e.cost} compact />
                </div>
              ))}
              </div>
            </div>
            <div className="stack" style={{ gap: 'var(--s4)' }}>
              <div>
                <div className="label" style={{ marginBottom: 6 }}>Reading the strip</div>
                <div className="stack" style={{ gap: 8 }}>
                  <div className="row" style={{ gap: 8 }}>
                    <div className="cont-seg solid" style={{ width: 40, height: 16, borderRadius: 2, border: '1px solid var(--border)' }} />
                    <span className="tiny">record continuous, behaviour consistent</span>
                  </div>
                  <div className="row" style={{ gap: 8 }}>
                    <div className="cont-seg gap" style={{ width: 40, height: 16, borderRadius: 2, border: '1px solid var(--border)' }} />
                    <span className="tiny">GAP — no evidence. Not proof of continuity.</span>
                  </div>
                  <div className="row" style={{ gap: 8 }}>
                    <span style={{ width: 40, display: 'grid', placeItems: 'center' }}>
                      <span style={{ width: 2, height: 16, background: 'var(--takeover-fg)' }} />
                    </span>
                    <span className="tiny">change-point, datable</span>
                  </div>
                </div>
              </div>
              <div className="hr" />
              <div className="callout takeover">
                The distinction that matters: a gap in the record and a change inside the record are different
                findings. Neither one is evidence of a new operator on its own, and neither can be smoothed into
                “probably the same person”.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =====================================================================
   5. DOSSIER + CHAIN OF CUSTODY
   The hash chain is real: sha256(prevHash + canonicalJSON(entry)). The
   tamper test flips one byte of one entry and shows verification failing
   at that row and every row after it.
   ===================================================================== */
function Dossier({ scene, ledger, onExport, onApprove, approvals, onRevealPII, revealed, revealRequested, chainState }) {
  const [busy, setBusy] = React.useState(null);
  const [done, setDone] = React.useState(null);
  const [tamper, setTamper] = React.useState(-1);
  const [verify, setVerify] = React.useState(null);
  const [reason, setReason] = React.useState('');
  const [reasonOpen, setReasonOpen] = React.useState(!!revealRequested);
  const [err, setErr] = React.useState(null);

  const chainOk = chainState && chainState.ok;
  const rows = ledger || [];

  async function go(format) {
    setBusy(format); setDone(null); setErr(null);
    const r = await onExport(format);
    setBusy(null);
    if (!r.ok) { setErr(r.error || 'Export failed.'); return; }
    setDone(r);
  }

  async function runTamper(index) {
    const r = await onExport.verify(tamper === index ? -1 : index);
    setVerify(r);
    setTamper(tamper === index ? -1 : index);
  }

  async function submitReveal() {
    const r = await onRevealPII(reason);
    if (!r.ok) { setErr(r.error); return; }
    setReasonOpen(false); setReason(''); setErr(null);
  }

  const approved = approvals && approvals[scene.case.id] && approvals[scene.case.id].b;

  return (
    <div className="cols-2-1 grid" style={{ alignItems: 'start' }}>
      <div className="stack" style={{ gap: 'var(--s4)' }}>
        <div className="sheet">
          <div className="sheet-head">
            <div style={{ flex: 1 }}>
              <div className="eyebrow">Chain of custody · {scene.case.id}</div>
              <h2 className="sheet-title">Append-only. Each entry hashes the one before it.</h2>
              <div className="tiny muted-2" style={{ marginTop: 4 }}>
                hash = sha256(prevHash + canonical JSON of the entry). Changing any byte invalidates every hash after it.
              </div>
            </div>
            <div className="head-badges">
              <span className={'chain-badge ' + (chainOk ? (verify && !verify.verified ? 'bad' : 'ok') : 'na')}>
                <Icon name={chainOk ? 'shield' : 'warn'} size={11} />
                {chainOk ? (verify && !verify.verified ? 'CHAIN FAILS' : 'CHAIN VERIFIED') : 'NO DIGEST'}
              </span>
              <span className="seal"><Icon name="seal" size={11} /> sealed</span>
            </div>
          </div>

          {!chainOk && chainState && (
            <div className="sheet-body tight">
              <div className="callout reject">{chainState.reason}</div>
            </div>
          )}

          <div className="ledger">
            {rows.map((r, i) => {
              const bad = verify && !verify.verified && verify.firstBadIndex === i;
              const after = verify && !verify.verified && verify.firstBadIndex >= 0 && i > verify.firstBadIndex;
              return (
                <div className={'ledger-row' + (bad ? ' tampered' : '') + (after ? ' failafter' : '')} key={i}>
                  <div className="link-glyph">{i === 0 ? '◆' : bad ? '✕' : after ? '!' : '↳'}</div>
                  <div style={{ minWidth: 0 }}>
                    <div className="ledger-act" style={{ fontWeight: 500 }}>{r.act}</div>
                    <div className="ledger-meta">
                      <span className="mono tiny muted">{r.actor}</span>
                      <span className="mono tiny muted">seq {String(r.seq).padStart(3, '0')}</span>
                      <span className="mono tiny muted">prev {(r.prev_hash || 'genesis').slice(0, 12)}</span>
                      {r.case_id && <span className="mono tiny muted">case {r.case_id}</span>}
                    </div>
                    {bad && (
                      <div className="ledger-note tiny" style={{ color: 'var(--reject-fg)', fontWeight: 600 }}>
                        Tampered. Expected {String(verify.expected || '').slice(0, 16)}…, stored {String(verify.stored || '').slice(0, 16)}…
                      </div>
                    )}
                    {after && (
                      <div className="ledger-note tiny" style={{ color: 'var(--reject-fg)' }}>
                        Fails — its prev hash no longer matches a valid predecessor.
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="ledger-hash">
                      {r.hash ? <Fingerprint value={r.hash.slice(0, 20)} /> : 'no digest'}
                    </div>
                    <div className="mono tiny muted" style={{ marginTop: 2 }}>{fmtStamp(r.at)}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="sheet-body tight rule-top">
            <div className="row" style={{ gap: 'var(--s3)', flexWrap: 'wrap' }}>
              <Icon name="lock" size={12} style={{ color: 'var(--text-3)' }} />
              <span className="tiny muted-2" style={{ flex: 1, minWidth: 220, textWrap: 'pretty' }}>
                Revealing redacted PII requires a typed reason and appends an entry. So does every verdict change,
                every export and every analyst decision.
              </span>
              <button className="btn btn-sm" onClick={() => setReasonOpen(!reasonOpen)} disabled={revealed}>
                <Icon name="eye" size={11} /> {revealed ? 'PII revealed' : 'Reveal PII'}
              </button>
              <button className="btn btn-sm" onClick={() => runTamper(rows.length ? Math.min(2, rows.length - 1) : 0)}>
                <Icon name="warn" size={11} /> {verify && !verify.verified ? 'Clear tamper test' : 'Tamper test'}
              </button>
            </div>
            {reasonOpen && !revealed && (
              <div className="reason-prompt" style={{ marginTop: 'var(--s3)' }}>
                <div className="label" style={{ marginBottom: 6 }}>Reason for reveal (required, recorded)</div>
                <textarea value={reason} onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. matching the declared escrow contact against an authorised breach record" />
                <div className="row" style={{ gap: 6, marginTop: 8 }}>
                  <button className="btn btn-primary btn-sm" onClick={submitReveal} disabled={!reason.trim()}>
                    Record reason and reveal
                  </button>
                  <button className="btn btn-sm btn-ghost" onClick={() => { setReasonOpen(false); setReason(''); }}>
                    Cancel
                  </button>
                  <span className="tiny muted">Reveal is refused without a reason.</span>
                </div>
              </div>
            )}
            {verify && !verify.verified && (
              <div className="callout reject" style={{ marginTop: 'var(--s3)' }}>
                <b>Tamper test result.</b> One byte of entry seq {verify.firstBadIndex + 1} was flipped. Chain
                verification fails at that row and every row after it, because each hash depends on the one before.
                Clear the test to restore the chain.
              </div>
            )}
            {verify && verify.verified && tamper >= 0 && (
              <div className="callout assert" style={{ marginTop: 'var(--s3)' }}>
                Chain verified across all {rows.length} entries.
              </div>
            )}
          </div>
        </div>

        <div className="sheet">
          <div className="sheet-head" style={{ padding: 'var(--s3) var(--s4)' }}>
            <h3 className="sheet-title" style={{ fontSize: 'var(--text-card)', flex: 1 }}>Dossier contents</h3>
            <span className="tiny mono muted">no scalar score is exported</span>
          </div>
          <div className="sheet-body tight">
            <table className="tbl">
              <thead><tr><th>Claim</th><th>Verdict</th><th>Status</th><th>Peak</th><th>Rule</th><th>Items</th><th>Open gaps</th></tr></thead>
              <tbody>
                {Object.entries(scene.claims).map(([cid, c]) => (
                  <tr key={cid}>
                    <td style={{ fontWeight: 500 }}>{CLAIM_TYPES.find((t) => t.id === cid)?.name}</td>
                    <td><VerdictChip verdict={c.claimVerdict} /></td>
                    <td><StatusWord status={c.status} /></td>
                    <td className="mono tiny">{c.peak}</td>
                    <td className="mono tiny muted">{c.rule}</td>
                    <td className="mono tiny">{c.evidence.length}</td>
                    <td className="mono tiny">{(c.missing || []).filter((m) => m.tier === 1).length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="hr" />
            <div className="row" style={{ gap: 'var(--s3)', flexWrap: 'wrap' }}>
              <span className="label">Contact identifiers</span>
              <PII value="ops@example.net" revealed={revealed} onToggle={() => setReasonOpen(true)} />
              <span className="tiny muted">
                {revealed ? 'revealed · reason and actor recorded in the ledger above' : 'redacted by default'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="stack" style={{ gap: 'var(--s4)' }}>
        <div className="sheet">
          <div className="sheet-body tight stack" style={{ gap: 'var(--s4)' }}>
            <div>
              <div className="label" style={{ marginBottom: 8 }}>Export — real files</div>
              <div className="stack" style={{ gap: 7 }}>
                {[
                  { f: 'pdf', label: 'PDF dossier', note: 'opens print dialog' },
                  { f: 'stix', label: 'STIX 2.1 bundle', note: 'identity + claim notes + relationships + opinions' },
                  { f: 'csv', label: 'CSV evidence table', note: 'one row per evidence item and gap' },
                  { f: 'json', label: 'JSON evidence set', note: 'full provenance, chain included' },
                ].map((o) => (
                  <button className="btn" key={o.f} disabled={!!busy} onClick={() => go(o.f)}
                    style={{ justifyContent: 'space-between', width: '100%' }}>
                    <span className="row" style={{ gap: 8 }}>
                      {busy === o.f ? <Icon name="history" size={12} className="pulse" /> : <Icon name="doc" size={12} />}
                      {o.label}
                    </span>
                    <span className="tiny muted">{o.note}</span>
                  </button>
                ))}
              </div>
            </div>

            {err && <div className="callout reject">{err}</div>}

            {done && (
              <div className="callout fade-in" style={{ borderLeftColor: 'var(--hold-fg)', background: 'var(--hold-wash)' }}>
                <div className="row" style={{ gap: 8, marginBottom: 4 }}>
                  <Icon name="lock" size={12} style={{ color: 'var(--hold-fg)' }} />
                  <span className="mono tiny" style={{ fontWeight: 600 }}>
                    {approved ? 'RELEASED — both signatures present' : 'EXPORT HELD FOR APPROVAL'}
                  </span>
                </div>
                <div className="tiny" style={{ textWrap: 'pretty' }}>
                  <span className="mono">{done.filename}</span> · {done.format.toUpperCase()} ·{' '}
                  {(done.bytes / 1024).toFixed(1)} KB · digest {done.sha}
                </div>
                <div className="tiny muted" style={{ marginTop: 6, textWrap: 'pretty' }}>
                  {done.format === 'pdf'
                    ? 'The report opens in a new tab with a print dialog. Save as PDF from there.'
                    : 'The file has been written to your downloads.'}{' '}
                  Release requires both analyst signatures.
                </div>
              </div>
            )}

            <div className="hr" />
            <div className="stack" style={{ gap: 8 }}>
              <div className="label">Release signatures</div>
              <div className="approval-row">
                <Icon name="check" size={11} style={{ color: 'var(--text)' }} />
                <span className="approval-sig signed">analyst.a · signed</span>
                <span className="tiny muted approval-who">case owner</span>
              </div>
              <div className="approval-row">
                <Icon name={approved ? 'check' : 'clock'} size={11}
                  style={{ color: approved ? 'var(--text)' : 'var(--text-3)' }} />
                <span className={'approval-sig ' + (approved ? 'signed' : 'waiting')}>
                  analyst.b · {approved ? 'signed' : 'waiting'}
                </span>
                <span className="tiny muted approval-who">second analyst</span>
              </div>
              {!approved && (
                <button className="btn btn-primary" onClick={() => onApprove('pdf')} style={{ justifyContent: 'center' }}>
                  <Icon name="seal" size={11} /> Approve as analyst.b
                </button>
              )}
              {approved && (
                <div className="callout assert">Approved. This export may now be released.</div>
              )}
            </div>

            <div className="hr" />
            <div className="stack" style={{ gap: 7 }}>
              <div className="label">Gates on release</div>
              {[
                'both analyst signatures present',
                'every claim verdict recorded in the dossier',
                'open gaps stated, not omitted',
                'PII state recorded as of release',
                'chain of custody verified',
              ].map((g, i) => (
                <div className="row" key={i} style={{ gap: 7 }}>
                  <Icon name="check" size={11} style={{ color: 'var(--text-3)' }} />
                  <span className="tiny" style={{ color: 'var(--text-2)' }}>{g}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

Object.assign(window, { ClaimBoard, IntakeStudio, HoldQueue, MigrationTimeline, Dossier, sleep });

export { DateFilter, inRange, ClaimBoard, IntakeStudio, SAMPLE_RAW, PipelineStages, HoldQueue, MigrationTimeline, Dossier, sleep };
