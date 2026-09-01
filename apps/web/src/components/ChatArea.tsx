import React, { useState, useEffect, useRef } from 'react';
import { ConversationItem, ChatMessage, SecurityAnalysis } from '../types';
import { MessageItem } from './MessageItem';
import { DlpPreSendWarningModal } from './DlpPreSendWarningModal';
import {
  Send,
  Paperclip,
  Smile,
  X,
  Lock,
  ShieldAlert,
  Sparkles,
  Shield,
  MoreVertical,
  UserX,
  UserCheck,
  Trash2,
  Flag,
  Power,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
} from 'lucide-react';
import { ApiClient } from '../api/client';

const EMOJI_LIST = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😍', '🥰',
  '😘', '😋', '😜', '🤪', '🤫', '🤔', '🤐', '🤨', '😐', '😏', '😒', '🙄', '😬', '🤥',
  '😎', '🤓', '🧐', '🥳', '🤠', '🤯', '😱', '🥵', '🥶', '🤖', '👾', '🎃', '👻', '💀',
  '🔒', '🛡️', '⚡', '🚨', '⚠️', '🔑', '🔐', '🗝️', '💻', '📱', '📡', '💾', '💡', '🔍',
  '👍', '👎', '👏', '🙌', '🤝', '👊', '✌️', '🤞', '🤙', '💪', '🙏', '❤️', '🔥', '✨',
  '🚀', '🎯', '💯', '✅', '❌', '⛔', '🚫', '🔴', '🟢', '🟡', '🟠', '🔵', '💬', '💵'
];

interface ChatAreaProps {
  conversation: ConversationItem | null;
  messages: ChatMessage[];
  onSendMessage: (text: string, securityAnalysis: SecurityAnalysis) => void;
  onInspectSecurity: (message: ChatMessage) => void;
  onTogglePrivacy?: () => void;
  onOpenTopicModal: () => void;
  onOpenCopilot: () => void;
  onBlockUser?: (conversationId: string) => void;
  onUnblockUser?: (conversationId: string) => void;
  onReportChat?: (conversationId: string) => void;
  onDeleteChat?: (conversationId: string) => void;
  onEditMessage?: (messageId: string, newText: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onBack?: () => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  conversation,
  messages,
  onSendMessage,
  onInspectSecurity,
  onTogglePrivacy,
  onOpenTopicModal,
  onOpenCopilot,
  onBlockUser,
  onUnblockUser,
  onReportChat,
  onDeleteChat,
  onEditMessage,
  onDeleteMessage,
  onBack,
}) => {
  const [inputText, setInputText] = useState('');
  const [threatWarning, setThreatWarning] = useState<{ title: string; desc: string; color: 'RED' | 'ORANGE' } | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: 'SUCCESS' | 'WARN' } | null>(null);

  const [dlpModalState, setDlpModalState] = useState<{
    isOpen: boolean;
    draftText: string;
    analysis: SecurityAnalysis | null;
  }>({
    isOpen: false,
    draftText: '',
    analysis: null,
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Click outside to close dropdown menu and emoji picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setIsEmojiPickerOpen(false);
      }
    };
    if (isMenuOpen || isEmojiPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen, isEmojiPickerOpen]);

  const handleInsertEmoji = (emoji: string) => {
    setInputText((prev) => prev + emoji);
    setIsEmojiPickerOpen(false);
  };

  // Real-time pre-send DLP evaluation while typing (OpSec: only alert sender on self-harm / secret leaks)
  useEffect(() => {
    if (!inputText.trim()) {
      setThreatWarning(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsEvaluating(true);
      const analysis = await ApiClient.analyzePreSend(inputText);
      setIsEvaluating(false);

      // OpSec principle: Only warn the sender if they are leaking THEIR OWN secrets / credentials / personal data (DLP)
      const isSensitiveDlp =
        analysis.primaryThreat === 'DLP_SECRET_EXPOSURE' ||
        analysis.evidenceList.some((e) => e.category === 'DLP_SECRET_EXPOSURE');

      if (isSensitiveDlp && analysis.riskScore >= 25) {
        const topEv = analysis.evidenceList.find((e) => e.category === 'DLP_SECRET_EXPOSURE') || analysis.evidenceList[0];
        setThreatWarning({
          title: 'Data Loss Prevention Alert: ',
          desc: topEv?.description || 'You are about to transmit sensitive credentials or private personal data.',
          color: analysis.indicatorColor === 'RED' ? 'RED' : 'ORANGE',
        });
      } else {
        setThreatWarning(null);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [inputText]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const analysis = await ApiClient.analyzePreSend(inputText);

    // If sensitive credentials, passwords, or personal data (DLP) detected, intercept and warn the sender!
    const isSensitiveDlp =
      analysis.primaryThreat === 'DLP_SECRET_EXPOSURE' ||
      analysis.evidenceList.some((e) => e.category === 'DLP_SECRET_EXPOSURE');

    if (isSensitiveDlp && analysis.riskScore >= 25) {
      setDlpModalState({
        isOpen: true,
        draftText: inputText,
        analysis,
      });
      return;
    }

    onSendMessage(inputText, analysis);
    setInputText('');
    setThreatWarning(null);
  };

  const handleCancelDlp = () => {
    setDlpModalState({ isOpen: false, draftText: '', analysis: null });
  };

  const handleSendRedacted = (redactedText: string) => {
    if (!dlpModalState.analysis) return;
    onSendMessage(redactedText, {
      ...dlpModalState.analysis,
      indicatorColor: 'GREEN',
      riskScore: 0,
      primaryThreat: 'NONE',
      explanation: 'Sensitive credentials were automatically redacted before transmission.',
    });
    setInputText('');
    setThreatWarning(null);
    setDlpModalState({ isOpen: false, draftText: '', analysis: null });
  };

  const handleSendAnyway = () => {
    if (!dlpModalState.analysis) return;
    onSendMessage(dlpModalState.draftText, dlpModalState.analysis);
    setInputText('');
    setThreatWarning(null);
    setDlpModalState({ isOpen: false, draftText: '', analysis: null });
  };

  const showToast = (message: string, type: 'SUCCESS' | 'WARN' = 'SUCCESS') => {
    setFeedbackToast({ message, type });
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  const handleMenuAction = (action: string) => {
    setIsMenuOpen(false);
    if (!conversation) return;

    switch (action) {
      case 'EXPLAIN_TOPIC':
        onOpenTopicModal();
        break;
      case 'OPEN_COPILOT':
        onOpenCopilot();
        break;
      case 'TOGGLE_AI':
        if (onTogglePrivacy) {
          onTogglePrivacy();
          showToast(conversation.isExcluded ? '⚡ AI Security Agent activated for this chat.' : '🔒 AI Security scanning paused for this chat (Privacy Mode).', 'SUCCESS');
        }
        break;
      case 'REPORT_CHAT':
        if (onReportChat) {
          onReportChat(conversation.id);
        } else {
          // Fallback report
          if (messages.length > 0) {
            const combined = messages.map(m => `${m.senderName}: ${m.plaintext}`).slice(-5).join(' \n ');
            ApiClient.reportMessage(combined, 'THREAT', conversation.id, 90, 'USER_REPORTED_CONVERSATION');
          }
        }
        showToast('🚨 Entire conversation submitted to SuperAdmin SecOps Moderation Queue for forensic review.', 'WARN');
        break;
      case 'BLOCK_USER':
        if (onBlockUser) {
          onBlockUser(conversation.id);
        }
        showToast(`🚫 Contact '${conversation.title}' has been blocked. Message history preserved intact.`, 'WARN');
        break;
      case 'UNBLOCK_USER':
        if (onUnblockUser) {
          onUnblockUser(conversation.id);
        }
        showToast(`✅ Contact '${conversation.title}' has been unblocked. Full messaging restored.`, 'SUCCESS');
        break;
      case 'DELETE_CHAT':
        if (onDeleteChat) {
          onDeleteChat(conversation.id);
        }
        showToast('🗑️ Conversation history has been cleared from local storage & server.', 'SUCCESS');
        break;
      default:
        break;
    }
  };

  if (!conversation) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        Select a secure channel to start messaging
      </div>
    );
  }

  return (
    <main className="chat-container">
      {/* Header */}
      <header className="chat-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {onBack && (
            <button
              onClick={onBack}
              className="btn-ghost"
              title="Back to conversations"
              style={{
                padding: '6px 8px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '2px',
              }}
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <img
            src={conversation.avatar}
            alt={conversation.title}
            style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-primary)' }}>
                {conversation.title}
              </span>
              {conversation.isBlocked && (
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'rgba(239, 68, 68, 0.2)',
                    color: 'var(--red-critical)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    textTransform: 'uppercase',
                  }}
                >
                  Blocked
                </span>
              )}
              {conversation.isExcluded && !conversation.isBlocked && (
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'rgba(245, 158, 11, 0.2)',
                    color: 'var(--orange-warn)',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    textTransform: 'uppercase',
                  }}
                >
                  Privacy Active
                </span>
              )}
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {conversation.isBlocked ? 'Blocked contact • History intact' : 'Signal Double Ratchet E2EE • AI Guarded'}
            </span>
          </div>
        </div>

        {/* Header Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Security Status Indicator */}
          <div
            className="security-badge"
            style={{
              padding: '6px 12px',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: conversation.isBlocked
                ? 'rgba(239, 68, 68, 0.15)'
                : conversation.isExcluded
                  ? 'rgba(245, 158, 11, 0.15)'
                  : conversation.securityState === 'RED'
                    ? 'rgba(239, 68, 68, 0.15)'
                    : conversation.securityState === 'ORANGE'
                      ? 'rgba(245, 158, 11, 0.15)'
                      : 'rgba(16, 185, 129, 0.15)',
              border: `1px solid ${conversation.isBlocked
                  ? 'rgba(239, 68, 68, 0.4)'
                  : conversation.isExcluded
                    ? 'rgba(245, 158, 11, 0.4)'
                    : conversation.securityState === 'RED'
                      ? 'rgba(239, 68, 68, 0.4)'
                      : conversation.securityState === 'ORANGE'
                        ? 'rgba(245, 158, 11, 0.4)'
                        : 'rgba(16, 185, 129, 0.4)'
                }`,
            }}
          >
            {conversation.isBlocked ? (
              <>
                <UserX size={14} color="var(--red-critical)" />
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--red-critical)' }}>
                  BLOCKED
                </span>
              </>
            ) : conversation.isExcluded ? (
              <>
                <Lock size={14} color="var(--orange-warn)" />
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--orange-warn)' }}>
                  PRIVACY MODE
                </span>
              </>
            ) : (
              <>
                <Shield
                  size={14}
                  color={
                    conversation.securityState === 'RED'
                      ? 'var(--red-critical)'
                      : conversation.securityState === 'ORANGE'
                        ? 'var(--orange-warn)'
                        : 'var(--green-safe)'
                  }
                />
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color:
                      conversation.securityState === 'RED'
                        ? 'var(--red-critical)'
                        : conversation.securityState === 'ORANGE'
                          ? 'var(--orange-warn)'
                          : 'var(--green-safe)',
                  }}
                >
                  {conversation.securityState === 'RED'
                    ? 'CRITICAL THREAT'
                    : conversation.securityState === 'ORANGE'
                      ? 'ELEVATED RISK'
                      : 'CHANNEL SECURE'}
                </span>
              </>
            )}
          </div>

          {/* 3-Dots Dropdown Menu Button */}
          <button
            ref={menuButtonRef}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="btn-ghost"
            title="Chat Options & Controls"
            style={{
              padding: '8px',
              borderRadius: '8px',
              background: isMenuOpen ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
              color: isMenuOpen ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            <MoreVertical size={18} />
          </button>

          {/* 3-Dots Dropdown Menu Modal */}
          {isMenuOpen && (
            <div
              ref={menuRef}
              style={{
                position: 'absolute',
                top: '56px',
                right: '24px',
                width: '240px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                padding: '6px',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6), 0 0 15px rgba(6, 182, 212, 0.1)',
                zIndex: 100,
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                animation: 'fadeIn 0.15s ease-out',
              }}
            >
              {/* Section 1: AI Assistance */}
              <div style={{ padding: '6px 10px 4px 10px', fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                AI Agent & Intelligence
              </div>

              <button
                onClick={() => handleMenuAction('EXPLAIN_TOPIC')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s ease',
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)')}
                onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <Sparkles size={16} color="var(--accent-cyan)" />
                <span>Explain Topic with AI</span>
              </button>

              <button
                onClick={() => handleMenuAction('OPEN_COPILOT')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s ease',
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)')}
                onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <Shield size={16} color="var(--accent-cyan)" />
                <span>Open Security Copilot</span>
              </button>

              <button
                onClick={() => handleMenuAction('TOGGLE_AI')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'transparent',
                  color: conversation.isExcluded ? 'var(--orange-warn)' : 'var(--green-safe)',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s ease',
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)')}
                onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Power size={16} />
                  <span>AI Agent Protection</span>
                </div>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: conversation.isExcluded ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                  }}
                >
                  {conversation.isExcluded ? 'OFF' : 'ON'}
                </span>
              </button>

              <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '4px 6px' }} />

              {/* Section 2: Chat Safety Controls */}
              <div style={{ padding: '6px 10px 4px 10px', fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Chat Controls & Security
              </div>

              <button
                onClick={() => handleMenuAction('REPORT_CHAT')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--orange-warn)',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s ease',
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(245, 158, 11, 0.15)')}
                onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <Flag size={16} />
                <span>Report Chat to Admin</span>
              </button>

              {/* Dynamic Block / Unblock Button */}
              {conversation.isBlocked ? (
                <button
                  onClick={() => handleMenuAction('UNBLOCK_USER')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'rgba(16, 185, 129, 0.1)',
                    color: 'var(--green-safe)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(16, 185, 129, 0.25)')}
                  onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)')}
                >
                  <UserCheck size={16} />
                  <span>Unblock User</span>
                </button>
              ) : (
                <button
                  onClick={() => handleMenuAction('BLOCK_USER')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--red-critical)',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)')}
                  onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <UserX size={16} />
                  <span>Block User</span>
                </button>
              )}

              <button
                onClick={() => handleMenuAction('DELETE_CHAT')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s ease',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                  e.currentTarget.style.color = 'var(--red-critical)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-muted)';
                }}
              >
                <Trash2 size={16} />
                <span>Delete Chat History</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Floating Action Feedback Toast */}
      {feedbackToast && (
        <div
          style={{
            position: 'absolute',
            top: '75px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: feedbackToast.type === 'WARN' ? 'rgba(239, 68, 68, 0.9)' : 'rgba(16, 185, 129, 0.9)',
            backdropFilter: 'blur(8px)',
            color: '#ffffff',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4)',
            zIndex: 90,
            animation: 'fadeIn 0.2s ease',
          }}
        >
          {feedbackToast.type === 'WARN' ? <AlertTriangle size={15} /> : <CheckCircle size={15} />}
          <span>{feedbackToast.message}</span>
        </div>
      )}

      {/* Messages Stream */}
      <div className="messages-stream">
        {messages.map((msg) => (
          <MessageItem
            key={msg.id}
            message={msg}
            onInspectSecurity={onInspectSecurity}
            onEditMessage={onEditMessage}
            onDeleteMessage={onDeleteMessage}
            isBlocked={conversation.isBlocked}
          />
        ))}
        <div ref={scrollRef} />
      </div>

      {/* Blocked Conversation Notice Banner */}
      {conversation.isBlocked && (
        <div
          style={{
            margin: '0 20px 10px 20px',
            padding: '10px 14px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: 'var(--red-critical)',
            fontSize: '12px',
            fontWeight: 600,
          }}
        >
          <UserX size={16} />
          <span>🚫 User is blocked. Message history is preserved intact, but sending, editing, and deleting are disabled. Unblock from menu (⋮) to resume messaging.</span>
        </div>
      )}

      {/* Real-time Pre-Send Threat Advisory Banner */}
      {threatWarning && !conversation.isBlocked && (
        <div
          style={{
            margin: '0 20px 10px 20px',
            padding: '10px 14px',
            background: threatWarning.color === 'RED' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
            border: `1px solid ${threatWarning.color === 'RED' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: threatWarning.color === 'RED' ? 'var(--red-critical)' : 'var(--orange-warn)',
            fontSize: '12px',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <ShieldAlert size={16} />
          <div>
            <strong>{threatWarning.title}</strong> {threatWarning.desc}
          </div>
        </div>
      )}

      {/* Input Composer */}
      <footer className="chat-footer">
        {/* Cyberpunk Emoji Picker Popover */}
        {isEmojiPickerOpen && (
          <div
            ref={emojiPickerRef}
            style={{
              position: 'absolute',
              bottom: '75px',
              left: '24px',
              width: '320px',
              maxHeight: '260px',
              background: 'var(--bg-secondary)',
              border: '1px solid rgba(6, 182, 212, 0.4)',
              borderRadius: '16px',
              padding: '12px',
              boxShadow: '0 15px 40px rgba(0, 0, 0, 0.7), 0 0 20px rgba(6, 182, 212, 0.15)',
              zIndex: 100,
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              animation: 'fadeIn 0.15s ease-out',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-cyan)', letterSpacing: '0.5px' }}>
                Cyber Emojis
              </span>
              <button
                type="button"
                onClick={() => setIsEmojiPickerOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
              >
                <X size={14} />
              </button>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '6px',
                overflowY: 'auto',
                maxHeight: '200px',
                paddingRight: '4px',
              }}
            >
              {EMOJI_LIST.map((emoji, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleInsertEmoji(emoji)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '8px',
                    fontSize: '18px',
                    padding: '6px 0',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.1s ease',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'rgba(6, 182, 212, 0.2)';
                    e.currentTarget.style.transform = 'scale(1.2)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSend} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* Attachment Button */}
          <button
            type="button"
            disabled={conversation.isBlocked}
            className="btn-ghost"
            title="Attach Secure Encrypted File"
            style={{ padding: '10px', opacity: conversation.isBlocked ? 0.4 : 1, cursor: conversation.isBlocked ? 'not-allowed' : 'pointer' }}
          >
            <Paperclip size={18} />
          </button>

          {/* Emoji Picker Button right beside Attachment Icon */}
          <button
            type="button"
            disabled={conversation.isBlocked}
            className="btn-ghost"
            onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
            title="Insert Emoji"
            style={{
              padding: '10px',
              color: isEmojiPickerOpen ? 'var(--accent-cyan)' : 'var(--text-muted)',
              background: isEmojiPickerOpen ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
              borderRadius: '8px',
              opacity: conversation.isBlocked ? 0.4 : 1,
              cursor: conversation.isBlocked ? 'not-allowed' : 'pointer',
            }}
          >
            <Smile size={18} />
          </button>

          <input
            type="text"
            className="secure-input"
            disabled={conversation.isBlocked}
            placeholder={
              conversation.isBlocked
                ? 'User is blocked. Unblock in menu (⋮) to send messages...'
                : conversation.isExcluded
                  ? 'Type message (AI Security scanning paused for this chat)...'
                  : 'Type message (Protected by Zero-Trust AI & DLP)...'
            }
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />

          <button
            type="submit"
            disabled={conversation.isBlocked}
            className="btn-primary"
            title="Send Encrypted Message"
            style={{
              padding: '10px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: conversation.isBlocked ? 0.4 : 1,
              cursor: conversation.isBlocked ? 'not-allowed' : 'pointer',
            }}
          >
            <Send size={16} />
            <span>Send</span>
          </button>
        </form>
      </footer>

      {/* Sensitive Credentials & Personal Data Pre-Send Warning Modal */}
      {dlpModalState.analysis && (
        <DlpPreSendWarningModal
          isOpen={dlpModalState.isOpen}
          draftText={dlpModalState.draftText}
          analysis={dlpModalState.analysis}
          onCancel={handleCancelDlp}
          onSendAnyway={handleSendAnyway}
          onSendRedacted={handleSendRedacted}
        />
      )}
    </main>
  );
};
