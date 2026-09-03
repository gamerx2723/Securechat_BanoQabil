import os
import sys
import csv
import json
import time
import re
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import SGDClassifier

if sys.platform == "win32":
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding="utf-8")

base_dir = os.path.dirname(os.path.abspath(__file__))
data_dir = os.path.join(base_dir, "data")
store_dir = os.path.join(base_dir, "models_store")
os.makedirs(store_dir, exist_ok=True)

print("=" * 70)
print("🚀 Comprehensive AI Model Training Pipeline — Ingesting ALL Data Files")
print("=" * 70)

url_regex = re.compile(r"https?://[^\s<>\"'{}|\\^`\[\]]+", re.IGNORECASE)
domain_regex = re.compile(r"^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(/.*)?$", re.IGNORECASE)

se_texts, se_labels = [], []
urls, url_labels = [], []
urdu_texts, urdu_labels = [], []
blackmail_texts, blackmail_labels = [], []

all_files = sorted(os.listdir(data_dir))
print(f"Discovered {len(all_files)} dataset files in '{data_dir}':\n")
for idx, fname in enumerate(all_files, 1):
    fpath = os.path.join(data_dir, fname)
    fsize = os.path.getsize(fpath) / (1024 * 1024)
    print(f"  [{idx:02d}] {fname} ({fsize:.2f} MB)")

# Helper to normalize label to 0 (benign) or 1 (malicious)
def parse_label(val) -> int:
    val_str = str(val).strip().lower()
    if val_str in ['1', 'spam', 'phishing', 'bad', 'malicious', 'scam', 'fraud', 'true', 'yes', 'danger', 'red']:
        return 1
    return 0

# Helper to check if string contains Urdu / Arabic Unicode characters
def is_urdu_script(text: str) -> bool:
    return any('\u0600' <= char <= '\u06FF' for char in text)

# Helper to check if string is Roman Urdu based on characteristic particles
def is_roman_urdu(text: str) -> bool:
    tokens = set(re.findall(r'\b[a-zA-Z]+\b', text.lower()))
    roman_markers = {'hai', 'hain', 'karein', 'karo', 'apna', 'apka', 'aap', 'raha', 'bhai', 'yar', 'pesay', 'bhejo', 'tasdeeq', 'shuda', 'raqam', 'wasool', 'inam', 'nikla', 'khatam', 'band', 'chalain', 'salam'}
    return len(tokens.intersection(roman_markers)) >= 1

# ==============================================================================
# INGEST EACH FILE IN THE DATA DIRECTORY
# ==============================================================================
print("\n" + "=" * 70)
print("📥 Ingesting & Extracting Data from ALL 18 Files...")
print("=" * 70)

for fname in all_files:
    fpath = os.path.join(data_dir, fname)
    if not os.path.isfile(fpath):
        continue

    initial_se = len(se_texts)
    initial_url = len(urls)
    initial_urdu = len(urdu_texts)

    # 1. JSON Files
    if fname.endswith(".json"):
        try:
            with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                data = json.load(f)
                if isinstance(data, list):
                    for item in data:
                        if isinstance(item, dict):
                            txt = item.get("text") or item.get("message") or item.get("prompt") or ""
                            if not txt:
                                continue
                            
                            lbl = 0
                            if "label" in item:
                                lbl = parse_label(item["label"])
                            elif "labels" in item and isinstance(item["labels"], dict):
                                lbl = 1 if any(bool(v) for v in item["labels"].values()) else 0
                            elif "is_threat" in item:
                                lbl = 1 if item["is_threat"] else 0
                            else:
                                lbl = 1 # Default security exemplar

                            if is_urdu_script(txt) or is_roman_urdu(txt) or item.get("language") in ["ur", "roman_urdu"]:
                                urdu_texts.append(txt)
                                urdu_labels.append(lbl)
                            else:
                                se_texts.append(txt)
                                se_labels.append(lbl)

                            for u in url_regex.findall(txt):
                                urls.append(u.strip())
                                url_labels.append(lbl)
        except Exception as e:
            print(f"⚠️ Error parsing JSON {fname}: {e}")

    # 2. Text / Tab-separated / CSV Files
    else:
        try:
            with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                # Check delimiter
                first_line = f.readline()
                f.seek(0)
                delimiter = '\t' if '\t' in first_line and ',' not in first_line else ','

                reader = csv.reader(f, delimiter=delimiter)
                header = next(reader, None)
                
                # Check if header exists or first row is data
                rows_to_process = []
                if header:
                    # If header doesn't look like column names, treat as data row
                    if any(w in str(header).lower() for w in ['http', 'www.', 'spam', 'ham', 'urgent', 'salam', 'free']):
                        rows_to_process.append(header)

                for row in reader:
                    rows_to_process.append(row)
                    if len(rows_to_process) >= 300000: # Capacity safety per file
                        break

                for row in rows_to_process:
                    if not row:
                        continue
                    
                    # File-specific heuristics
                    if fname in ["phishing_site_urls.csv", "phishing_urls_large.csv", "phishing_urls_dataset.csv", "urls_massive.csv"]:
                        # URL dataset: row[0]=url, row[1]=label
                        if len(row) >= 2:
                            u_val = row[0].strip()
                            l_val = parse_label(row[1])
                            if u_val and ("." in u_val or "/" in u_val):
                                urls.append(u_val)
                                url_labels.append(l_val)
                    
                    elif fname == "verified_online.csv":
                        # PhishTank verified online CSV format: phish_id,url,phish_detail_url,submission_time,verified,verification_time,online,target
                        if len(row) >= 2:
                            u_val = row[1].strip()
                            if u_val.startswith("http"):
                                urls.append(u_val)
                                url_labels.append(1)

                    elif fname in ["SMSSpamCollection", "sms_spam_raw.csv", "spam.csv"]:
                        # SMS datasets: row[0]=label, row[1]=text OR row[0]=text, row[1]=label
                        if len(row) >= 2:
                            col0 = row[0].strip()
                            col1 = row[1].strip()
                            if col0.lower() in ['ham', 'spam', '0', '1']:
                                lbl = parse_label(col0)
                                msg = col1
                            else:
                                lbl = parse_label(col1)
                                msg = col0

                            if msg:
                                se_texts.append(msg)
                                se_labels.append(lbl)
                                for u in url_regex.findall(msg):
                                    urls.append(u.strip())
                                    url_labels.append(lbl)

                    elif "blackmail" in fname.lower() or "sextortion" in fname.lower():
                        if len(row) >= 2:
                            txt = row[0].strip()
                            lbl = parse_label(row[1])
                            if txt:
                                blackmail_texts.append(txt)
                                blackmail_labels.append(lbl)
                                if is_urdu_script(txt) or is_roman_urdu(txt):
                                    urdu_texts.append(txt)
                                    urdu_labels.append(lbl)
                                else:
                                    se_texts.append(txt)
                                    se_labels.append(lbl)
                                for u in url_regex.findall(txt):
                                    urls.append(u.strip())
                                    url_labels.append(lbl)

                    elif "urdu" in fname.lower() or "bilingual" in fname.lower():
                        # Urdu / Roman Urdu files: row[0]=text, row[1]=label
                        if len(row) >= 2:
                            txt = row[0].strip()
                            lbl = parse_label(row[1])
                            if txt:
                                urdu_texts.append(txt)
                                urdu_labels.append(lbl)
                                for u in url_regex.findall(txt):
                                    urls.append(u.strip())
                                    url_labels.append(lbl)

                    elif fname == "phishing_detection_500k.csv":
                        if len(row) >= 3:
                            msg = row[1].strip()
                            lbl = parse_label(row[2])
                            if msg:
                                se_texts.append(msg)
                                se_labels.append(lbl)
                                for u in url_regex.findall(msg):
                                    urls.append(u.strip())
                                    url_labels.append(lbl)
                    
                    else:
                        # Generic CSV parsing
                        txt = ""
                        lbl = 0
                        for col in row:
                            c_clean = col.strip()
                            if c_clean.lower() in ['0', '1', 'spam', 'ham', 'phishing', 'benign', 'good', 'bad']:
                                lbl = parse_label(c_clean)
                            elif len(c_clean) > len(txt):
                                txt = c_clean
                        
                        if txt:
                            if is_urdu_script(txt) or is_roman_urdu(txt):
                                urdu_texts.append(txt)
                                urdu_labels.append(lbl)
                            else:
                                se_texts.append(txt)
                                se_labels.append(lbl)

                            for u in url_regex.findall(txt):
                                urls.append(u.strip())
                                url_labels.append(lbl)

        except Exception as e:
            print(f"⚠️ Error reading {fname}: {e}")

    added_se = len(se_texts) - initial_se
    added_url = len(urls) - initial_url
    added_urdu = len(urdu_texts) - initial_urdu
    print(f"  ✓ {fname:<32} -> Added: {added_se:>7,} messages | {added_url:>7,} URLs | {added_urdu:>7,} Urdu samples")

# ==============================================================================
# ADD CRITICAL EDGE-CASE BENIGN & MALICIOUS CONTROL PHRASES
# ==============================================================================
benign_edge_cases = [
    "send", "please send the document", "can you send the photo", "i will send it later",
    "did you send the invite?", "here is the zoom link for our meeting", "meeting tomorrow at 10am",
    "thanks for the update", "let me know when you are free", "hello how are you", "good morning",
    "call me when you get this", "see you at office", "what time is the class?", "ok noted",
    "i have submitted the assignment", "happy birthday!", "congratulations on the new role",
    "salam bhai", "kahan ho yar", "theek hai main ghar pohanch kar send karta hun",
    "kal university chalain ge", "السلام علیکم", "bhai chai peete hain", "all good yar"
]
for p in benign_edge_cases:
    if is_urdu_script(p) or is_roman_urdu(p):
        urdu_texts.append(p)
        urdu_labels.append(0)
    else:
        se_texts.append(p)
        se_labels.append(0)

print("\n" + "=" * 70)
print("📊 TOTAL INGESTED TRAINING DATA SUMMARY:")
print(f"   • Phishing & Benign URLs Dataset:      {len(urls):,} samples")
print(f"   • Social Engineering & SMS Messages:  {len(se_texts):,} samples")
print(f"   • Multilingual & Roman Urdu Corpus:   {len(urdu_texts):,} samples")
print(f"   • Grand Total Training Corpus:        {len(urls) + len(se_texts) + len(urdu_texts):,} samples")
print("=" * 70)

# ==============================================================================
# 1. TRAIN URL PHISHING CLASSIFIER
# ==============================================================================
print(f"\n🧠 [1/4] Training URL Phishing Model on {len(urls):,} URLs...")
t0 = time.time()
url_vec = TfidfVectorizer(ngram_range=(3, 5), analyzer="char", max_features=35000, sublinear_tf=True)
X_urls = url_vec.fit_transform(urls)
url_model = SGDClassifier(loss="log_loss", penalty="l2", alpha=1e-5, max_iter=2000, random_state=42)
url_model.fit(X_urls, url_labels)

joblib.dump({"vectorizer": url_vec, "model": url_model}, os.path.join(store_dir, "phishing_model.joblib"))
joblib.dump({"vectorizer": url_vec, "model": url_model}, os.path.join(store_dir, "phishing_model_large.joblib"))
print(f"   ✅ URL Phishing Model trained in {time.time()-t0:.2f}s and saved.")

# ==============================================================================
# 2. TRAIN SOCIAL ENGINEERING & SMS CLASSIFIER
# ==============================================================================
print(f"\n🧠 [2/4] Training Social Engineering Model on {len(se_texts):,} messages...")
t0 = time.time()
se_vec = TfidfVectorizer(ngram_range=(1, 2), max_features=45000, sublinear_tf=True)
X_se = se_vec.fit_transform(se_texts)
se_model = SGDClassifier(loss="log_loss", penalty="l2", alpha=1e-5, max_iter=2000, random_state=42)
se_model.fit(X_se, se_labels)

joblib.dump({"vectorizer": se_vec, "model": se_model}, os.path.join(store_dir, "social_engineering_model.joblib"))
print(f"   ✅ Social Engineering Model trained in {time.time()-t0:.2f}s and saved.")

# ==============================================================================
# 3. TRAIN BILINGUAL URDU & ROMAN URDU SCAM CLASSIFIER
# ==============================================================================
print(f"\n🧠 [3/4] Training Multilingual Urdu Model on {len(urdu_texts):,} samples...")
t0 = time.time()
urdu_vec = TfidfVectorizer(ngram_range=(1, 3), analyzer="char_wb", max_features=50000, sublinear_tf=True)
X_urdu = urdu_vec.fit_transform(urdu_texts)
urdu_model = SGDClassifier(loss="log_loss", penalty="l2", alpha=1e-5, max_iter=2000, random_state=42)
urdu_model.fit(X_urdu, urdu_labels)

joblib.dump({"vectorizer": urdu_vec, "model": urdu_model}, os.path.join(store_dir, "urdu_scam_model.joblib"))
print(f"   ✅ Urdu Scam Model trained in {time.time()-t0:.2f}s and saved.")

# ==============================================================================
# 4. TRAIN ADAPTIVE ONLINE BASE MODEL
# ==============================================================================
print(f"\n🧠 [4/4] Training Adaptive Online Base Model on {len(se_texts) + len(urdu_texts):,} combined samples...")
t0 = time.time()
all_adaptive_texts = se_texts + urdu_texts
all_adaptive_labels = se_labels + urdu_labels

adapt_vec = TfidfVectorizer(ngram_range=(1, 2), max_features=50000, analyzer="word", sublinear_tf=True)
X_adapt = adapt_vec.fit_transform(all_adaptive_texts)
adapt_model = SGDClassifier(loss="log_loss", penalty="l2", alpha=1e-5, max_iter=2000, random_state=42)
adapt_model.fit(X_adapt, all_adaptive_labels)

# ==============================================================================
# 5. TRAIN BLACKMAIL & SEXTORTION DETECTOR MODEL
# ==============================================================================
print(f"\n🧠 [5/5] Training Blackmail & Sextortion Model on {len(blackmail_texts):,} samples...")
t0 = time.time()
bm_vec = TfidfVectorizer(ngram_range=(1, 3), max_features=40000, analyzer="word", sublinear_tf=True)
X_bm = bm_vec.fit_transform(blackmail_texts)
bm_model = SGDClassifier(loss="log_loss", penalty="l2", alpha=1e-5, max_iter=2000, random_state=42)
bm_model.fit(X_bm, blackmail_labels)

joblib.dump({"vectorizer": bm_vec, "model": bm_model}, os.path.join(store_dir, "blackmail_model.joblib"))
joblib.dump({"vectorizer": adapt_vec, "model": adapt_model}, os.path.join(store_dir, "unified_online_guardian.joblib"))
print(f"   ✅ Blackmail & Sextortion Model and Unified Online Guardian trained in {time.time()-t0:.2f}s and saved.")

print("\n" + "=" * 70)
print(f"🎉 ALL MODELS TRAINED ON ALL {len(all_files)} FILES & SAVED TO models_store/")
print("=" * 70)
