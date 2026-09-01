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
    <div style={{ marginTop: '14px' }}>
      {/* Header & Stats */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
        <div style={{ minWidth: 0 }}>
          <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={18} style={{ color: '#60a5fa', flexShrink: 0 }} />
            <span>Threat Moderation & Training Queue</span>
          </h3>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
            Inspect user reports, check community consensus, and train the AI model online.
          </p>
        </div>

        <button
          onClick={loadReviews}
          disabled={loading}
          className="btn-ghost"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 12px' }}
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Analytics Counter Row (Responsive auto-fit grid) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px', marginBottom: '16px' }}>
        <div className="glass-panel" style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.02)' }}>
          <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Total Reports</div>
          <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', marginTop: '2px' }}>
            {stats.totalReported}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
          <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#f59e0b', fontWeight: 700 }}>Pending</div>
          <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#f59e0b', marginTop: '2px' }}>
            {stats.pendingCount}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#10b981', fontWeight: 700 }}>Trained</div>
          <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#10b981', marginTop: '2px' }}>
            {stats.trainedCount}
          </div>
        </div>
      </div>

      {/* Filter Tabs (Horizontal scroll on mobile) */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '6px', marginBottom: '14px', WebkitOverflowScrolling: 'touch' }}>
        {(['PENDING', 'ALL', 'TRAINED'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: filter === tab ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              background: filter === tab ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.04)',
              color: filter === tab ? 'var(--accent-cyan)' : 'var(--text-secondary)',
            }}
          >
            {tab === 'PENDING' ? `Pending (${stats.pendingCount})` : tab === 'TRAINED' ? `Trained (${stats.trainedCount})` : `All (${stats.totalReported})`}
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
                  padding: '14px',
                  borderRadius: '10px',
                  border: isTrainedMalicious 
                    ? '1px solid rgba(239, 68, 68, 0.3)' 
                    : isTrainedBenign 
                    ? '1px solid rgba(16, 185, 129, 0.3)' 
                    : '1px solid var(--border-subtle)',
                  background: 'rgba(255, 255, 255, 0.02)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', wordBreak: 'break-word', lineHeight: 1.4 }}>
                      "{r.text}"
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Reported {new Date(r.createdAt).toLocaleDateString()} • AI Risk: {r.aiRiskScore}% ({r.aiThreatType})
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: 800,
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

                {/* Crowd Consensus Ratio (Flex wrap for mobile) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0, 0, 0, 0.25)', padding: '8px 10px', borderRadius: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#ef4444', fontWeight: 700 }}>
                    <ThumbsDown size={12} /> {r.threatVotes} Threat
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#10b981', fontWeight: 700 }}>
                    <ThumbsUp size={12} /> {r.safeVotes} Safe
                  </div>

                  <div style={{ flex: 1, minWidth: '120px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ flex: 1, height: '5px', background: 'rgba(16, 185, 129, 0.3)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${threatPercent}%`, height: '100%', background: '#ef4444' }}></div>
                    </div>
                    <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      {threatPercent}%
                    </span>
                  </div>
                </div>

                {/* Admin Action Controls (Flex-wrap on mobile so buttons stack neatly without overflowing) */}
                {isPending && (
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-start', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handleDecision(r.id, 'TRAIN_MALICIOUS')}
                      disabled={processingId === r.id}
                      style={{
                        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                        border: 'none',
                        borderRadius: '6px',
                        color: '#ffffff',
                        padding: '6px 10px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Sparkles size={12} /> Train Threat
                    </button>

                    <button
                      onClick={() => handleDecision(r.id, 'TRAIN_BENIGN')}
                      disabled={processingId === r.id}
                      style={{
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        border: 'none',
                        borderRadius: '6px',
                        color: '#ffffff',
                        padding: '6px 10px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Check size={12} /> Train Safe
                    </button>

                    <button
                      onClick={() => handleDecision(r.id, 'DISMISS')}
                      disabled={processingId === r.id}
                      className="btn-ghost"
                      style={{ padding: '6px 10px', fontSize: '11px' }}
                    >
                      <X size={12} /> Dismiss
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '24px 12px', color: 'var(--text-muted)', fontSize: '12px' }} className="glass-panel">
          No reports in this queue. When users flag messages, they will appear here for review.
        </div>
      )}
    </div>
  );
};
