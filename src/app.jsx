import { citedRules, shortReason } from './copy.js';
import { PRESENTER } from './presenter.js';
import React from 'react';
import { CaseResult, ContinuityStrip, CopyOriginBundle, Icon, ProofLadder, WalletLadderStep, ProvenanceStrip, fmtStamp, SectionH, StatusWord, TakeoverFlag, VerdictChip } from './primitives.jsx';
import { CLAIM_TYPES, RULES, SCENES } from './scenes.js';
import { TweakButton, TweakRadio, TweakSection, TweakToggle, TweaksPanel, useTweaks } from './tweaks_panel.jsx';
import { api, caseResult } from './api.js';
import { Cover, RedTeam, RelationGraph } from './graph.jsx';
import { ClaimBoard, Dossier, HoldQueue, IntakeStudio, MigrationTimeline } from './screens.jsx';
import { ActorProfile, Collection, SuspectLadder } from './panels.jsx';
import { ClaimEvidence, ClaimCard, EvidenceInspector, EvidenceRow, MissingEvidence, ladderNote } from './claimcard.jsx';
/* =====================================================================
   SakshiAstra — application shell
   Nav, presenter mode, command palette, tweaks.
   ===================================================================== */

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "dark",
  "density": "analyst",
  "showComparison": true
}/*EDITMODE-END*/;

const NAV = [
  { id: 'board', label: 'Case workspace', glyph: '▤', hint: 'claim board' },
  { id: 'inspector', label: 'Evidence inspector', glyph: '◧', hint: 'claim cards' },
  { id: 'graph', label: 'Relationship graph', glyph: '◈', hint: 'entities' },
  { id: 'timeline', label: 'Migration timeline', glyph: '⊟', hint: 'continuity' },
  { id: 'intake', label: 'Intake studio', glyph: '⊕', hint: 'paste & parse' },
  { id: 'actor', label: 'Actor profile', glyph: '☰', hint: 'identifiers & claims' },
  { id: 'collection', label: 'Collection', glyph: '⟳', hint: 'scheduled scans' },
  { id: 'queue', label: 'Verification queue', glyph: '⚖', hint: 'HOLD decisions' },
  { id: 'redteam', label: 'Red team', glyph: '⊘', hint: 'attack the case' },
  { id: 'dossier', label: 'Dossier & custody', glyph: '⎘', hint: 'export' },
];



/* =====================================================================
   CONTEXT RAIL — the persistent third column (360px)
   Presentation only. Renders the case context that the claim board and
   actor profile previously duplicated inside their own layouts.
   ===================================================================== */
function ContextRail({ scene, board, onOpenClaim, onGoto, screen }) {
  if (!scene) return null;
  const cited = citedRules(scene);
  return (
    <>
      <div className="sheet">
        <div className="section">
          <div className="label" style={{ marginBottom: 12 }}>Subjects</div>
          <div className="stack" style={{ gap: 12 }}>
            {scene.subjects.map((s, i) => (
              <div key={i} className="stack" style={{ gap: 3 }}>
                <span className="mono" style={{ fontSize: 'var(--text-body)', fontWeight: 600 }}>{screen === 'actor' ? `Persona ${i + 1}` : s.handle}</span>
                <span className="tiny muted">{s.market} · {fmtStamp(s.first)} → {fmtStamp(s.last)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="section">
          <div className="grid g2" style={{ gap: 12 }}>
            <div className="stack" style={{ gap: 3 }}>
              <div className="label">Opened</div>
              <span className="mono tiny">{fmtStamp(scene.case.opened)}</span>
            </div>
            <div className="stack" style={{ gap: 3 }}>
              <div className="label">Analyst</div>
              <span className="mono tiny">{scene.case.analyst}</span>
            </div>
          </div>
        </div>
        <div className="section">
          <div className="tiny muted-2" style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <Icon name="lock" size={18} style={{ color: 'var(--color-text-3)', marginTop: 2 }} />
            <span>Analyst confirms identity. Second analyst approves export.</span>
          </div>
        </div>
      </div>

      <div className="sheet">
        <div className="section">
          <div className="label" style={{ marginBottom: 12 }}>Locked rules</div>
          <div className="stack" style={{ gap: 10 }}>
            {RULES.filter(r => cited.has(r.id)).map((r) => (
              <div key={r.id} className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
                <span className="mono tiny muted" style={{ flex: 'none', width: 18 }}>{r.id}</span>
                <span className="tiny muted-2" style={{ textWrap: 'pretty' }}>{r.title}</span>
              </div>
            ))}
          </div>
        </div>
        <details className="section evidence-fold"><summary>All rules</summary>
          {RULES.filter(r => !cited.has(r.id)).map(r => <div key={r.id} className="row tiny" style={{ gap: 10 }}>{r.id} · {r.title}</div>)}
        </details>
      </div>

    </>
  );
}

/* =====================================================================
   NAV OVERFLOW
   Measures which top-bar items fit and moves the remainder into a
   "More" menu. Presentation only — every destination stays reachable.
   ===================================================================== */
function NavOverflow({ items, screen, onPick }) {
  const wrapRef = React.useRef(null);
  const measureRef = React.useRef(null);
  const [visible, setVisible] = React.useState(items.length);
  const [open, setOpen] = React.useState(false);

  React.useLayoutEffect(() => {
    const MORE_W = 104;   // width reserved for the More control
    const calc = () => {
      const wrap = wrapRef.current, meas = measureRef.current;
      if (!wrap || !meas) return;
      const avail = wrap.clientWidth;
      if (!avail) return;
      const widths = Array.from(meas.children).map((c) => c.offsetWidth + 2);
      let used = 0, n = 0;
      for (let i = 0; i < widths.length; i++) {
        if (used + widths[i] <= avail) { used += widths[i]; n++; } else break;
      }
      if (n < items.length) {
        while (n > 0 && used + MORE_W > avail) { n--; used -= widths[n]; }
      }
      setVisible(n);
    };
    calc();
    const ro = new ResizeObserver(calc);
    if (wrapRef.current) ro.observe(wrapRef.current);
    window.addEventListener('resize', calc);
    return () => { ro.disconnect(); window.removeEventListener('resize', calc); };
  }, [items.length]);

  /* close the menu when the screen changes or on outside click */
  React.useEffect(() => { setOpen(false); }, [screen]);
  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const shown = items.slice(0, visible);
  const hidden = items.slice(visible);

  return (
    <div className="nav" ref={wrapRef}>
      {shown.map((n) => (
        <button key={n.id} className="nav-item" aria-current={screen === n.id}
          onClick={() => { onPick(n.id); setOpen(false); }}>
          {n.label}
        </button>
      ))}

      {/* hidden measurer: every item, so widths are known before layout */}
      <div ref={measureRef} aria-hidden="true"
        style={{ position: 'absolute', visibility: 'hidden', pointerEvents: 'none', display: 'flex', top: -9999, left: -9999 }}>
        {items.map((n) => <button key={n.id} className="nav-item" tabIndex={-1}>{n.label}</button>)}
      </div>

      {hidden.length > 0 && (
        <div className="more-wrap">
          <button className="more-btn" aria-expanded={open} aria-haspopup="menu"
            onClick={() => setOpen(!open)}>
            More
            <span style={{ fontFamily: 'var(--f-mono)', fontSize: 'var(--text-micro)', color: 'var(--text-3)' }}>
              +{hidden.length}
            </span>
            <Icon name={open ? 'chevronDown' : 'chevronRight'} size={11} />
          </button>
          {open && (
            <div className="more-menu" role="menu">
              {hidden.map((n) => (
                <button key={n.id} className="more-item" role="menuitem"
                  aria-current={screen === n.id}
                  onClick={() => { onPick(n.id); setOpen(false); }}>
                  <span className="rail-glyph">{n.glyph}</span>
                  <span style={{ flex: 1 }}>{n.label}</span>
                  {screen === n.id && <Icon name="check" size={12} />}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [screen, setScreen] = React.useState(() => localStorage.getItem('sa.screen') || 'board');
  const [sceneId, setSceneId] = React.useState(() => localStorage.getItem('sa.scene') || 'lookalike');
  /* the cover is the demo-video opening frame: show it on a cold load,
     skip it on a warm reload so a refresh never loses your place */
  const [entered, setEntered] = React.useState(() => !!localStorage.getItem('sa.entered'));
  const [scene, setScene] = React.useState(null);
  const [loadError, setLoadError] = React.useState(null);
  const [board, setBoard] = React.useState([]);
  const [ledger, setLedger] = React.useState([]);
  const [inspecting, setInspecting] = React.useState(null);
  const [collected, setCollected] = React.useState(new Set());
  const [busy, setBusy] = React.useState(false);
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const [presenting, setPresenting] = React.useState(false);
  const presenterBarRef = React.useRef(null);
  React.useLayoutEffect(() => {
    if (!presenting || !presenterBarRef.current) return;
    const measure = () => document.documentElement.style.setProperty('--presentation-height', `${presenterBarRef.current.offsetHeight}px`);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(presenterBarRef.current);
    return () => { observer.disconnect(); document.documentElement.style.removeProperty('--presentation-height'); };
  }, [presenting]);
  const [presIdx, setPresIdx] = React.useState(0);
  const [attackStates, setAttackStates] = React.useState({});
  const [decisions, setDecisions] = React.useState({});
  const [revealed, setRevealed] = React.useState(false);
  const [revealRequested, setRevealRequested] = React.useState(false);
  const [queue, setQueue] = React.useState([]);
  /* no artboard, no scale: the shell fills the viewport via CSS grid */
  const [profile, setProfile] = React.useState(null);
  const [collection, setCollection] = React.useState(null);
  const [approvals, setApprovals] = React.useState({});
  const [chainState, setChainState] = React.useState(null);
  const [dateRange, setDateRange] = React.useState({ from: '', to: '' });

  React.useEffect(() => { if (entered) localStorage.setItem('sa.entered', '1'); }, [entered]);

  React.useEffect(() => { localStorage.setItem('sa.screen', screen); }, [screen]);
  React.useEffect(() => { localStorage.setItem('sa.scene', sceneId); }, [sceneId]);

  const ledgerTick = React.useRef(0);
  const [reload, setReload] = React.useState(0);

  React.useEffect(() => {
    setScene(null); setInspecting(null); setRevealed(false); setRevealRequested(false);
    setAttackStates({});
  }, [sceneId]);

  React.useEffect(() => {
    let live = true;
    setLoadError(null);
    (async () => {
      const [s, b, l, q, p, col] = await Promise.all([
        api.getCase(sceneId), api.getClaimBoard(sceneId), api.getLedger(sceneId),
        api.getQueue(), api.getActorProfile(sceneId), api.getCollection(sceneId),
      ]);
      const v = await api.verifyLedger(sceneId, -1);
      if (!live) return;
      setScene(s); setBoard(b); setLedger(l); setQueue(q);
      setProfile(p); setCollection(col);
      setRevealed(!!s.piiRevealed);
      setChainState({ ok: v.verified, reason: v.reason || null });
    })().catch(() => {
      if (live) setLoadError('Could not load this case. Please try again.');
    });
    return () => { live = false; };
  }, [sceneId, collected, reload]);

  const refreshLedger = React.useCallback(async () => {
    setLedger(await api.getLedger(sceneId));
  }, [sceneId]);

  /* ---- keyboard ---- */
  React.useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault(); setPaletteOpen(true);
      } else if (e.key === 'Escape') {
        setPaletteOpen(false); setInspecting(null);
      } else if (presenting && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
        if (e.target instanceof Element && e.target.closest('input, textarea, select, [contenteditable]')) return;
        e.preventDefault();
        setPresIdx((i) => {
          const n = Math.max(0, Math.min(PRESENTER.length - 1, i + (e.key === 'ArrowRight' ? 1 : -1)));
          applyPresenter(n);
          return n;
        });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [presenting, sceneId]);

  function applyPresenter(i) {
    const p = PRESENTER[i];
    if (!p) return;
    setScreen(p.screen); setSceneId(p.scene); setInspecting(null);
    setDateRange({ from: '', to: '' });
  }

  async function openClaim(claimId) {
    const c = await api.getClaim(sceneId, claimId);
    setInspecting(c ? { ...c, id: claimId } : null);
    if (screen !== 'inspector' && screen !== 'board') setScreen('inspector');
  }

  async function onCollect(i, selectedClaimId) {
    setBusy(true);
    const claimId = selectedClaimId || inspecting?.id;
    try {
      const r = await api.collect(sceneId, claimId, i);
      if (!r.ok) return r;
      setCollected((prev) => new Set(prev).add(`${sceneId}:${claimId}:${i}`));
      const [fresh, b, l, q, p, c] = await Promise.all([
        api.getCase(sceneId), api.getClaimBoard(sceneId), api.getLedger(sceneId),
        api.getQueue(), api.getActorProfile(sceneId), api.getCollection(sceneId),
      ]);
      setScene(fresh); setBoard(b); setLedger(l); setQueue(q); setProfile(p); setCollection(c);
      if (inspecting) setInspecting({ ...await api.getClaim(sceneId, inspecting.id), id: inspecting.id });
      return r;
    } finally { setBusy(false); }
  }

  async function onRunAttack(attackId) {
    const r = await api.redteam(sceneId, attackId);
    setAttackStates((prev) => ({ ...prev, [attackId]: r }));
    setScene(await api.getCase(sceneId));
  }

  async function onDecision(sceneKey, decision) {
    const r = await api.decide(sceneKey, decision, 'analyst decision recorded');
    setDecisions((prev) => ({ ...prev, [sceneKey]: { ...r, decision } }));
    await refreshLedger();
  }

  /* PII reveal requires a typed reason; the reason is written to the chain */
  async function onRevealPII(reason) {
    const r = await api.revealPII(sceneId, reason);
    if (r.ok) { setRevealed(true); await refreshLedger(); }
    return r;
  }

  function openReveal() {
    setInspecting(null); setRevealRequested(true); setScreen('dossier');
  }

  function collectedFor(claimId) {
    const claim = scene?.claims[claimId];
    return new Set((claim?.missing || []).map((_, i) => i)
      .filter((i) => collected.has(`${sceneId}:${claimId}:${i}`)));
  }

  async function onExport(format) {
    const r = await api.exportDossier(sceneId, format);
    if (r.ok) await refreshLedger();
    return r;
  }
  onExport.verify = async (tamperIndex) => {
    const r = await api.verifyLedger(sceneId, tamperIndex);
    setLedger(r.rows);
    if (tamperIndex >= 0) await refreshLedger();
    return r;
  };

  async function onApprove(format) {
    const r = await api.approveExport(sceneId, format);
    setApprovals((prev) => ({ ...prev, [scene.case.id]: { a: 'analyst.a', b: 'analyst.b' } }));
    await refreshLedger();
    return r;
  }

  /* graph node click opens the claim that node belongs to */
  async function openNodeClaim(node) {
    const claimId = node.kind === 'persona' ? 'persona_link'
      : node.kind === 'key' ? 'key_control'
      : node.kind === 'wallet' ? 'wallet_control'
      : null;
    if (claimId && scene && scene.claims[claimId]) { await openClaim(claimId); return; }
    /* no direct claim — open the claim whose evidence mentions this artifact */
    if (scene) {
      const hit = Object.entries(scene.claims).find(([, c]) =>
        (c.evidence || []).some((e) => (e.originLabel || '').toLowerCase().includes(String(node.label).toLowerCase().slice(0, 8)) || (e.title || '').toLowerCase().includes(String(node.label).toLowerCase().slice(0, 8))));
      if (hit) { await openClaim(hit[0]); return; }
      await openClaim(Object.keys(scene.claims)[0]);
    }
  }

  const onChrome = t.theme !== 'light';
  /* the aside carries case context where that is useful; screens whose
     right side IS the primary content use the full width instead */
  const asideScreens = ['board', 'actor'];
  const showAside = asideScreens.includes(screen) && !!scene;

  if (!entered) {
    return (
      <div className="app">
        <Cover onEnter={() => { setEntered(true); setScreen('board'); }} />
      </div>
    );
  }

  return (
    <div className={'app' + (showAside ? '' : ' app--no-aside') + (presenting ? ' app--presenting' : '')}
      data-theme={t.theme} data-density={t.density}>

        {/* ---------------- topbar ---------------- */}
        <div className="topbar">
          <div className="brand">
            <div className="brand-mark">SA</div>
            <div>
              <div className="brand-name">SakshiAstra</div>
              <div className="brand-sub">verification workbench</div>
            </div>
          </div>
          <NavOverflow items={NAV} screen={screen}
            onPick={(id) => { setScreen(id); setInspecting(null); }} />
          <div className="topbar-right">
            <button className="search-trigger" onClick={() => setPaletteOpen(true)}>
              <Icon name="search" size={12} />
              <span style={{ flex: 1, textAlign: 'left' }}>Search identifier, wallet, PGP key…</span>
              <span className="kbd">⌘K</span>
            </button>
            <button className="icon-btn" title="Presenter mode" onClick={() => { setPresenting(!presenting); if (!presenting) applyPresenter(presIdx); }}>
              <Icon name={presenting ? 'pause' : 'play'} size={13} />
            </button>
            <div className="avatar">AA</div>
          </div>
        </div>

        <>
          {/* ---------------- rail ---------------- */}
          <div className="rail">
            <div className="rail-group">
              <div className="rail-label">Workspace</div>
              {NAV.slice(0, 7).map((n) => (
                <button key={n.id} className="rail-item" aria-current={screen === n.id}
                  onClick={() => { setScreen(n.id); setInspecting(null); }}>
                  <span className="rail-glyph">{n.glyph}</span>
                  <span style={{ flex: 1 }}>{n.label}</span>
                </button>
              ))}
            </div>

            <div className="rail-group">
              <div className="rail-label">Decision</div>
              {NAV.slice(7).map((n) => (
                <button key={n.id} className="rail-item" aria-current={screen === n.id}
                  onClick={() => { setScreen(n.id); setInspecting(null); }}>
                  <span className="rail-glyph">{n.glyph}</span>
                  <span style={{ flex: 1 }}>{n.label}</span>
                  {n.id === 'queue' && queue.length > 0 && <span className="rail-count">{queue.length}</span>}
                </button>
              ))}
            </div>

            <div className="rail-group">
              <div className="rail-label">Cases</div>
              <div className="stack" style={{ gap: 1, maxHeight: 158, overflowY: 'auto', overflowX: 'hidden' }}>
                {SCENES.map((s) => (
                  <button key={s.id} className="rail-item" aria-current={sceneId === s.id}
                    onClick={() => { setSceneId(s.id); setInspecting(null); setAttackStates({}); setDateRange({ from: '', to: '' }); }}>
                    <span className="rail-count" style={{ margin: 0, width: 14 }}>{s.n}</span>
                    <span style={{ flex: 1, whiteSpace: 'normal', overflowWrap: 'anywhere' }}>
                      {s.title}
                    </span>
                    <span className={`vchip v-${(s.id === 'ring' ? caseResult(s).verdict : s.verdict).toLowerCase()}`}
                      style={{ padding: 0, border: 'none', background: 'none', height: 'auto' }}>
                      <span className="dot" />
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="rail-foot">
              <button className="rail-item" onClick={() => setEntered(false)} style={{ marginBottom: 8 }}>
                <span className="rail-glyph">◆</span>
                <span style={{ flex: 1 }}>Cover screen</span>
              </button>
              <div className="tiny" style={{ color: 'var(--text-3)', lineHeight: 1.5 }}>
                Similarity finds suspects.<br />Verification proves what the evidence supports.
              </div>
            </div>
          </div>

          {/* ---------------- main ---------------- */}
          <div className="main">
            <div className="main-scroll">
              {loadError ? (
                <div className="text-block">
                  <p role="alert">{loadError}</p>
                  <button className="btn btn-sm" onClick={() => setReload(n => n + 1)}>Try again</button>
                </div>
              ) : !scene ? (
                <div className="text-block">
                  <div className="skel skel-title" />
                  <div className="skel skel-line" style={{ width: '72%' }} />
                  <div className="skel skel-counter" />
                  <div className="skel skel-card" />
                  <div className="skel skel-card" />
                </div>
              ) : (
                <div className="fade-in text-block">
                  {screen === 'board' && <ClaimBoard scene={scene} board={board}
                    onOpenClaim={openClaim} onGoto={setScreen} />}
                  {screen === 'inspector' && (
                    <InspectorScreen key={scene.id} scene={scene} board={board} onOpenClaim={openClaim}
                      onCollect={onCollect} collected={collected} busy={busy}
                      onRevealPII={onRevealPII} revealed={revealed} onOpenReveal={openReveal} />
                  )}
                  {screen === 'graph' && (
                    <RelationGraph scene={scene} onOpenClaim={openClaim} onNodeClaim={openNodeClaim}
                      dateRange={dateRange} setDateRange={setDateRange} />
                  )}
                  {screen === 'timeline' && (
                    <MigrationTimeline scene={scene} onOpenClaim={openClaim}
                      dateRange={dateRange} setDateRange={setDateRange} />
                  )}
                  {screen === 'intake' && <IntakeStudio scene={scene} onIngested={refreshLedger} />}
                  {screen === 'actor' && (
                    <ActorProfile scene={scene} profile={profile}
                      onOpenClaim={openClaim} onGoto={setScreen} />
                  )}
                  {screen === 'collection' && (
                    <Collection scene={scene} collection={collection} onOpenClaim={openClaim} />
                  )}
                  {screen === 'queue' && <HoldQueue items={queue} decisions={decisions}
                    onOpen={(s) => { setSceneId(s); setScreen('board'); }} onDecide={onDecision} />}
                  {screen === 'redteam' && (
                    <RedTeam scene={scene} attackStates={attackStates} showComparison={t.showComparison !== false}
                      onRun={onRunAttack}
                      onReset={async () => {
                        const result = await api.resetRedteam(sceneId);
                        if (!result.ok) return;
                        setRevealed(false); setRevealRequested(false);
                        setApprovals(prev => {
                          const next = { ...prev };
                          delete next[scene.case.id];
                          return next;
                        });
                        setCollected(new Set(result.collected)); setAttackStates({});
                        const [s, b, q, p, c] = await Promise.all([api.getCase(sceneId), api.getClaimBoard(sceneId), api.getQueue(), api.getActorProfile(sceneId), api.getCollection(sceneId)]);
                        setScene(s); setBoard(b); setQueue(q); setProfile(p); setCollection(c);
                        if (inspecting) setInspecting({ ...await api.getClaim(sceneId, inspecting.id), id: inspecting.id });
                        await refreshLedger();
                      }} />
                  )}
                  {screen === 'dossier' && (
                    <Dossier key={scene.id} scene={scene} ledger={ledger} onExport={onExport} onApprove={onApprove}
                      approvals={approvals} onRevealPII={onRevealPII} revealed={revealed}
                      revealRequested={revealRequested} chainState={chainState} />
                  )}
                </div>
              )}
            </div>
            {inspecting && (
              <EvidenceInspector claim={inspecting}
                claimType={{ name: (CLAIM_TYPES.find((c) => c.id === inspecting.id) || {}).name, question: (CLAIM_TYPES.find((c) => c.id === inspecting.id) || {}).question }}
                onClose={() => setInspecting(null)}
                onCollect={(i) => onCollect(i, inspecting.id)}
                collected={collectedFor(inspecting.id)} busy={busy}
                redacted={!revealed} onReveal={openReveal} />
            )}
          </div>

          {showAside && (
            <aside className="aside">
              <ContextRail screen={screen} scene={scene} board={board} onOpenClaim={openClaim} onGoto={setScreen} />
            </aside>
          )}
        </>

        <ProvenanceStrip scene={scene} />

        {paletteOpen && <CommandPalette scene={scene} onClose={() => setPaletteOpen(false)}
          onPick={(kind, v) => {
            setPaletteOpen(false);
            if (kind === 'claim') openClaim(v);
            else if (kind === 'case') { setSceneId(v); setScreen('board'); }
            else setScreen(v);
          }} />}

      {presenting && (
        <div className="presentation-bar" ref={presenterBarRef}>
          <div className="pres-caption" title={PRESENTER[presIdx].caption}>{PRESENTER[presIdx].caption}</div>
          <details className="presenter-notes"><summary>Presenter notes</summary>
            <div className="notes-body">{scene?.caption}{scene && Object.entries(scene.claims).map(([id,c]) => <p key={id}>{CLAIM_TYPES.find(t => t.id === id)?.name}: {c.summary} {c.why}</p>)}</div>
          </details>
          <div className="presenter">
            <button className="pres-btn" aria-label="Previous scene" disabled={presIdx === 0} onClick={() => { const n = Math.max(0, presIdx - 1); setPresIdx(n); applyPresenter(n); }}>
              <Icon name="chevronLeft" size={12} />
            </button>
            <div className="pres-scene">
              <b>Scene {PRESENTER[presIdx].scene}</b> · {SCENES.find((s) => s.id === PRESENTER[presIdx].scene)?.title}
              {' · '}
              <span style={{ color: 'var(--text-3)' }}>{presIdx + 1} / {PRESENTER.length}</span>
            </div>
            <button className="pres-btn" aria-label="Next scene" disabled={presIdx === PRESENTER.length - 1} onClick={() => { const n = Math.min(PRESENTER.length - 1, presIdx + 1); setPresIdx(n); applyPresenter(n); }}>
              <Icon name="chevronRight" size={12} />
            </button>
            <div className="pres-dots">
              {PRESENTER.map((_, i) => <div key={i} className="pres-dot" data-on={i <= presIdx} />)}
            </div>
            <button className="pres-btn" aria-label="Exit presenter mode" onClick={() => setPresenting(false)}>
              <Icon name="x" size={11} />
            </button>
          </div>
        </div>
      )}

      <TweaksPanel>
        <TweakSection label="Reading" />
        <TweakRadio label="Theme" value={t.theme} options={['dark', 'light']}
          onChange={(v) => setTweak('theme', v)} />
        <TweakRadio label="Density" value={t.density} options={['analyst', 'presentation']}
          onChange={(v) => setTweak('density', v)} />
        <TweakSection label="Demo" />
        <TweakToggle label="Presenter mode" value={presenting}
          onChange={(v) => { setPresenting(v); if (v) applyPresenter(presIdx); }} />
        <TweakToggle label="Comparison panel" value={t.showComparison}
          onChange={(v) => { setTweak('showComparison', v); if (!v && screen === 'redteam') setScreen('board'); }} />
        <TweakSection label="Case" />
        {SCENES.map((s) => (
          <TweakButton key={s.id} label={`${s.n}. ${s.title}`}
            onClick={() => { setSceneId(s.id); setInspecting(null); }} />
        ))}
      </TweaksPanel>
    </div>
  );
}

/* ---------- Inspector as a full screen (for slide stills) ---------- */
function InspectorScreen({ scene, board, onCollect, collected, busy, revealed, onOpenReveal }) {
  const [selId, setSelId] = React.useState(() => Object.keys(scene.claims)[0]);
  const claim = scene.claims[selId];
  const ct = CLAIM_TYPES.find(c => c.id === selId);
  if (!claim) return null;
  return <div className="stack" style={{ gap: 16 }}>
    <div className="claim-tabs" role="tablist" aria-label="Claims">
      {board.map(b => <button key={b.id} className="btn" role="tab" aria-selected={selId === b.id}
        disabled={!b.present} onClick={() => setSelId(b.id)}>{b.name}</button>)}
    </div>
    <div className="sheet">
      <div className="sheet-head">
        <h2 className="sheet-title" style={{ flex: 1 }}>{ct.question}</h2>
        <VerdictChip verdict={claim.claimVerdict || 'HOLD'} /><StatusWord status={claim.status} />
      </div>
      <div className="sheet-body stack" style={{ gap: 16 }}>
        <ProofLadder peak={claim.peak} />
        <div className="callout rule-brief">{claim.rule} · {shortReason(claim)}</div>
        <ClaimEvidence key={selId} claim={claim} busy={busy} redacted={!revealed} onReveal={onOpenReveal}
          onCollect={i => onCollect(i, selId)}
          collected={new Set((claim.missing || []).map((_,i) => i).filter(i => collected.has(`${scene.id}:${selId}:${i}`)))}>
          <div><SectionH>Suspect-entity ladder</SectionH><SuspectLadder ladder={scene.suspectLadder} /></div>
        </ClaimEvidence>
      </div>
    </div>
  </div>;
}

/* ---------- command palette ---------- */
function CommandPalette({ scene, onClose, onPick }) {
  const [q, setQ] = React.useState('');
  const [idx, setIdx] = React.useState(0);
  const inputRef = React.useRef(null);
  React.useEffect(() => { inputRef.current && inputRef.current.focus(); }, []);

  const items = React.useMemo(() => {
    const out = [];
    NAV.forEach((n) => out.push({ kind: 'screen', label: n.label, sub: n.hint, value: n.id, group: 'Go to' }));
    SCENES.forEach((s) => out.push({ kind: 'case', label: s.title, sub: s.case.id, value: s.id, group: 'Cases' }));
    if (scene) {
      Object.entries(scene.claims).forEach(([cid, c]) => {
        const ct = CLAIM_TYPES.find((x) => x.id === cid);
        out.push({ kind: 'claim', label: ct.name, sub: c.claimVerdict + ' · ' + scene.title, value: cid, group: 'Claims' });
        (c.evidence || []).forEach((e) => {
          out.push({ kind: 'claim', label: e.title, sub: ct.name + ' · ' + e.status, value: cid, group: 'Evidence' });
        });
      });
      scene.subjects.forEach((s) => out.push({ kind: 'claim', label: s.handle, sub: 'subject · ' + s.market, value: Object.keys(scene.claims)[0], group: 'Subjects' }));
    }
    const f = q.trim().toLowerCase();
    return (f ? out.filter((i) => (i.label + ' ' + i.sub).toLowerCase().includes(f)) : out).slice(0, 14);
  }, [q, scene]);

  return (
    <div className="scrim" onClick={onClose}>
      <div className="palette" onClick={(e) => e.stopPropagation()}>
        <input ref={inputRef} className="palette-input" value={q}
          placeholder="Search identifier, wallet, PGP key, case…"
          onChange={(e) => { setQ(e.target.value); setIdx(0); }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setIdx((i) => Math.min(items.length - 1, i + 1)); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); setIdx((i) => Math.max(0, i - 1)); }
            else if (e.key === 'Enter' && items[idx]) { onPick(items[idx].kind, items[idx].value); }
          }} />
        <div className="palette-list">
          {items.map((it, i) => (
            <button key={i} className="palette-item" data-on={i === idx}
              onMouseEnter={() => setIdx(i)} onClick={() => onPick(it.kind, it.value)}>
              <Icon name={it.kind === 'case' ? 'doc' : it.kind === 'claim' ? 'target' : 'arrowRight'}
                size={12} style={{ color: 'var(--text-3)' }} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.label}</span>
                <span className="tiny muted">{it.sub}</span>
              </span>
              <span className="palette-kind">{it.group}</span>
            </button>
          ))}
          {!items.length && <div className="tiny muted" style={{ padding: 'var(--s4)' }}>No match in this case’s loaded records.</div>}
        </div>
        <div className="palette-hint">
          <span>↑↓ navigate</span><span>↵ open</span><span>esc close</span>
          <span style={{ marginLeft: 'auto' }}>search runs against loaded evidence only</span>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { App, TWEAK_DEFAULTS, PRESENTER });

export { TWEAK_DEFAULTS, NAV, PRESENTER, ContextRail, NavOverflow, App, InspectorScreen, CommandPalette };

