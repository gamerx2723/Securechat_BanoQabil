import sys
import unittest

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from src.models.phishing_detector import PhishingDetector
from src.models.social_engineering_detector import SocialEngineeringDetector
from src.models.dlp_detector import DlpDetector
from src.models.context_engine import ConversationContextEngine
from src.models.explainability_engine import ExplainabilityEngine

class TestSecureChatAiService(unittest.TestCase):
    
    def test_phishing_detector_homoglyph_and_brand(self):
        sample = "Verify immediately: https://paypa1-update.xyz/login"
        res = PhishingDetector.analyze_text_and_urls(sample)
        self.assertTrue(res["phishing_detected"])
        self.assertGreaterEqual(res["phishing_confidence"], 0.70)
        print("[PASS] AI Test 1: Phishing detector brand spoofing & lookalike analysis")

    def test_social_engineering_multilingual(self):
        roman_urdu_sample = "Bhai jaldi se apna password send karo account verify karna hai"
        res = SocialEngineeringDetector.classify(roman_urdu_sample)
        self.assertIn("urgency", res["detected_categories"])
        self.assertIn("credential_solicitation", res["detected_categories"])
        self.assertGreaterEqual(res["social_engineering_index"], 0.60)
        print("[PASS] AI Test 2: Social engineering multilingual multi-label classification")

    def test_dlp_detector_aws_and_jwt(self):
        secret_sample = "Here is my dev AWS token: AKIAIOSFODNN7EXAMPLE and JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.t-IDcSemACt8x4iTMCda8Yhe3iZaWbvV5XKSTbuAn0M"
        res = DlpDetector.scan(secret_sample)
        self.assertTrue(res["has_sensitive_data"])
        self.assertEqual(len(res["detected_secrets"]), 2)
        print("[PASS] AI Test 3: DLP detector secret scanning & masking")

    def test_conversation_context_escalation(self):
        conversation = [
            "Hey how are you doing today?",
            "I noticed an issue with the payroll server.",
            "Urgent: You need to log into https://security-patch.xyz/login before 5pm or access will be revoked.",
            "Send me your OTP once you receive it."
        ]
        res = ConversationContextEngine.evaluate_history(conversation)
        self.assertEqual(res["security_state"], "RED")
        self.assertGreaterEqual(res["risk_score"], 80)
        self.assertEqual(len(res["timeline"]), 4)
        print("[PASS] AI Test 4: Multi-turn conversation risk timeline escalation")

if __name__ == "__main__":
    unittest.main()
