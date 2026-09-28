# SakshiAstra audit — before changes

The supplied folder is a React JSX prototype loaded by browser Babel. It has no package.json, TypeScript sources, installed project dependencies, or build command. The nested design handoff duplicates these sources.

| Check | Audit finding |
|---|---|
| 1. Viewport | ALREADY OK: html/body/root and app are 100% wide; no fixed app frame. The tweaks panel has an unnecessary scale rule. |
| 2. Presenter | FIX REQUIRED: eight requested scenes followed by a ninth, duplicate lookalike slide. |
| 3. Counters | ALREADY OK: board says “5 claims · 2 opened” and counts verdicts only over opened claims. |
| 4. Replay | FIX REQUIRED: fixture signature already has flag/L0/cost 0/note, but generated replay lacks its note, and contradiction observations incorrectly raise the replay claim peak to L1. |
| 5. Lookalike | FIX REQUIRED: copied key/wallet/template already share a counts-once bundle at cost 0 and HOLD, but constituent costs and evaluation do not consistently enforce the fold. |
| 6. Actions/exports | FIX REQUIRED: graph click is connected; inspector collection uses the wrong claim, resolveDemo is read from the wrong object, collection is not persisted, reveal bypasses logging, approval uses mismatched keys, and STIX contains invalid IDs/properties. Download plumbing already creates files. Ledger hashing also includes sequence inconsistently. |
| 7. Determinism | FIX REQUIRED: one application random call in the tweaks typing animation; business IDs are already seeded. |
| 8. Gap wording | ALREADY OK: prohibited wording absent from application sources. |
| 9. Identity percentage | FIX REQUIRED: 94% appears in the case caption outside the correctly labelled comparison. |
| 10. Build/errors | FIX REQUIRED: npm build does not exist. Need a reproducible build and browser verification. |

No visual redesign is planned. Verdict/status vocabulary and L0–L3 remain unchanged.

# Final fixes after the approved decisions

| Item | Status | Changed files / result |
|---|---|---|
| 1. Viewport | FIXED | `src/app.css`: full viewport width; fixed an implicit mobile grid column and narrow-screen overflow. Browser checks passed at 1920, 1440, 1280, 900, 768, and 390 pixels. |
| 2. Presenter | FIXED | `src/app.jsx`: exactly eight distinct scenes in the requested order; end controls stop at the boundaries. |
| 3 / C. Counter | FIXED | `src/screens.jsx`: “5 claims · 2 opened · 5 on HOLD (3 not yet opened)”; the individual verdict statistics are explicitly counts over opened claims. |
| 4 / E. Replay | FIXED | `src/api.js`, `src/scenes.js`: replay and observations of the same artifact carry no proof; claim is L0 HOLD. Signature has `replayed_signature`, cost 0, and first-seen date + market note. Contradictions never raise peak proof. |
| 5 / F. Lookalike fold | FIXED | `src/api.js`, `src/scenes.js`: key/wallet/template grouped once; group cost is the maximum member cost, never their sum; copied bundle costs 0 and cannot reach ASSERT. |
| 6. Actions | FIXED | `src/app.jsx`, `src/api.js`, `src/screens.jsx`: graph cards open, collection targets the selected claim, wallet and resolve move to ASSERT, reveal requires and logs a reason, case state survives navigation, and approval keys agree. |
| 7 / I. Determinism | FIXED | `src/tweaks_panel.jsx`: deterministic typing delay; no application random calls. Business IDs remain seeded; STIX uses UUIDv5. |
| 8. Gap wording | FIXED | `src/screens.jsx`, `src/api.js`: unopened claim labels/summaries say “GAP — no evidence”; prohibited wording absent from application source. |
| 9 / D. Percentage | FIXED | `src/scenes.js`: caption is “3 signals, 1 origin — counted once.” `src/graph.jsx` keeps percentage output confined to the red-team comparison with “What a weighted-score system reports”. |
| 10 / A. Build | FIXED | `package.json`, `package-lock.json`, `index.html`, `SakshiAstra.html`, `vite.config.js`, `src/main.jsx`: minimal Vite + React JSX project; no browser Babel or TypeScript conversion. Tailwind and Framer Motion installed and unused. |
| B. Duplicate source | FIXED | Deleted `design_handoff_sakshiastra_verification_workbench/` and unused vendored browser libraries; application has one source tree in `src/`. |
| G. Ledger | FIXED | `src/ledger.js`, `src/api.js`, `src/screens.jsx`: sorted compact canonical JSON includes `seq`; `prev_hash` genesis is 64 zeros; real SHA-256 chain verification; one-byte tamper fails at the altered row. |
| H. STIX / exports | FIXED | `src/ledger.js`, `src/api.js`, `src/screens.jsx`: deterministic content UUIDv5 IDs, valid standard identity/note/relationship/opinion properties, one relationship and opinion per opened claim; JSON/CSV/STIX download actual populated files; file digest is real SHA-256. |
| Scene checks | FIXED | `scripts/check_scenes.mjs`: requested eight scenario assertions plus custody and STIX checks; 10/10 passed. |

Validation: dependency installation succeeded; `npm run build` passed; `node scripts/check_scenes.mjs` passed all ten checks; `npm test` passed all ten production browser tests, including 80 screen/scene combinations with no console errors. Preview command was checked separately.

JSX components remain JSX. Responsive corrections and action wiring were made without a visual redesign. The prototype remains fixture-driven; in-memory case mutations last through navigation, not across a full page reload.

# Follow-up logic and consistency fixes

| Item | Status | Changed files / result |
|---|---|---|
| 1. Takeover | FIXED | `src/scenes.js`, `src/presenter.js`, `src/primitives.jsx`: exact narration; key evidence only in Key Control; Same Operator L1 behavioural evidence plus 14 March change-point; surrounding timeline shifted consistently. |
| 2. Hosting | FIXED | `src/api.js`, `src/screens.jsx`, `src/scenes.js`, `src/primitives.jsx`: weakest qualifying route is cert cost 4; favicon discounted; server-status, candidate origin cert and descriptor inconsistency present; common-asset count displayed as 2.3M hosts. |
| 3. Claim badges | FIXED | `src/api.js`, `src/primitives.jsx`, `src/app.jsx`, `src/screens.jsx`, `src/panels.jsx`, `src/ledger.js`: result labels name the decided claim; ring uses its explicit trust-weight result. |
| 4. Migration route | FIXED | `src/api.js`, `src/screens.jsx`: qualifying weakest route is persona-bound signature at cost 4. |
| 5. Wallet ladder | FIXED | `src/primitives.jsx`, `src/app.jsx`, `src/claimcard.jsx`, `src/scenes.js`: dedicated final challenge/funds-move collection changes HOLD to ASSERT and animates ladder to L3. |
| 6. Ring | FIXED | `src/scenes.js`, `src/api.js`, `src/presenter.js`: result is Vouches discounted · trust weight 0; narration matches five graph nodes. |
| 7. Resolve | FIXED | `src/scenes.js`, `src/api.js`: collecting item 1 updates both Persona Link and Key Control from HOLD to ASSERT. |
| 8. Locked rules | FIXED | `src/scenes.js`, `src/app.jsx`: all ten cited rules listed with short titles, including R6 and R8. |
| 9. Provenance | FIXED | `src/scenes.js`, `src/api.js`, `src/ledger.js`: planted and generated records use FIXTURE; market names anonymised as Market A/B/C; exports retain source levels. |
| 10. Ladder labels | FIXED | `src/scenes.js`: distinct pasted, signed-unbound, persona-bound and fresh descriptions for L0–L3. |
| 11. Presenter caption | FIXED | `src/presenter.js`, `src/app.jsx`, `src/app.css`: eight single-line captions, at most 15 words; reserved bottom grid row prevents content overlap. |

Verification expanded in `scripts/check_scenes.mjs` and `tests/audit.spec.js`: 14 scene/data checks and 12 production browser tests, including presenter spacing and wallet ladder animation. No visual redesign.

# Text reduction

Display changes only: compact claim cards with short reasons, collapsed evidence, one inspector question/ladder/rule line, checked/waiting counters and verdict chips, current-case rule titles with remaining rules collapsed, full wrapping names, and concise timestamps. Original scene/claim explanations remain in collapsed presenter notes. Fixture definitions, evaluation logic and scene order were not changed.

`TEXT_CHANGES.md` lists all 76 display-string changes and relocations, including exact claim reasons and board summaries. The browser suite now also checks card word limits, collapsed evidence rows, single question/proof ladder/rule line and wrapping claim tabs. Scene checks remain 14/14; production build passes.

# Local historical listing text

`src/data/agora.json` contains five scrubbed, generic listings and the requested
`template_3` group. `scripts/bundle_agora.py` builds it from supplied local data,
redacting residual vendor mentions and forbidden identifiers. The app imports JSON
at build time. No raw dataset, other template group or real vendor name is bundled.

`src/historical.js` adds clearly fictional listing context, dataset citations and
dual-source metadata. The copied-description comparison remains FIXTURE at L0,
cost 0; its historical template is a separately labelled HISTORICAL record.
All keys, wallets, signatures, dates, attack events and verdict rules are unchanged.
Profile categories and their three text terms come from supplied sample fields.
The classifier retains `terror_financing` with no historical examples.

No similarity manifest was present. Deterministic normalised character edit
similarity gives 88% raw and 24% after exact template removal. The lens begins in
raw mode and supports template strikethrough. The provenance bar lists only the
two requested sources. JSON/CSV retain mixed provenance and dataset citations.

All 14 prior scene checks plus one new historical-text check pass (15/15), including
identifier rejection, dataset citation, exact template group, three supporting
terms, no historical terror-financing examples and category-independent verdicts.
