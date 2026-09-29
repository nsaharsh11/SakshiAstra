# SakshiAstra — build scope and planned integrations

> **Built** means code implemented in this React fixture prototype. **Planned** means an integration or production requirement in development, not a claim that it works today. README.md is the authoritative overview; fixture outcomes are not production cryptographic verification.

## 1. Purpose and scope

SakshiAstra demonstrates claim-by-claim dark-web threat actor attribution for SIH26151. The React 18 + Vite interface evaluates labelled fixture evidence and displays scrubbed Agora 2014–15 listing text; it does not crawl live markets or identify real people automatically.

Built: JSX interface, shared CSS tokens, deterministic fixture rule evaluation, local extraction and collection demonstrations, Boilerplate Lens, custody hashing, exports, and client-side approval state. Planned: FastAPI, pgpy OpenPGP verification, wallet signature checks, DuckDB, ML matchers, authorised Tor collection, Docker, and production transport/release controls.

## 2. Fixed vocabulary

| Verdict | Meaning |
| --- | --- |
| ASSERT | The evidence supports the claim. |
| HOLD | The evidence does not yet support the claim. |
| REJECT | The evidence contradicts the claim. |

TAKEOVER is an outlined amber flag; it keeps the affected Same Operator claim on HOLD. It does not invalidate a separate Key Control claim automatically. Status is a separate axis: VERIFIED, SUPPORTED, UNVERIFIED, QUESTIONABLE, CONTRADICTED.

| Claim ID | Name | Question |
| --- | --- | --- |
| key_control | Key Control | Does this persona hold the private key? |
| wallet_control | Wallet Control | Does this persona control this wallet? |
| persona_link | Persona Link | Are these two handles the same person? |
| hosting_link | Hosting Link | Does this hidden service run on that origin? |
| same_operator | Same Operator | Is the same person still operating it? |

| Level | Concept demonstrated by fixtures |
| --- | --- |
| L0 · pasted | Anyone can type this string. |
| L1 · signed | A signature that does not bind a persona. |
| L2 · persona-bound | A signature naming the handle it belongs to. |
| L3 · fresh | Persona-bound proof plus a current block height/date or fresh challenge. |

Evidence badges distinguish FIXTURE, HISTORICAL and ANALYST INPUT. Live-feed source labels are vocabulary for planned collection, not proof that live collection exists.

## 3. Verification rules

Exact display copy from `src/copy.js`:

| Rule | Copy |
| --- | --- |
| R1 | Contradiction requires REJECT. |
| R2 | Changed behaviour keeps Same Operator on HOLD. |
| R3 | Shared origin counts once. |
| R4 | Persona-bound proof required for ASSERT. |
| R5 | Style alone can't prove. Max SUPPORTED. |
| R6 | No independent proof binds this persona. |
| R7 | Analyst confirms identity. Second analyst approves export. |
| R8 | Replay carries zero proof. |
| R9 | Cryptographic checks required. |
| R10 | Common assets carry zero proof. |

Built: the evaluator recomputes verdicts from fixture evidence, and rules are not user-configurable. Planned: signed production rule policies, actual PGP/wallet evidence verification for R9, and server-enforced approval for R7. No rule-policy signature verification is claimed built.

## 4. Evaluation and proof eligibility

`evaluateClaim` in `src/api.js` is the source of truth. `applyFolds` groups copied evidence before evaluation; each counts-once origin uses its maximum member cost, not a sum.

Replay signatures and observations sharing their origins supply zero positive proof. Context-only/common-indicator observations and zero-cost folded origins are excluded from positive proof; contradicted observations can reject a claim but cannot raise its proof peak.

The evaluator rejects eligible contradictions first, keeps takeover claims on HOLD, and holds claims without verified/supported evidence. Copyable evidence without persona-bound proof stays at most SUPPORTED/HOLD; ASSERT requires verified L2+ proof without remaining questionable evidence. Wallet claims marked `requiresFreshControl` remain HOLD until eligible verified L3 control is collected.

Peak proof is computed over eligible positive evidence, not all observations. Unopened claims are UNVERIFIED/L0/HOLD and carry named collection gaps. Per-claim evaluation and case result labels are distinct; a case label must name the claim it decides.

## 5. Cost to fake

| Cost | Fixture scale |
| --- | --- |
| 0 | Common template; no secret required. |
| 1 | Approximately five minutes; no skill or secret. |
| 2 | Approximately one hour; no skill or secret. |
| 3 | Approximately two days of writing skill. |
| 4 | Requires the original private key. |
| 5 | Requires forging a signature. |

These labels are fixture attack-cost concepts, not measured real-world timings. Strength, cost and source remain separate; cost alone cannot identify an operator.

## 6. Eight scenes

| # | Scene | Current result and locked values |
| --- | --- | --- |
| 1 | Lookalike vendor | Persona Link UNVERIFIED/L0/HOLD; six copied observations fold into four signals, one origin; cost 0; text similarity 88% → 24% after template removal. |
| 2 | Genuine migration | Key Control · ASSERT; qualifying persona-bound signature route cost 4. |
| 3 | Replayed signature | QUESTIONABLE/L0/HOLD; replay and artifact observations carry zero proof; signature cost 0; the block was seen five weeks earlier. |
| 4 | Pasted vs signed wallet | Wallet Control HOLD until fresh signed challenge/funds-move collection reaches L3 · ASSERT. |
| 5 | Takeover with change-point | Key Control · ASSERT; Same Operator L1/HOLD; outlined amber flag; change point 14 March. |
| 6 | Cert leak vs template favicon | Hosting Link · ASSERT; qualifying certificate route cost 4; server-status supports the link; common favicon/banner observations discounted. |
| 7 | Sock-puppet vouch ring | Five graph nodes: vendor, three vouchers, shared key; trust weight 0; contradicted claims REJECT. |
| 8 | HOLD resolving to ASSERT | Collection item 1 moves Persona Link and Key Control from HOLD to ASSERT. |

The red-team comparison uses four attack controls with illustrative weighted-score outputs. Its percentage is explicitly labelled as the comparison system's output, never SakshiAstra's identity confidence. Replay is QUESTIONABLE/L0/HOLD rather than the older REJECT/L1 description; its fixture signature cost is 0 even though the attack control has a separate preparation-cost label.

## 7. Interface and screens

The shell fills the viewport without a scaled artboard. Inter and JetBrains Mono are self-hosted binary assets; system fallbacks are available. `src/tokens.css` defines shared visual tokens, with `tailwind.config.cjs` as the Tailwind configuration; Tailwind and Framer Motion are installed, while current styling uses CSS.

The app exposes dark/light and density controls; the current content surfaces use the shared tokens. Takeover badges are outlined amber; no italic or serif treatment is required. Colour may mark interaction and verdicts; neutral status words use weight and underline treatment.

| Screen | Built behavior |
| --- | --- |
| Case workspace | Five claims; checked/waiting counts; claim-specific result, rule and cost. |
| Evidence inspector | One selected claim question, proof ladder and rule; expandable evidence and collection gaps. |
| Intake studio | Local text recognition, scope refusal and logged fixture extraction. |
| Verification queue | Current HOLD claims, including unopened questions. |
| Migration timeline | Labelled gaps, fixture observations and takeover change point. |
| Relationship graph | Claim navigation and relationship display; no automatic identity merge. |
| Red team | Four planted attack controls, labelled score comparison and case-only reset. |
| Actor profile / Collection | Identifiers, provenance, category terms and collection timestamps. |
| Dossier & custody | Real local hashes and exports, logged PII reveal, client-side approval. |
| Presenter mode | Eight distinct scenes with shared short captions. |

Data/approval state survives navigation but resets on full reload. Screen/case preferences use local storage; there are no scene URL deep links.

## 8. API integration — Planned

Built `api.js` methods resolve local fixtures. `MOCK = false` transport is **Planned**: changing that constant alone does not implement a real service. Endpoint names below describe the proposed integration contract, not deployed routes.

```text
GET    /api/cases
GET    /api/cases/:id
GET    /api/cases/:id/claims/:claimId
GET    /api/cases/:id/graph
GET    /api/cases/:id/ledger
POST   /api/cases/:id/intake
GET    /api/jobs/:jobId
POST   /api/cases/:id/collect
POST   /api/cases/:id/claims/:claimId/collect
GET    /api/queue
POST   /api/cases/:id/decision
POST   /api/cases/:id/redteam/:attackId
GET    /api/cases/:id/export?format=pdf|stix|json|csv
POST   /api/cases/:id/export/approve
```

HTTP errors and server-side release enforcement are **Planned**, including rejection of export without second-analyst approval. Client responses currently model pending/approved states and local errors; they do not enforce an HTTP 403 release boundary.

## 9. Evidence verification — Planned

OpenPGP parsing/fingerprints and verification using pgpy, verification that a signed body names its claimed persona, wallet message-signature checks, address checksums and chain-derived control checks are **Planned**. Fixture VERIFIED fields model their expected outcomes; Web Crypto custody hashing does not validate those signatures.

A replay can contain a valid historical signature while failing to bind the claimed persona. The fixture replay and its observations contribute L0, cost 0, zero proof and HOLD; contradicted evidence remains a separate REJECT path. Freshness and persona binding are requirements for future verifiers, not inferred from a pasted block.

## 10. Data shapes

Built case objects come from `src/scenes.js` with evaluated claims from `src/api.js`. Fields include claim ID, status, `claimVerdict`, eligible `peak`, rule, reasons, evidence, copied bundles, missing evidence, continuity and zero-weight observations. Do not treat historical schema examples as present-day fixture values.

Evidence distinguishes source labels from proof/status and includes origin, cost, flags and timestamps. Markets in planted evidence are anonymised as Market A/B/C; historical listing text is separately credited to Agora. Queue entries name current HOLD claims; unopened board entries say `GAP — no evidence`.

## 11. Custody and exports

Built custody uses `SHA-256(previous_hash + canonicalJSON(entry))`, sorted compact JSON and an included sequence number. Stored metadata is `prev_hash`; the genesis value is 64 zeroes. `hash`, `prev_hash`, `verified` and `tampered` are excluded from the hashed body.

The tamper test changes one byte and verification returns the first failing row; the interface displays that row and subsequent dependent rows as failed. If Web Crypto is unavailable, no digest is fabricated. An independently trusted external anchor is **Planned**; local hashing alone cannot prove that an entire chain was never rewritten.

| Export | Built content |
| --- | --- |
| JSON | `sakshiastra.evidence-set/1`: evaluated claims, evidence, gaps, provenance and chain. |
| CSV | Evidence and open-gap rows, including historical provenance. |
| STIX 2.1 | Case identity, claim note objects, relationships, opinions and a provenance note; `confidence` omitted. |
| PDF | Real case report opened for browser print/save as PDF. |

STIX IDs use content-derived UUIDv5; custody and file digests use SHA-256, not FNV. Verdict opinions map to agree, neutral and strongly-disagree. Approval is **client-side only**: JSON/CSV/STIX files are downloaded before the pending notice, and PDF opens before approval; analyst labels are not cryptographic signatures.

## 12. Build and verification

`npm ci`, `npm run build`, and `npm run preview` run the app. Both `/` and `/SakshiAstra.html` have HTML build entries; Vercel serves `dist` with the Vite framework configuration. The locked Vite version needs Node.js 20.19+ or 22.12+; the requested package engine metadata is `>=18` and is not a guarantee that Node 18 runs Vite.

`prebuild` runs `scripts/check_consistency.mjs` before Vite. Neither Python data script, Playwright nor browser downloads run during the build. Data reproduction is a separate local operation documented in README.md.

Current validation is **26/26 scene/data checks** (`node scripts/check_scenes.mjs`) and **18/18 production browser tests** (`npm test`), using installed Chrome. Production pytest and integration tests are **Planned**; no passing Python backend attack suite is claimed.

Stable business IDs use seeded FNV-1a; fixed fixture chains are reproducible for identical entry bodies. Live action timestamps vary, so whole interactive sessions are not promised byte-identical. The benchmark has its own documented determinism limitations and remains unchanged.

## 13. Data and research

`src/data/agora.json` and `data/agora_templates.json` are committed scrubbed outputs. Raw Agora data and `data/agora_sample.csv` are removed from the cleaned history and ignored locally. `scripts/agoras.py` and `scripts/bundle_agora.py` remain optional regeneration tools with unchanged logic.

The Boilerplate Lens computes character similarity live over historical template text plus planted residuals: 88% raw, 24% after template removal. Categories and their supporting terms do not enter attribution verdicts; `terror_financing` has no historical examples. The separate synthetic research benchmark is not an app performance measurement or a production PGP verifier.

## 14. Ethics and future acceptance criteria

Built safeguards demonstrate source badges, logged PII reveal, stated gaps, per-claim contradictions and human review. Operational use requires authorisation, data minimisation, human sign-off, and consideration of the IT Act 2000 and DPDP Act 2023. Agora-derived text is excluded from the project's MIT grant.

Planned production acceptance requires independently checked PGP/wallet evidence, durable storage, a server-enforced second-analyst release gate and auditable collector scope. Human identity attribution must not be inferred automatically from fixture ASSERT labels. Historical development notes live in `docs/history/` and do not supersede this scope.
