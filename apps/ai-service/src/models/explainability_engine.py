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
        dlp_res: Dict[str, Any]
    ) -> Dict[str, Any]:
        
        evidence_points = []
        
        for url_info in phishing_res.get("urls_analyzed", []):
            for r in url_info.get("reasons", []):
                evidence_points.append(f"Deceptive Link: {r}")
                
        for ling in phishing_res.get("linguistic_patterns", []):
            evidence_points.append(f"Suspicious Phrase: '{ling}'")
            
        for cat in social_res.get("detected_categories", []):
            evidence_points.append(f"Manipulation Pattern: {cat.replace('_', ' ').title()}")
            
        for secret in dlp_res.get("detected_secrets", []):
            evidence_points.append(f"Data Exposure: {secret['description']} ({secret['masked_value']})")

        if indicator_color == "GREEN":
            why = "The message contains normal conversational text without malicious links, urgency coercion, or sensitive data requests."
            recommendation = "No action required. Normal messaging."
        elif indicator_color == "ORANGE":
            why = f"The message exhibits suspicious characteristics: {'; '.join(evidence_points[:2])}."
            recommendation = "Proceed with caution. Verify the sender through a secondary trusted channel before clicking links."
        else:
            why = f"High-confidence threat: This message combines {'; '.join(evidence_points)} to deceive the recipient."
            recommendation = "DO NOT click any links, do NOT share passwords or OTPs, and report/block the sender immediately."

        return {
            "risk_score": risk_score,
            "indicator_color": indicator_color,
            "evidence_count": len(evidence_points),
            "evidence_list": evidence_points,
            "why_flagged": why,
            "recommendation": recommendation
        }
