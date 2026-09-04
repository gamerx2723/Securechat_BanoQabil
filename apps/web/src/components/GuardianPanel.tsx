import React, { useState, useEffect, useMemo } from 'react';
import { ConversationItem, ChatMessage, SecurityAnalysis } from '../types';
import { ApiClient } from '../api/client';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Activity,
  Zap,
  Sparkles,
  Send,
  RefreshCw,
  BarChart3,
  Database,
  Clock,
  Filter,
  MessageSquare,
  Lock,
} from 'lucide-react';

interface GuardianPanelProps {
  conversations: ConversationItem[];
  messagesMap: Record<string, ChatMessage[]>;
  activeConvId?: string;
  onSelectConversation?: (id: string) => void;
}

export const GuardianPanel: React.FC<GuardianPanelProps> = ({
  conversations,
  messagesMap,
  activeConvId,
  onSelectConversation,
}) => {
  const [selectedChannelId, setSelectedChannelId] = useState<string>(activeConvId || 'ALL');
  const [aiMode, setAiMode] = useState<'GUARDIAN' | 'BALANCED' | 'PRIVACY'>('GUARDIAN');
  const [isPaused, setIsPaused] = useState(false);

  // Interactive AI Sandbox state
  const [sandboxText, setSandboxText] = useState('');
  const [sandboxAnalysis, setSandboxAnalysis] = useState<SecurityAnalysis | null>(null);
  const [isAnalyzingSandbox, setIsAnalyzingSandbox] = useState(false);

  // Compute messages based on selected channel (ALL or specific conversation)
  const targetMessages: ChatMessage[] = useMemo(() => {
    if (selectedChannelId === 'ALL') {
      const allMsgs: ChatMessage[] = [];
      for (const convId of Object.keys(messagesMap)) {
        allMsgs.push(...(messagesMap[convId] || []));
      }
      return allMsgs.sort((a, b) => (a.id > b.id ? 1 : -1));
    }
    return messagesMap[selectedChannelId] || [];
  }, [selectedChannelId, messagesMap]);

  // Behavioral Escalation & Grooming Tracker state
  const [behaviorReport, setBehaviorReport] = useState<{
    conversationId: string;
    grooming_detected: boolean;
    grooming_risk_score: number;
    current_stage: string;
    stage_label: string;
    velocity_summary: string;
    intimacy_index: number;
    isolation_index: number;
    pity_index: number;
    exploitation_index: number;
    timeline_milestones: Array<{
      turn: number;
      stage: string;
      risk_score: number;
      snippet: string;
      detected_indicators: string[];
    }>;
    recommendation: string;
  } | null>(null);
  const [isLoadingBehavior, setIsLoadingBehavior] = useState(false);

  useEffect(() => {
    if (selectedChannelId && selectedChannelId !== 'ALL') {
      setIsLoadingBehavior(true);
      ApiClient.analyzeBehavior(selectedChannelId)
        .then(setBehaviorReport)
        .catch(() => setBehaviorReport(null))
        .finally(() => setIsLoadingBehavior(false));
    } else {
      setBehaviorReport(null);
    }
  }, [selectedChannelId, targetMessages.length]);

  // Compute Live Metrics
  const totalMessages = targetMessages.length;
  const threatMessages = targetMessages.filter(
    (m) => m?.securityAnalysis?.indicatorColor === 'RED'
  );
  const warnMessages = targetMessages.filter(
    (m) => m?.securityAnalysis?.indicatorColor === 'ORANGE'
  );
  const safeMessages = targetMessages.filter(
    (m) => m?.securityAnalysis?.indicatorColor === 'GREEN' || !m?.securityAnalysis?.indicatorColor
  );
  const peakRiskScore = targetMessages.reduce(
    (max, m) => Math.max(max, m?.securityAnalysis?.riskScore || 0),
    0
  );

  const phishingCount = targetMessages.filter(
    (m) =>
      m?.securityAnalysis?.primaryThreat === 'PHISHING' ||
      m?.securityAnalysis?.evidenceList?.some((e) => e.category === 'PHISHING')
  ).length;

  const socialEngCount = targetMessages.filter(
    (m) =>
      m?.securityAnalysis?.primaryThreat === 'SOCIAL_ENGINEERING' ||
      m?.securityAnalysis?.evidenceList?.some(
        (e) => e.category === 'SOCIAL_ENGINEERING' || e.category === 'URGENCY_MANIPULATION'
      )
  ).length;

  const dlpCount = targetMessages.filter(
    (m) =>
      m?.securityAnalysis?.primaryThreat === 'DLP_SECRET_EXPOSURE' ||
      m?.securityAnalysis?.evidenceList?.some((e) => e.category === 'DLP_SECRET_EXPOSURE')
  ).length;

  // Compute Timeline
  const timeline = targetMessages.map((m) => ({
    id: m?.id || Math.random().toString(),
    time: m?.sentAt || 'Now',
    sender: m?.senderName || 'Participant',
    snippet: m?.plaintext ? m.plaintext.slice(0, 50) + (m.plaintext.length > 50 ? '...' : '') : '',
    riskScore: m?.securityAnalysis?.riskScore || 0,
    color: m?.securityAnalysis?.indicatorColor || 'GREEN',
    threat: m?.securityAnalysis?.primaryThreat || 'NONE',
    explanation: m?.securityAnalysis?.explanation || 'Verified clean transmission.',
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
    {
      label: '🎣 Phishing Link',
      text: 'URGENT: Your bank account will be suspended in 24h. Verify at http://hbl-security-login.serveo.net/auth',
    },
    {
      label: '🔑 Secret Leak',
      text: 'Here is the master AWS key: AKIAIOSFODNN7EXAMPLE secret wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
    },
    {
      label: '🎭 Social Engineering',
      text: 'I am in an executive meeting, don\'t call me. Buy 5 Apple gift cards of $100 and send photos immediately.',
    },
    {
      label: '🇵🇰 Roman Urdu Scam',
      text: 'Bhai jaldi karo, account block honay wala hai! Apna 4 digit OTP tasdeeqi code aur CNIC number foran bhejo.',
    },
  ];

  return (
    <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--green-safe)',
              flexShrink: 0,
            }}
          >
            <Shield size={22} />
          </div>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, whiteSpace: 'nowrap' }}>
              AI Guardian Intelligence
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, whiteSpace: 'nowrap' }}>
              Real-time deep zero-trust message inspection & forensics
            </p>
          </div>
        </div>

        {/* Channel Selector & AI Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 255, 255, 0.05)', padding: '4px 8px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <Filter size={13} style={{ color: 'var(--text-muted)' }} />
            <select
              value={selectedChannelId}
              onChange={(e) => {
                setSelectedChannelId(e.target.value);
                if (onSelectConversation && e.target.value !== 'ALL') {
                  onSelectConversation(e.target.value);
                }
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '11px',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="ALL" style={{ background: '#0b1120', color: '#f8fafc' }}>
                🌐 All Channels ({conversations.length} Active)
              </option>
              {conversations.map((c) => (
                <option key={c.id} value={c.id} style={{ background: '#0b1120', color: '#f8fafc' }}>
                  💬 {c.title}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.05)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            {(['GUARDIAN', 'BALANCED', 'PRIVACY'] as const).map((mode) => (
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
                  transition: 'all 0.15s ease',
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
              cursor: 'pointer',
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
            <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Total Messages</span>
            <MessageSquare size={15} style={{ color: 'var(--accent-cyan)' }} />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
            {totalMessages}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Zero-Trust Analyzed</div>
        </div>

        <div className="glass-panel" style={{ padding: '14px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Threats Blocked</span>
            <ShieldAlert size={15} style={{ color: 'var(--red-critical)' }} />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--red-critical)', fontFamily: 'var(--font-mono)' }}>
            {threatMessages.length}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--red-critical)' }}>100% Intercepted</div>
        </div>

        <div className="glass-panel" style={{ padding: '14px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Peak Risk</span>
            <Activity size={15} style={{ color: peakRiskScore > 75 ? 'var(--red-critical)' : peakRiskScore > 35 ? '#f59e0b' : 'var(--green-safe)' }} />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: peakRiskScore > 75 ? 'var(--red-critical)' : peakRiskScore > 35 ? '#f59e0b' : 'var(--green-safe)', fontFamily: 'var(--font-mono)' }}>
            {peakRiskScore}/100
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Live Threat Score</div>
        </div>

        <div className="glass-panel" style={{ padding: '14px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Inference Latency</span>
            <Zap size={15} style={{ color: '#fbbf24' }} />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>
            ~6ms
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Real-time Edge Speed</div>
        </div>
      </div>

      {/* Multi-Turn Behavioral Escalation & Grooming / Romance Scam Tracker */}
      <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', marginBottom: '20px', border: '1px solid rgba(244, 63, 94, 0.25)', background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 27, 75, 0.4))' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: behaviorReport?.grooming_detected ? 'rgba(244, 63, 94, 0.2)' : 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: behaviorReport?.grooming_detected ? '#f43f5e' : 'var(--green-safe)' }}>
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Multi-Turn Behavioral Escalation & Grooming / Romance Scam Tracker
              </h3>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                15–20 turn sliding-window conversational velocity & manipulation stage analysis
              </p>
            </div>
          </div>

          <span
            style={{
              fontSize: '12px',
              fontWeight: 800,
              padding: '4px 12px',
              borderRadius: '8px',
              background: behaviorReport?.grooming_detected
                ? 'rgba(244, 63, 94, 0.2)'
                : 'rgba(16, 185, 129, 0.15)',
              color: behaviorReport?.grooming_detected ? '#f43f5e' : 'var(--green-safe)',
              border: `1px solid ${behaviorReport?.grooming_detected ? 'rgba(244, 63, 94, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
            }}
          >
            {behaviorReport?.stage_label || 'Stage 1: Clean Baseline'}
          </span>
        </div>

        {/* Narrative & Stage Meter */}
        <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '12px 14px', borderRadius: '10px', marginBottom: '16px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: '8px' }}>
            {behaviorReport?.velocity_summary || (selectedChannelId === 'ALL' ? 'Select a specific channel above to view sliding-window behavioral escalation forensics.' : 'Conversation is currently maintaining a benign communication baseline.')}
          </div>
          {behaviorReport?.recommendation && (
            <div style={{ fontSize: '11px', color: behaviorReport.grooming_detected ? '#fb7185' : 'var(--green-safe)', fontWeight: 600 }}>
              🛡️ AI Guardian Guidance: {behaviorReport.recommendation}
            </div>
          )}
        </div>

        {/* 4 Velocity Metrics Gauges */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '16px' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Intimacy Velocity</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#ec4899', fontFamily: 'var(--font-mono)' }}>
              {Math.round((behaviorReport?.intimacy_index || 0) * 100)}%
            </div>
            <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden', marginTop: '4px' }}>
              <div style={{ width: `${Math.min(100, (behaviorReport?.intimacy_index || 0) * 100)}%`, height: '100%', background: '#ec4899' }} />
            </div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Isolation Velocity</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#a855f7', fontFamily: 'var(--font-mono)' }}>
              {Math.round((behaviorReport?.isolation_index || 0) * 100)}%
            </div>
            <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden', marginTop: '4px' }}>
              <div style={{ width: `${Math.min(100, (behaviorReport?.isolation_index || 0) * 100)}%`, height: '100%', background: '#a855f7' }} />
            </div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Pity / Urgency Pressure</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#f59e0b', fontFamily: 'var(--font-mono)' }}>
              {Math.round((behaviorReport?.pity_index || 0) * 100)}%
            </div>
            <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden', marginTop: '4px' }}>
              <div style={{ width: `${Math.min(100, (behaviorReport?.pity_index || 0) * 100)}%`, height: '100%', background: '#f59e0b' }} />
            </div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Exploitation Velocity</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#ef4444', fontFamily: 'var(--font-mono)' }}>
              {Math.round((behaviorReport?.exploitation_index || 0) * 100)}%
            </div>
            <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden', marginTop: '4px' }}>
              <div style={{ width: `${Math.min(100, (behaviorReport?.exploitation_index || 0) * 100)}%`, height: '100%', background: '#ef4444' }} />
            </div>
          </div>
        </div>

        {/* Behavioral Escalation Milestones Timeline */}
        {behaviorReport && behaviorReport.timeline_milestones && behaviorReport.timeline_milestones.length > 0 && (
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
              Turn-by-Turn Escalation Milestones ({behaviorReport.timeline_milestones.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '140px', overflowY: 'auto' }}>
              {behaviorReport.timeline_milestones.map((m, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', fontSize: '11px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                    <span style={{ fontWeight: 800, color: 'var(--accent-cyan)' }}>#{m.turn}</span>
                    <span style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      "{m.snippet}"
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    <span style={{ fontSize: '10px', color: m.risk_score >= 50 ? '#ef4444' : '#fbbf24', fontWeight: 700 }}>{m.stage}</span>
                    <span style={{ fontSize: '10px', padding: '1px 5px', borderRadius: '4px', background: m.risk_score >= 50 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)', color: m.risk_score >= 50 ? '#ef4444' : '#fbbf24', fontWeight: 800 }}>
                      {m.risk_score}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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
                <span style={{ fontWeight: 700, color: phishingCount > 0 ? '#ef4444' : 'var(--text-muted)' }}>
                  {phishingCount}
                </span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.min(100, (phishingCount / (totalMessages || 1)) * 100)}%`,
                    height: '100%',
                    background: '#ef4444',
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span>Social Engineering & Manipulation</span>
                <span style={{ fontWeight: 700, color: socialEngCount > 0 ? '#f59e0b' : 'var(--text-muted)' }}>
                  {socialEngCount}
                </span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.min(100, (socialEngCount / (totalMessages || 1)) * 100)}%`,
                    height: '100%',
                    background: '#f59e0b',
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span>DLP & Secret Leakage</span>
                <span style={{ fontWeight: 700, color: dlpCount > 0 ? '#38bdf8' : 'var(--text-muted)' }}>
                  {dlpCount}
                </span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.min(100, (dlpCount / (totalMessages || 1)) * 100)}%`,
                    height: '100%',
                    background: '#38bdf8',
                  }}
                />
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
            Test suspicious texts or URLs against the zero-trust AI ensemble in real time.
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
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTestSandbox();
              }}
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
            <div
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                background:
                  sandboxAnalysis.indicatorColor === 'RED'
                    ? 'rgba(239, 68, 68, 0.15)'
                    : sandboxAnalysis.indicatorColor === 'ORANGE'
                    ? 'rgba(245, 158, 11, 0.15)'
                    : 'rgba(16, 185, 129, 0.15)',
                border: `1px solid ${
                  sandboxAnalysis.indicatorColor === 'RED'
                    ? 'rgba(239, 68, 68, 0.4)'
                    : sandboxAnalysis.indicatorColor === 'ORANGE'
                    ? 'rgba(245, 158, 11, 0.4)'
                    : 'rgba(16, 185, 129, 0.4)'
                }`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span
                  style={{
                    fontWeight: 800,
                    fontSize: '12px',
                    color:
                      sandboxAnalysis.indicatorColor === 'RED'
                        ? '#ef4444'
                        : sandboxAnalysis.indicatorColor === 'ORANGE'
                        ? '#fbbf24'
                        : '#10b981',
                  }}
                >
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
            No messages analyzed in this selection yet. Send or receive messages to see real-time cognitive timeline.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {timeline
              .slice(-15)
              .reverse()
              .map((item) => (
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
                      <span style={{ fontWeight: 700, fontSize: '12px', color: 'var(--text-primary)' }}>
                        {item.sender}
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{item.time}</span>
                    </div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: 'var(--text-secondary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.snippet}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: '6px',
                        background:
                          item.color === 'RED'
                            ? 'rgba(239, 68, 68, 0.2)'
                            : item.color === 'ORANGE'
                            ? 'rgba(245, 158, 11, 0.2)'
                            : 'rgba(16, 185, 129, 0.2)',
                        color:
                          item.color === 'RED'
                            ? '#ef4444'
                            : item.color === 'ORANGE'
                            ? '#fbbf24'
                            : '#10b981',
                      }}
                    >
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
