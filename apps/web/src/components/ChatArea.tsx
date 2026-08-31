import React, { useState, useEffect, useRef } from 'react';
import { ConversationItem, ChatMessage, SecurityAnalysis } from '../types';
import { MessageItem } from './MessageItem';
import { DlpPreSendWarningModal } from './DlpPreSendWarningModal';
import { Send, Paperclip, Lock, ShieldAlert, Sparkles, Shield } from 'lucide-react';
import { ApiClient } from '../api/client';

interface ChatAreaProps {
  conversation: ConversationItem | null;
  messages: ChatMessage[];
  onSendMessage: (text: string, securityAnalysis: SecurityAnalysis) => void;
  onInspectSecurity: (message: ChatMessage) => void;
  onTogglePrivacy?: () => void;
  onOpenTopicModal: () => void;
  onOpenCopilot: () => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  conversation,
  messages,
  onSendMessage,
  onInspectSecurity,
  onOpenTopicModal,
  onOpenCopilot,
}) => {
  const [inputText, setInputText] = useState('');
  const [threatWarning, setThreatWarning] = useState<{ title: string; desc: string; color: 'RED' | 'ORANGE' } | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
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

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  if (!conversation) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        Select a secure channel to start messaging
      </div>
    );
  }

  return (
    <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-primary)' }}>
      {/* Chat Header */}
      <header
        style={{
          padding: '14px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--bg-secondary)',
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
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Channel State: <code style={{ color: 'var(--accent-cyan)' }}>Zero-Trust Verified</code> • End-to-End Encrypted
            </div>
          </div>
        </div>

        {/* AI Action Header Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* AI Topic & Chat Explanation Button */}
          <button
            onClick={onOpenTopicModal}
            title="Explain current topic and analyze overall security of this whole chat"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.15))',
              border: '1px solid rgba(139, 92, 246, 0.4)',
              color: '#a78bfa',
              padding: '7px 13px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 0 15px rgba(139, 92, 246, 0.15)',
              transition: 'all 0.15s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.8)';
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(168, 85, 247, 0.25))';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.4)';
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.15))';
            }}
          >
            <Sparkles size={14} />
            <span>AI Chat Explanation</span>
          </button>

          {/* AI Security Copilot Button */}
          <button
            onClick={onOpenCopilot}
            title="Ask AI Security Copilot for deep forensic guidance"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 182, 212, 0.15))',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#34d399',
              padding: '7px 13px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 0 15px rgba(16, 185, 129, 0.15)',
              transition: 'all 0.15s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.8)';
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(6, 182, 212, 0.25))';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.4)';
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 182, 212, 0.15))';
            }}
          >
            <Shield size={14} />
            <span>AI Security Copilot</span>
          </button>
        </div>
      </header>

      {/* Messages Stream */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 0', position: 'relative' }}>
        {messages.map((msg) => (
          <MessageItem key={msg.id} message={msg} onInspectSecurity={onInspectSecurity} />
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
