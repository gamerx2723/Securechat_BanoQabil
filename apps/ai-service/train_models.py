"""
SecureChat — AI Security Model Training Pipeline
Trains and exports serialized machine learning models based on 'How to train model.docx'
and SRS v1.0 specifications using real dataset files from 'apps/ai-service/data/'.
Supports small baseline files and massive Kaggle / Hugging Face datasets (500k+ rows).
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
from sklearn.linear_model import LogisticRegression
from sklearn.multioutput import MultiOutputClassifier
from sklearn.metrics import classification_report, accuracy_score, f1_score

from src.models.extractors import LexicalUrlFeatureExtractor

BASE_DIR = os.path.dirname(__file__)
DATA_DIR = os.path.join(BASE_DIR, "data")
MODELS_DIR = os.path.join(BASE_DIR, "models_store")
os.makedirs(MODELS_DIR, exist_ok=True)

# -----------------------------------------------------------------------------
# 1. PHISHING URL DETECTOR (SUPPORTS BASELINE & EXTERNAL KAGGLE / PHISHTANK CSVs)
# -----------------------------------------------------------------------------

def train_phishing_model():
    print("\n--- [1/2] Training Phishing URL Detector ---")
    
    # Check for primary or external larger CSV
    dataset_candidates = [
        os.path.join(DATA_DIR, "phishing_site_urls.csv"),
        os.path.join(DATA_DIR, "malicious_urls.csv"),
        os.path.join(DATA_DIR, "phishing_urls_dataset.csv"),
    ]
    
    dataset_file = next((f for f in dataset_candidates if os.path.exists(f)), None)
    if not dataset_file:
        raise FileNotFoundError(f"No phishing URL dataset found in {DATA_DIR}")
        
    print(f"Loading dataset from: {dataset_file}")
    
    urls = []
    labels = []
    
    with open(dataset_file, mode='r', encoding='utf-8', errors='ignore') as f:
        reader = csv.reader(f)
        header = next(reader, None)
        
        # Auto-detect column format (Kaggle URL,Label or standard CSV)
        url_idx = 0
        label_idx = 1
        if header:
            for i, col in enumerate(header):
                if 'url' in col.lower() or 'site' in col.lower() or 'domain' in col.lower():
                    url_idx = i
                elif 'label' in col.lower() or 'class' in col.lower() or 'type' in col.lower() or 'result' in col.lower():
                    label_idx = i
                    
        for row in reader:
            if len(row) > max(url_idx, label_idx):
                u = row[url_idx].strip()
                raw_lbl = row[label_idx].strip().lower()
                
                # Normalize label
                if raw_lbl in ['1', 'bad', 'phishing', 'malicious', 'yes', 'fraud']:
                    lbl = 1
                elif raw_lbl in ['0', 'good', 'benign', 'legitimate', 'no', 'safe']:
                    lbl = 0
                else:
                    try:
                        lbl = int(raw_lbl)
                    except:
                        continue
                        
                if u:
                    urls.append(u)
                    labels.append(lbl)
            
    print(f"Loaded {len(urls)} URLs ({labels.count(0)} legitimate, {labels.count(1)} malicious/phishing).")

    # High-capacity feature union combining TF-IDF char n-grams + lexical properties
    max_features = min(5000, max(500, len(urls) // 2))
    vectorizer = FeatureUnion([
        ('tfidf', TfidfVectorizer(analyzer='char', ngram_range=(3, 5), max_features=max_features)),
        ('lexical', LexicalUrlFeatureExtractor())
    ])
    
    n_estimators = 100 if len(urls) <= 10000 else 50
    clf = RandomForestClassifier(n_estimators=n_estimators, random_state=42, max_depth=15, n_jobs=-1)
    pipeline = Pipeline([
        ('features', vectorizer),
        ('classifier', clf)
    ])
    
    pipeline.fit(urls, labels)
    preds = pipeline.predict(urls[:min(1000, len(urls))])
    acc = accuracy_score(labels[:min(1000, len(labels))], preds)
    f1 = f1_score(labels[:min(1000, len(labels))], preds)
    
    print(f"Phishing Model Evaluation -> Sample Accuracy: {acc * 100:.2f}% | F1-Score: {f1:.4f}")
    
    out_path = os.path.join(MODELS_DIR, "phishing_model.joblib")
    joblib.dump(pipeline, out_path)
    print(f"[SAVED] Phishing Model -> {out_path}")
    return pipeline

# -----------------------------------------------------------------------------
# 2. MULTILINGUAL SOCIAL ENGINEERING CLASSIFIER
# -----------------------------------------------------------------------------

def train_social_engineering_model():
    print("\n--- [2/2] Training Multilingual Social Engineering Classifier ---")
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
    print(f"Loaded {len(texts)} multilingual text samples across English, Urdu, and Roman Urdu.")
    
    vectorizer = TfidfVectorizer(
        ngram_range=(1, 3),
        analyzer='word',
        sublinear_tf=True,
        max_features=2000
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

if __name__ == "__main__":
    print("===================================================================")
    print("SECURECHAT PRODUCTION AI MODEL TRAINING PIPELINE")
    print("===================================================================")
    train_phishing_model()
    train_social_engineering_model()
    print("\n===================================================================")
    print("ALL AI MODELS TRAINED AND SERIALIZED TO 'apps/ai-service/models_store/'")
    print("===================================================================")
