import {
  SecurityAnalysisResult,
  SecurityIndicatorColor,
  ThreatCategory,
  ThreatEvidence,
} from '@securechat/types';
import { DlpScanner } from '../dlp/dlp_scanner.js';
import { UrlAnalyzer } from '../url/url_analyzer.js';
import { SocialEngineeringScanner } from '../social/social_patterns.js';
import { ZeroDayReasoner } from '../logic/zero_day_reasoner.js';

export class RiskEngine {
  /**
   * Evaluates a message using the multi-tier deterministic and zero-day cognitive security pipeline.
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

    // 1. Zero-Day Cognitive Intent & Invariant Analysis (Logic-Based Reasoning)
    const zeroDayResult = ZeroDayReasoner.evaluateZeroDay(text);
    if (zeroDayResult.zeroDayThreatDetected) {
      accumulatedRisk += zeroDayResult.cognitiveRiskScore * 0.85;
      for (const sig of zeroDayResult.intentSignals) {
        evidenceList.push(sig);
      }
    }

    // 2. DLP Secret & Credential Scan
    const dlpResult = DlpScanner.scan(text);
    if (dlpResult.hasSensitiveData) {
      accumulatedRisk += 45;
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

    // 3. Structural URL Analysis
    const urls = UrlAnalyzer.extractUrls(text);
    const analyzedUrls = urls.map(u => UrlAnalyzer.analyzeUrl(u));
    for (const urlInfo of analyzedUrls) {
      if (urlInfo.suspiciousScore > 20) {
        const weight = urlInfo.suspiciousScore >= 50 ? 1.0 : 0.8;
        accumulatedRisk += urlInfo.suspiciousScore * weight;
        evidenceList.push({
          category: (urlInfo.typoBrandTarget || urlInfo.suspiciousScore >= 45) ? 'PHISHING' : 'MALICIOUS_URL',
          signal: `URL:${urlInfo.domain}`,
          confidence: Math.max(0.85, urlInfo.suspiciousScore / 100),
          detectionBasis: 'DETERMINISTIC_RULE',
          description: urlInfo.reasons.join('; '),
        });
      }
    }

    // 4. Social Engineering & Manipulation Patterns
    const socialEvidence = SocialEngineeringScanner.scan(text);
    for (const item of socialEvidence) {
      evidenceList.push(item);
      accumulatedRisk += item.confidence * 35;
    }

    // 5. Compound Threat Logic
    const hasUrgency = evidenceList.some(e => e.category === 'URGENCY_MANIPULATION' || e.signal === 'ACTION_PRESSURE_COMPOUND');
    const hasSuspiciousUrl = analyzedUrls.some(u => u.suspiciousScore >= 35) || evidenceList.some(e => e.signal === 'UNTRUSTED_AUTH_ENDPOINT' || e.signal === 'OPEN_REDIRECT_INJECTION');
    const hasCredentialRequest = evidenceList.some(e => e.category === 'CREDENTIAL_HARVESTING' || e.signal === 'SECURITY_BYPASS_ATTEMPT');

    if (hasUrgency && hasSuspiciousUrl) {
      accumulatedRisk += 35;
      evidenceList.push({
        category: 'PHISHING',
        signal: 'COMPOUND_URGENCY_URL',
        confidence: 0.95,
        detectionBasis: 'CONTEXT_ANALYSIS',
        description: 'Compound threat pattern: Combines artificial urgency pressure with an unverified destination link.',
      });
    }

    if (hasUrgency && hasCredentialRequest) {
      accumulatedRisk += 40;
      evidenceList.push({
        category: 'CREDENTIAL_HARVESTING',
        signal: 'COMPOUND_URGENCY_CREDENTIALS',
        confidence: 0.98,
        detectionBasis: 'CONTEXT_ANALYSIS',
        description: 'High-risk pattern: Direct solicitation of confidential credentials accompanied by urgency pressure.',
      });
    }

    // High confidence zero-day floor
    if (zeroDayResult.cognitiveRiskScore >= 60 || analyzedUrls.some(u => u.suspiciousScore >= 55 || u.typoBrandTarget)) {
      accumulatedRisk = Math.max(accumulatedRisk, 80);
    }

    // Clamp score 0 - 100
    const finalScore = Math.min(100, Math.round(accumulatedRisk));

    // Determine Indicator Color
    let indicatorColor: SecurityIndicatorColor = 'GREEN';
    if (finalScore >= 75) {
      indicatorColor = 'RED';
    } else if (finalScore >= 25) {
      indicatorColor = 'ORANGE';
    }

    // Determine Primary Threat
    let primaryThreat: ThreatCategory = 'SAFE';
    if (evidenceList.length > 0) {
      const phishingEv = evidenceList.find(e => e.category === 'PHISHING');
      const dlpEv = evidenceList.find(e => e.category === 'DLP_SECRET_EXPOSURE');
      const credEv = evidenceList.find(e => e.category === 'CREDENTIAL_HARVESTING');

      if (phishingEv && finalScore >= 50) {
        primaryThreat = 'PHISHING';
      } else if (credEv && finalScore >= 50) {
        primaryThreat = 'CREDENTIAL_HARVESTING';
      } else if (dlpEv && finalScore >= 40) {
        primaryThreat = 'DLP_SECRET_EXPOSURE';
      } else {
        const topEvidence = [...evidenceList].sort((a, b) => b.confidence - a.confidence)[0];
        primaryThreat = topEvidence.category;
      }
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
      confidence: finalScore === 0 ? 98 : Math.min(99, Math.round(55 + finalScore / 2)),
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
      return 'No significant security risks, cognitive coercion, or deceptive links detected in this message.';
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
      return 'CAUTION: High risk detected under Zero-Day cognitive analysis. Do not authenticate, do not click unverified links, and do not disclose credentials.';
    }
    return 'Exercise caution. Verify the sender through an independent channel before proceeding or interacting with links.';
  }
}
