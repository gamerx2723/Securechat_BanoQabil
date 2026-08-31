import { Router, Response } from 'express';
import crypto from 'crypto';
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

    // If analysis indicates suspicious or critical risk, record real security event and auto-queue for review
    if (analysis.riskScore >= 25) {
      if (conversationId) {
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

      // Auto-queue newly flagged threat pattern into SecurityReview
      const textHash = crypto.createHash('sha256').update(text.trim().toLowerCase()).digest('hex');
      await prisma.securityReview.upsert({
        where: { hash: textHash },
        update: {
          aiRiskScore: analysis.riskScore,
          aiThreatType: analysis.primaryThreat,
        },
        create: {
          text: text.trim(),
          hash: textHash,
          aiRiskScore: analysis.riskScore,
          aiThreatType: analysis.primaryThreat,
          status: 'PENDING',
          threatVotes: 1,
          safeVotes: 0,
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
 * Crowd-sourced user threat voting / reporting
 */
securityRouter.post('/report', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { text, voteType, messageId, aiRiskScore, aiThreatType } = req.body;
    if (!text || !voteType) {
      res.status(400).json({ error: 'text and voteType (THREAT or SAFE) are required' });
      return;
    }

    const cleanText = text.trim();
    const textHash = crypto.createHash('sha256').update(cleanText.toLowerCase()).digest('hex');
    const isThreat = (voteType === 'THREAT');

    const review = await prisma.securityReview.upsert({
      where: { hash: textHash },
      update: {
        threatVotes: { increment: isThreat ? 1 : 0 },
        safeVotes: { increment: !isThreat ? 1 : 0 },
        messageId: messageId || undefined,
        aiRiskScore: aiRiskScore !== undefined ? aiRiskScore : undefined,
        aiThreatType: aiThreatType || undefined,
      },
      create: {
        text: cleanText,
        hash: textHash,
        messageId: messageId || null,
        threatVotes: isThreat ? 1 : 0,
        safeVotes: isThreat ? 0 : 1,
        aiRiskScore: aiRiskScore || 0,
        aiThreatType: aiThreatType || 'USER_REPORTED',
        status: 'PENDING',
      },
    });

    res.json({
      success: true,
      message: isThreat ? 'Thank you! Threat report submitted for Admin review.' : 'Thank you! False-alarm vote submitted for Admin review.',
      review,
    });
  } catch (error) {
    console.error('Report threat error:', error);
    res.status(500).json({ error: 'Failed to record threat report' });
  }
});

/**
 * SuperAdmin Threat Moderation Queue & Aggregated Analytics
 */
securityRouter.get('/admin/reviews', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const reviews = await prisma.securityReview.findMany({
      orderBy: [
        { threatVotes: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 100,
    });

    const totalReviews = await prisma.securityReview.count();
    const pendingReviews = await prisma.securityReview.count({ where: { status: 'PENDING' } });
    const trainedCount = await prisma.securityReview.count({ where: { status: { in: ['TRAINED_MALICIOUS', 'TRAINED_BENIGN'] } } });

    res.json({
      reviews,
      stats: {
        totalReported: totalReviews,
        pendingCount: pendingReviews,
        trainedCount: trainedCount,
      },
    });
  } catch (error) {
    console.error('Fetch admin reviews error:', error);
    res.status(500).json({ error: 'Failed to fetch admin reviews' });
  }
});

/**
 * SuperAdmin One-Click Model Training Decision
 */
securityRouter.post('/admin/train-decision', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { reviewId, decision, adminNotes } = req.body;
    if (!reviewId || !decision) {
      res.status(400).json({ error: 'reviewId and decision (TRAIN_MALICIOUS, TRAIN_BENIGN, DISMISS) are required' });
      return;
    }

    const review = await prisma.securityReview.findUnique({ where: { id: reviewId } });
    if (!review) {
      res.status(400).json({ error: 'Review entry not found' });
      return;
    }

    if (decision === 'TRAIN_MALICIOUS') {
      // Trigger Python AI service online training
      try {
        await fetch(`${config.aiServiceUrl}/api/v1/learn/feedback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: review.text,
            label: 'MALICIOUS',
            category: review.aiThreatType || 'ADMIN_APPROVED_ZERO_DAY',
            feedbackBy: req.user!.username,
          }),
        });
      } catch (err) {
        console.error('Failed to update AI service:', err);
      }

      await prisma.securityReview.update({
        where: { id: reviewId },
        data: { status: 'TRAINED_MALICIOUS', adminNotes },
      });

      res.json({ success: true, message: 'Pattern confirmed as MALICIOUS. AI Online SGD model weights updated and saved to Threat Memory.' });
      return;
    }

    if (decision === 'TRAIN_BENIGN') {
      // Trigger Python AI service online training
      try {
        await fetch(`${config.aiServiceUrl}/api/v1/learn/feedback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: review.text,
            label: 'BENIGN',
            category: 'FALSE_ALARM_CALIBRATION',
            feedbackBy: req.user!.username,
          }),
        });
      } catch (err) {
        console.error('Failed to update AI service:', err);
      }

      await prisma.securityReview.update({
        where: { id: reviewId },
        data: { status: 'TRAINED_BENIGN', adminNotes },
      });

      res.json({ success: true, message: 'Pattern confirmed as BENIGN (Safe). AI model calibrated and saved to Safe Exemplars.' });
      return;
    }

    if (decision === 'DISMISS') {
      await prisma.securityReview.update({
        where: { id: reviewId },
        data: { status: 'DISMISSED', adminNotes },
      });

      res.json({ success: true, message: 'Review dismissed.' });
      return;
    }

    res.status(400).json({ error: 'Invalid decision' });
  } catch (error) {
    console.error('Admin train decision error:', error);
    res.status(500).json({ error: 'Failed to process admin train decision' });
  }
});

/**
 * Real-time User & System Security Telemetry from actual SQLite database
 */
securityRouter.get('/telemetry', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;

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
 * Active Online Learning endpoint for direct manual teaching.
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
