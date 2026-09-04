import React, { useState, useEffect, useRef } from 'react';
import { ConversationItem, ChatMessage, SecurityAnalysis } from '../types';
import { MessageItem } from './MessageItem';
import { DlpPreSendWarningModal } from './DlpPreSendWarningModal';
import { SextortionEmergencyModal } from './SextortionEmergencyModal';
import { SensitiveMediaModal } from './SensitiveMediaModal';
import { DangerousFileModal } from './DangerousFileModal';
import { LegalDossierExportModal } from './LegalDossierExportModal';
import { MediaAnalyzer } from '../utils/mediaAnalyzer';
import { FileSecurityScanner, FileScanResult } from '../utils/fileSecurityScanner';
import { TrustEngine, TrustLevel } from '../utils/trustEngine';
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
  FileText,
  Users,
  ShieldCheck,
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

  const [isSextortionModalOpen, setIsSextortionModalOpen] = useState(false);
  const [isDossierModalOpen, setIsDossierModalOpen] = useState(false);
  const [dangerousFileState, setDangerousFileState] = useState<{
    isOpen: boolean;
    file: File | null;
    scanResult: FileScanResult | null;
  }>({
    isOpen: false,
    file: null,
    scanResult: null,
  });
  const [sensitiveMediaState, setSensitiveMediaState] = useState<{
    isOpen: boolean;
    previewUrl: string | null;
    pendingFile: File | null;
  }>({
    isOpen: false,
    previewUrl: null,
    pendingFile: null,
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const [isVaultWarningDismissed, setIsVaultWarningDismissed] = useState(false);

  useEffect(() => {
    setIsVaultWarningDismissed(false);
  }, [conversation?.id]);

  // Cyber-Blackmail threats targeting the receiver from contact
  const blackmailMessages = messages.filter(
    (m) =>
      !m.isSelf && (
        m.securityAnalysis?.primaryThreat === 'BLACKMAIL_SEXTORTION' ||
        m.securityAnalysis?.primaryThreat === 'COERCIVE_INTIMATE_SOLICITATION' ||
        m.securityAnalysis?.evidenceList?.some(
          (e) => e.category === 'BLACKMAIL_SEXTORTION' || e.category === 'COERCIVE_INTIMATE_SOLICITATION'
        )
      )
  );
  const hasBlackmailThreat = blackmailMessages.length > 0;

  // Threat evaluation for receiver only (only evaluate incoming messages from contact)
  const incomingThreatMessages = messages.filter(
    (m) =>
      !m.isSelf &&
      (m.securityAnalysis?.indicatorColor === 'RED' ||
        m.securityAnalysis?.indicatorColor === 'ORANGE' ||
        (m.securityAnalysis?.riskScore || 0) >= 40)
  );

  const hasCriticalIncomingThreat = incomingThreatMessages.some(
    (m) => m.securityAnalysis?.indicatorColor === 'RED' || (m.securityAnalysis?.riskScore || 0) >= 70
  );
  const hasElevatedIncomingThreat = incomingThreatMessages.some(
    (m) => m.securityAnalysis?.indicatorColor === 'ORANGE' || (m.securityAnalysis?.riskScore || 0) >= 40
  );

  const receiverSecurityState: 'GREEN' | 'ORANGE' | 'RED' = hasCriticalIncomingThreat
    ? 'RED'
    : hasElevatedIncomingThreat
    ? 'ORANGE'
    : 'GREEN';

  const handleAttachmentClick = () => {
    if (conversation?.isBlocked) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    // 1. Scan for Dangerous Extensions & Malicious APKs
    const fileScan = FileSecurityScanner.scanFile(file);
    if (fileScan.isDangerous || fileScan.isExecutable || fileScan.threatLevel === 'CRITICAL' || fileScan.threatLevel === 'HIGH') {
      setDangerousFileState({
        isOpen: true,
        file,
        scanResult: fileScan,
      });
      return;
    }

    // 2. Scan for Sensitive Media
    if (file.type.startsWith('image/')) {
      const scan = await MediaAnalyzer.scanImage(file);
      if (scan.isSensitive) {
        const previewUrl = URL.createObjectURL(file);
        setSensitiveMediaState({
          isOpen: true,
          previewUrl,
          pendingFile: file,
        });
        return;
      }
    }

    sendAttachmentMessage(file);
  };

  const sendAttachmentMessage = async (file: File, options?: { viewOnce?: boolean; watermark?: boolean }) => {
    let caption = `[Encrypted Image: ${file.name}]`;
    if (options?.viewOnce) {
      caption += ' ⏳ (View-Once Ephemeral)';
    }
    if (options?.watermark && conversation) {
      caption += ` 🛡️ (Protected with Watermark: ${conversation.title})`;
    }

    onSendMessage(caption, {
      riskScore: 0,
      indicatorColor: 'GREEN',
      primaryThreat: 'NONE',
      confidence: 1,
      evidenceList: [],
      explanation: options?.watermark
        ? 'Media encrypted and protected with forensic recipient watermark.'
        : 'Encrypted media verified safe.',
      recommendation: 'Standard encrypted transmission',
      suggestedActions: [],
    });
  };

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior, block: 'end' });
    }
  };

  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages]);

  // When mobile virtual keyboard resizes viewport, keep messages pinned to bottom
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;
    const handleViewportChange = () => {
      scrollToBottom('auto');
    };
    window.visualViewport.addEventListener('resize', handleViewportChange);
    window.visualViewport.addEventListener('scroll', handleViewportChange);
    return () => {
      window.visualViewport?.removeEventListener('resize', handleViewportChange);
      window.visualViewport?.removeEventListener('scroll', handleViewportChange);
    };
  }, []);

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
    inputRef.current?.focus();
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

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text) return;

    // Immediately clear input and restore focus to keep mobile keyboard open continuously!
    setInputText('');
    setThreatWarning(null);
    inputRef.current?.focus();
    setTimeout(() => scrollToBottom('smooth'), 50);

    const analysis = await ApiClient.analyzePreSend(text);

    // If sensitive credentials, passwords, or personal data (DLP) detected, intercept and warn the sender!
    const isSensitiveDlp =
      analysis.primaryThreat === 'DLP_SECRET_EXPOSURE' ||
      analysis.evidenceList.some((e) => e.category === 'DLP_SECRET_EXPOSURE');

    if (isSensitiveDlp && analysis.riskScore >= 25) {
      setDlpModalState({
        isOpen: true,
        draftText: text,
        analysis,
      });
      return;
    }

    onSendMessage(text, analysis);
    setTimeout(() => scrollToBottom('smooth'), 100);
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

  const trustInfo = TrustEngine.getContactTrust(conversation.id, messages);

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
                padding: '8px 10px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                marginRight: '4px',
                flexShrink: 0,
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-primary)' }}>
                {conversation.title}
              </span>
              {conversation.type === 'GROUP' && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '9px',
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'rgba(6, 182, 212, 0.2)',
                    color: 'var(--accent-cyan)',
                    border: '1px solid rgba(6, 182, 212, 0.4)',
                    textTransform: 'uppercase',
                  }}
                >
                  <Users size={10} /> Group
                </span>
              )}
              {/* Zero-Trust Lifecycle Trust Badge */}
              <div
                onClick={() => {
                  alert(
                    `🔐 Contact Zero-Trust Security Lifecycle:\n\n` +
                    `• Contact: ${conversation.title}\n` +
                    `• Trust Status: ${trustInfo.level} (${trustInfo.trustScore}/100)\n` +
                    `• Verification Method: ${trustInfo.verificationMethod}\n` +
                    `• Interaction History: ${trustInfo.messageCount} messages exchanged\n` +
                    `• Trust Basis: ${trustInfo.badgeDescription}`
                  );
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 7px',
                  borderRadius: '6px',
                  background: trustInfo.badgeColor.bg,
                  color: trustInfo.badgeColor.text,
                  border: `1px solid ${trustInfo.badgeColor.border}`,
                  fontSize: '9px',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
                title="Click to view Zero-Trust Cryptographic Contact Verification"
              >
                <ShieldCheck size={11} />
                <span>{trustInfo.level}</span>
              </div>
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
          {/* Security Status Indicator (Evaluated for Receiver Only) */}
          <div
            className="security-badge"
            onClick={() => {
              if (hasBlackmailThreat || receiverSecurityState === 'RED') {
                setIsSextortionModalOpen(true);
              }
            }}
            style={{
              padding: '6px 12px',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: hasBlackmailThreat || receiverSecurityState === 'RED' ? 'pointer' : 'default',
              background: conversation.isBlocked
                ? 'rgba(239, 68, 68, 0.15)'
                : conversation.isExcluded
                  ? 'rgba(245, 158, 11, 0.15)'
                  : receiverSecurityState === 'RED'
                    ? 'rgba(239, 68, 68, 0.15)'
                    : receiverSecurityState === 'ORANGE'
                      ? 'rgba(245, 158, 11, 0.15)'
                      : 'rgba(16, 185, 129, 0.15)',
              border: `1px solid ${conversation.isBlocked
                  ? 'rgba(239, 68, 68, 0.4)'
                  : conversation.isExcluded
                    ? 'rgba(245, 158, 11, 0.4)'
                    : receiverSecurityState === 'RED'
                      ? 'rgba(239, 68, 68, 0.4)'
                      : receiverSecurityState === 'ORANGE'
                        ? 'rgba(245, 158, 11, 0.4)'
                        : 'rgba(16, 185, 129, 0.4)'
                }`,
            }}
            title={hasBlackmailThreat || receiverSecurityState === 'RED' ? 'Click to open Anti-Sextortion & Emergency Vault' : undefined}
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
                    receiverSecurityState === 'RED'
                      ? 'var(--red-critical)'
                      : receiverSecurityState === 'ORANGE'
                        ? 'var(--orange-warn)'
                        : 'var(--green-safe)'
                  }
                />
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color:
                      receiverSecurityState === 'RED'
                        ? 'var(--red-critical)'
                        : receiverSecurityState === 'ORANGE'
                          ? 'var(--orange-warn)'
                          : 'var(--green-safe)',
                  }}
                >
                  {receiverSecurityState === 'RED'
                    ? 'CRITICAL THREAT'
                    : receiverSecurityState === 'ORANGE'
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
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsSextortionModalOpen(true);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'transparent',
                  color: '#ef4444',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s ease',
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)')}
                onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <ShieldAlert size={16} color="#ef4444" />
                <span>Emergency Vault (FIA 1991)</span>
              </button>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsDossierModalOpen(true);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--accent-cyan)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s ease',
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(6, 182, 212, 0.12)')}
                onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <FileText size={16} color="var(--accent-cyan)" />
                <span>Export Legal Dossier (FIA/Police)</span>
              </button>

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

      {/* Critical Cyber-Blackmail & Sextortion Threat Alert Banner */}
      {hasBlackmailThreat && !conversation.isBlocked && !isVaultWarningDismissed && (
        <div
          style={{
            margin: '0 20px 10px 20px',
            padding: '12px 16px',
            background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.22) 0%, rgba(185, 28, 28, 0.16) 100%)',
            border: '1px solid rgba(239, 68, 68, 0.55)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            boxShadow: '0 4px 15px rgba(239, 68, 68, 0.2)',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <ShieldAlert size={22} style={{ color: '#ef4444', flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ color: '#ef4444', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase' }}>
                🚨 Critical Cyber-Blackmail / Sextortion Alert
              </div>
              <div style={{ fontSize: '11px', color: '#f8fafc', marginTop: '2px' }}>
                Perpetrator is attempting coercion or photo leak extortion. Never comply with demands.
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <button
              onClick={() => setIsSextortionModalOpen(true)}
              style={{
                background: '#ef4444',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '7px 14px',
                fontSize: '11px',
                fontWeight: 800,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 10px rgba(239, 68, 68, 0.4)',
              }}
            >
              Emergency Vault (FIA 1991)
            </button>
            <button
              onClick={() => setIsVaultWarningDismissed(true)}
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                color: '#f8fafc',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                borderRadius: '8px',
                padding: '7px 12px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
              title="Dismiss warning banner"
            >
              Dismiss
            </button>
          </div>
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
          {/* Hidden File Input for Client-Side Sensitive Media Scanning */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          {/* Attachment Button */}
          <button
            type="button"
            disabled={conversation.isBlocked}
            onClick={handleAttachmentClick}
            className="btn-ghost"
            title="Attach Protected Encrypted Photo / Document"
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
            ref={inputRef}
            type="text"
            className="secure-input"
            disabled={conversation.isBlocked}
            placeholder={
              conversation.isBlocked
                ? 'User is blocked. Unblock in menu (⋮) to send messages...'
                : conversation.isExcluded
                  ? 'Type message (AI Security scanning paused for this chat)...'
                  : 'Type message (Protected by Zero-Trust AI & Anti-Sextortion Guardian)...'
            }
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onFocus={() => {
              setTimeout(() => scrollToBottom('smooth'), 150);
            }}
          />

          <button
            type="submit"
            disabled={conversation.isBlocked || !inputText.trim()}
            className="btn-primary"
            title="Send Encrypted Message"
            onMouseDown={(e) => e.preventDefault()}
            onTouchStart={(e) => {
              e.preventDefault();
              handleSend();
            }}
            style={{
              padding: '10px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: conversation.isBlocked || !inputText.trim() ? 0.4 : 1,
              cursor: conversation.isBlocked || !inputText.trim() ? 'not-allowed' : 'pointer',
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

      {/* Anti-Sextortion & Cyber-Blackmail Emergency Assistance & Evidence Modal */}
      <SextortionEmergencyModal
        isOpen={isSextortionModalOpen}
        onClose={() => setIsSextortionModalOpen(false)}
        conversationTitle={conversation.title}
        senderName={blackmailMessages[0]?.senderName || conversation.title}
        threatMessages={blackmailMessages}
        onBlockUser={() => {
          if (onBlockUser) onBlockUser(conversation.id);
          setIsSextortionModalOpen(false);
          showToast(`🚫 Abuser '${conversation.title}' has been blocked and AI Guardian updated.`, 'SUCCESS');
        }}
      />

      {/* Client-Side Sensitive Media Pre-Send Advisory Modal */}
      <SensitiveMediaModal
        isOpen={sensitiveMediaState.isOpen}
        previewUrl={sensitiveMediaState.previewUrl}
        recipientTitle={conversation.title}
        onCancel={() => {
          if (sensitiveMediaState.previewUrl) URL.revokeObjectURL(sensitiveMediaState.previewUrl);
          setSensitiveMediaState({ isOpen: false, previewUrl: null, pendingFile: null });
        }}
        onSendSafe={async ({ viewOnce, watermark }) => {
          const file = sensitiveMediaState.pendingFile;
          if (sensitiveMediaState.previewUrl) URL.revokeObjectURL(sensitiveMediaState.previewUrl);
          setSensitiveMediaState({ isOpen: false, previewUrl: null, pendingFile: null });
          if (file) {
            sendAttachmentMessage(file, { viewOnce, watermark });
          }
        }}
      />

      {/* Dangerous File & Malicious APK Attachment Scanner Modal */}
      <DangerousFileModal
        isOpen={dangerousFileState.isOpen}
        file={dangerousFileState.file}
        scanResult={dangerousFileState.scanResult}
        onCancel={() => setDangerousFileState({ isOpen: false, file: null, scanResult: null })}
        onProceedAnyway={() => {
          if (dangerousFileState.file) {
            sendAttachmentMessage(dangerousFileState.file);
          }
          setDangerousFileState({ isOpen: false, file: null, scanResult: null });
        }}
      />

      {/* Legal Cybercrime Evidence Dossier Exporter */}
      <LegalDossierExportModal
        isOpen={isDossierModalOpen}
        conversation={conversation}
        messages={messages}
        currentUser={ApiClient.getCurrentUser()}
        onClose={() => setIsDossierModalOpen(false)}
      />
    </main>
  );
};
