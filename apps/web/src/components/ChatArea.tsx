import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, ConversationItem, SecurityAnalysis } from '../types';
import { MessageItem } from './MessageItem';
import { ApiClient } from '../api/client';
import { Send, Shield, ShieldCheck, ShieldAlert, Paperclip, AlertOctagon, AlertTriangle, Lock } from 'lucide-react';

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
  const [threatWarning, setThreatWarning] = useState<{ title: string; desc: string; color: 'RED' | 'ORANGE' } | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Real-time pre-send threat & DLP evaluation while typing
  useEffect(() => {
    if (!inputText.trim()) {
      setThreatWarning(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsEvaluating(true);
      const analysis = await ApiClient.analyzePreSend(inputText);
      setIsEvaluating(false);

      if (analysis.riskScore >= 25 && analysis.indicatorColor !== 'GREEN') {
        const topEv = analysis.evidenceList[0];
        let title = 'Security Advisory: ';
        if (analysis.primaryThreat === 'PHISHING') {
          title = 'Phishing Interception Alert: ';
        } else if (analysis.primaryThreat === 'DLP_SECRET_EXPOSURE') {
          title = 'Data Leak Prevention Alert: ';
        } else if (analysis.primaryThreat === 'SOCIAL_ENGINEERING') {
          title = 'Social Engineering Alert: ';
        }

        setThreatWarning({
          title,
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
              Channel State: <code style={{ color: 'var(--accent-cyan)' }}>Zero-Trust Verified</code> • End-to-End Encrypted
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
          >
            {conversation.isExcluded ? <ShieldAlert size={14} /> : <Shield size={14} />}
            {conversation.isExcluded ? 'AI Scanning Paused' : 'Guardian Active'}
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

      {/* Pre-Send Real-Time Threat Interception Warning Banner */}
      {threatWarning && (
        <div
          className="fade-in"
          style={{
            margin: '0 20px 10px 20px',
            background: threatWarning.color === 'RED' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
            border: threatWarning.color === 'RED' ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)',
            borderRadius: '8px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: threatWarning.color === 'RED' ? 'var(--red-critical)' : 'var(--orange-warn)',
            fontSize: '13px',
          }}
        >
          {threatWarning.color === 'RED' ? <AlertTriangle size={18} style={{ flexShrink: 0 }} /> : <AlertOctagon size={18} style={{ flexShrink: 0 }} />}
          <div style={{ flex: 1 }}>
            <span style={{ fontWeight: 700 }}>{threatWarning.title}</span>
            {threatWarning.desc}
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
            placeholder="Type an end-to-end encrypted message or link..."
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
