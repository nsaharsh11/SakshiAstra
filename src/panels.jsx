import React from 'react';
import { CLASSIFIER_LABELS } from './historical.js';
import { CaseResult, DataBadge, fmtStamp, Icon, KeyVal, Stat, StatusWord, TakeoverFlag, VerdictChip } from './primitives.jsx';
import { SRC } from './scenes.js';
/* =====================================================================
   SakshiAstra — panels
   Actor profile · Collection schedule · Suspect-entity ladder
   ===================================================================== */

/* =====================================================================
   ACTOR PROFILE
   Identifiers, infrastructure, linkages, per-claim status + verdict,
   category, last scan, source badge. No aggregate score anywhere.
   ===================================================================== */
function ActorProfile({ scene, profile, onOpenClaim, onGoto }) {
  if (!profile) return null;
  const references = scene.subjects.map((subject, i) => ({ handle: subject.handle, label: `Persona ${i + 1}` }))
    .sort((a, b) => b.handle.length - a.handle.length);
  const reference = text => references.reduce((value, subject) => value.replaceAll(subject.handle, subject.label), String(text || ''));
  return (
    <div className="cols-2-1 grid" style={{ alignItems: 'start' }}>
      <div className="stack" style={{ gap: 'var(--s4)' }}>
        <div className="sheet">
          <div className="sheet-head">
            <div style={{ flex: 1 }}>
              <div className="eyebrow">Actor profile · {profile.caseId}</div>
              <h2 className="sheet-title">{scene.subjects.map((s) => s.handle).join('  ·  ')}</h2>
              <div className="tiny muted-2" style={{ marginTop: 4 }}>{reference(scene.question)}</div>
            </div>
            <div className="stack" style={{ gap: 6, alignItems: 'flex-end' }}>
              <CaseResult scene={scene} />
              {scene.takeoverFlag && <TakeoverFlag compact />}
            </div>
          </div>
          <div className="sheet-body tight">
            <div className="row" style={{ gap: '20px', flexWrap: 'wrap' }}>
              <KeyVal k="Last scan"><span className="mono tiny">{fmtStamp(profile.lastScan)}</span></KeyVal>
              <KeyVal k="Category">
                <span className="tiny">{profile.category.join(' · ')}</span>
                <div className="tiny muted">{profile.categoryTerms.join(' · ')}</div>
              </KeyVal>
              <KeyVal k="PII">
                <span className="tiny">{profile.piiRedacted ? 'redacted by default' : 'revealed'}</span>
              </KeyVal>
            </div>
            <div className="hr" />
            {profile.listingContext && <details className="evidence-fold">
              <summary>Show listing text</summary>
              <div className="row" style={{ gap: 8 }}><DataBadge sources={profile.listingContext.sources} /></div>
              <p className="tiny">Fictional persona: {reference(profile.listingContext.persona)} · {profile.listingContext.market}</p>
              <p className="tiny">{profile.listingContext.historical_text.title}</p>
              <p className="tiny">{profile.listingContext.historical_text.description}</p>
              <p className="tiny muted">Agora 2014-15 (Kaggle), text only. Category is never used in attribution.</p>
            </details>}
            <details className="evidence-fold" style={{ marginTop: 10 }}><summary>Classifier labels</summary>
              <div className="tiny">{CLASSIFIER_LABELS.join(' · ')}</div>
              <div className="tiny muted">terror_financing: no historical examples.</div>
            </details>
            <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
              <span className="label" style={{ marginRight: 2 }}>Sources on this profile</span>
              {profile.sources.map((s, i) => (
                <span key={i} className={`dbadge ${s === 'HISTORICAL' ? 'hist' : 'fix'}`} title={s === 'HISTORICAL' ? 'Agora 2014-15 (Kaggle), text only' : 'Fixture scenarios'}>{s}</span>
              ))}
            </div>
            {profile.infrastructure.length > 0 && (
              <div className="callout" style={{ marginTop: 'var(--s3)' }}>
                Infrastructure observations carry a source badge each. A candidate origin is a lead, not a conclusion,
                and only authorised scan ranges are used.
              </div>
            )}
          </div>
        </div>

        {/* per-claim status + verdict — the profile never collapses these */}
        <div className="sheet">
          <div className="sheet-head" style={{ padding: 'var(--s3) var(--s4)' }}>
            <h3 className="sheet-title" style={{ fontSize: 'var(--text-card)', flex: 1 }}>Claims on this actor</h3>
            <span className="tiny mono muted">status + verdict, never combined</span>
          </div>
          <div className="sheet-body tight">
            <div className="stack" style={{ gap: 6 }}>
              {profile.claims.map((c) => (
                <button key={c.id} className="verdict-line" onClick={() => onOpenClaim(c.id)}
                  style={{ width: '100%', textAlign: 'left' }}>
                  <span className="verdict-line-name">{c.name}</span>
                  <span className="mono tiny muted">{c.peak}</span>
                  <span className="mono tiny muted">{c.rule}</span>
                  <StatusWord status={c.status} />
                  <VerdictChip verdict={c.verdict} />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="sheet">
          <div className="sheet-head" style={{ padding: 'var(--s3) var(--s4)' }}>
            <h3 className="sheet-title" style={{ fontSize: 'var(--text-card)' }}>Linkages</h3>
          </div>
          <div className="sheet-body tight">
            <table className="tbl">
              <thead><tr><th>From</th><th>To</th><th>Basis</th><th>Status</th></tr></thead>
              <tbody>
                {profile.linkages.map((l, i) => (
                  <tr key={i}>
                    <td className="mono tiny">{reference(l.from || l.label)}</td>
                    <td className="mono tiny">{reference(l.to || '—')}</td>
                    <td className="tiny muted-2">{reference(l.label)}</td>
                    <td>{l.status ? <StatusWord status={
                      l.status === 'verified' ? 'VERIFIED' : l.status === 'supported' ? 'SUPPORTED'
                        : l.status === 'questionable' ? 'QUESTIONABLE' : l.status === 'contradicted' ? 'CONTRADICTED' : 'UNVERIFIED'
                    } /> : <span className="tiny muted">{l.kind}</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="stack" style={{ gap: 'var(--s4)' }}>
        <div className="sheet">
          <div className="sheet-head" style={{ padding: 'var(--s3) var(--s4)' }}>
            <h3 className="sheet-title" style={{ fontSize: 'var(--text-card)' }}>Identifiers</h3>
          </div>
          <div className="sheet-body tight stack" style={{ gap: 7 }}>
            {profile.identifiers.map((id, i) => (
              <div className="row" key={i} style={{ gap: 'var(--s3)' }}>
                <span className="mono tiny" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {reference(id.label)}
                </span>
                <span className="tiny mono muted">{id.kind}</span>
              </div>
            ))}
            <div className="tiny muted" style={{ marginTop: 6, textWrap: 'pretty' }}>
              Identifiers are recorded as observations. None of them is treated as a name, and none is resolved to a person.
            </div>
          </div>
        </div>

        <div className="sheet">
          <div className="sheet-head" style={{ padding: 'var(--s3) var(--s4)' }}>
            <h3 className="sheet-title" style={{ fontSize: 'var(--text-card)', flex: 1 }}>Infrastructure</h3>
            <DataBadge source={SRC.fixture} />
          </div>
          <div className="sheet-body tight stack" style={{ gap: 'var(--s3)' }}>
            {profile.infrastructure.length === 0 && (
              <span className="tiny muted">No infrastructure observations on this case.</span>
            )}
            {profile.infrastructure.map((o, i) => (
              <div key={i} className="missing" style={{ padding: 'var(--s3)' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="row" style={{ gap: 8 }}>
                    <span className="mono" style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{o.host}</span>
                    <span className="tiny mono muted">{o.role}</span>
                  </div>
                  <div className="tiny muted-2" style={{ marginTop: 3, textWrap: 'pretty' }}>{o.note}</div>
                  <div className="row" style={{ gap: 8, marginTop: 5 }}>
                    <span className="tiny mono" style={{ color: 'var(--text-2)' }}>{o.findings} rare finding{o.findings === 1 ? '' : 's'}</span>
                    {o.authorised && <span className="tiny mono muted">authorised range</span>}
                  </div>
                </div>
                <span className="tiny mono muted" style={{ alignSelf: 'flex-start' }}>{o.confidence}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="sheet">
          <div className="sheet-body tight stack" style={{ gap: 9 }}>
            <div className="label">Jump to</div>
            <button className="btn" style={{ justifyContent: 'flex-start' }} onClick={() => onGoto('collection')}>
              <Icon name="history" size={12} /> Collection schedule
            </button>
            <button className="btn" style={{ justifyContent: 'flex-start' }} onClick={() => onGoto('graph')}>
              <Icon name="route" size={12} /> Relationship graph
            </button>
            <button className="btn" style={{ justifyContent: 'flex-start' }} onClick={() => onGoto('dossier')}>
              <Icon name="doc" size={12} /> Dossier & custody
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =====================================================================
   COLLECTION
   Scheduled scans with last/next run, ranked by how many HOLD claims
   each scan would resolve. Everything badged FIXTURE.
   ===================================================================== */
function Collection({ scene, collection, onOpenClaim }) {
  if (!collection) return null;
  const { scans, holdCount, basis } = collection;
  return (
    <div className="stack" style={{ gap: 'var(--s4)' }}>
      <div className="sheet">
        <div className="sheet-head">
          <div style={{ flex: 1 }}>
            <div className="eyebrow">Collection · {scene.case.id}</div>
            <h2 className="sheet-title">Scans ranked by how many HOLD claims each one would resolve.</h2>
            <div className="tiny muted-2" style={{ marginTop: 4 }}>{basis}</div>
          </div>
          <div className="stack" style={{ gap: 6, alignItems: 'flex-end' }}>
            <VerdictChip verdict="HOLD" label={`${holdCount} ON HOLD`} />
            <DataBadge source={SRC.fixture} />
          </div>
        </div>
        <div className="sheet-body tight">
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 30 }}>#</th>
                <th>Scan target</th>
                <th>Claim</th>
                <th>Resolves</th>
                <th>Last run</th>
                <th>Next run</th>
                <th>Source</th>
                <th style={{ textAlign: 'right' }}>State</th>
              </tr>
            </thead>
            <tbody>
              {scans.map((s, i) => (
                <tr key={s.id}>
                  <td className="mono tiny" style={{ color: 'var(--text-3)' }}>{i + 1}</td>
                  <td>
                    <div className="tiny" style={{ fontWeight: 500 }}>{s.target}</div>
                    <div className="mono tiny muted" style={{ marginTop: 2 }}>{s.id}</div>
                  </td>
                  <td>
                    <button className="btn-ghost btn btn-sm" onClick={() => onOpenClaim(s.claim)}>
                      {s.claimName}
                    </button>
                  </td>
                  <td>
                    {s.resolves > 0
                      ? <span className="mono tiny" style={{ color: 'var(--text)', fontWeight: 600 }}>{s.resolves} HOLD</span>
                      : <span className="tiny muted">—</span>}
                    {s.tier1 > 0 && <span className="tiny mono muted" style={{ display: 'block', marginTop: 2 }}>{s.tier1} decisive gap{s.tier1 === 1 ? '' : 's'}</span>}
                  </td>
                  <td className="mono tiny muted">{fmtStamp(s.lastRun)}</td>
                  <td className="mono tiny">{fmtStamp(s.nextRun)}</td>
                  <td><DataBadge source={s.source} /></td>
                  <td style={{ textAlign: 'right' }}>
                    <span className={`vchip v-${s.status === 'queued' ? 'hold' : 'null'}`}>
                      <span className="dot" /><span>{s.status.toUpperCase()}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="callout" style={{ marginTop: 'var(--s4)' }}>
            Scans are labelled <b>FIXTURE</b>: no live marketplace or hidden-service crawling occurs in this
            system. Ordering is computed from the current HOLD set, so it changes when evidence lands — it is not a
            fixed priority list.
          </div>
        </div>
      </div>

      <div className="grid g3">
        <div className="sheet">
          <div className="sheet-body tight">
            <Stat fig={holdCount} cap="claims on hold" />
            <div className="tiny muted" style={{ marginTop: 8 }}>Across this case, the number of claims that no amount of current evidence will move.</div>
          </div>
        </div>
        <div className="sheet">
          <div className="sheet-body tight">
            <Stat fig={scans.filter((s) => s.resolves > 0).length} cap="scans that would move a verdict" />
            <div className="tiny muted" style={{ marginTop: 8 }}>A scan that resolves nothing is not scheduled ahead of one that does.</div>
          </div>
        </div>
        <div className="sheet">
          <div className="sheet-body tight">
            <Stat fig={scans.length} cap="scan targets this case" />
            <div className="tiny muted" style={{ marginTop: 8 }}>One target per claim type. Every target is an authorised or fixture source.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =====================================================================
   SUSPECT-ENTITY LADDER
   Mentioned → Low-cost link → High-cost link → Analyst-confirmed.
   The final rung is human-only and shows no automated route.
   ===================================================================== */
function SuspectLadder({ ladder, compact }) {
  if (!ladder) return null;
  if (compact) {
    return (
      <div className="stack" style={{ gap: 6 }}>
        <div className="ladder">
          {ladder.steps.map((s, i) => (
            <div key={s.id} className={`rung${s.done ? ' on' : ''}${s.id === ladder.reached ? ' peak' : ''}${s.blocked ? ' blocked' : ''}`}
              title={s.note}>
              <div className="rung-code">
                {i + 1}
                {s.done && <Icon name="check" size={10} />}
              </div>
              <div className="rung-desc">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="stack" style={{ gap: 'var(--s3)' }}>
      <div className="ladder">
        {ladder.steps.map((s, i) => (
          <div key={s.id} className={`rung${s.done ? ' on' : ''}${s.id === ladder.reached ? ' peak' : ''}${s.blocked ? ' blocked' : ''}`}>
            <div className="rung-code">
              {i + 1} {s.label} {s.done && <Icon name="check" size={10} />}
            </div>
            <div className="rung-desc">{s.by === 'human' ? 'human only — no automated route' : 'computed by the system'}</div>
          </div>
        ))}
      </div>
      <div className="stack" style={{ gap: 7 }}>
        {ladder.steps.map((s, i) => (
          <div className="row" key={s.id} style={{ gap: 9, alignItems: 'flex-start' }}>
            <span className="mono tiny" style={{ color: 'var(--text-3)', flex: 'none', width: 14 }}>{i + 1}</span>
            <div style={{ flex: 1 }}>
              <span className="tiny" style={{ fontWeight: 500 }}>{s.label}</span>
              {s.by === 'human' && <span className="vchip v-null" style={{ marginLeft: 8, height: 16 }}><span>HUMAN STEP</span></span>}
              <div className="tiny muted-2" style={{ marginTop: 2, textWrap: 'pretty' }}>{s.note}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="callout" style={{ marginTop: 2 }}>{ladder.note}</div>
    </div>
  );
}

Object.assign(window, { ActorProfile, Collection, SuspectLadder });

export { ActorProfile, Collection, SuspectLadder };
