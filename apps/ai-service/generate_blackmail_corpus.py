"""
SecureChat — Blackmail, Sextortion & Coercive Media Corpus Generator
Generates realistic, diverse samples of:
1. Cyber-Blackmail & Non-Consensual Image Leak Threats (Roman Urdu, English, Urdu Script)
2. Coercive Private/Intimate Media Demands & Emotional Manipulation
3. Benign Relationship & Friendly Control Conversations (to guarantee zero false positives on normal chats)
"""

import os
import sys
import csv
import random

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(__file__)
DATA_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)
OUT_PATH = os.path.join(DATA_DIR, "blackmail_sextortion_massive.csv")

TARGETS = ["teri", "tumhari", "apki", "uski"]
MEDIA_TYPES = ["pics", "pictures", "photos", "tasveerein", "videos", "recordings", "clips", "private photos"]
PLATFORMS = ["Facebook", "TikTok", "Instagram", "social media", "internet", "WhatsApp group", "YouTube"]
RELATIVES = ["abba", "abbu", "bhai", "walid", "ammi", "family", "rishtedaron", "ghar walon", "cousins"]
VENUES = ["college", "university", "school", "office", "mohallay", "class group"]
ACTIONS = ["viral kar dunga", "leak kar dunga", "upload kar dunga", "post kar dunga", "send kar dunga", "bhej dunga", "dikhaunga"]
DEMANDS = [
    "warna aur pics send karo",
    "warna 50 hazar JazzCash karo",
    "warna Easypaisa karo foran",
    "warna video call par kapray utaro",
    "warna jo kahoon wo karo",
    "warna tumhari zindagi barbad kar dunga",
    "warna saboot samnay le aunga",
    "last warning de raha hoon"
]

BLACKMAIL_TEMPLATES_ROMAN = [
    lambda t, m, p, r, v, a, d: f"{t.capitalize()} {m} {p} pe {a}, {d}.",
    lambda t, m, p, r, v, a, d: f"Agar meri baat na maani to {t} {m} {r} ko {a}.",
    lambda t, m, p, r, v, a, d: f"{v.capitalize()} mein sab ko {t} {m} {a}, samajh aayi?",
    lambda t, m, p, r, v, a, d: f"Mere paas {t} sari {m} save hain. {d} warna sab ko bhej doonga.",
    lambda t, m, p, r, v, a, d: f"Abhi ke abhi baat maano warna {t} sari recordings {p} pe upload ho jayengi.",
    lambda t, m, p, r, v, a, d: f"Tumhe kya lagta hai delete karne se bach jaogi? {t} {m} {r} k samne rakhunga.",
    lambda t, m, p, r, v, a, d: f"{d.capitalize()} warna kal subah {t} {m} har jagah viral hongi.",
]

COERCION_TEMPLATES_ROMAN = [
    "apni private pic send karo foran warna breakup kar loonga",
    "agar sach mein mujh se pyar karti ho to tasveer bhejo bina kapron k",
    "camera kholo aur kapray utaro, prove your love to me",
    "kisi ko mat batana ye hamara secret hai, pic bhejo abhi",
    "tasveer bhejo warna main tum se baat nahi karunga kabhi",
    "tum mujh par trust nahi karti? private video bana kar send karo",
    "meri khatir aik photo send nahi kar sakti? abhi bhejo foran",
    "nude send karo jaldi, koi nahi dekhega main foran delete kar dunga",
    "agar pyar ka saboot dena hai to tasveerein share karo",
    "room lock karo aur video call pe kapray utaro",
    "kisi dost ya ammi ko na batana, bas aik pic send kardo",
]

BLACKMAIL_TEMPLATES_EN = [
    "I will leak your private pictures on Instagram if you do not reply to me right now.",
    "Send $500 to my account or your nudes will be forwarded to your father and brother.",
    "I have saved all your intimate recordings. Do as I say or your life is ruined.",
    "Your photos will be posted on Facebook and sent to everyone in your college by tomorrow.",
    "Do not test me, I will leak everything on the internet and destroy your reputation.",
    "Send more pictures immediately or I am uploading your folder to social media.",
    "Your family will see what you have done unless you transfer the money today.",
]

COERCION_TEMPLATES_EN = [
    "If you really love me, prove it and send me a private photo.",
    "Send a nude right now or we are breaking up.",
    "Turn on your camera and take off your clothes, keep it our little secret.",
    "You said you trusted me, so send an intimate pic or I'll know you lied.",
    "Don't tell your friends, just send me one spicy picture and I'll delete it.",
    "Prove your love by sending your private picture right now.",
]

URDU_SCRIPT_SAMPLES = [
    ("تمہاری تصویریں فیس بک پر وائرل کر دوں گا اگر پیسے نہ دیے", 1),
    ("تیری تمام ذاتی ویڈیوز تیرے والد اور بھائی کو بھیج دوں گا", 1),
    ("اگر مجھ سے محبت ہے تو برہنہ تصویر بھیجو ابھی کے ابھی", 1),
    ("سب کو کالج میں دکھاؤں گا تمہاری ویڈیوز، برباد ہو جاؤ گی", 1),
    ("کیمرہ آن کرو اور کپڑے اتارو، ثبوت دو کہ تم مجھ سے پیار کرتی ہو", 1),
    ("میرے پاس تمہاری ریکارڈنگز محفوظ ہیں، جو کہوں گا وہی کرو گی", 1),
    ("کسی کو مت بتانا، یہ راز ہے، بس ایک تصویر بھیج دو", 1),
    ("سب رشتے داروں کو واٹس ایپ پر تمہاری تصویریں فارورڈ کروں گا", 1),
]

BENIGN_ROMANTIC_AND_NORMAL = [
    "salam jan, kahan ho aap? khana kha liya?",
    "i love you so much, thank you for always supporting me",
    "kal university mein milte hain library k bahar",
    "main ghar pohanch gaya hoon, aap apna khayal rakhna",
    "ammi puch rahi theen k paper kaisa hua?",
    "let us study together for tomorrow's exam",
    "happy anniversary to the best person in my life",
    "send me the lecture notes when you get free please",
    "can you send the photo of the food you cooked?",
    "bhai ko bolna k mujhe call karein jab free hon",
    "i am really sorry for arguing with you earlier, let us talk calmly",
    "can you please share the assignment pdf on whatsapp?",
    "tum bohot achi ho, hamesha khush raho",
    "main thora busy hoon office mein, shaam ko call karta hoon",
    "allah hafiz, take care of yourself!",
    "breakup karna chahta hoon kyun k hamare beech understanding nahi hai, all the best for your future",
    "let us part ways respectfully, no hard feelings between us",
    "send the picture of the presentation slides from the whiteboard",
    "salam ammi, main late ho jaunga thora dost k sath hoon",
]

def generate_corpus(num_samples=25000):
    rows = []

    # 1. Threat / Blackmail / Coercion Samples (Label 1)
    print("Generating Blackmail & Sextortion threat vectors...")
    threat_samples = []
    
    # Roman Urdu dynamic synthesis
    for _ in range(num_samples // 4):
        t = random.choice(TARGETS)
        m = random.choice(MEDIA_TYPES)
        p = random.choice(PLATFORMS)
        r = random.choice(RELATIVES)
        v = random.choice(VENUES)
        a = random.choice(ACTIONS)
        d = random.choice(DEMANDS)
        template = random.choice(BLACKMAIL_TEMPLATES_ROMAN)
        threat_samples.append(template(t, m, p, r, v, a, d))

    # Roman Urdu Coercion
    for _ in range(num_samples // 8):
        c = random.choice(COERCION_TEMPLATES_ROMAN)
        threat_samples.append(c)

    # English Blackmail & Coercion
    for _ in range(num_samples // 8):
        b = random.choice(BLACKMAIL_TEMPLATES_EN)
        threat_samples.append(b)
        c = random.choice(COERCION_TEMPLATES_EN)
        threat_samples.append(c)

    # Urdu Script threats
    for _ in range(num_samples // 16):
        u, _ = random.choice(URDU_SCRIPT_SAMPLES)
        threat_samples.append(u)

    for text in threat_samples:
        rows.append((text, 1))

    # 2. Benign Romantic, Breakup & Everyday Friendly Samples (Label 0)
    print("Generating Benign Control conversations...")
    benign_samples = []
    while len(benign_samples) < len(threat_samples):
        b = random.choice(BENIGN_ROMANTIC_AND_NORMAL)
        # Add natural conversational variations
        prefix = random.choice(["", "hey, ", "salam, ", "yaar, ", "bhai, ", "sunno, "])
        suffix = random.choice(["", " :)", " take care", " thanks", " reply soon", " ok?"])
        benign_samples.append(f"{prefix}{b}{suffix}".strip())

    for text in benign_samples:
        rows.append((text, 0))

    random.shuffle(rows)

    print(f"Writing {len(rows):,} samples to {OUT_PATH}...")
    with open(OUT_PATH, mode="w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["text", "label"])
        for r in rows:
            writer.writerow([r[0], r[1]])

    print(f"✅ Successfully created {OUT_PATH} ({len(rows):,} records, {len(threat_samples):,} threat / {len(benign_samples):,} benign).")

if __name__ == "__main__":
    generate_corpus(25000)
