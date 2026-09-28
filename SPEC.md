# SakshiAstra — Frontend Build Spec

**Purpose of this document.** It is the complete brief for generating the interface and its backend. Everything here is already proven to work in the accompanying prototype (`SakshiAstra.html`), which runs offline with a mocked data layer. Build to this spec and the result matches the prototype.

**Product.** SakshiAstra, a dark-web threat-actor de-anonymisation platform, built for SIH26151 (NTRO). It ingests footprints from marketplaces, forums and hidden services and links personas across them.

**The one idea that governs every screen:** similarity finds suspects; verification proves what the evidence supports. The system never resolves evidence into a single scalar. It resolves it into *claims* carrying a status, a proof level, a falsifier, and a price for an attacker to fake.

---

## 1. Anti-patterns — read this first

These are structural prohibitions, not style notes. A build that violates them has failed even if it looks good.

**Never build:**
1. **A single confidence percentage that implies identity.** No "94% match", no "confidence score", no gauge. Forbidden in the DOM, in exports, and in API responses.
2. **The string "100% match" anywhere.**
3. **Auto-merge of personas.** Merging requires an explicit analyst decision, recorded in the ledger.
4. **A weighted-sum scoring function.** No `score += weight * similarity`. The verdict engine is rule-based (Section 5).
5. **A threshold slider.** Thresholds are signed and locked. Show them read-only.
6. **Gradients on backgrounds** (one exception: the cover's single radial wash).
7. **Green terminal text, hoodie-hacker iconography, onion/iceberg imagery, script fonts, stock cyber photography.**
8. **Claims of live crawling of real marketplaces.**
9. **Historical datasets presented as live scans.** Every record carries a source badge.
10. **Colour used for anything except verdicts.** Primary buttons are ink-on-paper.

---

## 2. Fixed vocabulary

Do not invent terms outside these lists. The UI's credibility comes from using a closed vocabulary consistently.

### Verdicts (colour belongs to these, and only these)
| Verdict | Text | Background | Border | Meaning |
|---|---|---|---|---|
| `ASSERT` | `#15803D` | `#E7F4EC` | `#BFE0CC` | The evidence supports it |
| `HOLD` | `#B45309` | `#FBF0E2` | `#EBD3B0` | The evidence does not yet support it |
| `REJECT` | `#B91C1C` | `#FBEBEB` | `#EEC7C7` | The evidence contradicts it |
| `TAKEOVER` | `#B45309` | `#FFFFFF` | `#B45309` (1.5px) | Key valid, operator changed. **Outlined** badge with a warning icon — never filled. Always caps at HOLD |

There is no violet in this product. Takeover is amber, outlined.

### Claim statuses
`VERIFIED` · `SUPPORTED` · `UNVERIFIED` · `QUESTIONABLE` · `CONTRADICTED`

Statuses are rendered as a **word with a rule under it**, not a coloured badge. Colour is reserved for verdicts; status is a separate axis.

### The five claims
| id | Name | Question |
|---|---|---|
| `key_control` | Key Control | Does this persona hold the private key? |
| `wallet_control` | Wallet Control | Does this persona control this wallet? |
| `persona_link` | Persona Link | Are these two handles the same person? |
| `hosting_link` | Hosting Link | Does this hidden service run on that origin? |
| `same_operator` | Same Operator | Is the same person still operating it? |

### Proof ladder
| Code | Meaning |
|---|---|
| `L0` | pasted string — anyone can type this |
| `L1` | signed, but does not bind a persona |
| `L2` | persona-bound — a signature that names the handle it belongs to |
| `L3` | fresh — L2 plus a current block height / date, re-verifiable now |

### Source badges (shown wherever a record appears)
`HISTORICAL DATASET` · `FIXTURE` · `ANALYST INPUT` · `LIVE FEED`

---

## 3. Design system

### Concept: one light surface, colour reserved for verdicts
A single light theme throughout — page, sidebar, top bar, provenance bar and cover. There is no dark surface anywhere, and no second theme. Exactly one accent (`#1E3A8A`) carries interaction: active nav, links, primary buttons, the selected tab, and proof-ladder progress. **Colour otherwise appears only on verdict badges.** Counters, statuses, the ladder frame, rule boxes and cost meters are neutral.

### Type — self-hosted, must work offline
| Role | Face | Notes |
|---|---|---|
| All UI | **Inter** | variable 100–900. `--font-sans` |
| IDs, hashes, fingerprints | **JetBrains Mono** | variable 100–800. `--font-mono` |

**No serif. No italic anywhere.** `em`, `i`, `cite` are normalised to `font-style: normal`.
Mono is reserved for machine-produced strings — never used for labels or UI chrome.

**Scale** — root is `16px`, every size below is in `rem`
```
--text-body     1rem       body
--text-label    0.8125rem  labels, uppercase, letter-spacing 0.04em
--text-card     1.25rem    card titles, semibold
--text-page     1.75rem    page title, semibold
--text-counter  2.25rem    counters, tabular-nums
--text-badge    0.875rem   verdict badges
--text-nav      0.9375rem  sidebar items
--text-cover    3rem       cover headline, semibold
--text-lede     1.125rem   hero reason / cover lede
--text-sm       0.875rem · --text-xs 0.8125rem · --text-micro 0.75rem
```
Line-height 1.5 for body. **Nothing below 0.75rem.**

### Colour tokens — the complete set
Declared once in `tokens.css` (the single source of truth) and mirrored 1:1 in `tailwind.config.js`.

```css
/* surfaces */
--color-bg:            #F7F8FA;
--color-surface:       #FFFFFF;
--color-surface-alt:   #F1F5F9;   /* rule box, sunken panels */
--color-border:        #E3E6EB;
--color-border-strong: #CBD5E1;

/* text — no opacity used on any title or body text */
--color-text:   #0F172A;
--color-text-2: #475569;
--color-text-3: #64748B;

/* the single accent */
--color-accent:        #1E3A8A;
--color-accent-hover:  #16306F;
--color-accent-tint:   #EEF2FA;
--color-accent-border: #C7D2E8;

/* verdicts — the only colour in the product */
--color-assert: #15803D;  --color-assert-bg: #E7F4EC;  --color-assert-bd: #BFE0CC;
--color-hold:   #B45309;  --color-hold-bg:   #FBF0E2;  --color-hold-bd:   #EBD3B0;
--color-reject: #B91C1C;  --color-reject-bg: #FBEBEB;  --color-reject-bd: #EEC7C7;
--color-takeover: #B45309;   /* outlined, never filled */
```

**Rule:** no hex colour or px font size may appear outside `tokens.css`. Verify with
`grep -rn "#[0-9A-Fa-f]\{6\}\|font-size:[[:space:]]*[0-9]\+px" *.css *.jsx` — it must return only `tokens.css`.

### Space, radius, motion
```
--space-1 4 · --space-2 8 · --space-3 12 · --space-4 16
--space-5 20 · --space-6 24 · --space-7 32 · --space-8 40
--pad-card 24px   --gap 20px   (8px grid)
--radius 12px     --radius-sm 8px   --radius-pill 999px
--shadow     0 1px 2px rgba(15,23,42,.06)
--shadow-md  0 2px 4px rgba(15,23,42,.06), 0 4px 12px rgba(15,23,42,.06)
--shadow-lg  0 8px 28px rgba(15,23,42,.10)
--motion 200ms    --ease cubic-bezier(0.16, 1, 0.3, 1)
```
Motion is stepwise and short: the proof ladder fills rung by rung, copied items fold into one bundle, ledger rows chain in. **No bounce, no glow**, and `prefers-reduced-motion` disables all of it.

### Icons
Lucide conventions: **18px, 1.5 stroke, `#64748B`**. The prototype inlines geometric SVGs rather than importing Lucide — keep the size, stroke and colour.

---



---

## 4. Shell — full width, no artboard

The app fills the viewport. There is **no fixed frame, no `transform: scale`, no zoom, and no artboard.** A 1600×900 scaled stage existed in an earlier revision and was removed — it letterboxed at every viewport that was not exactly 16:9 and left dead strips. Do not reintroduce it.

```css
html, body, #root { width: 100%; height: 100%; margin: 0; }
```

The shell is one CSS grid:

```css
.app {
  display: grid;
  grid-template-columns: 264px minmax(0, 1fr) 360px;
  min-height: 100vh;
  width: 100%;
}
.app--no-aside { grid-template-columns: 264px minmax(0, 1fr); }
```

```
┌─ topbar (grid-row 1, sticky, 64px) ── brand · nav (+ "More" overflow) · search (⌘K) · presenter · avatar
├─ rail   (col 1, row 2, 264px)  ── case block · workspace · decision · cases · motto
├─ main   (col 2, row 2, 1fr)    ── page content, fills ALL remaining width
├─ aside  (col 3, row 2, 360px)  ── case context: subjects · locked rules · jump links
└─ provenance bar (grid-row 3, full width, ≥52px)
```

**Width rules**
- The main column fills all remaining width. **No `max-width` on the shell or on main.**
- `max-width: 1200px` applies to **text blocks only** (`.text-block`).
- The right column collapses under main below **1280px**; below 900px the rail also hides.

**Nav overflow.** Destinations that do not fit move into a **"More" button** whose menu lists them. The measurement container must never be `overflow: hidden` — doing so makes `clientWidth` under-report and the menu never appears. Measure with a hidden clone at the same font.

**Top bar** is `position: sticky; top: 0` at 64px with a 1px bottom border.

**Provenance bar** is a full-width band on every screen showing a live count by source class (`N records · N historical · N fixture · N live`), the named source references, and the statement that nothing is presented as a live scan and PII is redacted by default. It is a compliance artifact, not decoration. Its text is `0.8125rem` and it must never be squeezed below that — the optional source list drops out below 1500px while the strip itself stays.

---

## 5. The verdict engine — the core, get this right

Rule-based. No weights, no sums, no scalar output. Evaluate each claim independently over its evidence set, in this order:

```
evaluateClaim(claim):

  if no evidence:
    → UNVERIFIED · HOLD · R6
      "Absence is not assent."

  if any evidence.status == CONTRADICTED:
    → CONTRADICTED · REJECT · R1
      Contradiction is terminal. It is never averaged against supporting weight.

  if claim.takeover:
    → claim.status · HOLD · R2
      A valid key with changed behaviour caps at HOLD, whatever the evidence below does.

  if no evidence is VERIFIED or SUPPORTED:
    → UNVERIFIED · HOLD · R6

  bound = evidence where level >= L2 AND status == VERIFIED
  if bound is empty AND every item has cost <= 3:
    → SUPPORTED · HOLD · R5
      Copyable evidence is capped at SUPPORTED and cannot reach ASSERT.

  if bound is non-empty AND no item is QUESTIONABLE:
    → VERIFIED · ASSERT · R4

  otherwise:
    → SUPPORTED · HOLD · R4
```

**Peak proof level** = highest `level` across the claim's evidence.

These rules are the product. They are rendered in the UI as a visible "Locked rules" panel, marked as signed and non-configurable. That is what justifies the absence of a threshold slider.

---

## 6. Components

Every screen is assembled from these. Props and states are exact.

### `<ClaimCard claim claimType onOpen selected dense>`
The centrepiece. Structure:
1. Left spine, 3px, coloured by verdict
2. Header: claim name · question · takeover flag (if set) · verdict chip
3. Body: proof ladder (compact) on the left, status word on the right
4. Summary line (hidden when `dense`)
5. **Rule callout** — the rule code plus the plain-language reason. This is the most important element on the card.
6. Footer counts (`N items`, `N folded bundles`, `N could change verdict`) and an "Open claim" button
7. Copy-origin bundles (hidden when `dense`)

`selected` adds a 2px ink ring. Unopened claims render dashed with `NOT OPENED` and contribute HOLD.

### `<ProofLadder peak compact note>`
Four rungs L0→L3, left to right. Rungs at or below `peak` are lit; the peak rung gets a 2.5px inset bottom rule in assert-green. Each rung shows its code and description. The `note` prop states the ceiling in plain language, e.g. *"Ceiling here is L1 — signed but unbound. L1 cannot carry ASSERT."*

### `<AttackCost cost compact>`
Cost-to-forge, 0–5. A five-bar meter plus the cost in words.
| cost | shown as | level |
|---|---|---|
| 0 | ≈0 · template on every host | COMMON |
| 1 | ≈5 min · no skill, no secret | COPYABLE |
| 2 | ≈1 h · no skill, no secret | CHEAP |
| 3 | ≈2 days · writing skill | MODERATE |
| 4 | requires the original private key | EXPENSIVE |
| 5 | requires forging a signature | INFEASIBLE |

**Cost and strength are separate axes and must stay visibly separate in the layout.** This is the single component no competitor has.

### `<CopyOriginBundle bundle defaultOpen>`
Shows the fold *before* the individual signals: header reads `N→1`, title, and `N signals · one origin`. Expanded, it lists the folded items each tagged `same origin`, then a footer stating the rule and, when relevant, how many other records share that origin (e.g. `seen on 412 records`).

### `<BoilerplateLens text boiler indep raw independent>`
Two modes with a segmented control:
- **Raw** — raw character similarity (the number that misleads)
- **Independent** — template text struck through and excluded

Legend shows both percentages side by side so the drop is visible.

### `<EvidenceRow ev expanded onToggle>`
Collapsed: 3px status rail, kind, proof level, copy origin, title, source badge, date, cost meter, status word, chevron.
Expanded: full detail, a Strength / Proof level / Source grid, the cost breakdown, the copy origin, and a PII line.

### `<MissingEvidence items onCollect collected busy>`
Ranked list. Each row: rank number, the missing item in plain language, `would change HOLD → ASSERT`, a `decisive` tag for tier-1 items, and an **Add to collection** button. Items with no collection route say so instead of offering a dead button. Empty state is a green confirmation, not an empty box.

### `<ContinuityStrip continuity>`
Segmented bar: `solid` (record continuous, behaviour consistent), `gap` (no record — hatched, labelled **`GAP — no evidence`**), plus a violet diamond change-point marker. Axis labels below. **A gap and a change inside the record are different findings and must never be smoothed into "probably the same person".**

### `<StatusWord status>` `<VerdictChip verdict>` `<TakeoverFlag>`
StatusWord is a word with a bottom rule. VerdictChip is the only coloured chip in the product. TakeoverFlag is violet and always paired with HOLD.

### `<PII value revealed onToggle>`
Redacted by default as a striped block. Revealing is a logged action — the component must say so. Reveal is written to the ledger.

### `<ProvenanceStrip scene>` · `<DataBadge source>`
Persistent audit strip, and the inline badge that appears on every evidence record.

---

## 7. Screens

### 7.1 Cover
Split layout. Left: byline `SakshiAstra · SIH26151 · NTRO`, then the headline **"Similarity finds suspects. / Verification proves what the evidence supports."** (second clause italic), then the lede explaining that a weighted score has one direction, and that this platform carries what each item would cost to forge and treats contradiction as terminal. Right: the same link shown as five claims with five verdicts, under the line *"A scalar collapses all five into one number and loses every distinction that matters."* Footer: three compliance statements. Typographic only — no imagery.

### 7.2 Case workspace (claim board)
Header sheet with the case title, question, verdict chip, and four counts (claims opened / ASSERT / HOLD / REJECT) — **never a single number**. Then the caption. Then all five claims in vocabulary order, opened ones as full ClaimCards and unopened ones dashed, with the note *"An unexamined question is not a settled one."*
Right column: Subjects (handle, market, first→last), case metadata, the identity-confirmation notice, the Locked rules panel (R1–R5), and jump links.

### 7.3 Evidence inspector
Two panes: claim list at 356px, detail beside it. Detail order: rule callout → what the claim asks → proof ladder + status → continuity (if any) → copy-origin bundles → evidence rows → missing evidence → **what would falsify this**.
The falsifier block carries the line *"Stated with every claim. A claim that cannot say what would break it is not evidence."*
Also available as a slide-over drawer from the board.

### 7.4 Intake studio
**Step 1 · raw material:** textarea accepting a vendor page, PGP block, wallet declaration or forum post. Copy states that extraction reads what is present and never merges personas.
**Step 2 · what was found:** staged progress (Reading text → Matching against archive → Folding copy-origins), then the extracted items with type, value, proof level and cost meter, then any folded bundle.
Right column: peak proof level ladder, a "what extraction will not do" list, and the intake's own provenance block.

### 7.5 Verification & HOLD queue
Table: case, subject, decisive gap, takeover, opened. Row click selects. Decision panel on the right shows why it is held, the tier-1 blockers ranked, and three actions: **Keep at HOLD · Collect evidence · Reject claim**.
Deliberately **no "confirm identity" control**, with the explanation: attribution to a real person requires the case to reach ASSERT and then two analysts to sign.

### 7.6 Migration timeline
Continuity strip, then evidence placed on the record's own timeline (date, status rail, title, claim, level, source badge, cost), then a "reading the strip" key and the gap-vs-change distinction.

### 7.7 Relationship graph
Force layout, hand-rolled (repulsion + springs + centring, damped, ~190 steps, then normalised to fill the canvas with a 74px margin so small graphs read as well as large ones). Nodes: personas as labelled rectangles, keys/wallets/artifacts as circles. **Edges are coloured by verdict**, dashed for questionable and dotted for contradicted. Hover reveals the edge label. A **"Proven links only"** toggle filters to verified+supported, with the note that *"hiding an edge does not delete the evidence behind it."* Legend bottom-left.

### 7.8 Red-team split view
Two columns separated by a hairline. **Left, SakshiAstra:** the case's claims as verdict lines, with the attacked claim highlighted and the rule that moved it explained. **Right, a typical weighted-score system** — implemented by us, labelled `reference implementation`, never naming another team or product. It shows one big scalar that *rises* with every attack, and per-claim rows reading `n/a · no per-claim status`.
Four attacks, each with a cost meter and a one-line cost note:
| id | Attack | Cost | Ours | Theirs |
|---|---|---|---|---|
| A1 | Copy a published public key | 1 | UNVERIFIED → HOLD | 79% |
| A2 | Copy the vendor description | 1 | QUESTIONABLE → HOLD | 91% |
| A3 | Imitate the operator's writing | 3 | SUPPORTED → HOLD | 94% |
| A4 | Replay a real signed message | 2 | CONTRADICTED → REJECT | 88% |

Footer essays explain why every number on the right only goes up (a sum has one direction) and why ours moves both ways (cost-to-forge per item, folding before verdict, contradiction is terminal).

### 7.9 Dossier & chain of custody
Append-only ledger, one row per action: sequence number, actor, previous hash, this hash, timestamp. Each row linked with a `↳` glyph; the first is `◆`.
Dossier contents table: claim, verdict, peak, items, open gaps. PII block with reveal/redact.
Export: PDF dossier · STIX 2.1 bundle · JSON evidence set. **Every export is held for second-analyst approval** — show the held state with the gate list, and do not release on click.

### 7.10 Overlays
**Command palette (⌘K):** searches loaded evidence only — screens, cases, claims, evidence titles, subjects. Arrow keys and Enter. Footer states the scope.
**Presenter mode:** 9 scenes, each setting a screen plus a case, with a caption bar and a dot indicator. Arrow keys advance. This is what drives the demo video.

### 7.11 Tweaks
Theme (dark/light) · Density (analyst/presentation) · Presenter mode · Comparison panel · direct case jump. Deliberately **no threshold slider**.

---

## 8. Demo scenes

Eight, each a distinct *kind* of evidence problem rather than eight variations of one:

| # | Scene | Verdict | What it proves |
|---|---|---|---|
| 1 | Lookalike vendor | HOLD | 3 matching signals, all from one resale template → counted once |
| 2 | Genuine migration | ASSERT | Same signal count as #1, but reaches L3 |
| 3 | Replayed signature | REJECT | The signature verifies and still proves nothing |
| 4 | Pasted vs signed wallet | HOLD | Ladder jump L0→L2, cost 1→4 |
| 5 | Takeover with change-point | HOLD + violet | Key valid, operator changed |
| 6 | Cert leak vs template favicon | HOLD | Rare signal keeps weight; ubiquitous one cancels to zero |
| 7 | Sock-puppet vouch ring | REJECT | 4 independent accounts → 0 independent witnesses |
| 8 | HOLD resolving to ASSERT | HOLD→ASSERT | Missing evidence named, collected, verdict moves |

Every scene needs, in order: a real question, a verdict, a caption stating what it proves, subjects, claims with evidence + bundles + missing items, a graph, and a ledger.

---

## 9. API contract

`api.js` in the prototype already implements all of this against fixtures. Set `MOCK = false` and point `API_BASE` at the real service — **no screen code changes**, because response shapes are identical either way.

```
GET    /api/cases                        → CaseSummary[]
GET    /api/cases/:id                    → CaseDetail        // claims, evaluated
GET    /api/cases/:id/claims/:claimId     → Claim + claimType
GET    /api/cases/:id/graph              → { nodes[], edges[] }
GET    /api/cases/:id/ledger             → LedgerRow[]       // append-only, hash-chained
POST   /api/cases/:id/intake             → { jobId }
GET    /api/jobs/:jobId                  → { state, result } // polling for async work
POST   /api/cases/:id/collect            → { jobId }
POST   /api/cases/:id/claims/:id/collect → { jobId }
GET    /api/queue                        → QueueItem[]
POST   /api/cases/:id/decision           → { hash, gates[] }
POST   /api/cases/:id/redteam/:attackId  → { ours, theirs, changed, delta }
GET    /api/cases/:id/export?format=pdf|stix|json → { bytes, approval: "pending", gates[] }
POST   /api/cases/:id/export/approve     → { released, approvals[] }
```

### Shapes
```jsonc
// CaseSummary
{ "id": "SA-26151-0001", "scene": "lookalike", "title": "Lookalike vendor",
  "verdict": "HOLD", "claims": 2, "opened": "2026-09-24 11:02", "analyst": "analyst.a" }

// Claim (evaluated — the engine's output is part of the payload)
{ "status": "SUPPORTED", "claimVerdict": "HOLD", "peak": "L1",
  "rule": "R5", "why": "Every item here is copyable — text, style or timing…",
  "takeover": false,
  "summary": "…", "falsify": "A PGP-signed message from merrow_supply that names…",
  "evidence": [ EvidenceItem ], "bundles": [ Bundle ], "missing": [ MissingItem ] }

// EvidenceItem
{ "kind": "Description text",
  "title": "Listing description, 96% character similarity",
  "detail": "…",
  "status": "supported",          // verified|supported|unverified|questionable|contradicted
  "level": "L0", "cost": 1,       // cost 0-5
  "origin": "tpl-pack-v4",        // null when independent
  "originLabel": "Resale template pack v4",
  "source": { "badge": "hist", "label": "HISTORICAL DATASET",
              "ref": "Evolution market/forum dataset (Zenodo)" },
  "found": "2015-06-02" }

// Bundle
{ "id": "tpl-pack-v4", "title": "Resale template pack v4",
  "note": "One origin. Three signals. Counted once.",
  "items": ["Description text — 96% similarity", "…"],
  "occurrencesElsewhere": 412 }

// MissingItem
{ "text": "A PGP-signed message from merrow_supply that names the new handle",
  "effect": "HOLD → ASSERT", "tier": 1, "collectible": true }

// LedgerRow
{ "seq": 4, "act": "Copy-origin folding applied: 3 signals → 1 origin",
  "actor": "system", "hash": "a10f3d84", "prev": "c27e5590",
  "at": "2026-09-24 11:05" }
```

### Error and HOLD states
| State | Behaviour |
|---|---|
| No evidence in a claim | `UNVERIFIED` · HOLD · R6. Render the reason, never an empty panel. |
| Contradiction present | `REJECT`. Terminal. Do not offer "review anyway". |
| Takeover flag | Caps at HOLD regardless of evidence strength. |
| Async job running | Staged progress with named steps; never a bare spinner. |
| Export requested | Held at `approval: "pending"` with the gate list. Do not release. |
| Export without second approval | `403 { "error": "second_analyst_approval_required" }` |
| PII reveal | `200` + ledger entry. Never silent. |
| Search with no match | Name the scope: "No match in this case's loaded records." |

---

## 10. Ethics encoded in the interface

These are UI-level guarantees, not policy documents:

- **Attribution is human.** No control anywhere confirms a real-world identity. Export requires two analyst signatures.
- **Provenance is visible.** Every record badged at source level; the strip is always on screen.
- **PII is redacted by default.** Reveal is logged.
- **Absence is not assent.** A claim with no evidence holds, and says so.
- **Contradiction is terminal.** The UI is incapable of averaging it away.
- **Uncertainty is stated, not smoothed.** Gaps read `GAP — no evidence`; ceilings come with the rule that sets them. Neither is ever smoothed into “probably the same person”.
- **Nothing overclaims.** No live-crawl language, no historical data presented as current, no 100%.

---

---

## 12. Real verification, not asserted verification

**R9 is the load-bearing rule of the backend.** Nothing in this system may report `VERIFIED` because a field said so. Every status is the output of a cryptographic check that could fail, and the failure must be reportable.

### Required checks

| Check | Library | What it must actually do |
|---|---|---|
| OpenPGP signature verification | **pgpy** | Parse the armored block, verify the detached/inline signature against the claimed public key, and **assert the signed body's content** — specifically that it names the handle it is claimed to bind. A signature that verifies over text naming a *different* handle is a replay, not attestation. |
| OpenPGP key parse + fingerprint | **pgpy** | Compute the key fingerprint. Two profiles sharing a fingerprint is a finding; two profiles sharing only a *quoted key block* is a paste. |
| Bitcoin signed message | **secp256k1** (e.g. `coincurve` / `secp256k1-py`) | Recover the public key from the signature and compare it to the address's key hash. Do **not** trust a pasted `(address, signature)` pair. |
| Base58 / bech32 address checksum | any | A malformed address must be rejected before it reaches the graph, not silently stored. |
| Wallet control | chain read | Control is established by a **funds move**, not by an address appearing in text. |

### The replayed-signature case, as an algorithm

```python
def classify_signature(blob, declared_handle) -> Evidence:
    sig = pgpy.PGPSignature.from_blob(blob)          # raises on malformed
    key = load_public_key(blob)

    if not key.verify(blob):                          # real crypto check
        return Evidence(status='CONTRADICTED', level='L0', cost=0)

    body = extract_signed_body(blob)                  # the *signed* text
    named = handles_named_in(body)

    if declared_handle not in named:
        # verifies, but not for this persona
        return Evidence(
            status='questionable', level='L0', cost=0,
            flags=['replayed_signature'],
            note=f'replayed — first seen {first_seen} on {market}',
        )

    if sig.created < profile_first_seen:
        return Evidence(status='questionable', level='L1', cost=1,
                        flags=['replayed_signature'],
                        note='signed before the profile it attests to existed')

    fresh = block_height_at(sig.created) is not None   # L3 requires freshness
    return Evidence(status='verified', level='L3' if fresh else 'L2', cost=4)
```

Three distinct outcomes, and only the last two can carry weight. Note what the first two have in common: **the signature is cryptographically valid in both.** Validity is not the question.

### Forbidden in the backend

- Returning `status: "verified"` from a fixture, seed, or constant.
- Skipping verification when a key is unparseable — an unparseable key is `UNVERIFIED`, not `SUPPORTED`.
- Treating a key block pasted into a page as evidence the page's owner holds the key.
- Any confidence scalar. The API must not expose one; a client must not compute one.

### Tests — required

**Every attack scenario in the red-team panel requires a pytest that asserts its verdict.** A scenario without a passing test is not considered implemented. The tests are the contract; the UI is a rendering of them.

```python
# tests/test_verdicts.py
import pytest

@pytest.mark.parametrize('attack,expected_verdict,expected_peak', [
    ('replay_signature',     'REJECT',  'L1'),
    ('copy_published_key',   'HOLD',    'L0'),
    ('copy_boilerplate',     'HOLD',    'L0'),
    ('imitate_voice',        'HOLD',    'L1'),
])
def test_attack_degrades_verdict(atk, expected_verdict, expected_peak):
    """Each attack must move the targeted claim to the stated verdict."""
```

```python
def test_replayed_signature_has_zero_proof_weight():
    """A replay is excluded from evaluation AND from the peak proof level."""

def test_contradiction_is_terminal():
    """One CONTRADICTED item yields REJECT even against five supporting items."""

def test_takeover_caps_at_hold():
    """A takeover flag yields HOLD even when everything else is VERIFIED L3."""

def test_common_indicator_cannot_raise_a_claim():
    """Cost-0 common-indicator evidence never lifts a claim's status."""

def test_absent_evidence_is_hold_not_supported():
    """An empty evidence set is UNVERIFIED / HOLD (R6)."""

def test_no_scalar_in_any_response():
    """No response body contains a confidence/score/probability field."""
```

The last test is not decoration. It is the regression guard for the one prohibition that a well-meaning future contributor is most likely to break.

---

## 13. Data schemas

### CaseDetail — `GET /api/cases/:id`

```jsonc
{
  "id": "lookalike",
  "n": 1,
  "title": "Lookalike vendor",
  "question": "Two handles selling the same goods on two markets. Same operator?",
  "verdict": "HOLD",                    // ASSERT | HOLD | REJECT
  "takeoverFlag": false,
  "caption": "Three signals match…",    // presenter-mode / board copy
  "case": { "id": "SA-26151-0001", "opened": "2026-09-24 11:02", "analyst": "analyst.a" },
  "subjects": [ { "handle": "merrow_supply", "market": "Agora",
                  "first": "2015-02-08", "last": "2015-04-19" } ],
  "category": ["vendor", "resale-template"],
  "lastScan": "2026-09-24 11:05",
  "nextScans": ["2026-09-25 11:00", "…"],

  "claims": {                            // keyed by claim id; only opened ones appear
    "persona_link": {
      "status": "SUPPORTED",             // engine output, server-computed
      "claimVerdict": "HOLD",
      "peak": "L1",
      "rule": "R5",
      "why": "Every item here is copyable…",
      "takeover": false,
      "summary": "…",                    // what the claim asks
      "falsify": "A PGP-signed message from merrow_supply…",
      "evidence": [ EvidenceItem ],
      "bundles": [ CopyOriginBundle ],
      "missing": [ MissingItem ],
      "continuity": Continuity | null,
      "zeroWeight": [ EvidenceItem ]     // replayed/flagged, excluded from eval
    }
  },

  "suspectLadder": {
    "reached": "low_cost",               // mentioned | low_cost | high_cost | confirmed
    "steps": [ { "id": "confirmed", "label": "Analyst-confirmed",
                 "by": "human", "done": false, "blocked": true } ],
    "note": "The system computes the first three rungs…"
  },

  "graph": {
    "nodes": [ { "id": "a", "label": "merrow_supply", "kind": "persona",
                 "market": "Agora", "x": 0.18, "y": 0.5 } ],
    "edges": [ { "from": "a", "to": "t", "status": "supported", "label": "description" } ]
  },

  "candidateOrigins": [ { "host": "203.0.113.14", "role": "candidate origin",
                          "confidence": "rare-finding match", "findings": 2,
                          "authorised": true,
                          "source": { "badge": "fix", "label": "FIXTURE" },
                          "note": "…" } ],

  "typical": { "signals": 4, "score": 94, "label": "identity confidence",
               "merged": true }          // the COMPARISON column only
}
```

### EvidenceItem

```jsonc
{
  "kind": "Signature",
  "title": "Signed message reposted byte-for-byte",
  "detail": "The signature verifies cryptographically…",
  "status": "questionable",     // verified|supported|unverified|questionable|contradicted
  "level": "L0",                // L0 pasted | L1 signed-unbound | L2 persona-bound | L3 fresh
  "cost": 0,                    // 0-5, cost for an attacker to forge
  "flags": ["replayed_signature"],   // or ["common_indicator"]; [] otherwise
  "note": "replayed — first seen 2016-01-05 on DarkForums",
  "discount": "discounted: common on 68% of services",
  "origin": "sig-replay",       // null when independently observed
  "originLabel": "Replayed block",
  "source": { "badge": "hist", "label": "HISTORICAL DATASET", "ref": "…" },
  "found": "2016-02-11"
}
```

### QueueItem — `GET /api/queue`

```jsonc
{
  "caseId": "SA-26151-0001",
  "scene": "lookalike",
  "title": "Lookalike vendor",
  "opened": "2026-09-24 11:02",
  "analyst": "analyst.a",
  "holdClaims": ["Key Control", "Persona Link"],   // every claim at HOLD, incl. unopened
  "blockers": ["A PGP-signed message from merrow_supply that names the new handle"],
  "decisive": "…",
  "takeover": false,
  "wouldChange": 2                 // count of HOLD claims; used for ranking
}
```
Ordered by `wouldChange` descending. A case with no HOLD claim does not appear.

### getClaimBoard — `GET /api/cases/:id/claims`

Returns all **five** claim types in fixed vocabulary order, whether or not each was opened on this case — the board's job is to show the whole question set.

```jsonc
[{
  "id": "wallet_control",
  "name": "Wallet Control",
  "question": "Does this persona control this wallet?",
  "present": false,                // false = not opened on this case
  "verdict": "HOLD",               // unopened claims contribute HOLD
  "peak": "L0",
  "status": "UNVERIFIED",
  "takeover": false,
  "summary": "No claim opened for this type on this case.",
  "evidenceCount": 0,
  "bundleCount": 0,
  "missing": [ MissingItem ],      // default suggestions when unopened
  "missingCount": 2,
  "decisive": "No claim opened. The gap is that the question has not been examined.",
  "wouldChangeTo": "HOLD → ASSERT"
}]
```

**Requirement (item 5):** every claim held at HOLD — including one that was never opened — must return a ranked `missing` list. An unexamined question still has a cheapest next step, and the board must be able to rank it. `defaultMissing(claimId)` in `api.js` holds those defaults.

---

## 14. Ledger and exports

### Hash chain
`hash = sha256(prevHash + canonicalJSON(entry))`, where canonical JSON sorts keys recursively and emits no whitespace, and `CHAIN_ENVELOPE = ['hash','prev','verified','tampered']` is excluded from the digested body. Genesis prev-hash is 64 zeros.

The **tamper test** flips one bit of one byte of one string field in one entry, then re-verifies. It must fail at that row **and every row after it**, because each hash depends on the one before. If WebCrypto is unavailable, report the chain as having no digest rather than fabricating one.

### Exports — all real files

| Format | Content |
|---|---|
| `json` | `sakshiastra.evidence-set/1` — claims, statuses, falsifiers, evidence, bundles, open gaps, chain |
| `csv` | One row per evidence item **and** per open gap |
| `stix` | STIX 2.1 bundle: `identity` (one per case) + per claim an `indicator` + a `relationship` + an `opinion`, plus a `note` carrying the chain |
| `pdf` | Print-to-PDF report rendered from real case data |

**No export contains a confidence scalar.** STIX objects carry `"confidence": null` deliberately — the spec allows the field, so leaving it null is the explicit statement that this product reports no scalar. `opinion` maps verdict → `agree` / `neutral` / `strongly-disagree`.

### Approval gate
Every export is composed, then **held**. Release requires two signatures — `analyst.a` and `analyst.b`. `POST /api/cases/:id/export/approve` records the second signature and appends a ledger entry. An export attempted without both returns `403 { "error": "second_analyst_approval_required" }`.

### Ledger-bound events
These append an entry carrying the case ID: red-team attack applied, analyst decision, queue decision, export composed, export approved, intake accepted, **intake refused**, PII revealed (with the typed reason), tamper test run, case opened, verdict recorded, collection requested.

---

## 15. Determinism

**No `Math.random()` anywhere.** Every job ID, decision hash and export digest is derived from a seeded 32-bit FNV-1a hash of a stable string:

```js
function fnv1a(str) { let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h >>> 0; }
```

Two runs of the same scenario produce byte-identical IDs and chains, which is what makes the pytest assertions in §12 stable.

## 16. Colour discipline

**Green, amber and red appear only on verdicts. Violet appears only on the takeover flag.**

Status words, evidence rails, cost meters, chain badges and signature states are **neutral ink** (`--ink-1`/`--ink-2`/`--ink-3`). Status is distinguished by weight and rule style, not hue:

`.status-word` → base; `.strong` → 2.5px bottom rule; `.weak` → dashed rule, tertiary ink

This matters because a status and a verdict sit side by side constantly. If both are coloured, the reader stops being able to tell which signal is the conclusion.

On the red-team comparison column, the percentage is captioned **"What a weighted-score system reports"** — never left bare, so it is never mistaken for this product's output.

---

## 17. Build order

1. Tokens + shell + provenance strip + `evaluateClaim` (Section 5)
2. `ClaimCard` + `EvidenceRow` + `MissingEvidence` — these are the product
3. Case workspace, then Evidence inspector
4. Intake studio
5. Red-team split view
6. Queue, timeline, graph, dossier
7. Cover, command palette, presenter mode, tweaks
8. Seed all eight scenes; verify every verdict is reachable and every caption matches what the screen shows

**Definition of done:** no screen can display a scalar identity score; every claim on screen states its rule and its falsifier; and running all four attacks degrades the relevant claim while the reference column only rises.
