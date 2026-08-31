import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, ConversationItem, SecurityAnalysis } from '../types';
import { MessageItem } from './MessageItem';
import { ApiClient } from '../api/client';
import { Send, Shield, ShieldCheck, ShieldAlert, Paperclip, AlertOctagon, EyeOff, Lock } from 'lucide-react';

interface ChatAreaProps {
  conversation: ConversationItem;
  messages: ChatMessage[];
  onSendMessage: (text: string, analysis: SecurityAnalysis) => void;
  onInspectSecurity: (message: ChatMessage) => void;
  onTogglePrivacy: () => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  conversation,
  messages,
  onSendMessage,
  onInspectSecurity,
  onTogglePrivacy,
}) => {
  const [inputText, setInputText] = useState('');
  const [dlpWarning, setDlpWarning] = useState<string | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Real-time pre-send DLP evaluation while typing
  useEffect(() => {
    if (!inputText.trim()) {
      setDlpWarning(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsEvaluating(true);
      const analysis = await ApiClient.analyzePreSend(inputText);
      setIsEvaluating(false);

      if (analysis.riskScore >= 40 && analysis.evidenceList.some(e => e.category === 'DLP_SECRET_EXPOSURE')) {
        const dlpEvidence = analysis.evidenceList.find(e => e.category === 'DLP_SECRET_EXPOSURE');
        setDlpWarning(dlpEvidence ? dlpEvidence.description : 'Potential secret detected');
      } else {
        setDlpWarning(null);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [inputText]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const analysis = await ApiClient.analyzePreSend(inputText);
    onSendMessage(inputText, analysis);
    setInputText('');
    setDlpWarning(null);
  };

  return (
    <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-primary)' }}>
      {/* Chat Header */}
      <header
        style={{
          padding: '16px 24px',
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
              Identity Key: <code style={{ color: 'var(--text-secondary)' }}>0x8a92...3f1c</code> • Untrusted by Default
            </div>
          </div>
        </div>

        {/* Exclusion / Privacy Switch */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={onTogglePrivacy}
            className="btn-ghost"
            style={{
              fontSize: '12px',
              color: conversation.isExcluded ? 'var(--orange-warn)' : 'var(--text-secondary)',
              borderColor: conversation.isExcluded ? 'rgba(245, 158, 11, 0.4)' : 'var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            title="Toggle AI chat monitoring exclusion"
          >
            <EyeOff size={14} />
            {conversation.isExcluded ? 'AI Excluded' : 'AI Monitored'}
          </button>
        </div>
      </header>

      {/* Message Viewport */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 0' }}>
        {/* Zero-Trust Notice */}
        <div style={{ textAlign: 'center', margin: '0 20px 24px 20px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '9999px',
              padding: '6px 14px',
              fontSize: '11px',
              color: 'var(--text-muted)',
            }}
          >
            <ShieldCheck size={13} style={{ color: 'var(--green-safe)' }} />
            Zero-Trust Guardian active: Messages, links, and credentials continuously analyzed.
          </div>
        </div>

        {messages.map(msg => (
          <MessageItem
            key={msg.id}
            message={msg}
            onInspectSecurity={onInspectSecurity}
          />
        ))}
        <div ref={scrollRef} />
      </div>

      {/* Pre-Send DLP Interception Warning Banner */}
      {dlpWarning && (
        <div
          className="fade-in"
          style={{
            margin: '0 20px 10px 20px',
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            borderRadius: '8px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: 'var(--orange-warn)',
            fontSize: '13px',
          }}
        >
          <AlertOctagon size={18} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <span style={{ fontWeight: 700 }}>Data Leak Prevention Alert: </span>
            {dlpWarning}
          </div>
        </div>
      )}

      {/* Message Composer */}
      <div style={{ padding: '16px 20px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-subtle)' }}>
        <form onSubmit={handleSend} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            className="btn-ghost"
            style={{ padding: '10px', borderRadius: '8px' }}
            title="Attach encrypted media/document"
          >
            <Paperclip size={18} />
          </button>

          <input
            type="text"
            className="secure-input"
            placeholder="Type an end-to-end encrypted message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />

          <button type="submit" className="btn-primary" style={{ padding: '12px 18px' }} disabled={!inputText.trim()}>
            <Send size={16} /> Send
          </button>
        </form>
      </div>
    </main>
  );
};
