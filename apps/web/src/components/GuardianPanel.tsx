import React, { useState } from 'react';
import { ConversationItem, ChatMessage } from '../types';
import { Shield, ShieldAlert, ShieldCheck, Activity, Key, Sliders, Clock, AlertTriangle, CheckCircle, Lock } from 'lucide-react';

interface GuardianPanelProps {
  conversation: ConversationItem;
  messages: ChatMessage[];
}

export const GuardianPanel: React.FC<GuardianPanelProps> = ({ conversation, messages }) => {
  const [aiMode, setAiMode] = useState<'GUARDIAN' | 'BALANCED' | 'PRIVACY' | 'PERFORMANCE'>('GUARDIAN');
  const [isPaused, setIsPaused] = useState(false);

  // Compute Risk Timeline from conversation messages
  const timeline = messages.map((m, idx) => ({
    time: m.sentAt,
    sender: m.senderName,
    snippet: m.plaintext.slice(0, 35) + (m.plaintext.length > 35 ? '...' : ''),
    riskScore: m.securityAnalysis.riskScore,
    color: m.securityAnalysis.indicatorColor,
    threat: m.securityAnalysis.primaryThreat,
  }));

  // Identify exposed secrets
  const exposedSecrets = messages
    .filter(m => m.securityAnalysis.evidenceList.some(e => e.category === 'DLP_SECRET_EXPOSURE'))
    .map(m => ({
      sender: m.senderName,
      time: m.sentAt,
      signal: m.securityAnalysis.evidenceList.find(e => e.category === 'DLP_SECRET_EXPOSURE')?.description || 'Secret Detected',
    }));

  return (
    <div style={{ flex: 1, padding: '24px', overflowY: 'auto', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--green-safe)' }}>
            <Shield size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Guardian AI Security Panel</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Per-conversation risk intelligence & privacy controls</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="btn-ghost"
            style={{ fontSize: '12px', color: isPaused ? 'var(--orange-warn)' : 'var(--text-secondary)' }}
          >
            <Clock size={14} style={{ marginRight: '4px' }} />
            {isPaused ? 'Paused (15m remaining)' : 'Pause AI (15m)'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* 1. AI Protection Modes */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={16} style={{ color: 'var(--green-safe)' }} /> Security Operation Mode
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {[
              { mode: 'GUARDIAN', title: 'Guardian Mode', desc: 'Maximum protection: Deep phishing & DLP evaluation.' },
              { mode: 'BALANCED', title: 'Balanced Mode', desc: 'Optimal trade-off between security and subtle alerts.' },
              { mode: 'PRIVACY', title: 'Privacy Mode', desc: 'Strict on-device local model processing only.' },
              { mode: 'PERFORMANCE', title: 'Performance Mode', desc: 'Ultra-fast regex-first deterministic scanning.' },
            ].map(item => (
              <div
                key={item.mode}
                onClick={() => setAiMode(item.mode as any)}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  background: aiMode === item.mode ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                  border: aiMode === item.mode ? '1px solid var(--green-safe)' : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '13px', color: aiMode === item.mode ? 'var(--green-safe)' : 'var(--text-primary)', marginBottom: '4px' }}>
                  {item.title}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  {item.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Secret Exposure Map */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Key size={16} style={{ color: 'var(--accent-cyan)' }} /> Secret Exposure Map
          </h3>

          {exposedSecrets.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              <CheckCircle size={28} style={{ color: 'var(--green-safe)', margin: '0 auto 8px auto' }} />
              No credentials, tokens, or API keys exposed in this conversation.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {exposedSecrets.map((sec, idx) => (
                <div key={idx} style={{ padding: '10px', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '6px', fontSize: '12px' }}>
                  <div style={{ fontWeight: 600, color: 'var(--red-critical)' }}>{sec.signal}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '2px' }}>Sent by {sec.sender} at {sec.time}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. Conversation Risk Timeline */}
        <div className="glass-panel" style={{ gridColumn: '1 / -1', padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={16} style={{ color: 'var(--orange-warn)' }} /> Multi-Turn Conversation Risk Timeline
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {timeline.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', width: '60px' }}>
                  {item.time}
                </div>

                <div
                  style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    background: item.color === 'RED' ? 'rgba(244, 63, 94, 0.2)' : item.color === 'ORANGE' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                    color: item.color === 'RED' ? 'var(--red-critical)' : item.color === 'ORANGE' ? 'var(--orange-warn)' : 'var(--green-safe)',
                  }}
                >
                  {item.riskScore}%
                </div>

                <div style={{ flex: 1, fontSize: '13px' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.sender}: </span>
                  <span style={{ color: 'var(--text-secondary)' }}>{item.snippet}</span>
                </div>

                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  {item.threat.replace(/_/g, ' ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
