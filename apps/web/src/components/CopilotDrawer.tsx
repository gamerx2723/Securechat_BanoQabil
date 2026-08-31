import React, { useState } from 'react';
import { ApiClient } from '../api/client';
import { ShieldQuestion, X, Send, Bot, Sparkles, AlertTriangle } from 'lucide-react';

interface CopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

export const CopilotDrawer: React.FC<CopilotDrawerProps> = ({ isOpen, onClose, initialQuery }) => {
  const [messages, setMessages] = useState<Array<{ role: 'USER' | 'COPILOT'; text: string; risk?: number }>>([
    {
      role: 'COPILOT',
      text: 'Hello! I am SecureGuard Copilot, your zero-trust cybersecurity assistant. You can ask me to inspect links, analyze potential social engineering, or explain any flagged message.',
    },
  ]);
  const [input, setInput] = useState(initialQuery || '');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const q = textToSend || input;
    if (!q.trim()) return;

    setMessages(prev => [...prev, { role: 'USER', text: q }]);
    setInput('');
    setLoading(true);

    const res = await ApiClient.queryCopilot(q);
    setLoading(false);

    setMessages(prev => [...prev, { role: 'COPILOT', text: res.answer, risk: res.relatedRiskScore }]);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: '420px',
        background: 'var(--bg-secondary)',
        borderLeft: '1px solid var(--border-subtle)',
        boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.5)',
        zIndex: 9000,
        display: 'flex',
        flexDirection: 'column',
      }}
      className="fade-in"
    >
      {/* Header */}
      <div style={{ padding: '20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--green-safe)' }}>
            <Bot size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>SecureGuard Copilot</h3>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Personal AI Cybersecurity Copilot</p>
          </div>
        </div>

        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <X size={20} />
        </button>
      </div>

      {/* Chat messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {messages.map((m, idx) => (
          <div
            key={idx}
            style={{
              alignSelf: m.role === 'USER' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              padding: '12px 14px',
              borderRadius: m.role === 'USER' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
              background: m.role === 'USER' ? 'var(--bg-bubble-self)' : 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              fontSize: '13px',
              lineHeight: '1.4',
              color: 'var(--text-primary)',
            }}
          >
            {m.text}
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: 'flex-start', color: 'var(--text-muted)', fontSize: '12px', padding: '8px' }}>
            <Sparkles size={14} className="animate-spin inline mr-1" /> Evaluating security patterns...
          </div>
        )}
      </div>

      {/* Suggested Prompts */}
      <div style={{ padding: '8px 16px', display: 'flex', gap: '6px', overflowX: 'auto' }}>
        {['Is this link safe?', 'Am I leaking secrets?', 'How does Double Ratchet work?'].map((s, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(s)}
            style={{
              whiteSpace: 'nowrap',
              fontSize: '11px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              padding: '4px 10px',
              borderRadius: '9999px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Input Composer */}
      <div style={{ padding: '16px', borderTop: '1px solid var(--border-subtle)' }}>
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
            placeholder="Ask Copilot about any security topic..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" className="btn-primary" style={{ padding: '10px 14px' }}>
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
};
