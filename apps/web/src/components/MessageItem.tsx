import React from 'react';
import { ChatMessage, SecurityIndicatorColor } from '../types';
import { ShieldCheck, ShieldAlert, Check, CheckCheck, AlertTriangle, Lock } from 'lucide-react';

interface MessageItemProps {
  message: ChatMessage;
  onInspectSecurity: (message: ChatMessage) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message, onInspectSecurity }) => {
  const isSelf = message.isSelf;
  const analysis = message.securityAnalysis;

  const isRed = analysis.indicatorColor === 'RED';
  const isOrange = analysis.indicatorColor === 'ORANGE';
  const isGreen = analysis.indicatorColor === 'GREEN';
  const isDlp = analysis.primaryThreat === 'DLP_SECRET_EXPOSURE';

  // OpSec Principle:
  // - Sender ONLY sees warnings for their OWN sensitive data leaks (DLP) to prevent self-harm.
  // - Sender is NOT given threat scores on phishing/social engineering attacks to prevent evasion crafting.
  // - Receiver gets FULL prominent protection warnings & threat scores for incoming attacks.
  const showWarningBanner = isSelf ? isDlp : (isRed || isOrange);

  const bubbleBorder = isSelf
    ? isDlp
      ? '1px solid rgba(245, 158, 11, 0.7)'
      : '1px solid rgba(16, 185, 129, 0.2)'
    : isRed
    ? '1px solid rgba(239, 68, 68, 0.6)'
    : isOrange
    ? '1px solid rgba(245, 158, 11, 0.5)'
    : '1px solid var(--border-subtle)';

  const bubbleShadow = isSelf
    ? isDlp
      ? '0 4px 16px rgba(245, 158, 11, 0.2)'
      : '0 4px 12px rgba(0, 0, 0, 0.15)'
    : isRed
    ? '0 4px 20px rgba(239, 68, 68, 0.2)'
    : isOrange
    ? '0 4px 16px rgba(245, 158, 11, 0.15)'
    : '0 4px 12px rgba(0, 0, 0, 0.15)';

  const getThreatTitle = () => {
    if (isDlp) return 'SENSITIVE SECRET / DATA LEAK DETECTED';
    if (analysis.primaryThreat === 'PHISHING') return 'DECEPTIVE PHISHING LINK DETECTED';
    if (analysis.primaryThreat === 'SOCIAL_ENGINEERING') return 'PSYCHOLOGICAL SCAM / MANIPULATION DETECTED';
    return 'CRITICAL THREAT DETECTED';
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isSelf ? 'flex-end' : 'flex-start',
        marginBottom: '16px',
        padding: '0 20px',
      }}
    >
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span style={{ fontWeight: 600 }}>{message.senderName}</span>
        <span style={{ fontSize: '9px' }}>•</span>
        <span>{message.sentAt}</span>
      </div>

      <div
        style={{
          maxWidth: '75%',
          background: isSelf ? 'var(--bg-bubble-self)' : 'var(--bg-bubble-other)',
          border: bubbleBorder,
          borderRadius: isSelf ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          padding: '12px 16px',
          position: 'relative',
          boxShadow: bubbleShadow,
          transition: 'all 0.2s ease',
        }}
      >
        {/* Prominent Threat Banner (Asymmetric OpSec) */}
        {showWarningBanner && (
          <div
            style={{
              background: isDlp || isOrange ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${isDlp || isOrange ? 'rgba(245, 158, 11, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
              borderRadius: '8px',
              padding: '6px 10px',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: isDlp || isOrange ? 'var(--orange-warn)' : 'var(--red-critical)',
              fontSize: '12px',
              fontWeight: 700,
            }}
          >
            <AlertTriangle size={14} />
            <span>⚠️ {getThreatTitle()}</span>
          </div>
        )}

        {/* Decrypted Plaintext */}
        <div style={{ color: 'var(--text-primary)', fontSize: '14px', lineHeight: '1.5', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
          {message.plaintext}
        </div>

        {/* Footer info: Delivery status & Interactive Security Badge */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
          {isSelf && (
            <span style={{ color: 'var(--green-safe)', display: 'flex', alignItems: 'center' }}>
              {message.status === 'READ' ? <CheckCheck size={14} /> : <Check size={14} />}
            </span>
          )}

          {/* Interactive Security Badge */}
          {isSelf ? (
            // Sender Badge
            isDlp ? (
              <button
                onClick={() => onInspectSecurity(message)}
                className="badge-orange"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: 'none',
                  outline: 'none',
                  fontFamily: 'var(--font-mono)',
                }}
                title="Click to view leaked secret inspection"
              >
                <ShieldAlert size={12} />
                <span>LEAK WARNING</span>
              </button>
            ) : (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 6px',
                  fontSize: '10px',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                <Lock size={10} style={{ color: 'var(--green-safe)' }} />
                <span>E2EE</span>
              </span>
            )
          ) : (
            // Receiver Badge
            <button
              onClick={() => onInspectSecurity(message)}
              className={isRed ? 'badge-red' : isOrange ? 'badge-orange' : 'badge-green'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 8px',
                borderRadius: '9999px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                border: 'none',
                outline: 'none',
                fontFamily: 'var(--font-mono)',
              }}
              title="Click to inspect evidence, teach AI, or vote on threat"
            >
              {isGreen ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
              <span>{analysis.indicatorColor === 'GREEN' ? 'SAFE' : `${analysis.riskScore}% RISK`}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
