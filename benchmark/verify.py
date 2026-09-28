"""Audit preserved benchmark artifacts using only the Python standard library."""
import ast
import csv
import hashlib
import io
import json
from pathlib import Path

root = Path(__file__).resolve().parent
manifest = json.loads((root / 'source_manifest.json').read_text())
for name, expected in manifest['files'].items():
    actual = hashlib.sha256((root / 'experiment_4' / name).read_bytes()).hexdigest()
    assert actual == expected, f'Original artifact changed: {name}'
print('PASS: 10 copied artifacts match their original SHA-256 hashes')

p = root / 'experiment_4'
report = json.loads((p / 'final_blind_validation_report.json').read_text())
thresholds = json.loads((p / 'thresholds.json').read_text())
assert thresholds == report['locked_thresholds']
assert hashlib.sha256((p / 'thresholds.json').read_bytes()).hexdigest() == report['thresholds_sha256']
assert report['thresholds_sha256'] in (p / 'locked_thresholds_sha256.txt').read_text()
assert report['test_split_sha256'] in (p / 'test_split_hash.txt').read_text()
assert report['generator_seed'] == 20260927
print('PASS: threshold lock, seed and saved split-hash metadata agree')

rows = list(csv.DictReader(io.StringIO((p / 'table_final_blind_validation.csv').read_text())))
assert len(rows) == len(report['test_evaluation']) == 30
for csvrow, jsonrow in zip(rows, report['test_evaluation']):
    assert csvrow == {key: str(value) for key, value in jsonrow.items()}
print('PASS: all 30 CSV operating points match the JSON report')

gate = next(r for r in rows if r['System'].startswith('PRAMAAN') and r['Target Cov (Val)'] == '64%')
baseline = next(r for r in rows if r['System'].startswith('B4:') and r['Target Cov (Val)'] == '70%')
assert (gate['Test TP'], gate['Test FP'], gate['Realized Recall (Test)']) == ('67', '0', '67.0%')
assert (baseline['Test TP'], baseline['Test FP'], baseline['Realized Recall (Test)']) == ('67', '30', '67.0%')
assert thresholds[gate['System']]['64%']['threshold'] == 0.95
assert gate['Target Cov (Val)'] != baseline['Target Cov (Val)']
print('PASS: headline 0 vs 30 at 67% observed recall; different validation targets disclosed')

stress = list(csv.DictReader(io.StringIO((p / 'table_4f_continuity_stress.csv').read_text())))
assert next(r for r in stress if r['cohort'] == 'BENIGN_LARGE')['Flagged_Takeover_Rate'] == '1.0'
assert next(r for r in stress if r['cohort'] == 'MALICIOUS_SUBTLE')['Flagged_Takeover_Rate'] == '0.0'
noise = list(csv.DictReader(io.StringIO((p / 'table_4g_multi_seed_noise.csv').read_text())))
assert next(r for r in noise if r['Verifier Error Rate (eta)'] == '10%')['Mean FPR'] == '4.10%'
source = (p / 'run_final_blind_validation.py').read_text()
ast.parse(source)
assert source.index('# Save locked thresholds to disk BEFORE opening TEST') < source.index('thresh = locked_thresholds[s_name][cov_label]')
print('PASS: stress/noise limitations retained; original Python runner parses')
print('5/5 benchmark artifact checks passed (saved-run audit; full experiment not rerun)')
