# SakshiAstra — SIH26151

React JSX prototype with Vite. The interface and ASSERT/HOLD/REJECT, status, and L0–L3 vocabulary are preserved.

The separate [research benchmark](benchmark/README.md) includes the original runner,
saved results, threshold locks, provenance hashes and limitations. Its controlled,
synthetic results are not the React demo's measured performance or real-world rates.
Run `python benchmark/verify.py` to audit the saved artifacts. Python-backend
integration with the React prototype is in development.

The reviewed SIH presentation is in [deliverables](deliverables/).

```sh
npm install
npm run build
npm run preview
```

Open the local URL printed by Vite. `npm run dev` starts the development server. Both `/` and `/SakshiAstra.html` are supported.

```sh
node scripts/check_scenes.mjs
npm test
```

The scene check runs directly in Node and covers all eight scenarios, copy-origin folds, custody hashing, and STIX structure. Browser tests exercise the production build using installed Chrome, including downloads and console checks.

`npm run build` first validates fixture consistency. A mismatch in status,
ledger verdict, proof peak, missing-evidence effect, count, date or caption fails
the build before bundling. The evaluator remains the single source of status.

Application source lives only in `src/`. Browser Babel and the duplicate design handoff were removed. The restyle is complete; the current interface uses the shared design tokens. Tailwind and Framer Motion remain installed. There is no TypeScript conversion.

Collection, reveal, and approval state are held in the prototype session. They persist across navigation but reset on a full page reload.

See `AUDIT.md` for the initial findings and final verification report.

Historical listing text is bundled in `src/data/agora.json` from the supplied
`data/agora_sample.csv` and the selected `template_3` group in
`data/agora_templates.json`. Five generic sample listings are additionally
scrubbed against known vendor mentions. Rebuild the bundle with
`python scripts/bundle_agora.py`; it uses only local files and Python's standard
library. The browser never fetches the source data.

The Boilerplate Lens computes normalised character edit similarity (88% raw,
24% after template removal) for the historical template plus explicitly planted
residual text. These percentages describe listing text, never identity. Category
comes from the sample field with three supporting terms, and never enters the
verdict engine. `terror_financing` stays in classifier labels with no historical
examples. Historical text cites `Agora 2014-15 (Kaggle), text only`; mixed records
show both FIXTURE and HISTORICAL. Keys, wallets, signatures, timelines and attacks
remain FIXTURE.

## Requirement → screen

| Requirement | Screen |
| --- | --- |
| Five separate claims, verdicts and waiting counts | Case workspace |
| Proof ladder, cost to fake, locked rules and replay status | Evidence inspector |
| Copied observations folded into one origin; Boilerplate Lens | Evidence inspector |
| Entity relationships and claim navigation | Relationship graph |
| Migration continuity and 14 March takeover change-point | Migration timeline |
| Text extraction with scope checks | Intake studio |
| Persona identifiers, category terms and listing provenance | Actor profile |
| Ranked evidence collection and consistent timestamps | Collection |
| Current HOLD claims only | Verification queue |
| Planted attacks, weighted-score comparison and case-only reset | Red team |
| JSON, CSV, STIX 2.1 and printable PDF with full provenance | Dossier & custody |
| SHA-256 custody chain, tamper test and export approval | Dossier & custody |
| Eight distinct scenes with shared short captions | Presenter mode |

Raw source data (`data/raw/`) and private key material are excluded from Git.
The scrubbed samples and bundled application JSON remain versioned. Fixture key
labels and signatures are demonstration text, never private key files.
