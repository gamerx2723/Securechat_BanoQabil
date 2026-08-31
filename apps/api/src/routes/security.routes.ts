import { Router, Response } from 'express';
import { prisma } from '@securechat/database';
import { RiskEngine } from '@securechat/security';
import { analyzeMessageSchema, securityFeedbackSchema } from '@securechat/validation';
import { AuthenticatedRequest, authMiddleware } from '../auth/jwt.service.js';

export const securityRouter = Router();

securityRouter.use(authMiddleware);

/**
 * Pre-send client evaluation or server-side intelligence evaluation.
 */
securityRouter.post('/analyze', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const parseResult = analyzeMessageSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Validation failed', details: parseResult.error.format() });
      return;
    }

    const { text, conversationId } = parseResult.data;
    const userId = req.user!.userId;

    // Run deterministic rule engine
    const analysis = RiskEngine.evaluateMessage(text);

    // If analysis indicates suspicious or critical risk, record security event
    if (analysis.riskScore >= 25 && conversationId) {
      await prisma.securityEvent.create({
        data: {
          userId,
          conversationId,
          type: analysis.primaryThreat,
          severity: analysis.indicatorColor === 'RED' ? 'CRITICAL' : 'MEDIUM',
          riskScore: analysis.riskScore,
          indicatorColor: analysis.indicatorColor,
          confidence: analysis.confidence / 100,
          source: 'DETERMINISTIC_RULE_ENGINE',
          explanation: analysis.explanation,
          recommendation: analysis.recommendation,
        },
      });
    }

    res.json(analysis);
  } catch (error) {
    console.error('Security analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze text' });
  }
});

/**
 * Returns security event log history for the authenticated user.
 */
securityRouter.get('/events', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const events = await prisma.securityEvent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json(events);
  } catch {
    res.status(500).json({ error: 'Failed to fetch security events' });
  }
});

/**
 * User feedback on false positives.
 */
securityRouter.post('/feedback', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const parseResult = securityFeedbackSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Invalid feedback data' });
      return;
    }

    const { messageId, isFalsePositive, userComment } = parseResult.data;

    await prisma.securityEvent.updateMany({
      where: { messageId },
      data: { isFalsePositive },
    });

    res.json({ message: 'Feedback recorded. Security engine calibrated.', isFalsePositive });
  } catch {
    res.status(500).json({ error: 'Failed to record feedback' });
  }
});
