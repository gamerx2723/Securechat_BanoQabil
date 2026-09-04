import React, { useState } from 'react';
import { ChatMessage } from '../types';
import { ShieldCheck, ShieldAlert, Check, CheckCheck, Clock, AlertTriangle, Lock, Pencil, Trash2, X, Check as CheckIcon } from 'lucide-react';

interface MessageItemProps {
  message: ChatMessage;
  onInspectSecurity: (message: ChatMessage) => void;
  onEditMessage?: (messageId: string, newText: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  isBlocked?: boolean;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  onInspectSecurity,
  onEditMessage,
  onDeleteMessage,
  isBlocked,
}) => {
  const isSelf = message.isSelf;
  const analysis = message.securityAnalysis;

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.plaintext);
  const [isHovered, setIsHovered] = useState(false);

  const isRed = analysis.indicatorColor === 'RED';
  const isOrange = analysis.indicatorColor === 'ORANGE';
  const isGreen = analysis.indicatorColor === 'GREEN';
  const isDlp = analysis.primaryThreat === 'DLP_SECRET_EXPOSURE';

  const showWarningBanner = isRed || isOrange || isDlp;

  const bubbleBorder = isRed
    ? '1px solid rgba(239, 68, 68, 0.6)'
    : isOrange || isDlp
      ? '1px solid rgba(245, 158, 11, 0.6)'
      : isSelf
        ? '1px solid rgba(16, 185, 129, 0.2)'
        : '1px solid var(--border-subtle)';

  const bubbleShadow = isRed
    ? '0 4px 20px rgba(239, 68, 68, 0.2)'
    : isOrange || isDlp
      ? '0 4px 16px rgba(245, 158, 11, 0.2)'
      : '0 4px 12px rgba(0, 0, 0, 0.15)';

  const getThreatTitle = () => {
    if (isDlp) return 'SENSITIVE SECRET / DATA LEAK DETECTED';
    if (analysis.primaryThreat === 'BLACKMAIL_SEXTORTION') return 'CRITICAL SEXTORTION / IMAGE LEAK BLACKMAIL DETECTED';
    if (analysis.primaryThreat === 'COERCIVE_INTIMATE_SOLICITATION') return 'COERCIVE INTIMATE SOLICITATION DETECTED';
    if (analysis.primaryThreat === 'PHISHING') return 'DECEPTIVE PHISHING LINK DETECTED';
    if (
      analysis.primaryThreat === 'SOCIAL_ENGINEERING' ||
      analysis.primaryThreat === 'URGENCY_MANIPULATION' ||
      analysis.primaryThreat === 'FEAR_COERCION' ||
      analysis.primaryThreat === 'AUTHORITY_IMPERSONATION' ||
      analysis.primaryThreat === 'SECRECY_PRESSURE'
    ) return 'PSYCHOLOGICAL SCAM / SOCIAL ENGINEERING DETECTED';
    if (analysis.primaryThreat === 'CREDENTIAL_HARVESTING') return 'CREDENTIAL HARVESTING ATTEMPT DETECTED';
    if (analysis.primaryThreat === 'FINANCIAL_FRAUD') return 'FINANCIAL FRAUD / PAYMENT HIJACKING DETECTED';
    return 'CRITICAL THREAT DETECTED';
  };

  // 10-Minute Message Editing Window Constraint
  const canEdit = (() => {
    if (!isSelf) return false;
    if (!message.sentAt) return true;
    const parsed = new Date(message.sentAt).getTime();
    if (!isNaN(parsed) && parsed > 0) {
      return Date.now() - parsed <= 10 * 60 * 1000;
    }
    // Parse time string like "1:30 PM"
    const match = message.sentAt.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const meridian = match[3]?.toUpperCase();
      if (meridian === 'PM' && hours < 12) hours += 12;
      if (meridian === 'AM' && hours === 12) hours = 0;
      const d = new Date();
      d.setHours(hours, minutes, 0, 0);
      return Date.now() - d.getTime() <= 10 * 60 * 1000;
    }
    return true;
  })();

  const handleSaveEdit = () => {
    if (!editText.trim()) return;
    if (onEditMessage) {
      onEditMessage(message.id, editText.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditText(message.plaintext);
    setIsEditing(false);
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isSelf ? 'flex-end' : 'flex-start',
        marginBottom: '16px',
        padding: '0 20px',
        position: 'relative',
      }}
    >
      {/* Header Info: Sender Name, Time & (edited) tag */}
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span style={{ fontWeight: 600 }}>{message.senderName}</span>
        <span style={{ fontSize: '9px' }}>•</span>
        <span>{message.sentAt}</span>
        {message.isEdited && (
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic', marginLeft: '2px' }}>
            (edited)
          </span>
        )}
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

        {/* Decrypted Plaintext or Inline Editor */}
        {isEditing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '240px' }}>
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={2}
              style={{
                width: '100%',
                background: 'var(--bg-primary)',
                border: '1px solid rgba(99, 102, 241, 0.5)',
                borderRadius: '8px',
                padding: '8px',
                color: 'var(--text-primary)',
                fontSize: '13px',
                fontFamily: 'inherit',
                resize: 'vertical',
                outline: 'none',
              }}
              autoFocus
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
              <button
                onClick={handleCancelEdit}
                style={{
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  color: 'var(--text-muted)',
                  fontSize: '11px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <X size={12} />
                <span>Cancel</span>
              </button>
              <button
                onClick={handleSaveEdit}
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <CheckIcon size={12} />
                <span>Save</span>
              </button>
            </div>
          </div>
        ) : (
          <div style={{ color: 'var(--text-primary)', fontSize: '14px', lineHeight: '1.5', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
            {message.plaintext}
          </div>
        )}

        {/* Footer info: Action controls (Edit/Delete), Delivery status & Interactive Security Badge */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
          {/* Quick Edit & Delete Actions on hover for own messages (disabled when blocked) */}
          {isSelf && !isEditing && isHovered && !isBlocked && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginRight: 'auto' }}>
              {canEdit && (
                <button
                  onClick={() => setIsEditing(true)}
                  title="Edit message (Available within 10 mins of sending)"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Pencil size={13} />
                </button>
              )}
              <button
                onClick={() => onDeleteMessage && onDeleteMessage(message.id)}
                title="Delete message"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--red-critical)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          )}

          {isSelf && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', marginLeft: '4px' }}>
              {message.status === 'SENDING' && (
                <span title="Sending...">
                  <Clock
                    size={12}
                    style={{
                      color: 'var(--text-muted)',
                      animation: 'pulse 1.5s infinite ease-in-out',
                      opacity: 0.85,
                    }}
                  />
                </span>
              )}
              {message.status === 'SENT' && (
                <span title="Sent (Recipient offline)">
                  <Check size={14} style={{ color: '#94a3b8' }} />
                </span>
              )}
              {message.status === 'DELIVERED' && (
                <span title="Delivered (Recipient online)">
                  <CheckCheck size={14} style={{ color: '#94a3b8' }} />
                </span>
              )}
              {(message.status === 'READ' || !message.status) && (
                <span title="Read by recipient">
                  <CheckCheck
                    size={14}
                    style={{
                      color: '#38bdf8',
                      filter: 'drop-shadow(0 0 4px rgba(56, 189, 248, 0.7))',
                    }}
                  />
                </span>
              )}
            </span>
          )}

          {/* Interactive Security Badge */}
          <button
            onClick={() => onInspectSecurity(message)}
            className={isRed ? 'badge-red' : (isOrange || isDlp) ? 'badge-orange' : 'badge-green'}
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
            {isGreen && !isDlp ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
            <span>
              {isDlp
                ? 'LEAK WARNING'
                : isGreen
                ? 'SAFE'
                : `${analysis.riskScore}% RISK`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
