import React, { useEffect, useState } from 'react';
import { ApiClient } from '../api/client';
import { Brain, ShieldAlert, ShieldCheck, AlertTriangle, X, Sparkles, RefreshCw, MessageSquare, ExternalLink, ArrowRight } from 'lucide-react';

interface ConversationTopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  conversationName: string;
  onOpenCopilotWithQuery?: (query: string) => void;
}

export const ConversationTopicModal: React.FC<ConversationTopicModalProps> = ({
  isOpen,
  onClose,
  conversationId,
  conversationName,
  onOpenCopilotWithQuery,
}) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const loadSummary = async () => {
    if (!conversationId) return;
    setLoading(true);
    const res = await ApiClient.getConversationTopicSummary(conversationId);
    setData(res);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen && conversationId) {
      loadSummary();
    }
  }, [isOpen, conversationId]);

  if (!isOpen) return null;

  const color = data?.security_state || 'GREEN';
  const riskScore = data?.risk_score || 0;
  const isRed = color === 'RED';
  const isOrange = color === 'ORANGE';

  const glowColor = isRed ? '#ef4444' : isOrange ? '#f59e0b' : '#10b981';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      className="fade-in"
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '620px',
          maxHeight: '90vh',
          backgroundColor: 'var(--bg-secondary, #0f172a)',
          borderRadius: '16px',
          border: `1px solid ${glowColor}40`,
          boxShadow: `0 0 35px ${glowColor}25, 0 20px 40px rgba(0,0,0,0.6)`,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        className="scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to right, rgba(255,255,255,0.03), transparent)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: `${glowColor}15`,
                border: `1px solid ${glowColor}30`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: glowColor,
              }}
            >
              <Brain size={22} className="animate-pulse" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary, #f8fafc)', margin: 0 }}>
                  AI Topic & Chat Security Analysis
                </h3>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    background: `${glowColor}20`,
                    color: glowColor,
                    border: `1px solid ${glowColor}40`,
                    textTransform: 'uppercase',
                  }}
                >
                  {color} STATE
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)', margin: '2px 0 0' }}>
                Channel: <strong style={{ color: 'var(--text-secondary, #cbd5e1)' }}>{conversationName}</strong>
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={loadSummary}
              title="Refresh Analysis"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
                borderRadius: '8px',
                padding: '8px',
                color: 'var(--text-secondary, #cbd5e1)',
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted, #94a3b8)',
                cursor: 'pointer',
                padding: '4px',
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {loading ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted, #94a3b8)' }}>
              <Sparkles size={28} className="animate-spin" style={{ margin: '0 auto 12px', color: '#10b981' }} />
              <p style={{ fontSize: '14px', fontWeight: 600 }}>Analyzing conversational topics & behavioral patterns...</p>
              <p style={{ fontSize: '12px' }}>Evaluating Zero-Day invariants, phishing markers, and multi-turn context</p>
            </div>
          ) : (
            <>
              {/* Topic Subject Card */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
                  borderRadius: '12px',
                  padding: '16px 20px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Identified Topic & Subject Matter
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: 'rgba(255,255,255,0.06)',
                      color: 'var(--text-secondary, #cbd5e1)',
                    }}
                  >
                    {data?.topic?.category || 'GENERAL'}
                  </span>
                </div>
                <h4 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary, #f8fafc)', margin: '0 0 8px' }}>
                  {data?.topic?.title || 'Active Conversation'}
                </h4>
                <p style={{ fontSize: '13px', lineHeight: 1.5, color: 'var(--text-secondary, #cbd5e1)', margin: 0 }}>
                  {data?.topic?.summary || data?.summary}
                </p>

                {data?.topic?.key_entities?.length > 0 && (
                  <div style={{ marginTop: '12px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {data.topic.key_entities.map((ent: string, idx: number) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: '11px',
                          background: 'rgba(59, 130, 246, 0.1)',
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                          color: '#60a5fa',
                          padding: '3px 8px',
                          borderRadius: '6px',
                        }}
                      >
                        {ent}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Risk Meter & Security Status */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    background: `${glowColor}10`,
                    border: `1px solid ${glowColor}30`,
                    borderRadius: '12px',
                    padding: '14px 16px',
                  }}
                >
                  <span style={{ fontSize: '11px', fontWeight: 700, color: glowColor, textTransform: 'uppercase' }}>
                    Composite Risk Score
                  </span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' }}>
                    <span style={{ fontSize: '28px', fontWeight: 800, color: glowColor }}>
                      {riskScore}%
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)' }}>
                      / 100
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', marginTop: '8px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.max(5, riskScore)}%`,
                        background: glowColor,
                        borderRadius: '3px',
                      }}
                    />
                  </div>
                </div>

                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
                    borderRadius: '12px',
                    padding: '14px 16px',
                  }}
                >
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase' }}>
                    Observed Threat Signals
                  </span>
                  <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {data?.observed_signals?.length > 0 ? (
                      data.observed_signals.map((sig: string, idx: number) => (
                        <div key={idx} style={{ fontSize: '12px', color: '#f87171', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <AlertTriangle size={13} /> {sig.replace('_', ' ')}
                        </div>
                      ))
                    ) : (
                      <div style={{ fontSize: '12px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <ShieldCheck size={14} /> Zero threats detected in history
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Multi-Turn Security Timeline */}
              {data?.timeline?.length > 0 && (
                <div>
                  <h5 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Turn-by-Turn Context Timeline ({data.timeline.length} turns)
                  </h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '140px', overflowY: 'auto' }}>
                    {data.timeline.map((step: any, idx: number) => {
                      const stepColor = step.indicator_color === 'RED' ? '#ef4444' : step.indicator_color === 'ORANGE' ? '#f59e0b' : '#10b981';
                      return (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            background: 'rgba(255,255,255,0.02)',
                            borderRadius: '8px',
                            borderLeft: `3px solid ${stepColor}`,
                            fontSize: '12px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                            <span style={{ fontWeight: 700, color: 'var(--text-muted, #94a3b8)', minWidth: '45px' }}>
                              #{step.step}
                            </span>
                            <span style={{ color: 'var(--text-secondary, #cbd5e1)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                              "{step.message_snippet}"
                            </span>
                          </div>
                          <span style={{ fontWeight: 700, color: stepColor, marginLeft: '8px' }}>
                            {step.risk_score}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {data?.recommendations?.length > 0 && (
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
                    borderRadius: '12px',
                    padding: '14px 16px',
                  }}
                >
                  <h5 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', marginBottom: '8px' }}>
                    AI Guardian Precautions
                  </h5>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--text-secondary, #cbd5e1)', lineHeight: 1.6 }}>
                    {data.recommendations.map((rec: string, idx: number) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
            background: 'rgba(0,0,0,0.2)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <button
            onClick={() => {
              onClose();
              if (onOpenCopilotWithQuery) {
                onOpenCopilotWithQuery('Explain the topic and potential threats in this active chat');
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#10b981',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Sparkles size={14} /> Ask Copilot About This Chat
          </button>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
              color: 'var(--text-primary, #f8fafc)',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
