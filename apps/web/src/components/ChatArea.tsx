import React, { useState, useEffect, useRef } from 'react';
import { ConversationItem, ChatMessage, SecurityAnalysis } from '../types';
import { MessageItem } from './MessageItem';
import { DlpPreSendWarningModal } from './DlpPreSendWarningModal';
import {
  Send,
  Paperclip,
  Lock,
  ShieldAlert,
  Sparkles,
  Shield,
  MoreVertical,
  UserX,
  Trash2,
  Flag,
  Power,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { ApiClient } from '../api/client';

interface ChatAreaProps {
  conversation: ConversationItem | null;
  messages: ChatMessage[];
  onSendMessage: (text: string, securityAnalysis: SecurityAnalysis) => void;
  onInspectSecurity: (message: ChatMessage) => void;
  onTogglePrivacy?: () => void;
  onOpenTopicModal: () => void;
  onOpenCopilot: () => void;
  onBlockUser?: (conversationId: string) => void;
  onReportChat?: (conversationId: string) => void;
  onDeleteChat?: (conversationId: string) => void;
  onEditMessage?: (messageId: string, newText: string) => void;
  onDeleteMessage?: (messageId: string) => void;
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
  onReportChat,
  onDeleteChat,
  onEditMessage,
  onDeleteMessage,
}) => {
  const [inputText, setInputText] = useState('');
  const [threatWarning, setThreatWarning] = useState<{ title: string; desc: string; color: 'RED' | 'ORANGE' } | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Click outside to close dropdown menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

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

      // OpSec principle: Only warn the sender if they are leaking THEIR OWN secrets / credentials / PII (DLP)
      const isSensitiveDlp = analysis.primaryThreat === 'DLP_SECRET_EXPOSURE' ||
        analysis.evidenceList.some(e => 
          e.category === 'DLP_SECRET_EXPOSURE' ||
          /password|cnic|bank|card|secret|passcode|token|key|credential|iban|pii/i.test(e.description)
        );

      if (isSensitiveDlp && analysis.riskScore >= 25) {
        const topEv = analysis.evidenceList.find(e => /password|cnic|bank|card|secret|passcode|token|key|credential|iban|pii/i.test(e.description)) || analysis.evidenceList[0];
        setThreatWarning({
          title: 'Data Loss Prevention Alert: ',
          desc: topEv?.description || analysis.explanation,
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
    const isSensitiveDlp = analysis.primaryThreat === 'DLP_SECRET_EXPOSURE' ||
      analysis.evidenceList.some(e => 
        e.category === 'DLP_SECRET_EXPOSURE' ||
        /password|cnic|bank|card|secret|passcode|token|key|credential|iban|pii/i.test(e.description)
      );

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
        showToast(`🚫 Contact '${conversation.title}' has been blocked. Incoming messages will be rejected.`, 'WARN');
        break;
      case 'DELETE_CHAT':
        if (onDeleteChat) {
          onDeleteChat(conversation.id);
        }
        showToast('🗑️ Conversation history has been cleared from local device cache.', 'SUCCESS');
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
    <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-primary)', position: 'relative' }}>
      {/* Chat Header */}
      <header
        style={{
          padding: '14px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--bg-secondary)',
          position: 'relative',
          zIndex: 50,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img
            src={conversation.avatar}
            alt={conversation.title}
            style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {conversation.title}
              </h2>
              <span
                style={{
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  background: 'rgba(16, 185, 129, 0.1)',
                  color: 'var(--green-safe)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Lock size={10} /> Double Ratchet E2EE
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>Channel State:</span>
              {conversation.isExcluded ? (
                <span style={{ color: 'var(--orange-warn)', fontWeight: 600 }}>🔒 AI Scanning Paused</span>
              ) : (
                <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>🟢 Zero-Trust AI Active</span>
              )}
            </div>
          </div>
        </div>

        {/* 3-Bars / 3-Dots Dropdown Menu Button */}
        <div style={{ position: 'relative' }} ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            title="Chat Options & AI Security Controls"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              background: isMenuOpen ? 'rgba(99, 102, 241, 0.2)' : 'var(--bg-tertiary)',
              border: isMenuOpen ? '1px solid rgba(99, 102, 241, 0.6)' : '1px solid var(--border-subtle)',
              color: isMenuOpen ? '#a78bfa' : 'var(--text-primary)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <MoreVertical size={18} />
          </button>

          {/* Cyberpunk Dropdown Menu */}
          {isMenuOpen && (
            <div
              style={{
                position: 'absolute',
                top: '46px',
                right: '0',
                width: '270px',
                background: 'var(--bg-secondary)',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                borderRadius: '12px',
                padding: '6px',
                boxShadow: '0 15px 40px rgba(0, 0, 0, 0.6), 0 0 20px rgba(99, 102, 241, 0.15)',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                zIndex: 100,
                animation: 'fadeIn 0.15s ease-out',
              }}
            >
              {/* Section 1: AI Tools */}
              <div style={{ padding: '6px 10px 4px 10px', fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                AI Intelligence & Copilot
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
                onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(168, 85, 247, 0.15)')}
                onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <Sparkles size={16} style={{ color: '#a78bfa' }} />
                <span>Explain Chat Topic</span>
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
                onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)')}
                onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <Shield size={16} style={{ color: '#34d399' }} />
                <span>AI Security Copilot</span>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Power size={16} style={{ color: conversation.isExcluded ? 'var(--orange-warn)' : 'var(--green-safe)' }} />
                  <span>AI Agent Scanning</span>
                </div>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: conversation.isExcluded ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                    color: conversation.isExcluded ? 'var(--orange-warn)' : 'var(--green-safe)',
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
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 0', position: 'relative' }}>
        {messages.map((msg) => (
          <MessageItem
            key={msg.id}
            message={msg}
            onInspectSecurity={onInspectSecurity}
            onEditMessage={onEditMessage}
            onDeleteMessage={onDeleteMessage}
          />
        ))}
        <div ref={scrollRef} />
      </div>

      {/* Real-time Pre-Send Threat Advisory Banner */}
      {threatWarning && (
        <div
          style={{
            margin: '0 24px 10px 24px',
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
      <footer style={{ padding: '16px 24px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-subtle)' }}>
        <form onSubmit={handleSend} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button type="button" className="btn-ghost" title="Attach Secure Encrypted File" style={{ padding: '10px' }}>
            <Paperclip size={18} />
          </button>

          <input
            type="text"
            className="secure-input"
            placeholder={
              conversation.isExcluded
                ? 'Type message (AI Security scanning paused for this chat)...'
                : 'Type message (Protected by Zero-Trust AI & DLP)...'
            }
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />

          <button
            type="submit"
            className="btn-primary"
            title="Send Encrypted Message"
            style={{
              padding: '10px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
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
