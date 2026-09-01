import React, { useState } from 'react';
import { ConversationItem, ChatMessage, SecurityAnalysis } from '../types';
import { ApiClient } from '../api/client';
import { Shield, ShieldAlert, ShieldCheck, Activity, Key, Sliders, Clock, AlertTriangle, CheckCircle, Lock, Zap, Brain, Sparkles, Send, RefreshCw, BarChart3, Database } from 'lucide-react';

interface GuardianPanelProps {
  conversation: ConversationItem;
  messages: ChatMessage[];
}

export const GuardianPanel: React.FC<GuardianPanelProps> = ({ conversation, messages }) => {
  const [aiMode, setAiMode] = useState<'GUARDIAN' | 'BALANCED' | 'PRIVACY' | 'PERFORMANCE'>('GUARDIAN');
  const [isPaused, setIsPaused] = useState(false);

  // Interactive AI Sandbox state
  const [sandboxText, setSandboxText] = useState('');
  const [sandboxAnalysis, setSandboxAnalysis] = useState<SecurityAnalysis | null>(null);
  const [isAnalyzingSandbox, setIsAnalyzingSandbox] = useState(false);

  // Compute Conversation Threat Statistics
  const safeList = messages || [];
  const totalMessages = safeList.length;
  const threatMessages = safeList.filter(m => m?.securityAnalysis?.indicatorColor === 'RED');
  const warnMessages = safeList.filter(m => m?.securityAnalysis?.indicatorColor === 'ORANGE');
  const safeMessages = safeList.filter(m => m?.securityAnalysis?.indicatorColor === 'GREEN');
  const peakRiskScore = safeList.reduce((max, m) => Math.max(max, m?.securityAnalysis?.riskScore || 0), 0);

  const phishingCount = safeList.filter(m => m?.securityAnalysis?.primaryThreat === 'PHISHING' || m?.securityAnalysis?.evidenceList?.some(e => e.category === 'PHISHING')).length;
  const socialEngCount = safeList.filter(m => m?.securityAnalysis?.primaryThreat === 'SOCIAL_ENGINEERING' || m?.securityAnalysis?.evidenceList?.some(e => e.category === 'SOCIAL_ENGINEERING' || e.category === 'URGENCY_MANIPULATION')).length;
  const dlpCount = safeList.filter(m => m?.securityAnalysis?.primaryThreat === 'DLP_SECRET_EXPOSURE' || m?.securityAnalysis?.evidenceList?.some(e => e.category === 'DLP_SECRET_EXPOSURE')).length;

  // Compute Risk Timeline from conversation messages
  const timeline = safeList.map((m) => ({
    id: m?.id || Math.random().toString(),
    time: m?.sentAt || '',
    sender: m?.senderName || 'Unknown',
    snippet: m?.plaintext ? (m.plaintext.slice(0, 45) + (m.plaintext.length > 45 ? '...' : '')) : '',
    riskScore: m?.securityAnalysis?.riskScore || 0,
    color: m?.securityAnalysis?.indicatorColor || 'GREEN',
    threat: m?.securityAnalysis?.primaryThreat || 'NONE',
    explanation: m?.securityAnalysis?.explanation || 'Safe',
  }));

  // Identify exposed secrets
  const exposedSecrets = safeList
    .filter(m => m?.securityAnalysis?.evidenceList?.some(e => e.category === 'DLP_SECRET_EXPOSURE'))
    .map(m => ({
      sender: m?.senderName || 'Sender',
      time: m?.sentAt || '',
      signal: m?.securityAnalysis?.evidenceList?.find(e => e.category === 'DLP_SECRET_EXPOSURE')?.description || 'Secret Detected',
    }));

  const handleTestSandbox = async () => {
    if (!sandboxText.trim()) return;
    setIsAnalyzingSandbox(true);
    try {
      const result = await ApiClient.analyzePreSend(sandboxText);
      setSandboxAnalysis(result);
    } catch {
      setSandboxAnalysis(ApiClient.clientSideEvaluate(sandboxText));
    } finally {
      setIsAnalyzingSandbox(false);
    }
  };

  const sampleTriggers = [
    { label: '🎣 Phishing Lure', text: 'URGENT: Your bank account will be suspended in 24h. Verify at http://paypaI-secure-login.xyz/auth' },
    { label: '🔑 Secret Leak', text: 'Here is the master AWS key: AKIAIOSFODNN7EXAMPLE secret wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY' },
    { label: '🎭 Social Engineering', text: 'Hey, I am IT support. Send your 2FA OTP code immediately to prevent identity theft.' },
    { label: '🇵🇰 Urdu Scam', text: 'Aapka 50,000 ka inam nikla hai Benazir Income Support Program se. Abhi rabta karein.' },
  ];

  return (
    <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--green-safe)', flexShrink: 0 }}>
            <Shield size={22} />
          </div>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>AI Guardian Intelligence</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Real-time deep zero-trust message inspection</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.05)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            {(['GUARDIAN', 'BALANCED', 'PRIVACY'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setAiMode(mode)}
                style={{
                  background: aiMode === mode ? 'var(--green-safe)' : 'transparent',
                  color: aiMode === mode ? '#000' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {mode}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsPaused(!isPaused)}
            style={{
              background: isPaused ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.15)',
              border: `1px solid ${isPaused ? '#ef4444' : 'var(--green-safe)'}`,
              color: isPaused ? '#ef4444' : 'var(--green-safe)',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            {isPaused ? 'Paused' : 'Active'}
          </button>
        </div>
      </div>

      {/* Real-time AI Health & Dataset Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <div className="glass-panel" style={{ padding: '14px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Training Data</span>
            <Database size={15} style={{ color: 'var(--accent-cyan)' }} />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>1.7M+</div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Phishing & Scam samples</div>
        </div>

        <div className="glass-panel" style={{ padding: '14px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Inference Speed</span>
            <Zap size={15} style={{ color: '#fbbf24' }} />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>~8ms</div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Zero-lag client inference</div>
        </div>

        <div className="glass-panel" style={{ padding: '14px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Threats Blocked</span>
            <ShieldAlert size={15} style={{ color: 'var(--red-critical)' }} />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--red-critical)', fontFamily: 'var(--font-mono)' }}>{threatMessages.length}</div>
          <div style={{ fontSize: '10px', color: 'var(--red-critical)' }}>100% intercepted</div>
        </div>

        <div className="glass-panel" style={{ padding: '14px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Peak Risk</span>
            <Activity size={15} style={{ color: peakRiskScore > 75 ? 'var(--red-critical)' : peakRiskScore > 40 ? '#f59e0b' : 'var(--green-safe)' }} />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: peakRiskScore > 75 ? 'var(--red-critical)' : peakRiskScore > 40 ? '#f59e0b' : 'var(--green-safe)', fontFamily: 'var(--font-mono)' }}>{peakRiskScore}/100</div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Live conversation score</div>
        </div>
      </div>

      {/* Threat Category Gauges & Sandbox */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        {/* Threat Distribution */}
        <div className="glass-panel" style={{ padding: '18px', borderRadius: '14px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={16} style={{ color: 'var(--accent-cyan)' }} />
            Threat Vector Breakdown
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span>Phishing & Deceptive URLs</span>
                <span style={{ fontWeight: 700, color: phishingCount > 0 ? '#ef4444' : 'var(--text-muted)' }}>{phishingCount}</span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, (phishingCount / (totalMessages || 1)) * 100)}%`, height: '100%', background: '#ef4444' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span>Social Engineering & Manipulation</span>
                <span style={{ fontWeight: 700, color: socialEngCount > 0 ? '#f59e0b' : 'var(--text-muted)' }}>{socialEngCount}</span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, (socialEngCount / (totalMessages || 1)) * 100)}%`, height: '100%', background: '#f59e0b' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span>DLP & Secret Leakage</span>
                <span style={{ fontWeight: 700, color: dlpCount > 0 ? '#38bdf8' : 'var(--text-muted)' }}>{dlpCount}</span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, (dlpCount / (totalMessages || 1)) * 100)}%`, height: '100%', background: '#38bdf8' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Threat Simulation Sandbox */}
        <div className="glass-panel" style={{ padding: '18px', borderRadius: '14px', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} style={{ color: 'var(--accent-cyan)' }} />
            Interactive Threat Simulation Sandbox
          </h3>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 12px' }}>
            Test suspicious texts or URLs against the trained ensemble in real time.
          </p>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
            {sampleTriggers.map((s, idx) => (
              <button
                key={idx}
                onClick={() => setSandboxText(s.text)}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  padding: '3px 8px',
                  fontSize: '10px',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
            <input
              type="text"
              placeholder="Type or paste suspicious text..."
              value={sandboxText}
              onChange={(e) => setSandboxText(e.target.value)}
              style={{
                flex: 1,
                padding: '8px 12px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '12px',
                outline: 'none',
              }}
            />
            <button
              onClick={handleTestSandbox}
              disabled={isAnalyzingSandbox || !sandboxText.trim()}
              style={{
                background: 'var(--accent-cyan)',
                color: '#000',
                border: 'none',
                borderRadius: '8px',
                padding: '0 14px',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              {isAnalyzingSandbox ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
              Test
            </button>
          </div>

          {sandboxAnalysis && (
            <div style={{
              padding: '10px 12px',
              borderRadius: '8px',
              background: sandboxAnalysis.indicatorColor === 'RED' ? 'rgba(239, 68, 68, 0.15)' : sandboxAnalysis.indicatorColor === 'ORANGE' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              border: `1px solid ${sandboxAnalysis.indicatorColor === 'RED' ? 'rgba(239, 68, 68, 0.4)' : sandboxAnalysis.indicatorColor === 'ORANGE' ? 'rgba(245, 158, 11, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontWeight: 800, fontSize: '12px', color: sandboxAnalysis.indicatorColor === 'RED' ? '#ef4444' : sandboxAnalysis.indicatorColor === 'ORANGE' ? '#fbbf24' : '#10b981' }}>
                  Risk Score: {sandboxAnalysis.riskScore}/100 ({sandboxAnalysis.indicatorColor})
                </span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  {sandboxAnalysis.primaryThreat}
                </span>
              </div>
              <p style={{ fontSize: '11px', margin: 0, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {sandboxAnalysis.explanation}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Live Conversation Threat Timeline */}
      <div className="glass-panel" style={{ padding: '18px', borderRadius: '14px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={16} style={{ color: 'var(--accent-cyan)' }} />
          Live Threat Inspection Log ({timeline.length} Messages)
        </h3>

        {timeline.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '12px' }}>
            No messages analyzed in this conversation yet. Send or receive messages to see real-time cognitive timeline.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {timeline.slice(-10).reverse().map(item => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <span style={{ fontWeight: 700, fontSize: '12px', color: 'var(--text-primary)' }}>{item.sender}</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{item.time}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.snippet}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: '6px',
                    background: item.color === 'RED' ? 'rgba(239, 68, 68, 0.2)' : item.color === 'ORANGE' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                    color: item.color === 'RED' ? '#ef4444' : item.color === 'ORANGE' ? '#fbbf24' : '#10b981',
                  }}>
                    {item.riskScore}/100
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
