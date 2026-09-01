import os
import sys
import csv
import time
import re
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import SGDClassifier

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

base_dir = os.path.dirname(os.path.abspath(__file__))
data_dir = os.path.join(base_dir, "data")
store_dir = os.path.join(base_dir, "models_store")
os.makedirs(store_dir, exist_ok=True)

print("=" * 60)
print("🚀 Starting Unified Massive Multi-Model AI Training Pipeline")
print("=" * 60)

url_regex = re.compile(r"https?://[^\s<>\"'{}|\\^`\[\]]+", re.IGNORECASE)

# ==========================================
# 1. INGEST ALL DATASETS
# ==========================================
se_texts, se_labels = [], []
urls, url_labels = [], []
urdu_texts, urdu_labels = [], []

# A. Ingest 500k+ Phishing & Tricky Message Dataset (phishing_detection_500k.csv)
phishing_500k_path = os.path.join(data_dir, "phishing_detection_500k.csv")
if os.path.exists(phishing_500k_path):
    print(f"\n📂 Ingesting Tricky Messages Dataset: {os.path.basename(phishing_500k_path)}...")
    count = 0
    with open(phishing_500k_path, "r", encoding="utf-8", errors="ignore") as f:
        reader = csv.reader(f)
        header = next(reader, None)
        for row in reader:
            if len(row) >= 3:
                msg = row[1].strip()
                lbl_raw = row[2].strip().lower()
                is_threat = 1 if lbl_raw in ["phishing", "1", "malicious", "spam", "scam", "fraud"] else 0
                
                if msg:
                    se_texts.append(msg)
                    se_labels.append(is_threat)
                    count += 1
                    
                    # Extract URLs from message
                    extracted_urls = url_regex.findall(msg)
                    for u in extracted_urls:
                        urls.append(u.strip())
                        url_labels.append(is_threat)
                        
            if count >= 300000: # Optimal diverse representation
                break
    print(f"   -> Loaded {count} tricky phishing & conversational samples.")

# B. Ingest Social Engineering Dataset
se_path = os.path.join(data_dir, "social_eng_massive.csv")
if os.path.exists(se_path):
    print(f"📂 Ingesting Social Engineering Dataset: {os.path.basename(se_path)}...")
    with open(se_path, "r", encoding="utf-8", errors="ignore") as f:
        reader = csv.reader(f)
        next(reader, None)
        for row in reader:
            if len(row) >= 2 and row[0].strip():
                se_texts.append(row[0].strip())
                se_labels.append(int(row[1].strip()))

# Add targeted edge-case benign & malicious phrases
benign_additions = [
    "send", "please send the report", "can you send the photo", "i will send it tomorrow",
    "did you send the invite?", "here is the meeting link for zoom", "meeting tomorrow at 10am",
    "thanks for the update", "let me know when you are free", "hello how are you"
]
for p in benign_additions:
    se_texts.append(p)
    se_labels.append(0)

# C. Ingest URL Datasets
for url_file in ["urls_massive.csv", "phishing_urls_dataset.csv", "phishing_urls_large.csv"]:
    p = os.path.join(data_dir, url_file)
    if os.path.exists(p):
        print(f"📂 Ingesting URL Dataset: {url_file}...")
        with open(p, "r", encoding="utf-8", errors="ignore") as f:
            reader = csv.reader(f)
            next(reader, None)
            for row in reader:
                if len(row) >= 2 and row[0].strip():
                    try:
                        urls.append(row[0].strip())
                        url_labels.append(int(row[1].strip()))
                    except:
                        pass

# D. Ingest Roman Urdu 500k Dataset & Urdu Datasets
roman_500k_path = os.path.join(data_dir, "roman_urdu_500k_dataset.csv")
if os.path.exists(roman_500k_path):
    print(f"📂 Ingesting Roman Urdu 500k Dataset: {os.path.basename(roman_500k_path)}...")
    count_urdu = 0
    with open(roman_500k_path, "r", encoding="utf-8", errors="ignore") as f:
        reader = csv.reader(f)
        next(reader, None)
        for row in reader:
            if len(row) >= 2 and row[0].strip():
                try:
                    urdu_texts.append(row[0].strip())
                    urdu_labels.append(int(row[1].strip()))
                    count_urdu += 1
                except:
                    pass
            if count_urdu >= 200000:
                break
    print(f"   -> Loaded {count_urdu} Roman Urdu dataset samples.")

for urdu_file in ["roman_urdu_scams_massive.csv", "pure_urdu_scams_massive.csv", "bilingual_threats_massive.csv"]:
    p = os.path.join(data_dir, urdu_file)
    if os.path.exists(p):
        print(f"📂 Ingesting Urdu Dataset: {urdu_file}...")
        with open(p, "r", encoding="utf-8", errors="ignore") as f:
            reader = csv.reader(f)
            next(reader, None)
            for row in reader:
                if len(row) >= 2 and row[0].strip():
                    try:
                        urdu_texts.append(row[0].strip())
                        urdu_labels.append(int(row[1].strip()))
                    except:
                        pass

urdu_benign = [
    "salam", "kahan ho bhai", "theek hai main ghar pohanch kar send karta hun",
    "kal university chalain ge", "السلام علیکم", "bhai chai peete hain", "all good yar"
]
for u in urdu_benign:
    urdu_texts.append(u)
    urdu_labels.append(0)

# ==========================================
# 2. TRAIN URL PHISHING CLASSIFIER
# ==========================================
print(f"\n🧠 [1/4] Training URL Phishing Model on {len(urls):,} URL samples...")
t0 = time.time()
url_vec = TfidfVectorizer(ngram_range=(3, 5), analyzer="char", max_features=30000, sublinear_tf=True)
X_urls = url_vec.fit_transform(urls)
url_model = SGDClassifier(loss="log_loss", penalty="l2", alpha=1e-5, max_iter=2000, random_state=42)
url_model.fit(X_urls, url_labels)

joblib.dump({"vectorizer": url_vec, "model": url_model}, os.path.join(store_dir, "phishing_model.joblib"))
joblib.dump({"vectorizer": url_vec, "model": url_model}, os.path.join(store_dir, "phishing_model_large.joblib"))
print(f"   ✅ URL Phishing Model trained in {time.time()-t0:.2f}s and saved.")

# ==========================================
# 3. TRAIN SOCIAL ENGINEERING & TRICKY MESSAGE CLASSIFIER
# ==========================================
print(f"\n🧠 [2/4] Training Social Engineering & Tricky Message Model on {len(se_texts):,} samples...")
t0 = time.time()
se_vec = TfidfVectorizer(ngram_range=(1, 2), max_features=40000, sublinear_tf=True)
X_se = se_vec.fit_transform(se_texts)
se_model = SGDClassifier(loss="log_loss", penalty="l2", alpha=1e-5, max_iter=2000, random_state=42)
se_model.fit(X_se, se_labels)

joblib.dump({"vectorizer": se_vec, "model": se_model}, os.path.join(store_dir, "social_engineering_model.joblib"))
print(f"   ✅ Social Engineering Model trained in {time.time()-t0:.2f}s and saved.")

# ==========================================
# 4. TRAIN BILINGUAL URDU & ROMAN URDU SCAM CLASSIFIER
# ==========================================
print(f"\n🧠 [3/4] Training Multilingual Urdu & Roman Urdu Model on {len(urdu_texts):,} samples...")
t0 = time.time()
urdu_vec = TfidfVectorizer(ngram_range=(1, 3), analyzer="char_wb", max_features=50000, sublinear_tf=True)
X_urdu = urdu_vec.fit_transform(urdu_texts)
urdu_model = SGDClassifier(loss="log_loss", penalty="l2", alpha=1e-5, max_iter=2000, random_state=42)
urdu_model.fit(X_urdu, urdu_labels)

joblib.dump({"vectorizer": urdu_vec, "model": urdu_model}, os.path.join(store_dir, "urdu_scam_model.joblib"))
print(f"   ✅ Urdu Scam Model trained in {time.time()-t0:.2f}s and saved.")

# ==========================================
# 5. TRAIN ADAPTIVE ONLINE BASE MODEL
# ==========================================
print(f"\n🧠 [4/4] Training Adaptive Online Learning Base Model on {len(se_texts) + len(urdu_texts):,} combined samples...")
t0 = time.time()
all_adaptive_texts = se_texts + urdu_texts
all_adaptive_labels = se_labels + urdu_labels

adapt_vec = TfidfVectorizer(ngram_range=(1, 2), max_features=45000, analyzer="word", sublinear_tf=True)
X_adapt = adapt_vec.fit_transform(all_adaptive_texts)
adapt_model = SGDClassifier(loss="log_loss", penalty="l2", alpha=1e-5, max_iter=2000, random_state=42)
adapt_model.fit(X_adapt, all_adaptive_labels)

joblib.dump({"vectorizer": adapt_vec, "model": adapt_model}, os.path.join(store_dir, "adaptive_online_model.joblib"))
print(f"   ✅ Adaptive Online Base Model trained in {time.time()-t0:.2f}s and saved.")

print("\n" + "=" * 60)
print("🎉 ALL MODELS TRAINED & SAVED SUCCESSFULLY TO models_store/")
print("=" * 60)
