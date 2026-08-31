import React, { useState } from 'react';
import { ChatMessage } from '../types';
import { ShieldCheck, ShieldAlert, Check, CheckCheck, AlertTriangle, Lock, Pencil, Trash2, X, Check as CheckIcon } from 'lucide-react';

interface MessageItemProps {
  message: ChatMessage;
  onInspectSecurity: (message: ChatMessage) => void;
  onEditMessage?: (messageId: string, newText: string) => void;
  onDeleteMessage?: (messageId: string) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  onInspectSecurity,
  onEditMessage,
  onDeleteMessage,
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
          {/* Quick Edit & Delete Actions on hover for own messages */}
          {isSelf && !isEditing && isHovered && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginRight: 'auto' }}>
              <button
                onClick={() => setIsEditing(true)}
                title="Edit message"
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
