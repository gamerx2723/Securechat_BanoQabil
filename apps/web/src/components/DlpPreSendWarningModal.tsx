import React from 'react';
import { ShieldAlert, AlertTriangle, Key, Shield, Send, X } from 'lucide-react';
import { SecurityAnalysis, ThreatEvidence } from '../types';

interface DlpPreSendWarningModalProps {
  isOpen: boolean;
  draftText: string;
  analysis: SecurityAnalysis;
  onCancel: () => void;
  onSendAnyway: () => void;
  onSendRedacted: (redactedText: string) => void;
}

export const DlpPreSendWarningModal: React.FC<DlpPreSendWarningModalProps> = ({
  isOpen,
  draftText,
  analysis,
  onCancel,
  onSendAnyway,
  onSendRedacted,
}) => {
  if (!isOpen) return null;

  // Simple client-side redaction helper
  const performRedaction = (text: string): string => {
    let res = text;
    // Redact password assignments
    res = res.replace(/(?:password|pass|pwd|secret|passcode|creds)\s*[:=]\s*["']?([^\s"';,]{4,})["']?/gi, (match, p1) => match.replace(p1, '[PASSWORD REDACTED]'));
    res = res.replace(/(?:my\s+(?:password|pin|passcode)\s+is\s+)([^\s"';,]{4,})/gi, (match, p1) => match.replace(p1, '[PASSWORD REDACTED]'));
    // Redact CNIC
    res = res.replace(/\b(\d{5}-\d{7}-\d|\d{13})\b/g, '[CNIC REDACTED]');
    // Redact AWS / GitHub / JWT tokens
    res = res.replace(/\b(AKIA[0-9A-Z]{16})\b/g, '[AWS KEY REDACTED]');
    res = res.replace(/\b(ghp_[0-9a-zA-Z]{36}|github_pat_[0-9a-zA-Z_]{82})\b/g, '[GITHUB TOKEN REDACTED]');
    res = res.replace(/\b(eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*)\b/g, '[SESSION TOKEN REDACTED]');
    // Redact OTP
    res = res.replace(/(?:otp|verification\s*code|security\s*code|passcode|login\s*code|code\s*is|tasdeeqi\s*code)\s*[:=]?\s*(\b\d{4,8}\b)/gi, (match, p1) => match.replace(p1, '[OTP REDACTED]'));
    // Redact Credit cards
    res = res.replace(/\b(?:\d{4}[-\s]?){3}\d{4}\b|\b\d{15,16}\b/g, '****-****-****-XXXX');
    // Redact IBAN / Account
    res = res.replace(/\b(PK\d{2}[A-Z]{4}\d{16}|(?:account|acc|ac|khata)\s*#?\s*[:=]?\s*\d{10,16})\b/gi, '[BANK ACCOUNT REDACTED]');
    return res;
  };

  const redactedPreview = performRedaction(draftText);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(5, 7, 10, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid rgba(245, 158, 11, 0.5)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '560px',
          padding: '24px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(245, 158, 11, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          animation: 'fadeIn 0.2s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--orange-warn)',
              }}
            >
              <ShieldAlert size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Sensitive Data & Credentials Detected
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--orange-warn)', fontWeight: 600 }}>
                Zero-Trust Data Loss Prevention (DLP) Warning
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Advisory Box */}
        <div
          style={{
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            borderRadius: '10px',
            padding: '12px 14px',
            fontSize: '13px',
            color: 'var(--text-secondary)',
            lineHeight: '1.5',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--orange-warn)', marginBottom: '4px' }}>
            <AlertTriangle size={15} />
            <span>Before you send this message:</span>
          </div>
          You are about to transmit sensitive personal credentials, passwords, or confidential identification into this chat channel.
        </div>

        {/* Detected Tokens List */}
        <div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Detected Sensitive Items:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {analysis.evidenceList.map((ev: ThreatEvidence, idx: number) => (
              <div
                key={idx}
                style={{
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12px',
                }}
              >
                <Key size={14} style={{ color: 'var(--orange-warn)', flexShrink: 0 }} />
                <span style={{ color: 'var(--text-primary)', flex: 1 }}>{ev.description}</span>
                <span className="badge-orange" style={{ fontSize: '10px', padding: '1px 6px' }}>
                  {ev.category}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Draft Message Preview */}
        <div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
            Draft Message Content:
          </div>
          <div
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '10px 12px',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              maxHeight: '70px',
              overflowY: 'auto',
              wordBreak: 'break-word',
            }}
          >
            {draftText}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
          {/* Option 1: Redact & Send (Recommended) */}
          <button
            onClick={() => onSendRedacted(redactedPreview)}
            className="btn-primary"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 16px',
              fontSize: '13px',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              color: '#ffffff',
            }}
          >
            <Shield size={16} />
            <span>Redact Secrets & Send Safely (Recommended)</span>
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            {/* Option 2: Cancel & Edit */}
            <button
              onClick={onCancel}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '9px 14px',
                fontSize: '12px',
                fontWeight: 600,
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                cursor: 'pointer',
              }}
            >
              <X size={14} />
              <span>Cancel & Edit Draft</span>
            </button>

            {/* Option 3: Send Anyway (Explicit Override) */}
            <button
              onClick={onSendAnyway}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '9px 14px',
                fontSize: '12px',
                fontWeight: 600,
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                color: 'var(--red-critical)',
                cursor: 'pointer',
              }}
            >
              <Send size={14} />
              <span>Send Unmasked Anyway</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
