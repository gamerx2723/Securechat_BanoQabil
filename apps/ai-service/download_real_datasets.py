"""
SecureChat — Real Internet Dataset Downloader & Ingestion Pipeline
Downloads authentic, open-source phishing, spam/scam, and multilingual datasets from public mirrors.
"""

import os
import sys
import csv
import json
import urllib.request
import ssl

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(__file__)
DATA_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)

# Disable SSL verification for public dataset raw mirrors if needed
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}

def download_file(url: str, dest_path: str) -> bool:
    print(f"Downloading from {url} ...")
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, context=ctx, timeout=30) as response, open(dest_path, 'wb') as out_file:
            out_file.write(response.read())
        print(f"Successfully saved to {dest_path} ({os.path.getsize(dest_path)} bytes)")
        return True
    except Exception as e:
        print(f"Failed to download {url}: {e}")
        return False

# -----------------------------------------------------------------------------
# 1. DOWNLOAD REAL-WORLD SMS SPAM & SCAM DATASET (UCI ML / Kaggle Mirror)
# -----------------------------------------------------------------------------
def fetch_sms_spam_dataset():
    print("\n--- [1/3] Fetching Real SMS Scam & Spam Dataset (UCI ML) ---")
    dest = os.path.join(DATA_DIR, "sms_spam_raw.csv")
    
    urls = [
        "https://raw.githubusercontent.com/stedy/Machine-Learning-with-R-datasets/master/sms_spam.csv",
        "https://raw.githubusercontent.com/justmarkham/pycon-2016-tutorial/master/data/sms.tsv",
    ]
    
    success = False
    for u in urls:
        if download_file(u, dest):
            success = True
            break
            
    if success:
        # Convert to structured social engineering dataset
        print("Parsing and indexing SMS scam patterns into social engineering dataset...")
        processed_records = []
        with open(dest, mode='r', encoding='utf-8', errors='ignore') as f:
            reader = csv.reader(f)
            header = next(reader, None)
            for row in reader:
                if len(row) >= 2:
                    label = row[0].strip().lower()
                    text = row[1].strip()
                    if not text:
                        continue
                    
                    is_spam = label in ['spam', 'bad', 'scam', '1']
                    
                    # Detect urgency, fear, credential solicitation features
                    has_urgency = 1 if is_spam and any(w in text.lower() for w in ['urgent', 'immediately', 'now', 'today', 'expire', 'hurry', 'last chance', 'within 24 hours']) else 0
                    has_fear = 1 if is_spam and any(w in text.lower() for w in ['suspended', 'blocked', 'arrest', 'court', 'penalty', 'fine', 'cancelled']) else 0
                    has_auth = 1 if is_spam and any(w in text.lower() for w in ['bank', 'paypal', 'police', 'support', 'official', 'service', 'admin', 'gov']) else 0
                    has_cred = 1 if is_spam and any(w in text.lower() for w in ['claim', 'password', 'code', 'pin', 'verify', 'account', 'login', 'cash', 'won', 'prize', 'call']) else 0
                    
                    processed_records.append({
                        "text": text,
                        "language": "en",
                        "labels": {
                            "urgency": has_urgency,
                            "fear_intimidation": has_fear,
                            "authority_impersonation": has_auth,
                            "secrecy_isolation": 1 if is_spam and 'private' in text.lower() else 0,
                            "credential_solicitation": has_cred
                        }
                    })
                    
        print(f"Extracted {len(processed_records)} real SMS messages ({sum(1 for r in processed_records if any(r['labels'].values()))} flagged scam/phishing).")
        
        # Merge with existing multilingual baseline
        base_json = os.path.join(DATA_DIR, "social_engineering_dataset.json")
        existing_data = []
        if os.path.exists(base_json):
            with open(base_json, 'r', encoding='utf-8') as f:
                existing_data = json.load(f)
                
        # Take first 1,500 real samples + existing multilingual Roman Urdu samples
        combined = existing_data + processed_records[:1500]
        with open(base_json, 'w', encoding='utf-8') as f:
            json.dump(combined, f, indent=2, ensure_ascii=False)
            
        print(f"Updated '{base_json}' -> Total training samples: {len(combined)}")

# -----------------------------------------------------------------------------
# 2. DOWNLOAD REAL-WORLD PHISHING & BENIGN URLS DATASET
# -----------------------------------------------------------------------------
def fetch_phishing_urls_dataset():
    print("\n--- [2/3] Fetching Real Phishing & Benign URLs Dataset ---")
    dest = os.path.join(DATA_DIR, "phishing_urls_large.csv")
    
    urls = [
        "https://raw.githubusercontent.com/GregaVrbancic/Phishing-Dataset/master/dataset_full.csv",
        "https://raw.githubusercontent.com/taruntiwarihp/Phishing-Site-URLs/master/phishing_site_urls.csv",
    ]
    
    success = False
    for u in urls:
        if download_file(u, dest):
            success = True
            break
            
    if success:
        # Standardize CSV
        print("Standardizing phishing URL dataset format...")
        standard_path = os.path.join(DATA_DIR, "phishing_urls_dataset.csv")
        
        valid_rows = []
        with open(dest, mode='r', encoding='utf-8', errors='ignore') as f:
            reader = csv.reader(f)
            header = next(reader, None)
            for row in reader:
                if len(row) >= 2:
                    url = row[0].strip()
                    lbl = row[1].strip().lower()
                    if url and not url.startswith('http') and not '.' in url:
                        continue
                    
                    if lbl in ['1', 'bad', 'phishing', 'malicious']:
                        label = 1
                    elif lbl in ['0', 'good', 'benign', 'safe']:
                        label = 0
                    else:
                        continue
                        
                    valid_rows.append((url, label))
                    if len(valid_rows) >= 5000:
                        break
                        
        print(f"Extracted {len(valid_rows)} real URLs.")
        if len(valid_rows) > 0:
            with open(standard_path, mode='w', encoding='utf-8', newline='') as f:
                writer = csv.writer(f)
                writer.writerow(['url', 'label'])
                for r in valid_rows:
                    writer.writerow([r[0], r[1]])
            print(f"Updated '{standard_path}' with real URLs dataset ({len(valid_rows)} entries).")

# -----------------------------------------------------------------------------
# 3. DOWNLOAD ROMAN URDU SCAM & SENTIMENT DATASET
# -----------------------------------------------------------------------------
def fetch_roman_urdu_dataset():
    print("\n--- [3/3] Fetching Roman Urdu Real Dataset (IIT Delhi) ---")
    dest = os.path.join(DATA_DIR, "roman_urdu_raw.csv")
    
    url = "https://raw.githubusercontent.com/dair-iitd/roman-urdu-dataset/master/Roman%20Urdu%20DataSet.csv"
    if download_file(url, dest):
        print(f"Downloaded Roman Urdu authentic dataset to {dest}")

if __name__ == "__main__":
    print("===================================================================")
    print("SECURECHAT INTERNET DATASET DOWNLOADING & INGESTION")
    print("===================================================================")
    fetch_sms_spam_dataset()
    fetch_phishing_urls_dataset()
    fetch_roman_urdu_dataset()
    print("\n===================================================================")
    print("DATASET INGESTION COMPLETE! Ready to trigger model training.")
    print("===================================================================")
