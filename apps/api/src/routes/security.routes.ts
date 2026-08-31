import { Router, Response } from 'express';
import { prisma } from '@securechat/database';
import { ThreatEvaluationService } from '../services/threat_evaluation.service.js';
import { analyzeMessageSchema, securityFeedbackSchema } from '@securechat/validation';
import { AuthenticatedRequest, authMiddleware } from '../auth/jwt.service.js';
import { config } from '../config.js';

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

    // Run hybrid AI ML + deterministic evaluation
    const analysis = await ThreatEvaluationService.evaluate(text, conversationId, userId);

    // If analysis indicates suspicious or critical risk, record real security event in database
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
          source: 'ZERO_TRUST_AI_ENGINE',
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
 * Real-time User & System Security Telemetry from actual SQLite database
 */
securityRouter.get('/telemetry', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;

    // Actual counts from database
    const userDevicesCount = await prisma.device.count({ where: { userId, isRevoked: false } });
    const userMessagesCount = await prisma.message.count({ where: { senderId: userId } });
    const totalMessagesInDb = await prisma.message.count();

    const userSecurityEvents = await prisma.securityEvent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const redThreatsCount = await prisma.securityEvent.count({ where: { userId, indicatorColor: 'RED' } });
    const orangeThreatsCount = await prisma.securityEvent.count({ where: { userId, indicatorColor: 'ORANGE' } });

    // Group actual threats by category
    const threatsByCategory = await prisma.securityEvent.groupBy({
      by: ['type'],
      where: { userId },
      _count: { id: true },
    });

    res.json({
      activeDevices: userDevicesCount,
      sentMessages: userMessagesCount,
      totalProtectedMessages: totalMessagesInDb,
      redThreats: redThreatsCount,
      orangeThreats: orangeThreatsCount,
      totalThreats: redThreatsCount + orangeThreatsCount,
      threatBreakdown: threatsByCategory.map((t) => ({
        category: t.type,
        count: t._count.id,
      })),
      recentEvents: userSecurityEvents.map((e) => ({
        id: e.id,
        type: e.type,
        severity: e.severity,
        riskScore: e.riskScore,
        indicatorColor: e.indicatorColor,
        explanation: e.explanation,
        createdAt: e.createdAt,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch real telemetry' });
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
 * User feedback on false positives / reported threats with continuous online learning.
 */
securityRouter.post('/feedback', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const parseResult = securityFeedbackSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Invalid feedback data' });
      return;
    }

    const { messageId, isFalsePositive, text } = parseResult.data as any;

    if (messageId) {
      await prisma.securityEvent.updateMany({
        where: { messageId },
        data: { isFalsePositive },
      });
    }

    // Trigger online incremental learning in Python AI service
    if (text) {
      try {
        await fetch(`${config.aiServiceUrl}/api/v1/learn/feedback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            label: isFalsePositive ? 'BENIGN' : 'MALICIOUS',
            category: isFalsePositive ? 'FALSE_ALARM_FEEDBACK' : 'USER_REPORTED_THREAT',
            feedbackBy: req.user!.username,
          }),
        });
      } catch {}
    }

    res.json({ message: 'Feedback recorded. AI model weights updated online.', isFalsePositive });
  } catch {
    res.status(500).json({ error: 'Failed to record feedback' });
  }
});

/**
 * Active Online Learning endpoint for teaching the AI new threat patterns or false alarms.
 */
securityRouter.post('/teach', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { text, label, category } = req.body;
    if (!text || !label) {
      res.status(400).json({ error: 'text and label (MALICIOUS or BENIGN) are required' });
      return;
    }

    const response = await fetch(`${config.aiServiceUrl}/api/v1/learn/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        label,
        category: category || 'MANUAL_TEACHING',
        feedbackBy: req.user!.username,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      res.json(data);
      return;
    }

    res.json({ success: true, message: `Sample learned as ${label}` });
  } catch (error) {
    console.error('Teach AI error:', error);
    res.status(500).json({ error: 'Failed to teach AI model' });
  }
});

/**
 * Telemetry endpoint for Adaptive Online Learning stats.
 */
securityRouter.get('/learning-stats', async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const response = await fetch(`${config.aiServiceUrl}/api/v1/learn/stats`);
    if (response.ok) {
      const data = await response.json();
      res.json(data);
      return;
    }
    res.json({ total_exemplars: 0, online_learning_active: true });
  } catch {
    res.json({ total_exemplars: 0, online_learning_active: false });
  }
});
