import React from 'react';
import { ChatMessage, SecurityIndicatorColor } from '../types';
import { ShieldCheck, ShieldAlert, Check, CheckCheck, AlertTriangle } from 'lucide-react';

interface MessageItemProps {
  message: ChatMessage;
  onInspectSecurity: (message: ChatMessage) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message, onInspectSecurity }) => {
  const isSelf = message.isSelf;
  const analysis = message.securityAnalysis;

  const getBadgeStyle = (color: SecurityIndicatorColor) => {
    switch (color) {
      case 'RED':
        return 'badge-red';
      case 'ORANGE':
        return 'badge-orange';
      case 'GREEN':
      default:
        return 'badge-green';
    }
  };

  const getBadgeIcon = (color: SecurityIndicatorColor) => {
    switch (color) {
      case 'RED':
      case 'ORANGE':
        return <ShieldAlert size={12} />;
      case 'GREEN':
      default:
        return <ShieldCheck size={12} />;
    }
  };

  const isRed = analysis.indicatorColor === 'RED';
  const isOrange = analysis.indicatorColor === 'ORANGE';

  const bubbleBorder = isRed
    ? '1px solid rgba(239, 68, 68, 0.6)'
    : isOrange
    ? '1px solid rgba(245, 158, 11, 0.5)'
    : isSelf
    ? '1px solid rgba(16, 185, 129, 0.2)'
    : '1px solid var(--border-subtle)';

  const bubbleShadow = isRed
    ? '0 4px 20px rgba(239, 68, 68, 0.2)'
    : isOrange
    ? '0 4px 16px rgba(245, 158, 11, 0.15)'
    : '0 4px 12px rgba(0, 0, 0, 0.15)';

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
        {/* Prominent High-Risk Threat Banner inside bubble */}
        {isRed && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '8px',
              padding: '6px 10px',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--red-critical)',
              fontSize: '12px',
              fontWeight: 700,
            }}
          >
            <AlertTriangle size={14} />
            <span>⚠️ {analysis.primaryThreat === 'PHISHING' ? 'DECEPTIVE PHISHING LINK DETECTED' : 'CRITICAL THREAT DETECTED'}</span>
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
          <button
            onClick={() => onInspectSecurity(message)}
            className={getBadgeStyle(analysis.indicatorColor)}
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
            title="Click to inspect Zero-Trust security evidence"
          >
            {getBadgeIcon(analysis.indicatorColor)}
            <span>{analysis.indicatorColor === 'GREEN' ? 'SAFE' : `${analysis.riskScore}% RISK`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
