import os
import sys
import time
import json
import random
import hashlib
import subprocess
import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Any
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.metrics import roc_auc_score
from sentence_transformers import SentenceTransformer
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes, serialization

# ---------------------------------------------------------------------------
# GLOBAL REPRODUCIBILITY & PROTOCOL METADATA
# ---------------------------------------------------------------------------
GENERATOR_SEED = 20260927
random.seed(GENERATOR_SEED)
np.random.seed(GENERATOR_SEED)

print("=" * 110)
print("SIH26151 FINAL BLIND VALIDATION PROTOCOL")
print("Strict Train -> Validation (Threshold Lock) -> Untouched Test Methodology")
print(f"Master Generator Seed: {GENERATOR_SEED}")
print("=" * 110)

# Save generator seed file immediately
os.makedirs("experiment_4", exist_ok=True)
with open("experiment_4/generator_seed.txt", "w") as f:
    f.write(f"GENERATOR_SEED={GENERATOR_SEED}\nTIMESTAMP={time.strftime('%Y-%m-%d %H:%M:%S')}\n")

# ---------------------------------------------------------------------------
# 1. CRYPTOGRAPHIC PRIMITIVES
# ---------------------------------------------------------------------------
def generate_keypair():
    priv = rsa.generate_private_key(public_exponent=65537, key_size=1024)
    pub = priv.public_key()
    pub_pem = pub.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    ).decode('utf-8')
    fingerprint = hashlib.sha256(pub_pem.encode('utf-8')).hexdigest()[:40].upper()
    return priv, pub, pub_pem, fingerprint

def sign_statement(priv_key, message_str: str) -> str:
    sig = priv_key.sign(
        message_str.encode('utf-8'),
        padding.PSS(
            mgf=padding.MGF1(hashes.SHA256()),
            salt_length=padding.PSS.MAX_LENGTH
        ),
        hashes.SHA256()
    )
    return sig.hex()

def verify_statement(pub_key, message_str: str, sig_hex: str) -> bool:
    try:
        sig_bytes = bytes.fromhex(sig_hex)
        pub_key.verify(
            sig_bytes,
            message_str.encode('utf-8'),
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH
            ),
            hashes.SHA256()
        )
        return True
    except Exception:
        return False

# ---------------------------------------------------------------------------
# 2. SYNTHETIC CORPUS GENERATOR (DISJOINT PARTITIONS)
# ---------------------------------------------------------------------------
CATEGORIES = [
    "Digital Goods & Exploits",
    "OpSec, VPN & Bulletproof",
    "Chemicals & Pharmaceuticals",
    "Counterfeit ID & Documents",
    "Financial & Carding Services"
]

TEMPLATES = [
    "OFFICIAL DISPATCH PROTOCOL: Stealth vacuum sealed mylar. Orders shipped within 24h. Use PGP for address. Escrow enabled.",
    "DIRECT VENDOR BULK SUPPLY: High purity verified product. 100% reship on tracked customs seizure. Never send plaintext details.",
    "EXCLUSIVE EXPLOIT HUB: Clean runtime FUD binaries. Source code included. Support via Jabber OTR only. Fast release.",
    "SECURE DOC SERVICES: High quality holographic UV replication. Fast worldwide dispatch. Multi-sig escrow accepted."
]

BOILERPLATE_DISCLAIMER = "STANDARD FORUM DISCLAIMER: 1. ALL SALES FINAL AFTER ESCROW. 2. PGP ENCRYPT ALL TICKETS. 3. 24H DISPATCH."

def make_listing_text(base_template: str, specific_terms: List[str], drift_noise: float = 0.0, add_boilerplate: bool = False) -> str:
    terms = " ".join(specific_terms)
    text = f"{base_template} {terms} All transactions protected by marketplace escrow."
    if drift_noise > 0.3:
        text = text.replace("OFFICIAL DISPATCH PROTOCOL", "DELIVERY GUIDELINES & POLICIES")
        text = text.replace("Stealth vacuum sealed", "Double vacuum packaging")
        text = text.replace("All transactions protected", "Escrow protection mandatory for buyers")
    if add_boilerplate:
        text += "\n" + BOILERPLATE_DISCLAIMER
    return text

def build_partition_pairs(split_name: str, offset: int, n_genuine: int, n_unrelated: int, n_adv_per_family: int) -> List[Dict[str, Any]]:
    """
    Builds a completely independent, non-overlapping cohort of vendors and adversaries.
    """
    part_pairs = []
    
    # Genuine Migrations (True Positives)
    for i in range(n_genuine):
        idx = offset + i
        cluster_id = f"{split_name}_vendor_cluster_{idx}"
        handle_A = f"Vendor_{split_name}_{idx:04d}"
        handle_B = handle_A if random.random() < 0.75 else f"{handle_A}_v2"
        cat = random.choice(CATEGORIES)
        priv, pub, pem, fp = generate_keypair()
        start_hour = random.randint(8, 16)
        
        tmpl = random.choice(TEMPLATES)
        terms = [f"batch_{random.randint(10, 99)}", "escrow_ready", "priority_track"]
        
        textA = make_listing_text(tmpl, terms, drift_noise=0.0)
        textB = make_listing_text(tmpl, terms, drift_noise=random.choice([0.0, 0.4, 0.6]))
        
        # 64-65% provide bound migration canary
        has_bound_sig = (random.random() < 0.65)
        sig_evidence = []
        if has_bound_sig:
            stmt = f"Official migration statement: I am {handle_A} moving to AlphaBay as {handle_B}. Verified."
            sig_hex = sign_statement(priv, stmt)
            sig_evidence.append({
                "body": stmt,
                "sig": sig_hex,
                "first_seen_market": "AlphaBay",
                "target_handle": handle_B,
                "target_market": "AlphaBay"
            })
            
        part_pairs.append({
            "pair_id": f"{split_name}_GEN_{idx}",
            "split": split_name,
            "cluster_id": cluster_id,
            "type": "GENUINE_MIGRATION",
            "ground_truth_operator": 1,
            "is_hard_negative": False,
            "handle_A": handle_A,
            "handle_B": handle_B,
            "market_A": "Agora",
            "market_B": "AlphaBay",
            "pub_A": pub,
            "pub_B": pub,
            "key_match": 1,
            "text_A": textA,
            "text_B": textB,
            "has_boilerplate": False,
            "start_hour_A": start_hour,
            "start_hour_B": (start_hour + random.randint(-1, 1)) % 24,
            "cat_A": cat,
            "cat_B": cat,
            "sig_evidence": sig_evidence,
            "adversary_family": "NONE_GENUINE"
        })
        
    # Unrelated Pairs (Easy True Negatives)
    for i in range(n_unrelated):
        idx = offset + i
        cluster_id = f"{split_name}_unrel_cluster_{idx}"
        privA, pubA, _, _ = generate_keypair()
        privB, pubB, _, _ = generate_keypair()
        part_pairs.append({
            "pair_id": f"{split_name}_UNREL_{idx}",
            "split": split_name,
            "cluster_id": cluster_id,
            "type": "UNRELATED",
            "ground_truth_operator": 0,
            "is_hard_negative": False,
            "handle_A": f"TraderA_{split_name}_{idx}",
            "handle_B": f"TraderB_{split_name}_{idx}",
            "market_A": "Agora",
            "market_B": "Evolution",
            "pub_A": pubA,
            "pub_B": pubB,
            "key_match": 0,
            "text_A": make_listing_text(random.choice(TEMPLATES), ["item_alpha", "dispatch"]),
            "text_B": make_listing_text(random.choice(TEMPLATES), ["item_beta", "terms"]),
            "has_boilerplate": False,
            "start_hour_A": random.randint(0, 23),
            "start_hour_B": random.randint(0, 23),
            "cat_A": random.choice(CATEGORIES),
            "cat_B": random.choice(CATEGORIES),
            "sig_evidence": [],
            "adversary_family": "NONE_CLEAN_NEG"
        })
        
    # Adversarial Families (Hard Negatives)
    n_adv = n_adv_per_family
    
    # F1: Key Copy Impostor
    for i in range(n_adv):
        idx = offset + i
        privA, pubA, _, _ = generate_keypair()
        part_pairs.append({
            "pair_id": f"{split_name}_F1_{idx}",
            "split": split_name,
            "cluster_id": f"{split_name}_f1_cluster_{idx}",
            "type": "KEY_COPY_IMPOSTOR",
            "ground_truth_operator": 0,
            "is_hard_negative": True,
            "handle_A": f"PrimeSeller_{split_name}_{idx}",
            "handle_B": f"PrimeSeller_{split_name}_Store",
            "market_A": "Agora",
            "market_B": "AlphaBay",
            "pub_A": pubA,
            "pub_B": pubA,
            "key_match": 1,
            "text_A": make_listing_text(TEMPLATES[0], ["genuine_stock"]),
            "text_B": make_listing_text(TEMPLATES[1], ["fake_dispatch"]),
            "has_boilerplate": False,
            "start_hour_A": 10,
            "start_hour_B": 19,
            "cat_A": "Digital Goods & Exploits",
            "cat_B": "Digital Goods & Exploits",
            "sig_evidence": [],
            "adversary_family": "F1_KEY_COPY"
        })

    # F2: Signature Replay
    for i in range(n_adv):
        idx = offset + i
        privA, pubA, _, _ = generate_keypair()
        hA = f"WhaleVendor_{split_name}_{idx}"
        old_stmt = f"Canary 2014: {hA} is active on Agora. Verification only."
        sig_hex = sign_statement(privA, old_stmt)
        part_pairs.append({
            "pair_id": f"{split_name}_F2_{idx}",
            "split": split_name,
            "cluster_id": f"{split_name}_f2_cluster_{idx}",
            "type": "SIGNATURE_REPLAY",
            "ground_truth_operator": 0,
            "is_hard_negative": True,
            "handle_A": hA,
            "handle_B": f"{hA}_Official",
            "market_A": "Agora",
            "market_B": "Hansa",
            "pub_A": pubA,
            "pub_B": pubA,
            "key_match": 1,
            "text_A": make_listing_text(TEMPLATES[2], ["exploit_vault"]),
            "text_B": make_listing_text(TEMPLATES[2], ["exploit_vault"], drift_noise=0.3),
            "has_boilerplate": False,
            "start_hour_A": 14,
            "start_hour_B": 15,
            "cat_A": "OpSec, VPN & Bulletproof",
            "cat_B": "OpSec, VPN & Bulletproof",
            "sig_evidence": [{
                "body": old_stmt,
                "sig": sig_hex,
                "first_seen_market": "Agora",
                "target_handle": hA,
                "target_market": "Agora"
            }],
            "adversary_family": "F2_REPLAY"
        })

    # F3-A: Key + Text Clone (Modified Handle)
    for i in range(n_adv):
        idx = offset + i
        privA, pubA, _, _ = generate_keypair()
        tA = make_listing_text(TEMPLATES[0], ["batch_high_purity", "escrow_ready"])
        part_pairs.append({
            "pair_id": f"{split_name}_F3A_{idx}",
            "split": split_name,
            "cluster_id": f"{split_name}_f3a_cluster_{idx}",
            "type": "KEY_AND_TEXT_CLONE",
            "ground_truth_operator": 0,
            "is_hard_negative": True,
            "handle_A": f"ApexSupplier_{split_name}_{idx}",
            "handle_B": f"ApexSupplier_{split_name}_Direct",
            "market_A": "Agora",
            "market_B": "AlphaBay",
            "pub_A": pubA,
            "pub_B": pubA,
            "key_match": 1,
            "text_A": tA,
            "text_B": tA,
            "has_boilerplate": False,
            "start_hour_A": 11,
            "start_hour_B": 11,
            "cat_A": "Chemicals & Pharmaceuticals",
            "cat_B": "Chemicals & Pharmaceuticals",
            "sig_evidence": [],
            "adversary_family": "F3A_TEXT_CLONE"
        })

    # F3-B: Exact Handle Squatting + Key + Text Clone
    for i in range(n_adv):
        idx = offset + i
        privA, pubA, _, _ = generate_keypair()
        hA = f"GhostLord_{split_name}_{idx}"
        tA = make_listing_text(TEMPLATES[1], ["premium_grade", "instant_dispatch"])
        part_pairs.append({
            "pair_id": f"{split_name}_F3B_{idx}",
            "split": split_name,
            "cluster_id": f"{split_name}_f3b_cluster_{idx}",
            "type": "EXACT_HANDLE_SQUAT_CLONE",
            "ground_truth_operator": 0,
            "is_hard_negative": True,
            "handle_A": hA,
            "handle_B": hA,  # Exact handle squatting!
            "market_A": "Agora",
            "market_B": "AlphaBay",
            "pub_A": pubA,
            "pub_B": pubA,
            "key_match": 1,
            "text_A": tA,
            "text_B": tA,
            "has_boilerplate": False,
            "start_hour_A": 12,
            "start_hour_B": 12,
            "cat_A": "Counterfeit ID & Documents",
            "cat_B": "Counterfeit ID & Documents",
            "sig_evidence": [],
            "adversary_family": "F3B_EXACT_SQUAT"
        })

    # F4: Boilerplate Template Collusion
    for i in range(n_adv):
        idx = offset + i
        privA, pubA, _, _ = generate_keypair()
        privB, pubB, _, _ = generate_keypair()
        part_pairs.append({
            "pair_id": f"{split_name}_F4_{idx}",
            "split": split_name,
            "cluster_id": f"{split_name}_f4_cluster_{idx}",
            "type": "TEMPLATE_CLONE",
            "ground_truth_operator": 0,
            "is_hard_negative": True,
            "handle_A": f"ShopA_{split_name}_{idx}",
            "handle_B": f"ShopB_{split_name}_{idx}",
            "market_A": "Agora",
            "market_B": "Evolution",
            "pub_A": pubA,
            "pub_B": pubB,
            "key_match": 0,
            "text_A": make_listing_text("CUSTOM SPEC A", [f"item_{idx}"], add_boilerplate=True),
            "text_B": make_listing_text("CUSTOM SPEC B", [f"item_{idx}"], add_boilerplate=True),
            "has_boilerplate": True,
            "start_hour_A": 12,
            "start_hour_B": 12,
            "cat_A": "Chemicals & Pharmaceuticals",
            "cat_B": "Digital Goods & Exploits",
            "sig_evidence": [],
            "adversary_family": "F4_TEMPLATE"
        })

    # F5: Stolen Private Key
    for i in range(n_adv):
        idx = offset + i
        privA, pubA, _, _ = generate_keypair()
        hA = f"MasterVendor_{split_name}_{idx}"
        hB = f"MasterVendor_{split_name}_Alpha"
        stmt = f"Official migration statement: I am {hA} moving to AlphaBay as {hB}. Verified."
        sig_hex = sign_statement(privA, stmt)
        part_pairs.append({
            "pair_id": f"{split_name}_F5_{idx}",
            "split": split_name,
            "cluster_id": f"{split_name}_f5_cluster_{idx}",
            "type": "COMPROMISED_KEY_THEFT",
            "ground_truth_operator": 0,
            "is_hard_negative": True,
            "handle_A": hA,
            "handle_B": hB,
            "market_A": "Agora",
            "market_B": "AlphaBay",
            "pub_A": pubA,
            "pub_B": pubA,
            "key_match": 1,
            "text_A": make_listing_text(TEMPLATES[0], ["pharma_purity"]),
            "text_B": "ALL NEW MANAGEMENT!! FAST ESCROW DISPATCH ONLY!! NO MORE OLD POLICY!! PGP MESSAGE FOR DETAILS!!",
            "has_boilerplate": False,
            "start_hour_A": 9,
            "start_hour_B": 22,
            "cat_A": "Chemicals & Pharmaceuticals",
            "cat_B": "Digital Goods & Exploits",
            "sig_evidence": [{
                "body": stmt,
                "sig": sig_hex,
                "first_seen_market": "AlphaBay",
                "target_handle": hB,
                "target_market": "AlphaBay"
            }],
            "adversary_family": "F5_KEY_THEFT"
        })

    # F6: Account Sale / Exit Scam
    for i in range(n_adv):
        idx = offset + i
        privA, pubA, _, _ = generate_keypair()
        hA = f"OldGuard_{split_name}_{idx}"
        stmt = f"Official migration statement: I am {hA} moving to Evolution. Verified."
        sig_hex = sign_statement(privA, stmt)
        part_pairs.append({
            "pair_id": f"{split_name}_F6_{idx}",
            "split": split_name,
            "cluster_id": f"{split_name}_f6_cluster_{idx}",
            "type": "ACCOUNT_SALE_TAKEOVER",
            "ground_truth_operator": 0,
            "is_hard_negative": True,
            "handle_A": hA,
            "handle_B": hA,
            "market_A": "Agora",
            "market_B": "Evolution",
            "pub_A": pubA,
            "pub_B": pubA,
            "key_match": 1,
            "text_A": make_listing_text(TEMPLATES[2], ["exploit_code_clean"]),
            "text_B": "STORE UNDER NEW OWNERSHIP. BULK DUMPS & CARDING TRACKS. FE MANDATORY. INSTANT BTC ONLY.",
            "has_boilerplate": False,
            "start_hour_A": 14,
            "start_hour_B": 2,
            "cat_A": "OpSec, VPN & Bulletproof",
            "cat_B": "Financial & Carding Services",
            "sig_evidence": [{
                "body": stmt,
                "sig": sig_hex,
                "first_seen_market": "Evolution",
                "target_handle": hA,
                "target_market": "Evolution"
            }],
            "adversary_family": "F6_ACCOUNT_SALE"
        })
        
    return part_pairs

print("\n[Phase 1] Synthesizing Independent Splits (TRAIN, VALIDATION, TEST)...")
# TRAIN: 100 genuine, 100 unrelated, 15 F1 key copy
train_pairs = build_partition_pairs("TRAIN", offset=0, n_genuine=100, n_unrelated=100, n_adv_per_family=15)
# Keep only F1 for train hard negatives to mirror realistic training where defender knows basic key copy
train_pairs = [p for p in train_pairs if (p["ground_truth_operator"] == 1) or (p["type"] == "UNRELATED") or (p["adversary_family"] == "F1_KEY_COPY")]

# VALIDATION: 100 genuine, 100 unrelated, 30 per adversarial family
val_pairs = build_partition_pairs("VAL", offset=1000, n_genuine=100, n_unrelated=100, n_adv_per_family=30)

# TEST: 100 genuine, 100 unrelated, 30 per adversarial family (Completely fresh, unseen entities)
test_pairs = build_partition_pairs("TEST", offset=2000, n_genuine=100, n_unrelated=100, n_adv_per_family=30)

print(f"Dataset generated: Train={len(train_pairs)}, Validation={len(val_pairs)}, Test={len(test_pairs)}")

# Compute test split hash to guarantee it remains completely untouched
test_summary_str = f"N={len(test_pairs)}:" + ":".join([p["pair_id"] for p in test_pairs])
test_hash = hashlib.sha256(test_summary_str.encode('utf-8')).hexdigest()
with open("experiment_4/test_split_hash.txt", "w") as f:
    f.write(f"TEST_SPLIT_SHA256={test_hash}\nPAIR_COUNT={len(test_pairs)}\n")
print(f"Locked Test Split SHA-256: {test_hash}")

# ---------------------------------------------------------------------------
# 3. FEATURE EXTRACTION PIPELINE
# ---------------------------------------------------------------------------
print("\n[Phase 2] Computing Transformer & Forensic Stylometry Features...")

sbert_model = SentenceTransformer("all-MiniLM-L6-v2")

all_pairs = train_pairs + val_pairs + test_pairs
all_texts_A = [p["text_A"] for p in all_pairs]
all_texts_B = [p["text_B"] for p in all_pairs]

embs_A = sbert_model.encode(all_texts_A, batch_size=64, show_progress_bar=False)
embs_B = sbert_model.encode(all_texts_B, batch_size=64, show_progress_bar=False)

# Fit TF-IDF on TRAIN corpus ONLY to avoid data contamination
train_corpus = [p["text_A"] for p in train_pairs] + [p["text_B"] for p in train_pairs]
tfidf_word = TfidfVectorizer(max_features=500, stop_words="english").fit(train_corpus)
tfidf_char = TfidfVectorizer(max_features=1000, analyzer="char", ngram_range=(3, 5)).fit(train_corpus)

def compute_cosine(v1, v2):
    dot = np.dot(v1, v2)
    norm1, norm2 = np.linalg.norm(v1), np.linalg.norm(v2)
    return float(dot / (norm1 * norm2)) if norm1 > 0 and norm2 > 0 else 0.0

def levenshtein_sim(s1, s2):
    from difflib import SequenceMatcher
    return SequenceMatcher(None, s1.lower(), s2.lower()).ratio()

rows = []
for idx, p in enumerate(all_pairs):
    sim_ab = compute_cosine(embs_A[idx], embs_B[idx])
    sim_aa = compute_cosine(embs_A[idx], embs_A[idx])
    sim_bb = compute_cosine(embs_B[idx], embs_B[idx])
    vendorlink_norm_sim = float((2.0 * sim_ab) / (sim_aa + sim_bb))
    
    wA = tfidf_word.transform([p["text_A"]]).toarray()[0]
    wB = tfidf_word.transform([p["text_B"]]).toarray()[0]
    cA = tfidf_char.transform([p["text_A"]]).toarray()[0]
    cB = tfidf_char.transform([p["text_B"]]).toarray()[0]
    
    word_cos = compute_cosine(wA, wB)
    char_cos = compute_cosine(cA, cB)
    stylometry_sim = (word_cos + char_cos) / 2.0
    
    handle_sim = levenshtein_sim(p["handle_A"], p["handle_B"])
    time_diff = abs(p["start_hour_A"] - p["start_hour_B"])
    time_overlap = max(0.0, 1.0 - (time_diff / 12.0))
    cat_match = 1.0 if p["cat_A"] == p["cat_B"] else 0.0
    
    # Cryptographic Evidence Verification
    has_sig = 1.0 if len(p["sig_evidence"]) > 0 else 0.0
    sig_valid = 0.0
    crypto_grade = 0
    is_bound_sig = False
    is_replay_sig = False
    
    if p["key_match"] == 1:
        crypto_grade = 1  # L1: Key match alone (unverified possession)
        for sig_item in p["sig_evidence"]:
            is_valid = verify_statement(p["pub_B"], sig_item["body"], sig_item["sig"])
            if is_valid:
                sig_valid = 1.0
                is_bound_sig = (sig_item["target_handle"] == p["handle_B"]) and (sig_item["target_market"] == p["market_B"])
                is_replay_sig = (sig_item["first_seen_market"] != p["market_B"])
                if is_valid and is_bound_sig and not is_replay_sig:
                    crypto_grade = 3  # L3: Bound signature verified
                    break
                elif is_valid:
                    crypto_grade = 2  # L2: Replayed / unbound
                    
    rows.append({
        "pair_id": p["pair_id"],
        "split": p["split"],
        "cluster_id": p["cluster_id"],
        "type": p["type"],
        "adversary_family": p["adversary_family"],
        "ground_truth_operator": p["ground_truth_operator"],
        "is_hard_negative": p["is_hard_negative"],
        "handle_A": p["handle_A"],
        "handle_B": p["handle_B"],
        "key_match": p["key_match"],
        "handle_sim": handle_sim,
        "word_cos": word_cos,
        "char_cos": char_cos,
        "stylometry_sim": stylometry_sim,
        "vendorlink_norm_sim": vendorlink_norm_sim,
        "time_overlap": time_overlap,
        "cat_match": cat_match,
        "has_sig": has_sig,
        "sig_valid": sig_valid,
        "crypto_grade": crypto_grade,
        "is_bound_sig": is_bound_sig,
        "is_replay_sig": is_replay_sig,
        "has_boilerplate": p["has_boilerplate"]
    })

df = pd.DataFrame(rows)

train_df = df[df["split"] == "TRAIN"].copy()
val_df = df[df["split"] == "VAL"].copy()
test_df = df[df["split"] == "TEST"].copy()

# Focus adversarial evaluation on Genuine Migrations vs Hard Negatives
val_hard_df = val_df[(val_df["ground_truth_operator"] == 1) | (val_df["is_hard_negative"] == True)].copy()
test_hard_df = test_df[(test_df["ground_truth_operator"] == 1) | (test_df["is_hard_negative"] == True)].copy()

print(f"Adversarial Hard Sets: Val={len(val_hard_df)} (100 Pos, {len(val_hard_df)-100} Neg), Test={len(test_hard_df)} (100 Pos, {len(test_hard_df)-100} Neg)")

# ---------------------------------------------------------------------------
# 4. TRAIN BASELINE MODELS ON TRAIN ONLY
# ---------------------------------------------------------------------------
print("\n[Phase 3] Fitting Supervised Baseline Models on TRAIN...")

std_features = ["key_match", "handle_sim", "word_cos", "char_cos", "time_overlap", "cat_match"]
b4_matcher = HistGradientBoostingClassifier(random_state=GENERATOR_SEED, max_iter=100)
b4_matcher.fit(train_df[std_features], train_df["ground_truth_operator"])

grade_features = std_features + ["crypto_grade"]
b8_matcher = HistGradientBoostingClassifier(random_state=GENERATOR_SEED, max_iter=100)
b8_matcher.fit(train_df[grade_features], train_df["ground_truth_operator"])

# Score validation set
val_hard_df["score_B0"] = val_hard_df["key_match"].astype(float)
val_hard_df["score_B5_Transformer"] = val_hard_df["vendorlink_norm_sim"].astype(float)
val_hard_df["score_B4_Matcher"] = b4_matcher.predict_proba(val_hard_df[std_features])[:, 1]
val_hard_df["score_B8_Grade"] = b8_matcher.predict_proba(val_hard_df[grade_features])[:, 1]

# Score test set (scores generated, but NOT used for threshold selection!)
test_hard_df["score_B0"] = test_hard_df["key_match"].astype(float)
test_hard_df["score_B5_Transformer"] = test_hard_df["vendorlink_norm_sim"].astype(float)
test_hard_df["score_B4_Matcher"] = b4_matcher.predict_proba(test_hard_df[std_features])[:, 1]
test_hard_df["score_B8_Grade"] = b8_matcher.predict_proba(test_hard_df[grade_features])[:, 1]

# ---------------------------------------------------------------------------
# 5. CLAIM-SPECIFIC GATE EVALUATION
# ---------------------------------------------------------------------------
def evaluate_gate(row, use_continuity: bool = True, noise: float = 0.0) -> Dict[str, Any]:
    grade = row["crypto_grade"]
    has_boilerplate = row["has_boilerplate"]
    style_sim = row["stylometry_sim"]
    time_ol = row["time_overlap"]
    cand_score = row["score_B4_Matcher"]
    
    if noise > 0.0 and random.random() < noise:
        has_boilerplate = False
        if grade in [1, 2]: grade = 3
        
    if cand_score < 0.30:
        return {"decision": "REJECT", "key_control": "UNVERIFIED", "operator": "DISCONTINUOUS", "gate_score": cand_score * 0.1}
        
    if grade == 1:
        return {"decision": "HOLD", "key_control": "UNVERIFIED_COPY", "operator": "AMBIGUOUS", "gate_score": 0.45}
    elif grade == 2:
        return {"decision": "HOLD", "key_control": "REPLAYED", "operator": "AMBIGUOUS", "gate_score": 0.40}
    elif grade == 3:
        if use_continuity and (style_sim < 0.35 or time_ol < 0.20):
            return {"decision": "HOLD", "key_control": "VERIFIED", "operator": "SUSPECTED_THEFT_OR_SALE", "gate_score": 0.48}
        else:
            return {"decision": "ASSERT", "key_control": "VERIFIED", "operator": "SUPPORTED", "gate_score": 0.95}
    else:
        if has_boilerplate:
            return {"decision": "HOLD", "key_control": "NONE", "operator": "SHARED_TEMPLATE", "gate_score": 0.35}
        elif cand_score >= 0.85 and style_sim >= 0.70:
            return {"decision": "ASSERT", "key_control": "NONE", "operator": "STRONG_BEHAVIORAL", "gate_score": cand_score}
        else:
            return {"decision": "HOLD", "key_control": "NONE", "operator": "AMBIGUOUS", "gate_score": cand_score * 0.5}

# Compute gate scores on validation and test
val_hard_df["pramaan_out"] = [evaluate_gate(row, use_continuity=True) for _, row in val_hard_df.iterrows()]
val_hard_df["score_PRAMAAN"] = [g["gate_score"] for g in val_hard_df["pramaan_out"]]

test_hard_df["pramaan_out"] = [evaluate_gate(row, use_continuity=True) for _, row in test_hard_df.iterrows()]
test_hard_df["score_PRAMAAN"] = [g["gate_score"] for g in test_hard_df["pramaan_out"]]

# ---------------------------------------------------------------------------
# 6. BLIND THRESHOLD CALIBRATION ON VALIDATION ONLY
# ---------------------------------------------------------------------------
print("\n[Phase 4] Calibrating Thresholds Exclusively on VALIDATION Set...")

TARGET_COVERAGES = [0.40, 0.50, 0.60, 0.64, 0.70, 0.80]

systems = [
    ("B0: Naive Key Match", "score_B0"),
    ("B5: Transformer Text Baseline", "score_B5_Transformer"),
    ("B4: Gradient Boosting Alone", "score_B4_Matcher"),
    ("B8: GradBoost + Grade Feature", "score_B8_Grade"),
    ("PRAMAAN: Claim-Specific Verification Gate", "score_PRAMAAN")
]

val_y = val_hard_df["ground_truth_operator"].values
val_pos_idx = np.where(val_y == 1)[0]
N_VAL_POS = len(val_pos_idx)  # 100

locked_thresholds = {}

for s_name, col in systems:
    s_scores = val_hard_df[col].values
    pos_scores = s_scores[val_pos_idx]
    sorted_pos = np.sort(pos_scores)[::-1]
    
    locked_thresholds[s_name] = {}
    for cov in TARGET_COVERAGES:
        target_k = int(round(cov * N_VAL_POS))
        # Pick threshold on validation set
        threshold_val = float(sorted_pos[target_k - 1])
        # Measure realized coverage on validation
        val_realized = float(np.sum(s_scores[val_pos_idx] >= threshold_val) / N_VAL_POS)
        locked_thresholds[s_name][f"{int(cov*100)}%"] = {
            "target_coverage": cov,
            "threshold": threshold_val,
            "validation_realized_coverage": val_realized
        }

# Save locked thresholds to disk BEFORE opening TEST
with open("experiment_4/thresholds.json", "w") as f:
    json.dump(locked_thresholds, f, indent=2)

thresholds_bytes = open("experiment_4/thresholds.json", "rb").read()
thresholds_sha = hashlib.sha256(thresholds_bytes).hexdigest()
with open("experiment_4/locked_thresholds_sha256.txt", "w") as f:
    f.write(f"THRESHOLDS_SHA256={thresholds_sha}\n")

# Get git commit hash if available
git_commit_hash = "N/A"
try:
    git_commit_hash = subprocess.check_output(["git", "rev-parse", "HEAD"], text=True).strip()
except Exception:
    pass
with open("experiment_4/git_commit.txt", "w") as f:
    f.write(f"GIT_COMMIT={git_commit_hash}\n")

print(f"Thresholds locked and saved. SHA-256: {thresholds_sha}")
print(f"Git commit snapshot: {git_commit_hash}")

# ---------------------------------------------------------------------------
# 7. UNTOUCHED TEST SET EVALUATION
# ---------------------------------------------------------------------------
print("\n" + "=" * 110)
print("PHASE 5: UNTOUCHED TEST SET EVALUATION WITH LOCKED THRESHOLDS")
print("Metric Definitions:")
print("  - Recall / Realized Coverage = TP / N_pos (Sensitivity)")
print("  - FPR (False Positive Rate)  = FP / N_neg (Proportion of hard negatives incorrectly asserted)")
print("  - FDR (False Discovery Rate) = FP / (TP + FP) = 1 - Precision")
print("  - Precision                  = TP / (TP + FP)")
print("=" * 110)

test_y = test_hard_df["ground_truth_operator"].values
TOTAL_TEST_POS = np.sum(test_y == 1)      # 100
TOTAL_TEST_NEG = np.sum(test_y == 0)      # 210

test_results = []

for cov in TARGET_COVERAGES:
    cov_label = f"{int(cov*100)}%"
    for s_name, col in systems:
        thresh = locked_thresholds[s_name][cov_label]["threshold"]
        s_scores = test_hard_df[col].values
        
        # Binary assertion decision under locked validation threshold
        asserted = (s_scores >= thresh)
        
        tp = int(np.sum(asserted & (test_y == 1)))
        fp = int(np.sum(asserted & (test_y == 0)))
        
        recall = tp / TOTAL_TEST_POS
        fpr = fp / TOTAL_TEST_NEG
        prec = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        fdr = fp / (tp + fp) if (tp + fp) > 0 else 0.0
        
        fp_squats = int(np.sum(asserted & (test_hard_df["adversary_family"] == "F3B_EXACT_SQUAT").values))
        fp_replays = int(np.sum(asserted & (test_hard_df["adversary_family"] == "F2_REPLAY").values))
        fp_templates = int(np.sum(asserted & (test_hard_df["adversary_family"] == "F4_TEMPLATE").values))
        fp_theft = int(np.sum(asserted & (test_hard_df["adversary_family"] == "F5_KEY_THEFT").values))
        fp_sale = int(np.sum(asserted & (test_hard_df["adversary_family"] == "F6_ACCOUNT_SALE").values))
        
        test_results.append({
            "Target Cov (Val)": cov_label,
            "Locked Thresh": f"{thresh:.4f}",
            "System": s_name,
            "Test TP": tp,
            "Realized Recall (Test)": f"{recall*100:.1f}%",
            "Test FP": fp,
            "FPR (FP/N_neg)": f"{fpr*100:.1f}%",
            "Precision": f"{prec*100:.1f}%",
            "FDR (1-Prec)": f"{fdr*100:.1f}%",
            "Exact Squats (F3B)": f"{fp_squats}/30",
            "Templates (F4)": f"{fp_templates}/30",
            "Replays (F2)": f"{fp_replays}/30",
            "Key Theft (F5)": f"{fp_theft}/30",
            "Account Sale (F6)": f"{fp_sale}/30"
        })

df_blind_test = pd.DataFrame(test_results)
print("\n--- [TABLE 4E: FINAL BLIND VALIDATION RESULTS (UNTOUCHED TEST SET)] ---")
print(df_blind_test.to_string(index=False))

# ---------------------------------------------------------------------------
# 8. EXPERIMENT 4F: CONTINUITY STRESS TEST (BENIGN DRIFT VS. MALICIOUS TAKEOVER)
# ---------------------------------------------------------------------------
print("\n" + "=" * 110)
print("EXPERIMENT 4F: CONTINUITY STRESS TEST (SPECTRUM OF BEHAVIORAL DRIFT)")
print("Evaluating detector failure boundary across subtle, medium, and large changes")
print("=" * 110)

drift_specs = [
    ("BENIGN_SMALL", 1, 0.1, 1),
    ("BENIGN_MEDIUM", 1, 0.3, 3),
    ("BENIGN_LARGE", 1, 0.6, 6),
    ("MALICIOUS_SUBTLE", 0, 0.2, 2),
    ("MALICIOUS_MEDIUM", 0, 0.4, 5),
    ("MALICIOUS_LARGE", 0, 0.8, 10)
]

stress_cases = []
for label, is_operator, drift, dt in drift_specs:
    for i in range(30):
        priv, pub, pem, fp = generate_keypair()
        handle = f"StressVendor_{label}_{i}"
        stmt = f"Migration canary: {handle} moving to Evolution."
        sig_hex = sign_statement(priv, stmt)
        
        tA = make_listing_text(TEMPLATES[0], ["special_supply", "verified"])
        if is_operator:
            tB = make_listing_text(TEMPLATES[0], ["special_supply", "verified"], drift_noise=drift)
        else:
            if drift < 0.3:
                tB = make_listing_text(TEMPLATES[0], ["special_supply", "verified_escrow"], drift_noise=0.25)
            else:
                tB = f"NEW OPERATOR MANAGING {handle}. Fast dispatch. FE only."
                
        wA = tfidf_word.transform([tA]).toarray()[0]
        wB = tfidf_word.transform([tB]).toarray()[0]
        style = compute_cosine(wA, wB)
        time_ol = max(0.0, 1.0 - (dt / 12.0))
        
        continuity_score = 0.60 * style + 0.40 * time_ol
        
        stress_cases.append({
            "cohort": label,
            "is_same_operator": is_operator,
            "stylometry_sim": style,
            "time_overlap": time_ol,
            "continuity_score": continuity_score,
            "flagged_as_takeover": (continuity_score < 0.55)
        })

df_stress = pd.DataFrame(stress_cases)
stress_summary = df_stress.groupby("cohort").agg(
    Mean_Style=("stylometry_sim", "mean"),
    Mean_TimeOverlap=("time_overlap", "mean"),
    Mean_ContinuityScore=("continuity_score", "mean"),
    Flagged_Takeover_Rate=("flagged_as_takeover", "mean")
).reset_index()

stress_auc = roc_auc_score(df_stress["is_same_operator"], df_stress["continuity_score"])

print("\n--- [TABLE 4F: CONTINUITY STRESS SPECTRUM RESULTS] ---")
print(stress_summary.to_string(index=False, float_format=lambda x: f"{x:.4f}"))
print(f"\nContinuity Detector Discrimination ROC-AUC: {stress_auc:.4f}")

# ---------------------------------------------------------------------------
# 9. EXPERIMENT 4G: MULTI-SEED VERIFIER NOISE EVALUATION (50 RUNS PER NOISE)
# ---------------------------------------------------------------------------
print("\n" + "=" * 110)
print("EXPERIMENT 4G: MULTI-SEED VERIFIER NOISE ROBUSTNESS (50 RUNS PER LEVEL)")
print("Reporting Mean FPR and 95% Confidence Intervals over 50 Monte Carlo Seeds")
print("=" * 110)

N_SEEDS = 50
noise_levels = [0.0, 0.10, 0.20, 0.30, 0.40]
noise_summary = []

for eta in noise_levels:
    fprs = []
    precs = []
    
    for s in range(N_SEEDS):
        random.seed(s * 1000 + 42)
        gate_outs = [evaluate_gate(row, use_continuity=True, noise=eta) for _, row in test_hard_df.iterrows()]
        asserted = np.array([g["decision"] == "ASSERT" for g in gate_outs])
        
        tp = np.sum(asserted & (test_y == 1))
        fp = np.sum(asserted & (test_y == 0))
        fpr = fp / TOTAL_TEST_NEG
        prec = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        
        fprs.append(fpr)
        precs.append(prec)
        
    mean_fpr = float(np.mean(fprs))
    ci_fpr = [float(np.percentile(fprs, 2.5)), float(np.percentile(fprs, 97.5))]
    mean_prec = float(np.mean(precs))
    ci_prec = [float(np.percentile(precs, 2.5)), float(np.percentile(precs, 97.5))]
    
    noise_summary.append({
        "Verifier Error Rate (eta)": f"{int(eta*100)}%",
        "Mean FPR": f"{mean_fpr*100:.2f}%",
        "FPR 95% CI": f"[{ci_fpr[0]*100:.2f}%, {ci_fpr[1]*100:.2f}%]",
        "Mean Precision": f"{mean_prec*100:.2f}%",
        "Precision 95% CI": f"[{ci_prec[0]*100:.2f}%, {ci_prec[1]*100:.2f}%]"
    })

df_4g = pd.DataFrame(noise_summary)
print("\n--- [TABLE 4G: MULTI-SEED VERIFIER NOISE DEGRADATION] ---")
print(df_4g.to_string(index=False))

# ---------------------------------------------------------------------------
# 10. SAVE ARTIFACTS TO DISK
# ---------------------------------------------------------------------------
df_blind_test.to_csv("experiment_4/table_final_blind_validation.csv", index=False)
stress_summary.to_csv("experiment_4/table_4f_continuity_stress.csv", index=False)
df_4g.to_csv("experiment_4/table_4g_multi_seed_noise.csv", index=False)

out_report = {
    "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
    "generator_seed": GENERATOR_SEED,
    "test_split_sha256": test_hash,
    "thresholds_sha256": thresholds_sha,
    "git_commit": git_commit_hash,
    "locked_thresholds": locked_thresholds,
    "test_evaluation": test_results,
    "table_4f_continuity_stress": stress_summary.to_dict(orient="records"),
    "table_4f_auc": float(stress_auc),
    "table_4g_noise": noise_summary
}

with open("experiment_4/final_blind_validation_report.json", "w") as f:
    json.dump(out_report, f, indent=2)

print("\n" + "=" * 110)
print("FINAL BLIND VALIDATION COMPLETE!")
print("Artifacts saved in experiment_4/ directory:")
print("  - thresholds.json")
print("  - generator_seed.txt")
print("  - test_split_hash.txt")
print("  - locked_thresholds_sha256.txt")
print("  - git_commit.txt")
print("  - table_final_blind_validation.csv")
print("  - table_4f_continuity_stress.csv")
print("  - table_4g_multi_seed_noise.csv")
print("  - final_blind_validation_report.json")
print("=" * 110)
