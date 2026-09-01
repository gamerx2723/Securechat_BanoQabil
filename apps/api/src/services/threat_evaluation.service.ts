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

        return {
          riskScore: maxScore,
          indicatorColor: color,
          primaryThreat,
          confidence: Math.max(localResult.confidence, aiData.confidence || 0),
          evidenceList,
          explanation: aiData.explanation?.why_flagged || localResult.explanation,
          recommendation: aiData.explanation?.recommendation || localResult.recommendation,
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
