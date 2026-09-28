import pandas as pd, re, hashlib, json

df = pd.read_csv("data/raw/Agora.csv", encoding="latin-1", on_bad_lines="skip")
df.columns = [c.strip() for c in df.columns]
df = df.rename(columns={"Item Description": "desc"})
df["Category"] = df["Category"].astype(str).str.strip()
print(df["Category"].value_counts().head(40))   # check real category names

def map_cat(c):
    c = c.lower()
    if c.startswith("drugs"): return "drugs"
    if c.startswith("weapons"): return "arms"
    if "accounts" in c or c.startswith("data"): return "stolen_data"
    if "hacking" in c or "software" in c: return "hacking"
    if "money" in c: return "laundering"
    return None                                  # everything else dropped
df["category"] = df["Category"].map(map_cat)

BLOCK = re.compile(r"\b(sex|anal|boob|breast|cum|porn|nude|ssn|dob|"
                   r"registered owner|home address|full name)\b", re.I)
df = df.dropna(subset=["category", "desc", "Item"])
df = df[df["desc"].str.len() > 80]
df = df[~(df["desc"].str.contains(BLOCK) | df["Item"].str.contains(BLOCK))]
df = df[~df["desc"].str.contains(r"vendors? thread|profile\.php|alpha02", case=False)]

def scrub(text, vendor):
    t = str(text)
    t = re.sub(r"\S+@\S+", "[email]", t)
    t = re.sub(r"https?://\S+|\b[a-z2-7]{16,56}\.onion\S*", "[link]", t, flags=re.I)
    t = re.sub(r"\b(1|3|bc1)[a-km-zA-HJ-NP-Z1-9]{25,62}\b", "[wallet]", t)
    t = re.sub(r"-----BEGIN PGP.*?-----END PGP[^-]*-----", "[pgp]", t, flags=re.S)
    t = re.sub(r"(wickr|jabber|icq|telegram|skype|torchat)\s*[:\-]\s*\S+",
               r"\1 [contact]", t, flags=re.I)
    if len(str(vendor)) >= 3:
        t = re.sub(re.escape(str(vendor)), "[vendor]", t, flags=re.I)
    return re.sub(r"\s+", " ", t).strip()[:600]

# 1) balanced listing sample (~250 rows)
sample = (df.groupby("category", group_keys=False)
            .apply(lambda g: g.sample(min(len(g), 50), random_state=26151)))
out = pd.DataFrame({
    "row_id": [hashlib.sha1(f"agora-{i}".encode()).hexdigest()[:10] for i in sample.index],
    "category": sample["category"],
    "title": [scrub(t, v) for t, v in zip(sample["Item"], sample["Vendor"])],
    "description": [scrub(d, v) for d, v in zip(sample["desc"], sample["Vendor"])],
    "source": "Agora 2014-15 (Kaggle), text only",
})
out.to_csv("data/agora_sample.csv", index=False)

# 2) real boilerplate groups: same opening text reused across many listings
df["opening"] = df["desc"].str[:60]
groups = (df.groupby("opening").filter(lambda g: len(g) >= 8)
            .groupby("opening").head(3))
templates = {}
for i, (op, g) in enumerate(groups.groupby("opening")):
    if i >= 5: break
    templates[f"template_{i+1}"] = [scrub(d, v) for d, v in zip(g["desc"], g["Vendor"])]
json.dump(templates, open("data/agora_templates.json", "w"), indent=2)

print(len(out), "rows"); print(out["category"].value_counts())
print(len(templates), "template groups")
