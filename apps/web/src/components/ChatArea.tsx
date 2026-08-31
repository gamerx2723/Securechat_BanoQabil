import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, ConversationItem, SecurityAnalysis } from '../types';
import { MessageItem } from './MessageItem';
import { ApiClient } from '../api/client';
import { Send, Shield, ShieldCheck, ShieldAlert, Paperclip, AlertOctagon, AlertTriangle, Lock, Brain, Bot, Sparkles } from 'lucide-react';

interface ChatAreaProps {
  conversation: ConversationItem;
  messages: ChatMessage[];
  onSendMessage: (text: string, analysis: SecurityAnalysis) => void;
  onInspectSecurity: (message: ChatMessage) => void;
  onTogglePrivacy: () => void;
  onOpenTopicModal?: () => void;
  onOpenCopilot?: () => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  conversation,
  messages,
  onSendMessage,
  onInspectSecurity,
  onTogglePrivacy,
  onOpenTopicModal,
  onOpenCopilot,
}) => {
  const [inputText, setInputText] = useState('');
  const [threatWarning, setThreatWarning] = useState<{ title: string; desc: string; color: 'RED' | 'ORANGE' } | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
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

      // OpSec principle: Only warn the sender if they are leaking THEIR OWN secrets / credentials (DLP)
      if (analysis.primaryThreat === 'DLP_SECRET_EXPOSURE' && analysis.riskScore >= 25) {
        const topEv = analysis.evidenceList[0];
        setThreatWarning({
          title: 'Data Leak Prevention Alert: ',
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
    onSendMessage(inputText, analysis);
    setInputText('');
    setThreatWarning(null);
  };

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
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(168, 85, 247, 0.25))';
              e.currentTarget.style.borderColor = '#c084fc';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.15))';
              e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.4)';
              e.currentTarget.style.color = '#a78bfa';
            }}
          >
            <Brain size={15} className="animate-pulse" />
            <span>AI Topic & Risk Summary</span>
          </button>

          {/* Ask Copilot Button */}
          <button
            onClick={onOpenCopilot}
            title="Open Security Copilot Assistant"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: 'var(--green-safe, #10b981)',
              padding: '7px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Bot size={15} />
            <span>Copilot</span>
          </button>

          {/* Exclusion / Privacy Switch */}
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
              padding: '7px 10px',
            }}
          >
            {conversation.isExcluded ? <ShieldAlert size={14} /> : <Shield size={14} />}
            {conversation.isExcluded ? 'AI Paused' : 'Guardian Active'}
          </button>
        </div>
      </header>

      {/* Message Feed */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 0' }}>
        {/* Zero-Trust Notice */}
        <div style={{ textAlign: 'center', margin: '0 0 20px 0' }}>
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
            <span>Zero-Trust Architecture Active. Messages are E2EE and verified client-side.</span>
          </div>
        </div>

        {/* Render all messages */}
        {messages.map((msg) => (
          <MessageItem
            key={msg.id}
            message={msg}
            onInspectSecurity={() => onInspectSecurity(msg)}
          />
        ))}
        <div ref={scrollRef} />
      </div>

      {/* Real-time Threat Warning Banner while typing */}
      {threatWarning && (
        <div
          style={{
            margin: '0 24px 8px',
            padding: '10px 14px',
            background: threatWarning.color === 'RED' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)',
            border: `1px solid ${threatWarning.color === 'RED' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: `0 0 20px ${threatWarning.color === 'RED' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)'}`,
          }}
          className="fade-in"
        >
          <div style={{ color: threatWarning.color === 'RED' ? '#ef4444' : '#f59e0b', display: 'flex', alignItems: 'center' }}>
            {threatWarning.color === 'RED' ? <AlertOctagon size={20} className="animate-pulse" /> : <AlertTriangle size={20} />}
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ fontWeight: 700, fontSize: '12px', color: threatWarning.color === 'RED' ? '#fca5a5' : '#fcd34d' }}>
              {threatWarning.title}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {threatWarning.desc}
            </span>
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
    </main>
  );
};
