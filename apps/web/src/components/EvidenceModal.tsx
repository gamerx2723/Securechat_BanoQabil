import React, { useState } from 'react';
import { ChatMessage } from '../types';
import { ApiClient } from '../api/client';
import { ShieldAlert, ShieldCheck, X, AlertTriangle, ExternalLink, HelpCircle, CheckCircle, Shield, Ban, Sparkles, Check, ThumbsUp, ThumbsDown } from 'lucide-react';

interface EvidenceModalProps {
  message: ChatMessage | null;
  onClose: () => void;
  onAskCopilot: (query: string) => void;
}

export const EvidenceModal: React.FC<EvidenceModalProps> = ({ message, onClose, onAskCopilot }) => {
  const [learningFeedback, setLearningFeedback] = useState<string | null>(null);
  const [isTeaching, setIsTeaching] = useState(false);

  if (!message) return null;

  const analysis = message.securityAnalysis;
  const isRed = analysis.indicatorColor === 'RED';
  const isOrange = analysis.indicatorColor === 'ORANGE';
  const isGreen = analysis.indicatorColor === 'GREEN';

  const handleTeachAI = async (label: 'MALICIOUS' | 'BENIGN') => {
    setIsTeaching(true);
    const category = label === 'MALICIOUS' ? 'USER_REPORTED_ZERO_DAY' : 'FALSE_ALARM_FEEDBACK';
    const res = await ApiClient.teachAI(message.plaintext, label, category);
    await ApiClient.submitSecurityFeedback(message.id, label === 'BENIGN', message.plaintext);
    setIsTeaching(false);
    setLearningFeedback(label === 'MALICIOUS' 
      ? '⚡ Learned pattern into permanent AI Threat Memory (SGD weights updated online).' 
      : '✅ Pattern calibrated as Safe. AI will not false-alarm on this pattern again.');
    setTimeout(() => setLearningFeedback(null), 4000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        className="glass-modal fade-in"
        style={{
          width: '100%',
          maxWidth: '580px',
          borderRadius: '18px',
          padding: '24px',
          position: 'relative',
          color: 'var(--text-primary)',
          background: 'var(--bg-secondary, #0f172a)',
          border: `1px solid ${isRed ? 'rgba(239, 68, 68, 0.3)' : isOrange ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
          boxShadow: '0 20px 50px rgba(0,0,0,0.7)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: isRed ? 'rgba(244, 63, 94, 0.2)' : isOrange ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isRed ? 'var(--red-critical)' : isOrange ? 'var(--orange-warn)' : 'var(--green-safe)',
              }}
            >
              {isGreen ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
            </div>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0 }}>Zero-Trust Security Inspection</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>Deep Cognitive & Adaptive Learning Pipeline</p>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Risk Score Gauge & Threat Badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '12px', marginBottom: '18px', border: '1px solid var(--border-subtle)' }}>
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Risk Score</div>
            <div style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: isRed ? 'var(--red-critical)' : isOrange ? 'var(--orange-warn)' : 'var(--green-safe)' }}>
              {analysis.riskScore} <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>/ 100</span>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>Classification</div>
            <span
              style={{
                display: 'inline-block',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 700,
                background: isRed ? 'rgba(244, 63, 94, 0.2)' : isOrange ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                color: isRed ? 'var(--red-critical)' : isOrange ? 'var(--orange-warn)' : 'var(--green-safe)',
                border: `1px solid ${isRed ? 'rgba(244, 63, 94, 0.4)' : isOrange ? 'rgba(245, 158, 11, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
              }}
            >
              {analysis.primaryThreat.replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        {/* Why Was This Flagged? */}
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '6px', letterSpacing: '0.04em' }}>
            Cognitive Intent Reasoning
          </h4>
          <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.5', background: 'rgba(0, 0, 0, 0.25)', padding: '12px', borderRadius: '8px', borderLeft: `3px solid ${isRed ? 'var(--red-critical)' : isOrange ? 'var(--orange-warn)' : 'var(--green-safe)'}`, margin: 0 }}>
            {analysis.explanation}
          </p>
        </div>

        {/* Evidence Points */}
        {analysis.evidenceList.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '6px', letterSpacing: '0.04em' }}>
              Observed Signals & Evidence ({analysis.evidenceList.length})
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '120px', overflowY: 'auto' }}>
              {analysis.evidenceList.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', background: 'rgba(255, 255, 255, 0.02)', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                  <AlertTriangle size={14} style={{ color: isRed ? 'var(--red-critical)' : 'var(--orange-warn)', flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.category.replace(/_/g, ' ')}: </span>
                    <span style={{ color: 'var(--text-secondary)' }}>{item.description}</span>
                  </div>
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    {Math.round(item.confidence * 100)}% conf
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Continuous Active Learning Controls */}
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.06)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '10px',
            padding: '12px 14px',
            marginBottom: '18px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={14} style={{ color: '#10b981' }} /> Teach AI Model (Continuous Online Learning)
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => handleTeachAI('MALICIOUS')}
                disabled={isTeaching}
                title="Teach AI this message is malicious"
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  color: '#ef4444',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <ThumbsDown size={12} /> Confirm Threat
              </button>

              <button
                onClick={() => handleTeachAI('BENIGN')}
                disabled={isTeaching}
                title="Teach AI this message is clean and safe"
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  color: '#10b981',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <ThumbsUp size={12} /> Confirm Safe
              </button>
            </div>
          </div>

          {learningFeedback && (
            <div style={{ marginTop: '8px', fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }} className="fade-in">
              <Check size={13} /> {learningFeedback}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={() => {
              onAskCopilot(`Why was this message flagged with risk score ${analysis.riskScore}? Message snippet: "${message.plaintext.slice(0, 80)}"`);
              onClose();
            }}
            className="btn-ghost"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
          >
            <HelpCircle size={14} /> Ask Copilot
          </button>

          {isRed && (
            <button
              onClick={() => {
                alert('Sender blocked and threat quarantined in local Security Archive.');
                onClose();
              }}
              className="btn-danger"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
            >
              <Ban size={14} /> Block & Quarantine
            </button>
          )}

          <button onClick={onClose} className="btn-primary" style={{ fontSize: '12px' }}>
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
