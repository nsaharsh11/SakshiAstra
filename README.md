# SakshiAstra — SIH26151

React JSX prototype with Vite. The interface and ASSERT/HOLD/REJECT, status, and L0–L3 vocabulary are preserved.

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

Application source lives only in `src/`. Browser Babel and the duplicate design handoff were removed. Tailwind and Framer Motion are installed but unused, ready for the later restyle round. There is no TypeScript conversion.

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
