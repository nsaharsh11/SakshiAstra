import React from 'react';
import { DateFilter, inRange } from './screens.jsx';
import { AttackCost, Icon, StatusWord, TakeoverFlag, VerdictChip } from './primitives.jsx';
import { ATTACKS, CLAIM_TYPES } from './scenes.js';
/* =====================================================================
   SakshiAstra — graph · red-team split view · cover
   ===================================================================== */

/* =====================================================================
   RELATIONSHIP GRAPH
   Force layout, hand-rolled so it stays offline and deterministic.
   Edges are coloured by verdict, and there is a "proven links only"
   toggle — the filter that turns a hairball into an argument.
   ===================================================================== */
function RelationGraph({ scene, onOpenClaim, onNodeClaim, dateRange, setDateRange }) {
  const [provenOnly, setProvenOnly] = React.useState(false);
  const [hover, setHover] = React.useState(null);
  const [sel, setSel] = React.useState(null);
  const [tick, setTick] = React.useState(0);
  const W = 720, H = 468;

  const nodes = React.useMemo(
    () => scene.graph.nodes.map((n) => ({ ...n, px: n.x * W, py: n.y * H, vx: 0, vy: 0 })),
    [scene.id],
  );
  /* Date range filters edges. An edge inherits the date of the evidence
     that supports it; the two persona nodes always stay, so the graph
     cannot appear empty and imply "nothing found". */
  const range = dateRange || { from: '', to: '' };
  const edgeDate = (e) => {
    const hay = Object.values(scene.claims).flatMap((c) => c.evidence || []);
    const hit = hay.find((x) =>
      (x.originLabel || '').toLowerCase().includes(String(e.label || '').toLowerCase()) ||
      (x.title || '').toLowerCase().includes(String(e.label || '').toLowerCase()));
    return hit ? hit.found : scene.case.opened;
  };
  const allEdges = scene.graph.edges;
  const edges = allEdges.filter((e) => inRange(edgeDate(e), range.from, range.to));
  const filteredOut = allEdges.length - edges.length;

  /* force simulation: repulsion + springs + centring, damped, settled */
  React.useEffect(() => {
    let raf, steps = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 189 : 0;
    const sim = () => {
      steps++;
      nodes.forEach((n) => { n.vx *= 0.86; n.vy *= 0.86; });
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          let dx = b.px - a.px, dy = b.py - a.py;
          let d2 = dx * dx + dy * dy || 1;
          const f = 26000 / d2;
          const d = Math.sqrt(d2);
          const fx = (dx / d) * f, fy = (dy / d) * f;
          a.vx -= fx; a.vy -= fy; b.vx += fx; b.vy += fy;
        }
      }
      edges.forEach((e) => {
        const a = nodes.find((n) => n.id === e.from), b = nodes.find((n) => n.id === e.to);
        if (!a || !b) return;
        const dx = b.px - a.px, dy = b.py - a.py;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        const f = (d - 156) * 0.014;
        const fx = (dx / d) * f, fy = (dy / d) * f;
        a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy;
      });
      nodes.forEach((n) => {
        n.vx += (n.x * W - n.px) * 0.012;
        n.vy += (n.y * H - n.py) * 0.012;
        n.px += n.vx; n.py += n.vy;
      });
      if (steps < 190) { setTick(steps); raf = requestAnimationFrame(sim); }
      else {
        /* settle: normalise the layout to fill the canvas with margin,
           so a 3-node case reads as well as a 5-node one */
        const pad = 74;
        const xs = nodes.map((n) => n.px), ys = nodes.map((n) => n.py);
        const minX = Math.min(...xs), maxX = Math.max(...xs);
        const minY = Math.min(...ys), maxY = Math.max(...ys);
        const sx = (W - pad * 2) / Math.max(1, maxX - minX);
        const sy = (H - pad * 2) / Math.max(1, maxY - minY);
        const sc = Math.min(sx, sy, 2.4);
        nodes.forEach((n) => {
          n.px = pad + (n.px - minX) * sc + (W - pad * 2 - (maxX - minX) * sc) / 2;
          n.py = pad + (n.py - minY) * sc + (H - pad * 2 - (maxY - minY) * sc) / 2;
        });
        setTick(-1);
      }
    };
    raf = requestAnimationFrame(sim);
    return () => cancelAnimationFrame(raf);
  }, [scene.id, provenOnly]);

  const shown = provenOnly
    ? edges.filter((e) => e.status === 'verified' || e.status === 'supported')
    : edges;
  const shownIds = new Set(shown.flatMap((e) => [e.from, e.to]));

  const colorOf = (s) => ({
    verified: 'var(--assert-fg)', supported: 'oklch(0.70 0.10 158)',
    questionable: 'var(--hold-fg)', contradicted: 'var(--reject-fg)',
    takeover: 'var(--takeover-fg)', unverified: 'var(--text-3)',
  }[s] || 'var(--text-3)');

  const nodeFill = (n) => (n.kind === 'key' ? 'var(--surface-sunk)' : n.kind === 'wallet' ? 'var(--surface-sunk)' : 'var(--surface)');
  const dash = (s) => (s === 'questionable' || s === 'unverified' ? '4 3' : s === 'contradicted' ? '2 2' : null);

  return (
    <div className="stack" style={{ gap: 'var(--s4)' }}>
      <div className="sheet">
        <div className="sheet-head">
          <div style={{ flex: 1 }}>
            <div className="eyebrow">Relationship graph</div>
            <h2 className="sheet-title">Edges carry verdicts, not similarity scores.</h2>
          </div>
          <div className="row" style={{ gap: 'var(--s3)' }}>
            <button className="btn btn-sm" aria-pressed={provenOnly} onClick={() => setProvenOnly(!provenOnly)}
              style={provenOnly ? { background: 'var(--text)', color: 'var(--surface)', borderColor: 'var(--text)' } : {}}>
              <Icon name="filter" size={11} /> Proven links only
            </button>
          </div>
        </div>
        <div className="sheet-body tight">
          {setDateRange && (
            <div style={{ marginBottom: 'var(--s3)' }}>
              <DateFilter from={range.from} to={range.to}
                onFrom={(v) => setDateRange({ ...range, from: v })}
                onTo={(v) => setDateRange({ ...range, to: v })}
                onReset={() => setDateRange({ from: '', to: '' })}
                matched={edges.length} total={allEdges.length} scope="links in range" />
            </div>
          )}
          <div className="graph-wrap">
            <svg className="graph-svg" viewBox={`0 0 ${W} ${H}`} style={{ height: 468 }}>
              {shown.map((e, i) => {
                const a = nodes.find((n) => n.id === e.from), b = nodes.find((n) => n.id === e.to);
                if (!a || !b) return null;
                const hot = hover === a.id || hover === b.id;
                return (
                  <g key={i}>
                    <line x1={a.px} y1={a.py} x2={b.px} y2={b.py}
                      stroke={colorOf(e.status)} strokeWidth={hot ? 2.4 : 1.5}
                      strokeDasharray={dash(e.status) || undefined}
                      opacity={hover && !hot ? 0.28 : 0.92} />
                    {hot && (
                      <text x={(a.px + b.px) / 2} y={(a.py + b.py) / 2 - 6}
                        textAnchor="middle" className="gnode-label" style={{ fill: colorOf(e.status) }}>
                        {e.label}
                      </text>
                    )}
                  </g>
                );
              })}
              {nodes.filter((n) => !provenOnly || shownIds.has(n.id)).map((n) => {
                const r = n.kind === 'persona' ? 22 : 15;
                const on = hover === n.id || sel === n.id;
                return (
                  <g key={n.id} transform={`translate(${n.px},${n.py})`} className="gnode-hit"
                    onMouseEnter={() => setHover(n.id)} onMouseLeave={() => setHover(null)}
                    onClick={() => {
                      setSel(sel === n.id ? null : n.id);
                      if (onNodeClaim) onNodeClaim(n);
                    }}
                    style={{ cursor: 'pointer' }}>
                    <circle r={r + (on ? 3 : 0)} fill={nodeFill(n)} stroke={on ? 'var(--text)' : 'var(--border-strong)'}
                      strokeWidth={on ? 2 : 1.2} style={{ transition: 'all 120ms' }} />
                    {n.kind === 'persona' && (
                      <text textAnchor="middle" dy="3.5" className="gnode-label"
                        style={{ fill: 'var(--text)', fontSize: 'var(--text-micro)', fontWeight: 600 }}>
                        {initials(n.label)}
                      </text>
                    )}
                    {n.kind !== 'persona' && (
                      <circle r="3" fill="var(--text-3)" />
                    )}
                    <text textAnchor="middle" y={r + 13} className="gnode-label"
                      style={{ fill: on ? 'var(--text)' : 'var(--text-2)', fontWeight: on ? 600 : 400 }}>
                      {n.label}
                    </text>
                  </g>
                );
              })}
            </svg>
            {hover && (() => {
              const n = nodes.find((x) => x.id === hover);
              const c = scene.graph.nodes.find((x) => x.id === hover);
              return (
                <div className="ghover-card" style={{ left: Math.min(n.px + 16, W - 200), top: n.py + 14 }}>
                  <div className="mono" style={{ fontWeight: 600 }}>{n.label}</div>
                  <div className="tiny" style={{ opacity: 1, marginTop: 3 }}>
                    {n.kind}{c.market ? ` · ${c.market}` : ''}
                  </div>
                  <div className="tiny" style={{ opacity: 1, marginTop: 3 }}>
                    click to open its claim card
                  </div>
                </div>
              );
            })()}
            <div className="graph-key">
              {[['verified', 'verified'], ['supported', 'supported'], ['questionable', 'questionable'], ['contradicted', 'contradicted'], ['takeover', 'takeover']].map(([k, l]) => (
                <span key={k} className="row" style={{ gap: 5 }}>
                  <span style={{ width: 14, height: 2, background: colorOf(k), display: 'inline-block' }} />
                  {l}
                </span>
              ))}
            </div>
          </div>
          <div className="row" style={{ gap: 'var(--s4)', marginTop: 'var(--s3)' }}>
            <span className="tiny muted-2" style={{ flex: 1, textWrap: 'pretty' }}>
              {provenOnly
                ? `Filtered to proven and supported links: ${shown.length} of ${allEdges.length}. Everything else is still recorded — hiding an edge does not delete the evidence behind it.`
                : `Showing ${edges.length} of ${allEdges.length} links, including the ${edges.filter((e) => e.status === 'questionable').length} questionable ones a weighted system would quietly count.`}
              {filteredOut > 0 && ` ${filteredOut} link${filteredOut === 1 ? '' : 's'} outside the selected date range are excluded from view only; they are not discounted and they do not change any verdict.`}
            </span>
          </div>
        </div>
      </div>

      <div className="grid g3">
        {scene.graph.nodes.map((n) => {
          const es = edges.filter((e) => e.from === n.id || e.to === n.id);
          const worst = es.some((e) => e.status === 'contradicted') ? 'contradicted'
            : es.some((e) => e.status === 'questionable') ? 'questionable'
            : es.some((e) => e.status === 'supported') ? 'supported' : 'verified';
          return (
            <div className="claim-card" key={n.id} style={{ padding: 'var(--s3)' }}>
              <div className="row" style={{ gap: 8 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: colorOf(worst), flex: 'none' }} />
                <span className="mono" style={{ fontSize: 'var(--text-xs)', fontWeight: 600, flex: 1 }}>{n.label}</span>
                <span className="tiny mono muted">{n.kind}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
function initials(s) {
  return String(s).replace(/[^a-z_]/gi, '').slice(0, 2).toUpperCase();
}

/* =====================================================================
   RED-TEAM SPLIT VIEW
   Same attack, same evidence, two systems. Ours degrades because it is
   built to. The comparison side is a "typical weighted-score system"
   that we implement ourselves — no other team or product is named.
   ===================================================================== */
function RedTeam({ scene, attackStates, onRun, onReset, showComparison = true }) {
  const [sel, setSel] = React.useState(null);
  const active = attackStates[sel];
  const baseBoard = CLAIM_TYPES.map((ct) => {
    const c = scene.claims[ct.id];
    return { ...ct, present: !!c, verdict: c ? c.claimVerdict : 'HOLD', status: c ? c.status : 'UNVERIFIED', peak: c ? c.peak : 'L0', takeover: c ? !!c.takeover : false };
  });

  return (
    <div className="stack" style={{ gap: 'var(--s4)' }}>
      <div className="sheet">
        <div className="sheet-head">
          <div style={{ flex: 1 }}>
            <div className="eyebrow">Red-team panel</div>
            <h2 className="sheet-title">Attack this case, then watch the verdict respond.</h2>
            <div className="tiny muted-2" style={{ marginTop: 4 }}>
              The same attack, run against the same evidence, in two systems. One of them is able to change its mind.
            </div>
          </div>
          <button className="btn btn-sm" onClick={() => { setSel(null); onReset(); }}>
            <Icon name="history" size={11} /> Reset case
          </button>
        </div>
        <div className="sheet-body">
          <div className="split" style={{ gridTemplateColumns: showComparison ? '1fr 1px 1fr' : '1fr' }}>
            {/* ---------------- OUR SIDE ---------------- */}
            <div className="split-side us">
              <div className="split-head">
                <span className="split-title" style={{ flex: 1 }}>SakshiAstra</span>
                <span className="split-tag">verification layer · reports no score</span>
              </div>
              <div className="verdict-stack">
                {baseBoard.filter((b) => b.present).map((b) => {
                  const st = active && active.targetId === b.id ? active.ours : null;
                  const v = st ? st.verdict : b.verdict;
                  const status = st ? st.status : b.status;
                  const peak = st ? st.peak : b.peak;
                  const changed = st && v !== b.verdict;
                  return (
                    <div className="verdict-line" key={b.id}
                      style={changed ? { borderColor: 'var(--text)', boxShadow: '0 0 0 1.5px var(--text)' } : {}}>
                      <span className="verdict-line-name">{b.name}</span>
                      <span className="mono tiny muted">{peak}</span>
                      <StatusWord status={status} muted={!st} />
                      <VerdictChip verdict={v} />
                    </div>
                  );
                })}
              </div>
              {active && (
                <div className={`callout ${active.ours.verdict === 'REJECT' ? 'reject' : active.ours.verdict === 'ASSERT' ? 'assert' : ''}`} style={{ marginTop: 'var(--s3)' }}>
                  <div className="rule-line">
                    <span className="rule-code">{active.ours.rule}</span>
                    <span className="rule-label">{active.delta}</span>
                  </div>
                  <p className="rule-why">{active.ours.why}</p>
                </div>
              )}
              {!active && (
                <div className="callout" style={{ marginTop: 'var(--s3)' }}>
                  No attack applied. Run one from below to see which claim moves, and which rule moves it.
                </div>
              )}
            </div>

            <div className="split-rule" style={{ display: showComparison ? 'block' : 'none' }} />

            {/* ----------- COMPARISON SIDE (ours, deliberately) ----------- */}
            {showComparison && (
            <div className="split-side">
              <div className="split-head">
                <span className="split-title" style={{ flex: 1 }}>Typical weighted-score system</span>
                <span className="split-tag">reference implementation</span>
              </div>
              <div className="label" style={{ marginBottom: 5 }}>What a weighted-score system reports</div>
              <div className="scalar">
                <div className="scalar-fig">{active ? active.theirs.score : scene.typical.score}%</div>
                <div className="scalar-note">
                  {active
                    ? active.theirs.because
                    : `${scene.typical.signals} matching signals, one summed ${scene.typical.label}. A scalar like this cannot say which signal did the work, what it would cost an attacker to produce, or what would falsify it.`}
                </div>
              </div>
              <div className="verdict-stack" style={{ marginTop: 'var(--s3)' }}>
                {baseBoard.filter((b) => b.present).map((b) => (
                  <div className="verdict-line" key={b.id} style={{ opacity: 1 }}>
                    <span className="verdict-line-name">{b.name}</span>
                    <span className="tiny mono muted">n/a</span>
                    <span className="tiny muted">no per-claim status</span>
                  </div>
                ))}
              </div>
              <div className="callout reject" style={{ marginTop: 'var(--s3)' }}>
                {active
                  ? `The attack raises the summed score from ${scene.typical.score}% to ${active.theirs.score}%. Every attack in this panel moves this number upward, because adding a matching signal always adds weight.`
                  : scene.typical.merged
                    ? 'This is where the scalar system merges the personas and calls it one actor. Note the number never has a column for what it would cost an attacker to produce.'
                    : 'No verdict change on this side, because there is no verdict here — only a number.'}
              </div>
            </div>
            )}
          </div>
        </div>
      </div>

      <div className="sheet">
        <div className="sheet-head" style={{ padding: 'var(--s3) var(--s4)' }}>
          <h3 className="sheet-title" style={{ fontSize: 'var(--text-card)', flex: 1 }}>Attacks</h3>
          <span className="tiny muted">each one is cheap, and each one works on a weighted sum</span>
        </div>
        <div className="sheet-body tight">
          <div className="grid g4" style={{ gap: 'var(--s3)' }}>
            {ATTACKS.map((a) => (
              <button className="attack" key={a.id} aria-pressed={sel === a.id}
                onClick={() => { setSel(a.id); onRun(a.id); }}
                style={{ flexDirection: 'column' }}>
                <div className="row" style={{ gap: 'var(--s3)', width: '100%' }}>
                  <span className="attack-id">{a.n}</span>
                  <div style={{ flex: 1 }}>
                    <div className="attack-name">{a.name}</div>
                  </div>
                </div>
                <div className="attack-desc">{a.desc}</div>
                <div className="row" style={{ gap: 'var(--s3)', marginTop: 'var(--s3)', width: '100%', justifyContent: 'space-between' }}>
                  <AttackCost cost={a.cost} compact />
                  <span className="tiny mono muted">{a.costNote}</span>
                </div>
              </button>
            ))}
          </div>
          <div className="hr" />
          <div className="grid g2" style={{ gap: 'var(--s4)' }}>
            <div>
              <div className="label" style={{ marginBottom: 8 }}>Why the numbers on the right all go up</div>
              <div className="body-text" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-2)' }}>
                A weighted sum has one direction: every matching feature adds weight. It has no term for “this
                feature is cheap to fake”, and no term for “these four features are actually one artifact”. So an
                attacker who copies a public key, a public description and a public signature block gets three
                increases and no penalty.
              </div>
            </div>
            <div>
              <div className="label" style={{ marginBottom: 8 }}>Why ours moves in both directions</div>
              <div className="body-text" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-2)' }}>
                Cost-to-forge is carried per item, copy-origin folding runs before any verdict, and contradiction is
                terminal. Replayed signatures and their artifact observations carry zero proof and leave an unsupported claim at HOLD.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =====================================================================
   COVER — the demo-video opening frame. Typographic. No imagery.
   ===================================================================== */
function Cover({ onEnter }) {
  const claims = [
    { name: 'Key Control', verdict: 'ASSERT', peak: 'L3' },
    { name: 'Wallet Control', verdict: 'ASSERT', peak: 'L3' },
    { name: 'Persona Link', verdict: 'HOLD', peak: 'L1' },
    { name: 'Hosting Link', verdict: 'HOLD', peak: 'L1' },
    { name: 'Same Operator', verdict: 'HOLD', takeover: true, peak: 'L1' },
  ];
  return (
    <div className="cover">
      <div className="cover-left">
        <div className="cover-byline">SakshiAstra · SIH26151 · NTRO</div>
        <h1 className="cover-title">
          Similarity finds suspects.<br />
          <em>Verification proves what the evidence supports.</em>
        </h1>
        <p className="cover-lede">
          A weighted score has one direction: everything that matches adds weight. This platform carries what each
          piece of evidence would cost an attacker to fake, folds signals that share one origin, and treats a
          contradiction as terminal. It cannot print 100%, because it never resolves evidence into a single number.
        </p>
        <div className="row" style={{ gap: 'var(--s3)', marginTop: 'var(--s6)' }}>
          <button className="btn-chrome-solid btn" onClick={onEnter}>
            <Icon name="play" size={11} /> Enter the workbench
          </button>
          <span className="cover-byline">demo runs offline · fixtures labelled at source</span>
        </div>
      </div>
      <div className="cover-right">
        <div className="cover-byline" style={{ marginBottom: 'var(--s2)' }}>One link · five claims · four statuses</div>
        {claims.map((c) => (
          <div className="cover-claim" key={c.name}>
            <div className="row" style={{ gap: 'var(--s3)' }}>
              <span className="cover-claim-name" style={{ flex: 1 }}>{c.name}</span>
              <span className="mono tiny" style={{ color: 'var(--text-3)' }}>{c.peak}</span>
              {c.takeover && <TakeoverFlag compact />}
              <VerdictChip verdict={c.verdict} onChrome />
            </div>
          </div>
        ))}
        <div className="cover-byline" style={{ marginTop: 'var(--s3)', textTransform: 'none', letterSpacing: 0 }}>
          The same link, five sub-claims. A scalar collapses all five into one number and loses every distinction
          that matters.
        </div>
      </div>
      <div className="cover-foot">
        <span className="cover-byline">no live crawling of real marketplaces</span>
        <span className="cover-byline">historical data always labelled</span>
        <span className="cover-byline">analyst confirms · second analyst approves export</span>
      </div>
    </div>
  );
}

Object.assign(window, { RelationGraph, RedTeam, Cover });

export { RelationGraph, initials, RedTeam, Cover };
