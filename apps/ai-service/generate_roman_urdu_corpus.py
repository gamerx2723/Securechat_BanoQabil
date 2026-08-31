"""
SecureChat — 500,000 Roman Urdu Phishing & Scam Corpus Generator
Synthesizes 500,000 authentic, diverse Roman Urdu messages covering:
- Easypaisa / JazzCash / Banking biometric phishing
- BISP / Ehsaas / Lottery fake rewards
- FIA / Police / Legal notice extortion
- Urgent hospital/relative impersonation
- Job / Double-income / Crypto scams
- WhatsApp verification code forward tricks
- Real benign everyday Pakistani conversations (greetings, work, friends, family)
"""

import os
import sys
import json
import random
import csv
import itertools

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(__file__)
DATA_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)

# -----------------------------------------------------------------------------
# VOCABULARY & TEMPLATES MATRIX FOR HIGH DIVERSITY CORPUS
# -----------------------------------------------------------------------------

BANKS = ["HBL", "UBL", "Meezan Bank", "MCB", "Allied Bank", "Bank Alfalah", "Faysal Bank", "JazzCash", "Easypaisa", "Nayapay", "Sadapay"]
AMOUNTS = ["15,000", "25,000", "50,000", "100,000", "75,000", "30,000", "5,000", "10,000"]
URGENCY_WORDS = ["foran", "jaldi", "abhi ke abhi", "bina takheer", "aaj hi", "2 ghantay k andar", "within 1 hour", "last warning"]
RELATIONS = ["Bhai", "Yar", "Dost", "Uncle", "Bhabhi", "Ammi", "Abba", "Chacha"]
CALL_ACTIONS = ["0300-1234567 par rabta karein", "is link par click karein", "OTP forward karein", "pin code send karein", "JazzCash send karein"]

# Scam Template Builders
SCAM_TEMPLATES = [
    # 1. Fintech & Banking Biometric Phishing
    (
        lambda b, u, a: f"Muaziz Sarif! Aapka {b} account ghair tasdeeq shuda hone ki waja se block kar dia gya hai. Account bahal karne k liye {u} is link par biometric verify karein: https://{b.lower().replace(' ', '')}-login-verify.xyz/auth",
        {"urgency": 1, "fear_intimidation": 1, "authority_impersonation": 1, "secrecy_isolation": 0, "credential_solicitation": 1}
    ),
    (
        lambda b, u, a: f"{b} Alert: Aapke account se Rs {a} ki unauthorized transaction detect hui hai. Agar ye aap ne nahi ki to {u} helpline 0311-9876543 par call kar k OTP batayein.",
        {"urgency": 1, "fear_intimidation": 1, "authority_impersonation": 1, "secrecy_isolation": 0, "credential_solicitation": 1}
    ),
    (
        lambda b, u, a: f"Alert from {b}: Aap ka debit card/ATM temporarily suspend ho chuka hai. Verification k liye {u} apna 4-digit PIN aur CNIC number update karein.",
        {"urgency": 1, "fear_intimidation": 1, "authority_impersonation": 1, "secrecy_isolation": 0, "credential_solicitation": 1}
    ),
    
    # 2. BISP / Ehsaas / Fake Reward & Lottery Scams
    (
        lambda b, u, a: f"Mubarak ho! Prime Minister Benazir Income Support Program (BISP) se aapki Rs {a} ki imdad manzoor ho chuki hai. Raqam wasool karne k liye {u} apna JazzCash/Easypaisa number aur OTP share karein.",
        {"urgency": 1, "fear_intimidation": 0, "authority_impersonation": 1, "secrecy_isolation": 0, "credential_solicitation": 1}
    ),
    (
        lambda b, u, a: f"Jeeto Pakistan / ARY Digital: Aapka 10 tola sona aur Rs {a} cash inam nikla hai! Inam claim karne k liye {u} registration fees Rs 2,500 send karein.",
        {"urgency": 1, "fear_intimidation": 0, "authority_impersonation": 1, "secrecy_isolation": 0, "credential_solicitation": 1}
    ),
    (
        lambda b, u, a: f"Congratulations! Lucky draw me aapka iPhone 16 Pro Max nikal aya hai. Delivery k liye {u} Rs 1500 courier charges send karein.",
        {"urgency": 1, "fear_intimidation": 0, "authority_impersonation": 0, "secrecy_isolation": 0, "credential_solicitation": 1}
    ),
    
    # 3. FIA / Police / Legal Threat Extortion
    (
        lambda b, u, a: f"FIA Cyber Crime Wing Notice: Aap k CNIC aur mobile number par illegal activity ki FIR darj hui hai. Arrest warrant se bachne k liye {u} Officer Rashid se 0300-8765432 par rabta karein.",
        {"urgency": 1, "fear_intimidation": 1, "authority_impersonation": 1, "secrecy_isolation": 1, "credential_solicitation": 0}
    ),
    (
        lambda b, u, a: f"PTA Final Warning: Aapki SIM par biometric missing hai. Agar aapne {u} verify na kia to tamam SIMs hamesha k liye block kar di jayen gi.",
        {"urgency": 1, "fear_intimidation": 1, "authority_impersonation": 1, "secrecy_isolation": 0, "credential_solicitation": 1}
    ),

    # 4. Social Engineering / Friend / Relative Impersonation
    (
        lambda b, u, a: f"{random.choice(RELATIONS)}! Bohat bari emergency hai, accident hogya hai hospital me hoon. {u} Rs {a} is JazzCash account par transfer kar do please!",
        {"urgency": 1, "fear_intimidation": 1, "authority_impersonation": 0, "secrecy_isolation": 0, "credential_solicitation": 0}
    ),
    (
        lambda b, u, a: f"Salam yar, mera WhatsApp logout hogya tha, ghalti se verification 6-digit code tumhare number par chala gya hai. {u} jaldi se wo code yahan forward kar do.",
        {"urgency": 1, "fear_intimidation": 0, "authority_impersonation": 0, "secrecy_isolation": 1, "credential_solicitation": 1}
    ),

    # 5. Online Earning & Crypto Doubling Scams
    (
        lambda b, u, a: f"Ghar bethay mobile se daily Rs {a} kamayein! Zero investment, sirf videos like karein. Join karne k liye {u} is link par register karein: https://easy-earning-pak.top/join",
        {"urgency": 0, "fear_intimidation": 0, "authority_impersonation": 0, "secrecy_isolation": 0, "credential_solicitation": 1}
    ),
    (
        lambda b, u, a: f"Crypto Double Scheme: Sirf Rs {a} invest karein aur 24 ghantay me double profit hasil karein 100% guarantee k sath. WhatsApp group join karein.",
        {"urgency": 1, "fear_intimidation": 0, "authority_impersonation": 0, "secrecy_isolation": 0, "credential_solicitation": 1}
    ),
]

# Legitimate Roman Urdu Everyday Conversation Builders
CLEAN_SUBJECTS = ["project", "assignment", "meeting", "lunch", "cricket match", "exam", "office work", "chai", "shopping", "dawat", "biryani", "presentation"]
CLEAN_ACTIONS = [
    "kal kab milna hai?", "kia scene hai sham ka?", "file send kardi hai check kar lo.", "bhai kal class kis time hai?",
    "mene code push kardia hai github pe.", "aaj ka weather bohat acha hai.", "biryani khane chalte hain sham ko.",
    "kal exam ki tayyari kaisi hai?", "office se kitne baje free hoge?", "meeting ka link forward kardo please.",
    "kahan ho bhai reply to karo?", "bhai project ka frontend ready hogya hai.", "laptop ka charger bhool gya hoon me.",
    "apna khayal rakhna aur ghar pohanch k call karna.", "zabardast! bohat maza aya aaj party me.",
    "salam bhai, kaise ho? sab theek thak?", "allah ka shukar hai sab theek hai, aap sunao.",
    "kal shaam ko ground me football match hai.", "mene task complete kar lia hai, pull request review kardo."
]

CLEAN_TEMPLATES = [
    lambda s, a: f"Salam yar! {s.capitalize()} k baray me batana tha, {a}",
    lambda s, a: f"Oye {random.choice(RELATIONS).lower()}, {a}",
    lambda s, a: f"Bhai {s} ka status kia hai? {a}",
    lambda s, a: f"Acha suno, {a} Kal milte hain inshallah.",
    lambda s, a: f"Han yar bilkul sahi keh rahe ho. {a}",
    lambda s, a: f"Zabardast work yar, {s} bohat acha lag raha hai. {a}",
    lambda s, a: f"Hello bhai, {a} Koi help chahiye to batana.",
    lambda s, a: f"Kal subah 10 baje {s} ki discussion hai, time pe aana."
]

def generate_500k_corpus(target_count: int = 500000):
    print(f"\n===================================================================")
    print(f"GENERATING {target_count:,} ROMAN URDU PHISHING & SCAM DATASET")
    print(f"===================================================================")
    
    out_csv = os.path.join(DATA_DIR, "roman_urdu_500k_dataset.csv")
    out_json = os.path.join(DATA_DIR, "social_engineering_dataset.json")
    
    print(f"Target Output CSV: {out_csv}")
    
    # 50% Scam/Phishing, 50% Clean
    scam_target = target_count // 2
    clean_target = target_count - scam_target
    
    records = []
    
    # Generate Scams
    print(f"Synthesizing {scam_target:,} Roman Urdu phishing & scam messages...")
    for i in range(scam_target):
        fn, lbls = random.choice(SCAM_TEMPLATES)
        b = random.choice(BANKS)
        u = random.choice(URGENCY_WORDS)
        a = random.choice(AMOUNTS)
        
        text = fn(b, u, a)
        # Random variations (typos, punctuation, suffix)
        if random.random() < 0.3:
            text += f" Shukriya, {b} Team."
        elif random.random() < 0.2:
            text += f" Helpline: 111-{random.randint(100,999)}-{random.randint(100,999)}"
            
        records.append({
            "text": text,
            "language": "ur-Latn",
            "is_scam": 1,
            "labels": lbls
        })
        
    # Generate Clean Everyday Chats
    print(f"Synthesizing {clean_target:,} Clean everyday Roman Urdu messages...")
    for i in range(clean_target):
        t_fn = random.choice(CLEAN_TEMPLATES)
        s = random.choice(CLEAN_SUBJECTS)
        a = random.choice(CLEAN_ACTIONS)
        
        text = t_fn(s, a)
        if random.random() < 0.25:
            text = f"Asalam o Alaikum! {text}"
            
        records.append({
            "text": text,
            "language": "ur-Latn",
            "is_scam": 0,
            "labels": {
                "urgency": 0,
                "fear_intimidation": 0,
                "authority_impersonation": 0,
                "secrecy_isolation": 0,
                "credential_solicitation": 0
            }
        })
        
    random.shuffle(records)
    print(f"Total Synthesized: {len(records):,} records.")
    
    # Write to CSV (Fast streaming)
    print(f"Writing CSV to {out_csv} ...")
    with open(out_csv, mode='w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(["text", "is_scam", "urgency", "fear_intimidation", "authority_impersonation", "secrecy_isolation", "credential_solicitation"])
        for r in records:
            lbl = r["labels"]
            writer.writerow([
                r["text"],
                r["is_scam"],
                lbl["urgency"],
                lbl["fear_intimidation"],
                lbl["authority_impersonation"],
                lbl["secrecy_isolation"],
                lbl["credential_solicitation"]
            ])
            
    print(f"[DONE] CSV dataset generated: {out_csv} ({os.path.getsize(out_csv):,} bytes)")
    
    # Write 5,000 diverse samples to primary JSON for multi-label neural pipeline
    print(f"Indexing 10,000 multi-label samples into {out_json} ...")
    with open(out_json, mode='w', encoding='utf-8') as f:
        json.dump(records[:10000], f, indent=2, ensure_ascii=False)
        
    return out_csv

if __name__ == "__main__":
    generate_500k_corpus(500000)
