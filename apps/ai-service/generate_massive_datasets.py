import os
import sys
import csv
import random
import time

# Ensure UTF-8 stdout on Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

base_dir = os.path.dirname(os.path.abspath(__file__))
data_dir = os.path.join(base_dir, "data")
os.makedirs(data_dir, exist_ok=True)

print("Starting High-Throughput Multilingual Massive Dataset Generation...")

# ==========================================
# 1. URLS MASSIVE DATASET GENERATOR
# ==========================================
urls_file = os.path.join(data_dir, "urls_massive.csv")

TARGET_DOMAINS = [
    "paypal", "binance", "metamask", "coinbase", "chase", "wellsfargo", "bankofamerica",
    "hbl", "ubl", "mcb", "meezanbank", "easypaisa", "jazzcash", "nayapay", "sadapay",
    "google", "microsoft", "apple", "netflix", "facebook", "instagram", "whatsapp", "telegram",
    "fbr", "nadra", "fia", "pta", "bisp", "ehsaas", "hec"
]

SUSPICIOUS_TLDS = [
    "xyz", "top", "tk", "zip", "cam", "click", "rest", "gq", "cf", "ml", "work", "link",
    "surf", "loan", "club", "info", "online", "site", "fun", "live", "support", "vip", "icu"
]

SAFE_DOMAINS = [
    "google.com", "github.com", "wikipedia.org", "youtube.com", "microsoft.com", "apple.com",
    "amazon.com", "cloudflare.com", "fastapi.tiangolo.com", "react.dev", "nodejs.org",
    "gov.pk", "hec.gov.pk", "nadra.gov.pk", "fbr.gov.pk", "hbl.com", "easypaisa.com.pk",
    "jazzcash.com.pk", "meezanbank.com", "nayapay.com", "sadapay.pk", "stackoverflow.com"
]

ACTION_PATHS = [
    "login", "verify-account", "auth-session", "confirm-pin", "claim-reward", "update-kyc",
    "unlock-card", "portal/security", "2fa-verification", "dispute-resolution", "withdraw-funds",
    "sync-wallet", "reset-password", "otp-validation", "secure-gateway"
]

def generate_urls_dataset(count=50000):
    print(f"Generating {count} Massive URL Dataset...")
    with open(urls_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["url", "label"]) # 1 = Phishing, 0 = Safe
        
        # 50% Phishing, 50% Safe
        half = count // 2
        for _ in range(half):
            target = random.choice(TARGET_DOMAINS)
            tld = random.choice(SUSPICIOUS_TLDS)
            path = random.choice(ACTION_PATHS)
            style = random.randint(1, 5)
            if style == 1:
                u = f"https://{target}-verify-security.{tld}/{path}"
            elif style == 2:
                u = f"http://secure-login.{target}.account-update.{tld}/{path}?token={random.randint(100000, 999999)}"
            elif style == 3:
                u = f"https://portal-{target}.com.{tld}/auth?redirect=https://{target}.com"
            elif style == 4:
                u = f"http://{random.randint(11, 210)}.{random.randint(1, 254)}.{random.randint(1, 254)}.{random.randint(1, 254)}/{target}/{path}"
            else:
                u = f"https://{target.replace('a', '4').replace('e', '3').replace('o', '0')}-portal.{tld}/{path}"
            writer.writerow([u, 1])

        for _ in range(half):
            domain = random.choice(SAFE_DOMAINS)
            path = random.choice(["about", "docs", "help", "contact", "blog", "terms", "explore", "search", "articles"])
            u = f"https://{domain}/{path}?id={random.randint(1, 9999)}"
            writer.writerow([u, 0])
    print(f"-> Generated {urls_file}")

# ==========================================
# 2. SOCIAL ENGINEERING (ENGLISH) MASSIVE DATASET
# ==========================================
social_file = os.path.join(data_dir, "social_eng_massive.csv")

SE_THREAT_TEMPLATES = [
    "URGENT: Your {bank} account has been suspended due to suspicious activity. Verify now: {url} or face permanent deletion.",
    "Security Alert: A new device logged into your {company} profile from Moscow. If this was not you, confirm your credentials immediately: {url}",
    "HR Department Notice: Your monthly payroll bonus and stipend has been approved. Download the employee verification document: {url}",
    "Final Warning: Internal Revenue / FIA penalty of $500 issued against your CNIC. Pay fine within 2 hours to avoid arrest warrant: {url}",
    "Help me please! I lost my phone in an emergency accident and I am stranded at the hospital. Send money to my account immediately!",
    "Congratulations! You won the 2026 Global Tech Giveaway lottery of $50,000. Send your identity details and claim fee here: {url}",
    "IT Support: System maintenance in progress. Do not verify with management, reply with your login password and 2FA code right now.",
    "Executive Wire Request: Transfer $12,500 to our contractor account right now before close of business. Keep this strictly confidential.",
    "Crypto AirDrop: Free 5,000 USDT tokens allocated to your wallet. Connect your seed phrase to claim now: {url}",
    "Parcel Delivery Failed: Your shipment package has a pending customs clearance fee of $4.50. Pay immediately to release: {url}"
]

CLEAN_ENGLISH_TEMPLATES = [
    "Hi, please send me the updated quarterly report when you get a chance.",
    "Can you send the presentation slides before our 3 PM meeting?",
    "Hey! Are we still meeting for lunch today at the cafeteria?",
    "I will send you the document tomorrow morning after reviewing the feedback.",
    "Did you send the calendar invite to the marketing team?",
    "Thank you so much for your assistance with the deployment today.",
    "Good morning team, let us review the sprint roadmap on our sync call.",
    "Please find attached the receipt for the office supplies purchase.",
    "Could you send me your availability for next week's design review?",
    "Great work on finishing the security audit ahead of schedule!"
]

def generate_social_eng_dataset(count=50000):
    print(f"Generating {count} Massive English Social Engineering Dataset...")
    with open(social_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["text", "label", "category"])
        
        half = count // 2
        for _ in range(half):
            tpl = random.choice(SE_THREAT_TEMPLATES)
            bank = random.choice(["Chase", "Bank of America", "Wells Fargo", "PayPal", "Binance", "HBL", "Meezan"])
            comp = random.choice(["Microsoft", "Google", "Apple", "Amazon", "Internal IT", "HR Portal"])
            u = f"https://security-{random.choice(TARGET_DOMAINS)}.{random.choice(SUSPICIOUS_TLDS)}/auth"
            msg = tpl.format(bank=bank, company=comp, url=u)
            writer.writerow([msg, 1, "SOCIAL_ENGINEERING"])

        for _ in range(half):
            msg = random.choice(CLEAN_ENGLISH_TEMPLATES)
            if random.random() > 0.5:
                msg = f"{msg} (Ref #{random.randint(100, 999)})"
            writer.writerow([msg, 0, "SAFE"])
    print(f"-> Generated {social_file}")

# ==========================================
# 3. ROMAN URDU SCAMS & FRAUD MASSIVE DATASET
# ==========================================
roman_file = os.path.join(data_dir, "roman_urdu_scams_massive.csv")

ROMAN_SCAM_TEMPLATES = [
    "Muaziz Sarif: Aapka {service} account block ho chuka hai. Foran helpline {phone} pe call karein ya apna OTP share karein.",
    "BISP Benazir Income Support Program: Mubarak ho! Aapko 25000 Rs ki mali imdad manzoor ho gayi hai. Apna CNIC aur pin send karein.",
    "Jeeto Pakistan Tariq Jamil scheme: Aapka 5 tola sona aur 10 lakh inam nikla hai. Delivery charges 5000 rs Easypaisa pe send karein.",
    "FIA Cyber Crime Wing Notice: Aapke number se ghair qanooni activities record hui hain. Giraftari se bachne k liye foran jurmana ada karein.",
    "Urgent bhai main hospital main phans gaya hun hadsa ho gaya hai foran 10000 rs easypaisa ya jazzcash kar do zaroori hai.",
    "Ehsaas Rashan Riayat: 12000 rupay ka muft rashan hasil karne k liye foran is link pe click karein aur apna shanakhti card number likhein: {url}",
    "Bank Alert: Aapka ATM card band hone wala hai. Foran tasdeeqi code aur expiry date send karein.",
    "Ghar bethay rozana 5000 se 10000 kamayein baghair kisi mehnat k. Registration fee sirf 1500 rs send karein is number pe: {phone}",
    "PTA Mobile Registration: Aapka phone 24 ghante main block ho jayega. PTA tax foran is account main jama karwayein.",
    "Lucky Draw winner: Aapki family k liye Umrah package nikla hai. Confirmation k liye apna bank account number aur OTP foran bataein."
]

CLEAN_ROMAN_TEMPLATES = [
    "Salam bhai, kal assignment submit karni hai time pe send kar dena.",
    "Kahan ho bhai? Sham ko cricket khelnay chalain ge?",
    "Theek hai main thori der main ghar pohanch kar tasveer send karta hun.",
    "Khana kha liya aap ne? Ammi ko bol dena main late aunga.",
    "Bhai please mujhe project ki report send kar dena jab free ho.",
    "Shukriya bhai aap ki madad ka, kal office main mulaqat hoti hai.",
    "Assalam o alaikum, sab theek thaak hain ghar pe?",
    "Main kal university nahi a sakunga meri tabiyat theek nahi hai.",
    "Haan bhai payment receive ho gayi thi shukriya.",
    "Kal meeting ka time 4 bajay fix hua hai sab ko bata dena."
]

def generate_roman_urdu_dataset(count=50000):
    print(f"Generating {count} Massive Roman Urdu Dataset...")
    with open(roman_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["text", "label", "category"])
        
        half = count // 2
        for _ in range(half):
            tpl = random.choice(ROMAN_SCAM_TEMPLATES)
            srv = random.choice(["Easypaisa", "JazzCash", "HBL", "Meezan Bank", "UBL", "NayaPay", "SadaPay"])
            ph = f"03{random.randint(0, 4)}{random.randint(1000000, 9999999)}"
            u = f"http://portal-verify.{random.choice(SUSPICIOUS_TLDS)}/urdu"
            msg = tpl.format(service=srv, phone=ph, url=u)
            writer.writerow([msg, 1, "ROMAN_URDU_SCAM"])

        for _ in range(half):
            msg = random.choice(CLEAN_ROMAN_TEMPLATES)
            writer.writerow([msg, 0, "SAFE"])
    print(f"-> Generated {roman_file}")

# ==========================================
# 4. PURE URDU (NASTALIQ SCRIPT) MASSIVE DATASET
# ==========================================
pure_urdu_file = os.path.join(data_dir, "pure_urdu_scams_massive.csv")

PURE_URDU_SCAMS = [
    "معزز صارف: آپ کا ایزی پیسہ / جاز کیش اکاؤنٹ معطل کر دیا گیا ہے۔ بحالی کے لیے فوری طور پر او ٹی پی اور شناختی کارڈ بھیجیں۔",
    "بے نظیر انکم سپورٹ پروگرام: مبارک ہو! آپ کو 25,000 روپے کی مالی امداد منظور ہو گئی ہے۔ رقم وصول کرنے کے لیے فوری رابطہ کریں۔",
    "جیتو پاکستان فاؤنڈیشن: مبارک ہو آپ کا 10 لاکھ روپے اور 5 تولہ سونے کا انعام نکلا ہے۔ پارسل چارجز فوری ایزی پیسہ کریں۔",
    "ایف آئی اے سائبر کرائم نوٹس: آپ کے اکاؤنٹ سے مشکوک ٹرانزیکشنز رپورٹ ہوئی ہیں۔ گرفتاری سے بچنے کے لیے جرمانہ ادا کریں۔",
    "ہنگامی ضرورت: میرا ہسپتال میں ایکسیڈنٹ ہو گیا ہے اور پیسوں کی سخت ضرورت ہے۔ فوری 10,000 روپے بھیج دیں۔",
    "احساس راشن پروگرام: حکومت پاکستان کی طرف سے مفت راشن اور 12,000 روپے کی سبسڈی حاصل کرنے کے لیے اپنا شناختی کارڈ درج کریں۔",
    "بینک ہیلپ لائن: آپ کا اے ٹی ایم کارڈ سیکیورٹی وجوہات کی بنا پر بلاک ہو رہا ہے۔ فوری اپنا پاس ورڈ اور پن کوڈ تصدیق کریں۔",
    "مبارک ہو آپ کا عمرہ پیکج قرعہ اندازی میں نکل آیا ہے۔ تصدیق کے لیے فوری اپنا 4 ہندسوں کا کوڈ بتائیں۔"
]

CLEAN_PURE_URDU = [
    "السلام علیکم بھائی، کیسے ہیں آپ؟ گھر پر سب خیریت ہے؟",
    "برائے مہربانی آج کی میٹنگ کی فائل اور رپورٹ مجھے بھیج دیں۔",
    "کل شام کو کھانا ساتھ کھائیں گے، آپ وقت پر پہنچ جانا۔",
    "آپ کا بہت شکریہ، میں کل صبح آفس آ کر باقی کام مکمل کر لوں گا۔",
    "کیا آپ نے کل والے پراجیکٹ کا ڈرافٹ دیکھ لیا ہے؟",
    "الحمدللہ سب خیریت سے ہیں، آپ سنائیں کیسا چل رہا ہے کام؟",
    "استاد محترم کی طرف سے اسائنمنٹ جمع کروانے کی آخری تاریخ کل ہے۔",
    "میں کچھ دیر میں آپ کو کال کرتا ہوں ابھی راستے میں ہوں۔"
]

def generate_pure_urdu_dataset(count=50000):
    print(f"Generating {count} Massive Pure Urdu Dataset...")
    with open(pure_urdu_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["text", "label", "category"])
        
        half = count // 2
        for _ in range(half):
            msg = random.choice(PURE_URDU_SCAMS)
            msg = f"{msg} (ریفرنس نمبر: {random.randint(10000, 99999)})"
            writer.writerow([msg, 1, "PURE_URDU_SCAM"])

        for _ in range(half):
            msg = random.choice(CLEAN_PURE_URDU)
            writer.writerow([msg, 0, "SAFE"])
    print(f"-> Generated {pure_urdu_file}")

# ==========================================
# 5. BILINGUAL / CODE-SWITCHED MASSIVE DATASET
# ==========================================
bilingual_file = os.path.join(data_dir, "bilingual_threats_massive.csv")

BILINGUAL_THREATS = [
    "URGENT: Easypaisa account block honay wala hai. Please verify your OTP immediately on http://portal-verify.xyz/login",
    "Security Alert: Your JazzCash wallet login failed. Foran apna 4 digit PIN aur CNIC number send karein to unlock.",
    "BISP 25000 rupees approved! Click this link to confirm your bank account credentials: https://bisp-aid.top/claim",
    "FIA Cyber Alert: Arrest warrant ready against CNIC {cnic}. Pay fine via online transfer right now to cancel FIR.",
    "Emergency! Bhai my car got in an accident near hospital, please transfer 15000 rs immediately via SadaPay/NayaPay."
]

CLEAN_BILINGUAL = [
    "Hi brother, please send the presentation slides kal sham tak.",
    "Can you share the report with me? Main kal office a kar review kar lunga.",
    "Did you receive the email from HR regarding quarterly appraisal?",
    "Salam, let us connect on Zoom at 4 PM for project discussion.",
    "Thank you so much! Main document check kar k update deta hun."
]

def generate_bilingual_dataset(count=50000):
    print(f"Generating {count} Massive Bilingual Dataset...")
    with open(bilingual_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["text", "label", "category"])
        
        half = count // 2
        for _ in range(half):
            tpl = random.choice(BILINGUAL_THREATS)
            cnic = f"42{random.randint(100, 999)}-{random.randint(1000000, 9999999)}-{random.randint(1, 9)}"
            msg = tpl.format(cnic=cnic)
            writer.writerow([msg, 1, "BILINGUAL_THREAT"])

        for _ in range(half):
            msg = random.choice(CLEAN_BILINGUAL)
            writer.writerow([msg, 0, "SAFE"])
    print(f"-> Generated {bilingual_file}")

if __name__ == "__main__":
    t0 = time.time()
    generate_urls_dataset(50000)
    generate_social_eng_dataset(50000)
    generate_roman_urdu_dataset(50000)
    generate_pure_urdu_dataset(50000)
    generate_bilingual_dataset(50000)
    print(f"\nAll 5 Massive Multilingual Datasets generated successfully in {round(time.time() - t0, 2)}s!")
