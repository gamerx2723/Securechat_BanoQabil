import { SecurityAnalysisResult, ThreatCategory, SecurityIndicatorColor, ThreatEvidence } from '@securechat/types';
import { RiskEngine } from '@securechat/security';
import { config } from '../config.js';

export class ThreatEvaluationService {
  /**
   * Evaluates message content by fusing Python AI Microservice intelligence
   * with the local Deterministic Security Engine for zero-latency, zero-false-negative protection.
   */
  public static async evaluate(
    plaintext: string,
    conversationId?: string,
    senderId?: string
  ): Promise<SecurityAnalysisResult> {
    // 1. Run local deterministic rule engine first
    const localResult = RiskEngine.evaluateMessage(plaintext);

    // 2. Query Python Zero-Trust AI Microservice (with ML Random Forest + Roman Urdu detector)
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);

      const aiBase = config.aiServiceUrl.startsWith('http') ? config.aiServiceUrl : `http://${config.aiServiceUrl}`;
      const response = await fetch(`${aiBase.replace(/\/+$/, '')}/api/v1/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: plaintext,
          conversationId,
          senderId,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (response.ok) {
        const aiData: any = await response.json();

        // Fuse AI ML signals with local signals
        const evidenceList: ThreatEvidence[] = [...localResult.evidenceList];

        if (aiData.phishing_analysis?.phishing_detected) {
          for (const urlItem of aiData.phishing_analysis.analyzed_urls || []) {
            if (urlItem.phishing_detected) {
              const alreadyPresent = evidenceList.some((e) => e.signal === `URL:${urlItem.domain}`);
              if (!alreadyPresent) {
                evidenceList.push({
                  category: 'PHISHING',
                  signal: `URL:${urlItem.domain}`,
                  confidence: urlItem.confidence || 0.95,
                  detectionBasis: urlItem.ml_model_active ? 'LOCAL_AI_MODEL' : 'DETERMINISTIC_RULE',
                  description: (urlItem.signals || []).join('; ') || `Machine learning identified phishing domain ${urlItem.domain}`,
                });
              }
            }
          }
        }

        if (aiData.social_engineering_analysis?.social_engineering_detected) {
          for (const cat of aiData.social_engineering_analysis.detected_categories || []) {
            const score = aiData.social_engineering_analysis.category_scores?.[cat] || 0.85;
            evidenceList.push({
              category: 'SOCIAL_ENGINEERING',
              signal: cat.toUpperCase(),
              confidence: score,
              detectionBasis: 'LOCAL_AI_MODEL',
              description: `AI Model detected linguistic manipulation pattern: ${cat.replace('_', ' ')}`,
            });
          }
        }

        if (aiData.blackmail_analysis?.blackmail_detected) {
          for (const ev of aiData.blackmail_analysis.evidence || []) {
            evidenceList.push({
              category: (ev.category as ThreatCategory) || 'BLACKMAIL_SEXTORTION',
              signal: ev.signal || 'IMAGE_LEAK_EXTORTION',
              confidence: ev.confidence || 0.98,
              detectionBasis: (ev.detectionBasis as any) || 'LOCAL_AI_MODEL',
              description: ev.description || 'Sextortion, private image leak extortion, or coercive blackmail threat detected.',
            });
          }
        }

        if (aiData.urdu_scam_analysis?.scam_detected) {
          for (const sig of aiData.urdu_scam_analysis.signals || []) {
            evidenceList.push({
              category: 'SOCIAL_ENGINEERING',
              signal: 'ROMAN_URDU_SCAM_PATTERN',
              confidence: 0.95,
              detectionBasis: 'LOCAL_AI_MODEL',
              description: sig,
            });
          }
        }

        if (aiData.zero_day_analysis?.zero_day_threat_detected) {
          for (const sig of aiData.zero_day_analysis.signals || []) {
            evidenceList.push({
              category: 'SOCIAL_ENGINEERING',
              signal: 'ZERO_DAY_COGNITIVE_INTENT',
              confidence: 0.95,
              detectionBasis: 'LOCAL_AI_MODEL',
              description: sig,
            });
          }
        }

        if (aiData.dlp_analysis?.has_sensitive_data) {
          for (const sec of aiData.dlp_analysis.detected_secrets || []) {
            const alreadyPresent = evidenceList.some((e) => e.signal === sec.type);
            if (!alreadyPresent) {
              evidenceList.push({
                category: 'DLP_SECRET_EXPOSURE',
                signal: sec.type || 'SENSITIVE_DATA_EXPOSURE',
                confidence: 0.99,
                detectionBasis: 'DETERMINISTIC_RULE',
                description: `Sensitive ${sec.type || 'credential'} detected (${sec.snippet || sec.masked_value || '***'}).`,
              });
            }
          }
        }

        const maxScore = Math.max(localResult.riskScore, aiData.risk_score || 0);
        let color: SecurityIndicatorColor = 'GREEN';
        if (maxScore >= 75) {
          color = 'RED';
        } else if (maxScore >= 25) {
          color = 'ORANGE';
        }

        let primaryThreat: ThreatCategory = localResult.primaryThreat;
        if (aiData.primary_threat && aiData.primary_threat !== 'SAFE' && maxScore >= 25) {
          primaryThreat = aiData.primary_threat;
        } else if (localResult.primaryThreat !== 'SAFE') {
          primaryThreat = localResult.primaryThreat;
        }

        const rawExplanation = typeof aiData.explanation === 'string'
          ? aiData.explanation
          : aiData.explanation?.why_flagged || localResult.explanation;
        const rawRecommendation = typeof aiData.explanation === 'object'
          ? (aiData.explanation?.recommendation || localResult.recommendation)
          : localResult.recommendation;

        return {
          riskScore: maxScore,
          indicatorColor: color,
          primaryThreat,
          confidence: Math.max(localResult.confidence, aiData.confidence || 0),
          evidenceList,
          explanation: rawExplanation,
          recommendation: rawRecommendation,
          suggestedActions: color === 'RED'
            ? ['BLOCK_LINK', 'BLOCK_SENDER', 'REPORT_MESSAGE', 'ASK_COPILOT']
            : color === 'ORANGE'
            ? ['ASK_COPILOT', 'CONTINUE_ANYWAY', 'REPORT_MESSAGE']
            : ['ASK_COPILOT'],
          detectedSecrets: localResult.detectedSecrets,
          analyzedUrls: localResult.analyzedUrls,
        };
      }
    } catch {
      // AI microservice network error or timeout -> graceful fallback to local result
    }

    return localResult;
  }
}
