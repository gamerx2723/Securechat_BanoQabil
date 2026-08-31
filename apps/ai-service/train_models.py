"""
SecureChat — AI Security Model Training Pipeline
Trains and exports serialized machine learning models based on 'How to train model.docx'
and SRS v1.0 specifications using real dataset files from 'apps/ai-service/data/'.
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
# 1. PHISHING URL DETECTOR (TRAINED FROM CSV DATASET)
# -----------------------------------------------------------------------------

def train_phishing_model():
    print("\n--- [1/2] Training Phishing URL Detector ---")
    dataset_file = os.path.join(DATA_DIR, "phishing_urls_dataset.csv")
    print(f"Loading dataset from: {dataset_file}")
    
    urls = []
    labels = []
    
    with open(dataset_file, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            urls.append(row["url"].strip())
            labels.append(int(row["label"].strip()))
            
    print(f"Loaded {len(urls)} URLs ({labels.count(0)} legitimate, {labels.count(1)} malicious/phishing).")

    vectorizer = FeatureUnion([
        ('tfidf', TfidfVectorizer(analyzer='char', ngram_range=(3, 5), max_features=500)),
        ('lexical', LexicalUrlFeatureExtractor())
    ])
    
    clf = RandomForestClassifier(n_estimators=100, random_state=42, max_depth=10)
    pipeline = Pipeline([
        ('features', vectorizer),
        ('classifier', clf)
    ])
    
    pipeline.fit(urls, labels)
    preds = pipeline.predict(urls)
    acc = accuracy_score(labels, preds)
    f1 = f1_score(labels, preds)
    
    print(f"Phishing Model Accuracy: {acc * 100:.2f}% | F1-Score: {f1:.4f}")
    
    out_path = os.path.join(MODELS_DIR, "phishing_model.joblib")
    joblib.dump(pipeline, out_path)
    print(f"[SAVED] Phishing Model -> {out_path}")
    return pipeline

# -----------------------------------------------------------------------------
# 2. MULTILINGUAL SOCIAL ENGINEERING CLASSIFIER (TRAINED FROM JSON DATASET)
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
        max_features=1000
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
