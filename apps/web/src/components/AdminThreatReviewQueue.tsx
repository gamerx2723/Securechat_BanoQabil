import React, { useState, useEffect } from 'react';
import { ApiClient } from '../api/client';
import { ShieldAlert, ShieldCheck, RefreshCw, Sparkles, Check, X, ThumbsUp, ThumbsDown, Users, AlertTriangle, Filter } from 'lucide-react';

export const AdminThreatReviewQueue: React.FC = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [stats, setStats] = useState<{ totalReported: number; pendingCount: number; trainedCount: number }>({
    totalReported: 0,
    pendingCount: 0,
    trainedCount: 0,
  });
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'TRAINED'>('PENDING');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadReviews = async () => {
    setLoading(true);
    const res = await ApiClient.getAdminReviews();
    setReviews(res.reviews || []);
    setStats(res.stats || { totalReported: 0, pendingCount: 0, trainedCount: 0 });
    setLoading(false);
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const handleDecision = async (reviewId: string, decision: 'TRAIN_MALICIOUS' | 'TRAIN_BENIGN' | 'DISMISS') => {
    setProcessingId(reviewId);
    const res = await ApiClient.submitAdminTrainDecision(reviewId, decision);
    setProcessingId(null);
    if (res.success) {
      setActionFeedback(res.message);
      loadReviews();
      setTimeout(() => setActionFeedback(null), 4000);
    }
  };

  const filteredReviews = reviews.filter((r) => {
    if (filter === 'PENDING') return r.status === 'PENDING';
    if (filter === 'TRAINED') return r.status === 'TRAINED_MALICIOUS' || r.status === 'TRAINED_BENIGN';
    return true;
  });

  return (
    <div style={{ marginTop: '24px' }}>
      {/* Header & Stats */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={20} style={{ color: '#60a5fa' }} />
            Crowd-Sourced Threat Moderation & SuperAdmin Training Queue
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '3px 0 0' }}>
            Review user-flagged messages, inspect crowd consensus, and approve samples to train the AI model online.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={loadReviews}
            disabled={loading}
            className="btn-ghost"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 12px' }}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Analytics Counter Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '20px' }}>
        <div className="glass-panel" style={{ padding: '14px 18px', background: 'rgba(255, 255, 255, 0.02)' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Total User Reports</div>
          <div style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', marginTop: '4px' }}>
            {stats.totalReported}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '14px 18px', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#f59e0b', fontWeight: 600 }}>Pending Moderation</div>
          <div style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#f59e0b', marginTop: '4px' }}>
            {stats.pendingCount}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '14px 18px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#10b981', fontWeight: 600 }}>Trained & Calibrated</div>
          <div style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#10b981', marginTop: '4px' }}>
            {stats.trainedCount}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
        {(['PENDING', 'ALL', 'TRAINED'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              background: filter === tab ? 'var(--primary-color, #2563eb)' : 'rgba(255, 255, 255, 0.05)',
              color: filter === tab ? '#ffffff' : 'var(--text-muted)',
            }}
          >
            {tab === 'PENDING' ? `Pending Queue (${stats.pendingCount})` : tab === 'TRAINED' ? `Trained (${stats.trainedCount})` : `All (${stats.totalReported})`}
          </button>
        ))}
      </div>

      {/* Live Action Feedback Toast */}
      {actionFeedback && (
        <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', padding: '10px 14px', color: '#10b981', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }} className="fade-in">
          <Check size={15} /> {actionFeedback}
        </div>
      )}

      {/* Review Queue Items */}
      {filteredReviews.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredReviews.map((r) => {
            const totalVotes = (r.threatVotes || 0) + (r.safeVotes || 0);
            const threatPercent = totalVotes > 0 ? Math.round((r.threatVotes / totalVotes) * 100) : 0;
            const isPending = r.status === 'PENDING';
            const isTrainedMalicious = r.status === 'TRAINED_MALICIOUS';
            const isTrainedBenign = r.status === 'TRAINED_BENIGN';

            return (
              <div
                key={r.id}
                className="glass-panel"
                style={{
                  padding: '16px',
                  borderRadius: '10px',
                  border: isTrainedMalicious 
                    ? '1px solid rgba(239, 68, 68, 0.3)' 
                    : isTrainedBenign 
                    ? '1px solid rgba(16, 185, 129, 0.3)' 
                    : '1px solid var(--border-subtle)',
                  background: 'rgba(255, 255, 255, 0.02)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div style={{ flex: 1, marginRight: '16px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', wordBreak: 'break-word' }}>
                      "{r.text}"
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Reported on {new Date(r.createdAt).toLocaleString()} • AI Risk Score: {r.aiRiskScore}% ({r.aiThreatType})
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        background: isTrainedMalicious
                          ? 'rgba(239, 68, 68, 0.2)'
                          : isTrainedBenign
                          ? 'rgba(16, 185, 129, 0.2)'
                          : 'rgba(245, 158, 11, 0.2)',
                        color: isTrainedMalicious ? '#ef4444' : isTrainedBenign ? '#10b981' : '#f59e0b',
                      }}
                    >
                      {r.status}
                    </span>
                  </div>
                </div>

                {/* Crowd Consensus Ratio */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(0, 0, 0, 0.2)', padding: '8px 12px', borderRadius: '8px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#ef4444', fontWeight: 700 }}>
                    <ThumbsDown size={13} /> {r.threatVotes} Users Voted Threat
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#10b981', fontWeight: 700 }}>
                    <ThumbsUp size={13} /> {r.safeVotes} Users Voted Safe
                  </div>

                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1, height: '6px', background: 'rgba(16, 185, 129, 0.3)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${threatPercent}%`, height: '100%', background: '#ef4444' }}></div>
                    </div>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      {threatPercent}% Threat Consensus
                    </span>
                  </div>
                </div>

                {/* Admin Action Controls */}
                {isPending && (
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => handleDecision(r.id, 'TRAIN_MALICIOUS')}
                      disabled={processingId === r.id}
                      style={{
                        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                        border: 'none',
                        borderRadius: '6px',
                        color: '#ffffff',
                        padding: '6px 14px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <Sparkles size={13} /> ⚡ Approve & Train AI (Malicious)
                    </button>

                    <button
                      onClick={() => handleDecision(r.id, 'TRAIN_BENIGN')}
                      disabled={processingId === r.id}
                      style={{
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        border: 'none',
                        borderRadius: '6px',
                        color: '#ffffff',
                        padding: '6px 14px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <Check size={13} /> ✅ Approve & Calibrate (Safe)
                    </button>

                    <button
                      onClick={() => handleDecision(r.id, 'DISMISS')}
                      disabled={processingId === r.id}
                      className="btn-ghost"
                      style={{ padding: '6px 12px', fontSize: '11px' }}
                    >
                      <X size={13} /> Dismiss
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-muted)', fontSize: '13px' }} className="glass-panel">
          <ShieldCheck size={28} style={{ color: 'var(--green-safe)', margin: '0 auto 8px auto' }} />
          No items in this filter. All crowd reports reviewed!
        </div>
      )}
    </div>
  );
};
