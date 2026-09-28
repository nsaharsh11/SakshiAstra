# SakshiAstra research benchmark

These are original research artifacts copied from `E:\SIH\experiment_4`, with byte hashes recorded in [source_manifest.json](source_manifest.json). The scripts and reports retain their earlier research name, **PRAMAAN**. They evaluate a research verification gate, not the React application's end-to-end performance. The separate Python backend is not integrated into the React demo.

## What the reported numbers mean

The canonical saved run is [final_blind_validation_report.json](experiment_4/final_blind_validation_report.json), with the corresponding [CSV](experiment_4/table_final_blind_validation.csv) and [runner](experiment_4/run_final_blind_validation.py). Its synthetic hard test subset has **100 genuine migrations + 210 adversarial pairs** (seven families, 30 each). The full generated test split also includes 100 unrelated pairs; the headline table reports the hard subset, not all 410 pairs.

At the gate's **64% validation target**, its locked threshold is **0.95**. It resolves **67/100 genuine migrations with 0/210 false attributions** on the saved test run. The gradient-boosting baselines at their **70% validation target** resolve the same **67/100**, with **30/210** false attributions. Thus **0 vs 30 at 67% observed test recall** is supported by the saved table. The validation targets differ: this is a comparison of operating points with matched *observed test recall*, not proof that one identical validation target produced those results. Baseline names and all other operating points remain visible in the original report. At the gate's less conservative 70% target, it makes **60 false attributions**.

The code fits TF-IDF and the classifier on training data, selects thresholds on validation data, saves them before test evaluation, and uses a fixed pretrained MiniLM model. This controlled, synthetic benchmark does **not** establish real-world accuracy, terror-financing detection performance, or production cryptographic verification. The runner uses generated RSA/PSS proofs, not a validated OpenPGP deployment.

## Limitations retained in the published results

- The noise table reports mean false-positive rates of **4.10% at 10% verifier error** and **8.08% at 20% verifier error**. Zero in the headline result is not a universal rate.
- The continuity stress test flags all large benign shifts and misses all subtle malicious shifts in those particular generated cohorts. Its saved AUC is about 0.778.
- Seed 20260927 fixes the scenario generator, but RSA generation/signature salts and timestamps are not deterministic. Original package versions were not recorded. Exact byte-for-byte reruns are not promised.
- The original test-split hash covers IDs and counts, not every feature, text, signature or model artifact. Threshold and copied-file hashes are separately verifiable; this is not independent proof that the test was never inspected.
- The saved report's source commit is recorded for provenance; the imported benchmark is now committed in this repository. Full research execution has not been rerun as part of the presentation edit.

## Audit saved artifacts (no third-party packages)

```sh
python benchmark/verify.py
```

This checks original-file hashes, the threshold lock, JSON/CSV agreement, the exact headline operating points, and the retained failure/stress results.

## Rerun the research experiment

Create a separate Python environment and install `numpy`, `pandas`, `scikit-learn`, `sentence-transformers`, and `cryptography` (see [requirements.txt](requirements.txt)). The first model load downloads `all-MiniLM-L6-v2` unless cached. CPU execution is supported. Run from a **scratch directory**, because the original runner writes an `experiment_4/` directory and should not overwrite the preserved reference artifacts:

```sh
python /absolute/path/to/benchmark/experiment_4/run_final_blind_validation.py
```

The React prototype uses fictional fixture scenarios plus scrubbed **Agora 2014–15 (Kaggle), listing text only**. Its category labels and historical listing text are not benchmark attribution ground truth. No real vendor identities, raw listings, private keys, or databases were added to this benchmark folder.
