import React, { useState, useEffect, useRef } from 'react';
import { ApiClient } from '../api/client';
import { ShieldQuestion, X, Send, Bot, Sparkles, AlertTriangle, ShieldCheck, HelpCircle, Terminal } from 'lucide-react';

interface CopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  conversationId?: string;
}

export const CopilotDrawer: React.FC<CopilotDrawerProps> = ({
  isOpen,
  onClose,
  initialQuery,
  conversationId,
}) => {
  const [messages, setMessages] = useState<Array<{ role: 'USER' | 'COPILOT'; text: string; risk?: number }>>([
    {
      role: 'COPILOT',
      text: '👋 Hello! I am **SecureGuard Copilot**, your Zero-Trust AI cybersecurity guardian.\n\nYou can ask me to inspect links, summarize the current chat topic, detect zero-day social engineering, or explain any cryptographic protocol.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialQuery && isOpen) {
      handleSend(initialQuery);
    }
  }, [initialQuery, isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const q = textToSend || input;
    if (!q.trim()) return;

    setMessages(prev => [...prev, { role: 'USER', text: q }]);
    setInput('');
    setLoading(true);

    const res = await ApiClient.queryCopilot(q, conversationId);
    setLoading(false);

    setMessages(prev => [...prev, { role: 'COPILOT', text: res.answer, risk: res.relatedRiskScore }]);
  };

  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // Bold text replacement
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <div key={idx} style={{ minHeight: line.trim() === '' ? '8px' : 'auto', marginBottom: '3px' }}>
          {parts.map((p, pIdx) => {
            if (p.startsWith('**') && p.endsWith('**')) {
              return <strong key={pIdx} style={{ color: 'var(--text-primary, #f8fafc)', fontWeight: 700 }}>{p.slice(2, -2)}</strong>;
            }
            return p;
          })}
        </div>
      );
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: '440px',
        maxWidth: '100vw',
        background: 'var(--bg-secondary, #0f172a)',
        borderLeft: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
        boxShadow: '-12px 0 40px rgba(0, 0, 0, 0.65)',
        zIndex: 9000,
        display: 'flex',
        flexDirection: 'column',
      }}
      className="fade-in"
    >
      {/* Header */}
      <div
        style={{
          padding: '18px 20px',
          borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(to right, rgba(16, 185, 129, 0.08), transparent)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--green-safe, #10b981)',
            }}
          >
            <Bot size={22} className="animate-pulse" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary, #f8fafc)', margin: 0 }}>
                SecureGuard Copilot
              </h3>
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 700,
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#10b981',
                  padding: '2px 6px',
                  borderRadius: '9999px',
                }}
              >
                LIVE AI
              </span>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)', margin: '2px 0 0' }}>
              Real-Time Conversational Security Reasoning
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted, #94a3b8)',
            cursor: 'pointer',
            padding: '6px',
          }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Chat messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        {messages.map((m, idx) => {
          const isUser = m.role === 'USER';
          const isRisk = m.risk && m.risk > 30;
          return (
            <div
              key={idx}
              style={{
                alignSelf: isUser ? 'flex-end' : 'flex-start',
                maxWidth: '90%',
                padding: '12px 16px',
                borderRadius: isUser ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                background: isUser
                  ? 'var(--bg-bubble-self, #2563eb)'
                  : isRisk
                  ? 'rgba(239, 68, 68, 0.08)'
                  : 'rgba(255, 255, 255, 0.04)',
                border: isUser
                  ? '1px solid rgba(255,255,255,0.1)'
                  : isRisk
                  ? '1px solid rgba(239, 68, 68, 0.3)'
                  : '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
                fontSize: '13px',
                lineHeight: '1.5',
                color: isUser ? '#ffffff' : 'var(--text-secondary, #cbd5e1)',
                boxShadow: isRisk ? '0 0 20px rgba(239, 68, 68, 0.15)' : 'none',
              }}
            >
              {isUser ? m.text : renderFormattedText(m.text)}
            </div>
          );
        })}

        {loading && (
          <div
            style={{
              alignSelf: 'flex-start',
              color: 'var(--text-muted, #94a3b8)',
              fontSize: '12px',
              padding: '10px 14px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Sparkles size={15} className="animate-spin" style={{ color: '#10b981' }} />
            Evaluating Zero-Trust models & conversation context...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div
        style={{
          padding: '10px 16px',
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          borderTop: '1px solid var(--border-subtle, rgba(255,255,255,0.06))',
          background: 'rgba(0,0,0,0.15)',
        }}
      >
        {[
          '✨ Explain topic of this chat',
          '⚠️ Scan threats in this chat',
          '🧠 How does Zero-Day logic work?',
          '🇵🇰 Explain Urdu scam patterns',
          '🔐 What is Double Ratchet?',
        ].map((s, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(s)}
            style={{
              whiteSpace: 'nowrap',
              fontSize: '11px',
              fontWeight: 500,
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
              padding: '6px 12px',
              borderRadius: '9999px',
              color: 'var(--text-secondary, #cbd5e1)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = 'var(--green-safe, #10b981)';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.color = '#cbd5e1';
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Input Composer */}
      <div
        style={{
          padding: '16px 20px',
          borderTop: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
          background: 'var(--bg-secondary, #0f172a)',
        }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          style={{ display: 'flex', gap: '8px' }}
        >
          <input
            type="text"
            className="secure-input"
            placeholder="Ask Copilot about links, threats, or this chat..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{
              flex: 1,
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle, rgba(255,255,255,0.15))',
              borderRadius: '10px',
              padding: '10px 14px',
              color: '#ffffff',
              fontSize: '13px',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            style={{
              padding: '10px 16px',
              background: 'var(--green-safe, #10b981)',
              border: 'none',
              borderRadius: '10px',
              color: '#0f172a',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Send size={15} />
          </button>
        </form>
      </div>
    </div>
  );
};
