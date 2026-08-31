import os
import csv
import json
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import SGDClassifier

base_dir = os.path.dirname(os.path.abspath(__file__))
sms_path = os.path.join(base_dir, "data", "sms_spam_raw.csv")
model_path = os.path.join(base_dir, "models_store", "adaptive_online_model.joblib")
exemplars_path = os.path.join(base_dir, "data", "feedback_exemplars.json")

# Ensure clean exemplars
with open(exemplars_path, "w", encoding="utf-8") as f:
    json.dump([], f)

texts = []
labels = []

if os.path.exists(sms_path):
    with open(sms_path, "r", encoding="utf-8", errors="ignore") as f:
        reader = csv.reader(f)
        for row in reader:
            if len(row) >= 2:
                lbl = 1 if row[0].strip().lower() == "spam" else 0
                txt = row[1].strip()
                if txt:
                    texts.append(txt)
                    labels.append(lbl)

# Add explicit everyday conversational samples with common communication words
clean_samples = [
    ("send", 0),
    ("please send the report", 0),
    ("can you send the document when you get a chance", 0),
    ("can you send me the photo", 0),
    ("i will send it tomorrow", 0),
    ("send me your email address so i can forward the pdf", 0),
    ("did you send the invite to everyone?", 0),
    ("just sending you a quick update on the project", 0),
    ("send it over whenever you are ready", 0),
    ("please send my regards to your family", 0),
    ("bhai assignment send kar dena sham ko", 0),
    ("tasveer send karo main dekh leta hun", 0),
    ("kal meeting ka time bata dena please", 0),
    ("urgent send your bank password right now to prevent account closure", 1),
    ("send otp immediately to fia cyber crime cell or face arrest", 1),
    ("send 5000 rs advance fee to claim your 25000 bisp prize", 1),
    ("urgent verify your easypaisa account or send otp right now", 1),
]

for t, l in clean_samples:
    texts.append(t)
    labels.append(l)

vectorizer = TfidfVectorizer(ngram_range=(1, 2), max_features=20000, analyzer='word', sublinear_tf=True)
X = vectorizer.fit_transform(texts)

model = SGDClassifier(loss='log_loss', penalty='l2', alpha=1e-5, max_iter=2000, random_state=42)
model.fit(X, labels)

joblib.dump({"vectorizer": vectorizer, "model": model}, model_path)
print(f"Successfully trained balanced adaptive base model on {len(texts)} samples.")

# Test
test_phrases = [
    "send",
    "please send the report",
    "can you send me the photo",
    "i will send it tomorrow",
    "urgent send your otp right now"
]
X_test = vectorizer.transform(test_phrases)
probs = model.predict_proba(X_test)[:, 1]
for phrase, prob in zip(test_phrases, probs):
    print(f'PHRASE: "{phrase}" ==> PREDICTED SCAM PROBABILITY: {prob:.4f}')
