# Needs data/agora_sample.csv, created locally by agoras.py. It is not in the
# repository. The committed src/data/agora.json is the scrubbed output.
"""Build a small, local, identifier-free text bundle from supplied files."""
import csv
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = "Agora 2014-15 (Kaggle), text only"
with (ROOT / 'data/agora_sample.csv').open(encoding='utf-8-sig', newline='') as handle:
    rows = list(csv.DictReader(handle))
templates = json.loads((ROOT / 'data/agora_templates.json').read_text())
group = next((key, values) for key, values in templates.items()
             if values[0].startswith("!!! PLEASE READ !!! Dear Costumer ***ALL ORDER's REQUIERE FE***"))

# Never copy vendor columns into the app. Known names are used only to
# redact residual mentions from the already scrubbed input text.
vendors = set()
raw = ROOT / 'data/raw/Agora.csv'
if raw.exists():
    with raw.open(encoding='latin-1', newline='') as handle:
        vendors = {r.get('Vendor', '').strip() for r in csv.DictReader(handle)}
vendors = sorted((v for v in vendors if len(v) >= 3), key=lambda v: (-len(v), v.lower()))
patterns = [
    r'-----BEGIN PGP[\s\S]*?-----END PGP[^\r\n]*',
    r'[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}',
    r'\b[a-z0-9-]+\.onion\b\S*',
    r'\b[13][a-km-zA-HJ-NP-Z1-9]{25,34}\b',
    r'\bbc1[ac-hj-np-z02-9]{11,87}\b',
    r'https?://\S+',
]

def clean(text):
    for pattern in patterns:
        text = re.sub(pattern, '[redacted]', text, flags=re.I)
    for vendor in vendors:
        text = re.sub(r'(?<![a-z0-9])' + re.escape(vendor) + r'(?![a-z0-9])',
                      '[redacted]', text, flags=re.I)
    return re.sub(r'\s+', ' ', text).strip()

# Explicit, generic listings; no custom orders, personal names or adult material.
selected_ids = ['e13b3d7355', '90aec9e3f7', '4957352e55', 'f548ce81ec', '9dcc989dce']
preferred = {
    'drugs': ['zolpidem', 'sedative', 'insomnia', 'hypnotic'],
    'arms': ['ammo', 'ammunition', 'rounds', 'brick'],
    'hacking': ['keylogger', 'software', 'keyboard', 'stealer'],
    'laundering': ['counterfeit', 'bullion', 'assay', 'packaging'],
    'stolen_data': ['product key', 'accounts', 'warranty', 'lifetime'],
}
listings = []
for row_id in selected_ids:
    row = next(r for r in rows if r['row_id'] == row_id)
    title, description = clean(row['title']), clean(row['description'])
    combined = (title + ' ' + description).lower()
    terms = [t for t in preferred[row['category']] if t in combined][:3]
    assert len(terms) == 3, (row_id, 'three category terms must survive redaction')
    listings.append(dict(row_id=row_id, category=row['category'], title=title,
                         description=description, supporting_terms=terms,
                         source_level='HISTORICAL', source=SOURCE))

template = dict(group_id=group[0], variants=[clean(text) for text in group[1]],
                source_level='HISTORICAL', source=SOURCE)
bundle = dict(dataset=SOURCE, listings=listings, template=template)
strings = [text for r in listings for text in [r['title'], r['description']]] + template['variants']
for text in strings:
    assert not any(re.search(p, text, re.I) for p in patterns[:5]), 'unsafe identifier remains'
    assert not any(re.search(r'(?<![a-z0-9])' + re.escape(v) + r'(?![a-z0-9])', text, re.I)
                   for v in vendors), 'vendor mention remains'
assert not any(r['category'] == 'terror_financing' for r in listings)
target = ROOT / 'src/data/agora.json'
target.parent.mkdir(exist_ok=True)
target.write_text(json.dumps(bundle, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'Bundled {len(listings)} scrubbed listings + {template["group_id"]}; no runtime network required.')
