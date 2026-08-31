import os
import sys
import csv
import time
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import SGDClassifier
from sklearn.ensemble import RandomForestClassifier

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

base_dir = os.path.dirname(os.path.abspath(__file__))
data_dir = os.path.join(base_dir, "data")
store_dir = os.path.join(base_dir, "models_store")
os.makedirs(store_dir, exist_ok=True)

print("Starting Unified Massive Multi-Model Training Pipeline...")

# ==========================================
# 1. TRAIN MASSIVE URL PHISHING CLASSIFIER
# ==========================================
urls_path = os.path.join(data_dir, "urls_massive.csv")
if os.path.exists(urls_path):
    print("\n--- Training Massive URL Phishing Classifier ---")
    urls, url_labels = [], []
    with open(urls_path, "r", encoding="utf-8", errors="ignore") as f:
        reader = csv.reader(f)
        header = next(reader, None)
        for row in reader:
            if len(row) >= 2:
                urls.append(row[0].strip())
                url_labels.append(int(row[1].strip()))

    url_vec = TfidfVectorizer(ngram_range=(3, 5), analyzer="char", max_features=25000, sublinear_tf=True)
    X_urls = url_vec.fit_transform(urls)
    url_model = SGDClassifier(loss="log_loss", penalty="l2", alpha=1e-5, max_iter=2000, random_state=42)
    url_model.fit(X_urls, url_labels)

    joblib.dump({"vectorizer": url_vec, "model": url_model}, os.path.join(store_dir, "phishing_model.joblib"))
    joblib.dump({"vectorizer": url_vec, "model": url_model}, os.path.join(store_dir, "phishing_model_large.joblib"))
    print(f"✅ URL Phishing Model trained on {len(urls)} samples and saved successfully.")

# ==========================================
# 2. TRAIN MASSIVE SOCIAL ENGINEERING CLASSIFIER
# ==========================================
se_path = os.path.join(data_dir, "social_eng_massive.csv")
if os.path.exists(se_path):
    print("\n--- Training Massive English Social Engineering Classifier ---")
    se_texts, se_labels = [], []
    with open(se_path, "r", encoding="utf-8", errors="ignore") as f:
        reader = csv.reader(f)
        header = next(reader, None)
        for row in reader:
            if len(row) >= 2:
                se_texts.append(row[0].strip())
                se_labels.append(int(row[1].strip()))

    # Add everyday benign phrases
    for phrase in ["send", "please send the report", "can you send the photo", "i will send it tomorrow", "did you send the invite?"]:
        se_texts.append(phrase)
        se_labels.append(0)

    se_vec = TfidfVectorizer(ngram_range=(1, 2), max_features=30000, sublinear_tf=True)
    X_se = se_vec.fit_transform(se_texts)
    se_model = SGDClassifier(loss="log_loss", penalty="l2", alpha=1e-5, max_iter=2000, random_state=42)
    se_model.fit(X_se, se_labels)

    joblib.dump({"vectorizer": se_vec, "model": se_model}, os.path.join(store_dir, "social_engineering_model.joblib"))
    print(f"✅ Social Engineering Model trained on {len(se_texts)} samples and saved successfully.")

# ==========================================
# 3. TRAIN MASSIVE BILINGUAL URDU & ROMAN URDU SCAM CLASSIFIER
# ==========================================
roman_path = os.path.join(data_dir, "roman_urdu_scams_massive.csv")
pure_path = os.path.join(data_dir, "pure_urdu_scams_massive.csv")
bilingual_path = os.path.join(data_dir, "bilingual_threats_massive.csv")

print("\n--- Training Massive Bilingual Urdu & Roman Urdu Scam Classifier ---")
urdu_texts, urdu_labels = [], []

for p in [roman_path, pure_path, bilingual_path]:
    if os.path.exists(p):
        with open(p, "r", encoding="utf-8", errors="ignore") as f:
            reader = csv.reader(f)
            header = next(reader, None)
            for row in reader:
                if len(row) >= 2:
                    urdu_texts.append(row[0].strip())
                    urdu_labels.append(int(row[1].strip()))

# Add clean conversational samples
for clean_p in ["salam", "kahan ho bhai", "theek hai main ghar pohanch kar send karta hun", "kal university chalain ge", "السلام علیکم"]:
    urdu_texts.append(clean_p)
    urdu_labels.append(0)

urdu_vec = TfidfVectorizer(ngram_range=(1, 3), analyzer="char_wb", max_features=40000, sublinear_tf=True)
X_urdu = urdu_vec.fit_transform(urdu_texts)
urdu_model = SGDClassifier(loss="log_loss", penalty="l2", alpha=1e-5, max_iter=2000, random_state=42)
urdu_model.fit(X_urdu, urdu_labels)

joblib.dump({"vectorizer": urdu_vec, "model": urdu_model}, os.path.join(store_dir, "urdu_scam_model.joblib"))
print(f"✅ Urdu Scam & Threat Model trained on {len(urdu_texts)} combined samples and saved successfully.")

# ==========================================
# 4. TRAIN MASSIVE ADAPTIVE BASE MODEL
# ==========================================
print("\n--- Training Massive Adaptive Online Learning Base Model ---")
all_adaptive_texts = se_texts + urdu_texts
all_adaptive_labels = se_labels + urdu_labels

adapt_vec = TfidfVectorizer(ngram_range=(1, 2), max_features=35000, analyzer="word", sublinear_tf=True)
X_adapt = adapt_vec.fit_transform(all_adaptive_texts)
adapt_model = SGDClassifier(loss="log_loss", penalty="l2", alpha=1e-5, max_iter=2000, random_state=42)
adapt_model.fit(X_adapt, all_adaptive_labels)

joblib.dump({"vectorizer": adapt_vec, "model": adapt_model}, os.path.join(store_dir, "adaptive_online_model.joblib"))
print(f"✅ Adaptive Online Learning Base Model trained on {len(all_adaptive_texts)} samples and saved successfully.")

print("\n🎉 Unified Training Pipeline Complete! All models in models_store/ updated.")
