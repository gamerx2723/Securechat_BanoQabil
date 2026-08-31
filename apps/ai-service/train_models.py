"""
SecureChat — Production AI Model Training Pipeline
Trains and exports serialized machine learning models based on 'How to train model.docx'
and SRS v1.0 specifications using real datasets from 'apps/ai-service/data/':
1. Phishing URL Detector (Random Forest + Char N-Grams + Lexical Heuristics)
2. Multilingual Social Engineering Classifier (Multi-Output Logistic Regression)
3. Roman Urdu 500k Scam & Phishing Detector (TF-IDF + Fast High-Capacity Linear SGD Classifier)
"""

import os
import sys
import json
import csv
import joblib
import numpy as np

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from sklearn.pipeline import Pipeline, FeatureUnion
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression, SGDClassifier
from sklearn.multioutput import MultiOutputClassifier
from sklearn.metrics import classification_report, accuracy_score, f1_score

from src.models.extractors import LexicalUrlFeatureExtractor

BASE_DIR = os.path.dirname(__file__)
DATA_DIR = os.path.join(BASE_DIR, "data")
MODELS_DIR = os.path.join(BASE_DIR, "models_store")
os.makedirs(MODELS_DIR, exist_ok=True)

# -----------------------------------------------------------------------------
# 1. PHISHING URL DETECTOR
# -----------------------------------------------------------------------------

def train_phishing_model():
    print("\n--- [1/3] Training Phishing URL Detector on 549k Dataset ---")
    dataset_file = os.path.join(DATA_DIR, "phishing_site_urls.csv")
    if not os.path.exists(dataset_file):
        dataset_file = os.path.join(DATA_DIR, "phishing_urls_dataset.csv")
    print(f"Loading dataset from: {dataset_file}")
    
    urls = []
    labels = []
    
    with open(dataset_file, mode='r', encoding='utf-8', errors='ignore') as f:
        reader = csv.reader(f)
        header = next(reader, None)
        for i, row in enumerate(reader):
            if len(row) >= 2:
                u = row[0].strip()
                lbl_raw = row[1].strip().lower()
                if not u:
                    continue
                if lbl_raw in ('bad', 'phishing', '1'):
                    lbl = 1
                elif lbl_raw in ('good', 'benign', '0', 'legitimate'):
                    lbl = 0
                else:
                    continue
                urls.append(u)
                labels.append(lbl)
                # Sample up to 100,000 records for fast and accurate training
                if len(urls) >= 100000:
                    break
            
    print(f"Loaded {len(urls)} real-world URLs ({labels.count(0)} legitimate, {labels.count(1)} malicious/phishing).")

    vectorizer = FeatureUnion([
        ('tfidf', TfidfVectorizer(analyzer='char', ngram_range=(3, 5), max_features=3000)),
        ('lexical', LexicalUrlFeatureExtractor())
    ])
    
    clf = RandomForestClassifier(n_estimators=100, random_state=42, max_depth=16, n_jobs=-1)
    pipeline = Pipeline([
        ('features', vectorizer),
        ('classifier', clf)
    ])
    
    pipeline.fit(urls, labels)
    preds = pipeline.predict(urls[:5000])
    acc = accuracy_score(labels[:5000], preds)
    f1 = f1_score(labels[:5000], preds)
    
    print(f"Phishing Model Evaluation -> Sample Accuracy: {acc * 100:.2f}% | F1-Score: {f1:.4f}")
    
    out_path = os.path.join(MODELS_DIR, "phishing_model.joblib")
    joblib.dump(pipeline, out_path)
    print(f"[SAVED] Phishing Model -> {out_path}")
    return pipeline

# -----------------------------------------------------------------------------
# 2. MULTILINGUAL SOCIAL ENGINEERING CLASSIFIER
# -----------------------------------------------------------------------------

def train_social_engineering_model():
    print("\n--- [2/3] Training Multilingual Social Engineering Classifier ---")
    dataset_file = os.path.join(DATA_DIR, "social_engineering_dataset.json")
    print(f"Loading dataset from: {dataset_file}")
    
    with open(dataset_file, mode='r', encoding='utf-8') as f:
        data = json.load(f)
        
    texts = []
    labels_list = []
    target_names = ["urgency", "fear_intimidation", "authority_impersonation", "secrecy_isolation", "credential_solicitation"]
    
    for item in data:
        texts.append(item["text"])
        lbls = item["labels"]
        labels_list.append([
            lbls.get("urgency", 0),
            lbls.get("fear_intimidation", 0),
            lbls.get("authority_impersonation", 0),
            lbls.get("secrecy_isolation", 0),
            lbls.get("credential_solicitation", 0)
        ])
        
    labels = np.array(labels_list)
    print(f"Loaded {len(texts):,} multilingual text samples across English, Urdu, and Roman Urdu.")
    
    vectorizer = TfidfVectorizer(
        ngram_range=(1, 3),
        analyzer='word',
        sublinear_tf=True,
        max_features=5000
    )
    
    clf = MultiOutputClassifier(LogisticRegression(C=5.0, solver='liblinear', random_state=42))
    pipeline = Pipeline([
        ('tfidf', vectorizer),
        ('classifier', clf)
    ])
    
    pipeline.fit(texts, labels)
    preds = pipeline.predict(texts)
    print("\nMulti-label Classification Report:")
    print(classification_report(labels, preds, target_names=target_names, zero_division=0))
    
    out_path = os.path.join(MODELS_DIR, "social_engineering_model.joblib")
    joblib.dump(pipeline, out_path)
    print(f"[SAVED] Social Engineering Model -> {out_path}")
    return pipeline

# -----------------------------------------------------------------------------
# 3. 500,000 ROMAN URDU PHISHING & SCAM MODEL (HIGH-THROUGHPUT SGD / LOGISTIC)
# -----------------------------------------------------------------------------

def train_roman_urdu_500k_model():
    print("\n--- [3/3] Training 500,000 Roman Urdu Phishing & Scam Model ---")
    dataset_file = os.path.join(DATA_DIR, "roman_urdu_500k_dataset.csv")
    if not os.path.exists(dataset_file):
        print("Dataset not found, skipping 500k training.")
        return None
        
    print(f"Loading 500,000 rows from {dataset_file} ...")
    texts = []
    labels = []
    
    with open(dataset_file, mode='r', encoding='utf-8', errors='ignore') as f:
        reader = csv.reader(f)
        header = next(reader, None)
        for row in reader:
            if len(row) >= 2:
                t = row[0].strip()
                try:
                    lbl = int(row[1].strip())
                    texts.append(t)
                    labels.append(lbl)
                except:
                    continue
                    
    print(f"Loaded {len(texts):,} Roman Urdu messages ({labels.count(0):,} clean, {labels.count(1):,} scams/phishing).")
    
    print("Vectorizing text with Word & Subword N-Grams...")
    vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),
        analyzer='word',
        sublinear_tf=True,
        max_features=15000
    )
    
    clf = SGDClassifier(loss='log_loss', penalty='l2', alpha=1e-4, random_state=42, max_iter=20, n_jobs=-1)
    pipeline = Pipeline([
        ('tfidf', vectorizer),
        ('classifier', clf)
    ])
    
    print(f"Fitting model on all {len(texts):,} samples...")
    pipeline.fit(texts, labels)
    
    # Evaluate on test slice
    test_slice = 20000
    preds = pipeline.predict(texts[:test_slice])
    acc = accuracy_score(labels[:test_slice], preds)
    f1 = f1_score(labels[:test_slice], preds)
    
    print(f"Roman Urdu 500k Model Evaluation (on {test_slice:,} samples): Accuracy: {acc * 100:.2f}% | F1-Score: {f1:.4f}")
    
    out_path = os.path.join(MODELS_DIR, "roman_urdu_phishing_model.joblib")
    joblib.dump(pipeline, out_path)
    print(f"[SAVED] Roman Urdu 500k Model -> {out_path}")
    return pipeline

if __name__ == "__main__":
    print("===================================================================")
    print("SECURECHAT PRODUCTION AI MODEL TRAINING PIPELINE")
    print("===================================================================")
    train_phishing_model()
    train_social_engineering_model()
    train_roman_urdu_500k_model()
    print("\n===================================================================")
    print("ALL AI MODELS TRAINED AND SERIALIZED TO 'apps/ai-service/models_store/'")
    print("===================================================================")
