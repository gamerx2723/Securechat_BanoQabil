from typing import Dict, Any, List

class ExplainabilityEngine:
    """
    Generates structured, human-understandable security explanations answering:
    - What happened?
    - Why is it suspicious?
    - What evidence was used?
    - What is the recommended action?
    """
    
    @classmethod
    def generate_explanation(
        cls,
        risk_score: int,
        indicator_color: str,
        phishing_res: Dict[str, Any],
        social_res: Dict[str, Any],
        dlp_res: Dict[str, Any],
        urdu_res: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        
        evidence_points = []
        
        for url_info in phishing_res.get("analyzed_urls", []):
            for sig in url_info.get("signals", []):
                evidence_points.append(f"Deceptive Link: {sig}")
                
        for cat in social_res.get("detected_categories", []):
            evidence_points.append(f"Manipulation Pattern: {cat.replace('_', ' ').title()}")

        if urdu_res and urdu_res.get("scam_detected"):
            for sig in urdu_res.get("signals", []):
                evidence_points.append(sig)
            
        for secret in dlp_res.get("detected_secrets", []):
            evidence_points.append(f"Data Exposure: {secret.get('type', 'Secret')} ({secret.get('snippet', '***')})")

        if indicator_color == "GREEN":
            why = "The message contains normal conversational text without malicious links, urgency coercion, or sensitive data requests."
            recommendation = "No action required. Normal messaging."
        elif indicator_color == "ORANGE":
            why = f"The message exhibits suspicious characteristics: {'; '.join(evidence_points[:2]) if evidence_points else 'Elevated risk anomaly'}."
            recommendation = "Proceed with caution. Verify the sender through a secondary trusted channel before clicking links or sending funds."
        else:
            why = f"High-confidence threat: This message exhibits {'; '.join(evidence_points[:3]) if evidence_points else 'Critical malicious signals'}."
            recommendation = "DO NOT click any links, do NOT share passwords, OTPs, or CNIC, and do NOT send money via Easypaisa/JazzCash. Block the sender immediately."

        return {
            "risk_score": risk_score,
            "indicator_color": indicator_color,
            "evidence_count": len(evidence_points),
            "evidence_list": evidence_points,
            "why_flagged": why,
            "recommendation": recommendation
        }
