import {
  SecurityAnalysisResult,
  SecurityIndicatorColor,
  ThreatCategory,
  ThreatEvidence,
} from '@securechat/types';
import { DlpScanner } from '../dlp/dlp_scanner.js';
import { UrlAnalyzer } from '../url/url_analyzer.js';
import { SocialEngineeringScanner } from '../social/social_patterns.js';

export class RiskEngine {
  /**
   * Evaluates a message using the multi-tier deterministic security pipeline.
   */
  public static evaluateMessage(
    text: string,
    params?: {
      senderTrustScore?: number; // 0 - 100 (100 = verified)
      isKnownContact?: boolean;
    }
  ): SecurityAnalysisResult {
    const evidenceList: ThreatEvidence[] = [];
    let accumulatedRisk = 0;

    // 1. DLP Scan
    const dlpResult = DlpScanner.scan(text);
    if (dlpResult.hasSensitiveData) {
      accumulatedRisk += 40;
      for (const item of dlpResult.detectedItems) {
        evidenceList.push({
          category: 'DLP_SECRET_EXPOSURE',
          signal: item.type,
          confidence: 0.95,
          detectionBasis: 'DETERMINISTIC_RULE',
          description: item.warning,
        });
      }
    }

    // 2. URL Analysis
    const urls = UrlAnalyzer.extractUrls(text);
    const analyzedUrls = urls.map(u => UrlAnalyzer.analyzeUrl(u));
    for (const urlInfo of analyzedUrls) {
      if (urlInfo.suspiciousScore > 20) {
        accumulatedRisk += urlInfo.suspiciousScore * 0.8;
        evidenceList.push({
          category: urlInfo.typoBrandTarget ? 'PHISHING' : 'MALICIOUS_URL',
          signal: `URL:${urlInfo.domain}`,
          confidence: urlInfo.suspiciousScore / 100,
          detectionBasis: 'DETERMINISTIC_RULE',
          description: urlInfo.reasons.join('; '),
        });
      }
    }

    // 3. Social Engineering Cues
    const socialEvidence = SocialEngineeringScanner.scan(text);
    for (const item of socialEvidence) {
      evidenceList.push(item);
      accumulatedRisk += item.confidence * 35;
    }

    // 4. Combined Threat Logic (e.g. Urgency + Suspicious URL = High confidence Phishing)
    const hasUrgency = evidenceList.some(e => e.category === 'URGENCY_MANIPULATION');
    const hasSuspiciousUrl = analyzedUrls.some(u => u.suspiciousScore >= 40);
    const hasCredentialRequest = evidenceList.some(e => e.category === 'CREDENTIAL_HARVESTING');

    if (hasUrgency && hasSuspiciousUrl) {
      accumulatedRisk += 30;
      evidenceList.push({
        category: 'PHISHING',
        signal: 'COMPOUND_URGENCY_URL',
        confidence: 0.92,
        detectionBasis: 'DETERMINISTIC_RULE',
        description: 'Compound threat pattern: Combines artificial urgency with an external unverified link.',
      });
    }

    if (hasUrgency && hasCredentialRequest) {
      accumulatedRisk += 35;
      evidenceList.push({
        category: 'CREDENTIAL_HARVESTING',
        signal: 'COMPOUND_URGENCY_CREDENTIALS',
        confidence: 0.95,
        detectionBasis: 'DETERMINISTIC_RULE',
        description: 'High-risk pattern: Direct solicitation of confidential credentials accompanied by urgency pressure.',
      });
    }

    // Clamp score 0 - 100
    const finalScore = Math.min(100, Math.round(accumulatedRisk));

    // Determine Indicator Color
    let indicatorColor: SecurityIndicatorColor = 'GREEN';
    if (finalScore >= 80) {
      indicatorColor = 'RED';
    } else if (finalScore >= 25) {
      indicatorColor = 'ORANGE';
    }

    // Determine Primary Threat
    let primaryThreat: ThreatCategory = 'SAFE';
    if (evidenceList.length > 0) {
      const topEvidence = [...evidenceList].sort((a, b) => b.confidence - a.confidence)[0];
      primaryThreat = topEvidence.category;
    }

    // Generate Human-Readable Explanation
    const explanation = this.generateExplanation(finalScore, indicatorColor, evidenceList);
    const recommendation = this.generateRecommendation(indicatorColor, primaryThreat);

    // Suggested Actions
    const suggestedActions: SecurityAnalysisResult['suggestedActions'] = [];
    if (indicatorColor === 'RED') {
      suggestedActions.push('BLOCK_LINK', 'BLOCK_SENDER', 'REPORT_MESSAGE', 'ASK_COPILOT');
    } else if (indicatorColor === 'ORANGE') {
      suggestedActions.push('ASK_COPILOT', 'CONTINUE_ANYWAY', 'REPORT_MESSAGE');
    } else {
      suggestedActions.push('ASK_COPILOT');
    }

    return {
      riskScore: finalScore,
      indicatorColor,
      primaryThreat,
      confidence: finalScore === 0 ? 98 : Math.min(99, Math.round(50 + finalScore / 2)),
      evidenceList,
      explanation,
      recommendation,
      suggestedActions,
      detectedSecrets: dlpResult.detectedItems.map(i => ({ type: i.type, snippet: i.maskedSnippet })),
      analyzedUrls,
    };
  }

  private static generateExplanation(
    riskScore: number,
    color: SecurityIndicatorColor,
    evidence: ThreatEvidence[]
  ): string {
    if (color === 'GREEN') {
      return 'No significant security risks, credential solicitations, or deceptive links detected in this message.';
    }

    const reasons = evidence.map(e => `• ${e.description}`).join('\n');
    return `Security analysis identified ${evidence.length} risk factor(s) (Risk Score: ${riskScore}/100):\n${reasons}`;
  }

  private static generateRecommendation(
    color: SecurityIndicatorColor,
    threat: ThreatCategory
  ): string {
    if (color === 'GREEN') {
      return 'Message appears safe. Standard security practices apply.';
    }
    if (color === 'RED') {
      return 'CAUTION: High risk detected. Do not click links, do not share OTPs/passwords, and do not execute attachments.';
    }
    return 'Exercise caution. Verify the sender through an independent channel before proceeding or interacting with links.';
  }
}
