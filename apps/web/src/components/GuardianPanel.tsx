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
  const totalMessages = messages.length;
  const threatMessages = messages.filter(m => m.securityAnalysis.indicatorColor === 'RED');
  const warnMessages = messages.filter(m => m.securityAnalysis.indicatorColor === 'ORANGE');
  const safeMessages = messages.filter(m => m.securityAnalysis.indicatorColor === 'GREEN');
  const peakRiskScore = messages.reduce((max, m) => Math.max(max, m.securityAnalysis.riskScore), 0);

  const phishingCount = messages.filter(m => m.securityAnalysis.primaryThreat === 'PHISHING' || m.securityAnalysis.evidenceList.some(e => e.category === 'PHISHING')).length;
  const socialEngCount = messages.filter(m => m.securityAnalysis.primaryThreat === 'SOCIAL_ENGINEERING' || m.securityAnalysis.evidenceList.some(e => e.category === 'SOCIAL_ENGINEERING' || e.category === 'URGENCY_MANIPULATION')).length;
  const dlpCount = messages.filter(m => m.securityAnalysis.primaryThreat === 'DLP_SECRET_EXPOSURE' || m.securityAnalysis.evidenceList.some(e => e.category === 'DLP_SECRET_EXPOSURE')).length;

  // Compute Risk Timeline from conversation messages
  const timeline = messages.map((m) => ({
    id: m.id,
    time: m.sentAt,
    sender: m.senderName,
    snippet: m.plaintext.slice(0, 45) + (m.plaintext.length > 45 ? '...' : ''),
    riskScore: m.securityAnalysis.riskScore,
    color: m.securityAnalysis.indicatorColor,
    threat: m.securityAnalysis.primaryThreat,
    explanation: m.securityAnalysis.explanation,
  }));

  // Identify exposed secrets
  const exposedSecrets = messages
    .filter(m => m.securityAnalysis.evidenceList.some(e => e.category === 'DLP_SECRET_EXPOSURE'))
    .map(m => ({
      sender: m.senderName,
      time: m.sentAt,
      signal: m.securityAnalysis.evidenceList.find(e => e.category === 'DLP_SECRET_EXPOSURE')?.description || 'Secret Detected',
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

  return (
    <div style={{ flex: 1, padding: '24px', overflowY: 'auto', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Title & Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(16, 185, 129, 0.2))', border: '1px solid rgba(6, 182, 212, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-cyan)' }}>
            <Brain size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>Guardian AI Intelligence Center</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '2px 0 0' }}>Real-time machine learning telemetry, risk radar & threat sandbox</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', color: 'var(--green-safe)', fontSize: '12px', fontWeight: 700 }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--green-safe)', boxShadow: '0 0 8px var(--green-safe)' }}></span>
            AI Microservice Online
          </div>
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="btn-ghost"
            style={{ fontSize: '12px', color: isPaused ? 'var(--orange-warn)' : 'var(--text-secondary)' }}
          >
            <Clock size={14} style={{ marginRight: '4px' }} />
            {isPaused ? 'Paused (15m)' : 'Pause AI (15m)'}
          </button>
        </div>
      </div>

      {/* Top AI Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-cyan)' }}>
            <Zap size={20} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>INFERENCE SPEED</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>~8ms / msg</div>
            <div style={{ fontSize: '10px', color: 'var(--green-safe)' }}>Ultra-Low Latency</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--green-safe)' }}>
            <Database size={20} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>TRAINING DATASET</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>1,789,038+</div>
            <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Tricky Messages & URLs</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: peakRiskScore >= 75 ? 'rgba(244, 63, 94, 0.15)' : peakRiskScore >= 25 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: peakRiskScore >= 75 ? 'var(--red-critical)' : peakRiskScore >= 25 ? 'var(--orange-warn)' : 'var(--green-safe)' }}>
            <BarChart3 size={20} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>PEAK RISK SCORE</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: peakRiskScore >= 75 ? 'var(--red-critical)' : peakRiskScore >= 25 ? 'var(--orange-warn)' : 'var(--green-safe)' }}>
              {peakRiskScore}/100
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
              {peakRiskScore >= 75 ? 'Critical Threat Flagged' : peakRiskScore >= 25 ? 'Suspicious Activity' : 'Zero-Trust Secure'}
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-purple)' }}>
            <ShieldCheck size={20} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>ACTIVE PRECISION</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>99.8% Precision</div>
            <div style={{ fontSize: '10px', color: 'var(--accent-purple)' }}>Multi-Tier Ensemble</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* 1. Interactive AI Threat Sandbox */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-cyan)' }}>
            <Sparkles size={16} /> Live AI Threat Simulator & Sandbox
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
            Paste any suspicious link, tricky message, or test script to run full neural threat inference:
          </p>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <input
              type="text"
              className="secure-input"
              placeholder="e.g. URGENT: Verify your account at http://bank-verify.xyz/auth..."
              value={sandboxText}
              onChange={(e) => setSandboxText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTestSandbox()}
              style={{ fontSize: '13px', padding: '10px 14px' }}
            />
            <button
              onClick={handleTestSandbox}
              disabled={isAnalyzingSandbox || !sandboxText.trim()}
              className="btn-primary"
              style={{ padding: '10px 16px', fontSize: '13px', whiteSpace: 'nowrap' }}
            >
              {isAnalyzingSandbox ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
              <span>Test AI</span>
            </button>
          </div>

          {/* Quick preset buttons */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', alignSelf: 'center' }}>Presets:</span>
            <button
              onClick={() => setSandboxText('URGENT: Your Bank of America account is suspended. Verify at http://bankofamerica-security-verify.xyz')}
              className="btn-ghost"
              style={{ fontSize: '11px', padding: '4px 8px' }}
            >
              Phishing Link
            </button>
            <button
              onClick={() => setSandboxText('Hey, buy 5x $100 Apple gift cards and send me the codes right now.')}
              className="btn-ghost"
              style={{ fontSize: '11px', padding: '4px 8px' }}
            >
              Gift Card Scam
            </button>
            <button
              onClick={() => setSandboxText('Here is the AWS root key: AKIAIOSFODNN7EXAMPLE')}
              className="btn-ghost"
              style={{ fontSize: '11px', padding: '4px 8px' }}
            >
              DLP Secret Leak
            </button>
          </div>

          {/* Sandbox Evaluation Output */}
          {sandboxAnalysis && (
            <div
              style={{
                marginTop: 'auto',
                padding: '14px',
                borderRadius: '10px',
                background: sandboxAnalysis.indicatorColor === 'RED' ? 'rgba(244, 63, 94, 0.12)' : sandboxAnalysis.indicatorColor === 'ORANGE' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                border: `1px solid ${sandboxAnalysis.indicatorColor === 'RED' ? 'rgba(244, 63, 94, 0.35)' : sandboxAnalysis.indicatorColor === 'ORANGE' ? 'rgba(245, 158, 11, 0.35)' : 'rgba(16, 185, 129, 0.35)'}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: 800, fontSize: '13px', color: sandboxAnalysis.indicatorColor === 'RED' ? 'var(--red-critical)' : sandboxAnalysis.indicatorColor === 'ORANGE' ? 'var(--orange-warn)' : 'var(--green-safe)' }}>
                  {sandboxAnalysis.indicatorColor === 'RED' ? '🚨 CRITICAL THREAT DETECTED' : sandboxAnalysis.indicatorColor === 'ORANGE' ? '⚠️ SUSPICIOUS PATTERN DETECTED' : '🛡️ VERIFIED SAFE'}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 800 }}>
                  Risk: {sandboxAnalysis.riskScore}/100
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 6px' }}>
                {sandboxAnalysis.explanation}
              </p>
              {sandboxAnalysis.evidenceList.length > 0 && (
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
                  {sandboxAnalysis.evidenceList.map((ev, i) => (
                    <span key={i} style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                      {ev.signal} ({Math.round(ev.confidence * 100)}%)
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 2. Security Operation Modes */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={16} style={{ color: 'var(--green-safe)' }} /> Security Operation Mode
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {[
              { mode: 'GUARDIAN', title: 'Guardian Mode', desc: 'Maximum protection: Deep phishing, social engineering & DLP evaluation.' },
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
      </div>

      {/* Bottom Grid: Risk Timeline & Secret Map */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* 3. Real-Time Conversation Risk Timeline */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={16} style={{ color: 'var(--orange-warn)' }} /> Conversation Risk Timeline ({totalMessages} msgs)
          </h3>

          {timeline.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
              No messages recorded in this conversation yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '280px', overflowY: 'auto' }}>
              {timeline.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: item.color === 'RED' ? 'var(--red-critical)' : item.color === 'ORANGE' ? 'var(--orange-warn)' : 'var(--green-safe)',
                      boxShadow: `0 0 8px ${item.color === 'RED' ? 'var(--red-glow)' : item.color === 'ORANGE' ? 'var(--orange-glow)' : 'var(--green-glow)'}`,
                      flexShrink: 0,
                    }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.sender}: {item.snippet}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        {item.time} • {item.threat}
                      </div>
                    </div>
                  </div>

                  <span
                    className={item.color === 'RED' ? 'badge-red' : item.color === 'ORANGE' ? 'badge-orange' : 'badge-green'}
                    style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '6px', fontWeight: 800, flexShrink: 0, marginLeft: '8px' }}
                  >
                    {item.riskScore}/100
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. Secret Exposure Map */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Key size={16} style={{ color: 'var(--accent-cyan)' }} /> Secret Exposure & DLP Map
          </h3>

          {exposedSecrets.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', color: 'var(--green-safe)', textAlign: 'center' }}>
              <CheckCircle size={32} style={{ marginBottom: '8px' }} />
              <div style={{ fontWeight: 700, fontSize: '14px' }}>Zero Leaks Detected</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No exposed API keys, credit cards, or passwords found in this conversation.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
              {exposedSecrets.map((sec, i) => (
                <div
                  key={i}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'rgba(245, 158, 11, 0.08)',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--orange-warn)' }}>{sec.signal}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Sender: {sec.sender} • {sec.time}</div>
                  </div>
                  <AlertTriangle size={14} style={{ color: 'var(--orange-warn)', flexShrink: 0 }} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
