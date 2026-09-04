import React, { useState } from 'react';
import {
  Key,
  ShieldAlert,
  ShieldCheck,
  CreditCard,
  Lock,
  Database,
  FileCode,
  Smartphone,
  Eye,
  EyeOff,
  Filter,
  CheckCircle,
  AlertTriangle,
  Download
} from 'lucide-react';
import { ChatMessage } from '../types';

interface ExposedSecretItem {
  id: string;
  type: 'PASSWORD' | 'CREDIT_CARD' | 'CNIC_PII' | 'BANK_ACCOUNT' | 'API_KEY' | 'OTP';
  label: string;
  maskedSnippet: string;
  conversationTitle: string;
  timestamp: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
}

interface SecretExposureMapViewProps {
  messages: ChatMessage[];
  conversationTitle?: string;
  onOpenDossierModal?: () => void;
}

export const SecretExposureMapView: React.FC<SecretExposureMapViewProps> = ({
  messages,
  conversationTitle,
  onOpenDossierModal,
}) => {
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'CRITICAL' | 'FINANCIAL' | 'CREDENTIAL'>('ALL');
  const [revealedIds, setRevealedIds] = useState<string[]>([]);

  // Scan current messages for exposed secrets
  const exposedSecrets: ExposedSecretItem[] = [];

  messages.forEach((m, idx) => {
    const text = m.plaintext;

    // Passwords
    const pwMatch = text.match(/(?:password|pass|pwd|secret|passcode|creds|pin)\s*(?:is|[:=])\s*[:=]?\s*["']?([^\s"';,]{3,})["']?|(?:my\s+(?:password|pin|passcode|secret)\s+(?:is|[:=])\s*[:=]?\s*([^\s"';,]{3,}))/i);
    if (pwMatch) {
      const val = pwMatch[1] || pwMatch[2] || 'secret';
      exposedSecrets.push({
        id: `sec-${idx}-pw`,
        type: 'PASSWORD',
        label: 'Plaintext Account Password',
        maskedSnippet: `${val.slice(0, 2)}***${val.slice(-2)}`,
        conversationTitle: conversationTitle || 'Direct Messaging Session',
        timestamp: m.sentAt || 'Today',
        severity: 'CRITICAL',
      });
    }

    // Credit cards
    const cardMatch = text.match(/\b(?:\d{4}[-\s]?){3}\d{4}\b|\b\d{15,16}\b/);
    if (cardMatch) {
      const raw = cardMatch[0].replace(/[-\s]/g, '');
      exposedSecrets.push({
        id: `sec-${idx}-card`,
        type: 'CREDIT_CARD',
        label: 'Credit / Debit Card Number',
        maskedSnippet: `****-****-****-${raw.slice(-4)}`,
        conversationTitle: conversationTitle || 'Direct Messaging Session',
        timestamp: m.sentAt || 'Today',
        severity: 'CRITICAL',
      });
    }

    // CNIC
    const cnicMatch = text.match(/\b(\d{5}-\d{7}-\d|\d{13})\b/);
    if (cnicMatch) {
      const cnic = cnicMatch[1];
      exposedSecrets.push({
        id: `sec-${idx}-cnic`,
        type: 'CNIC_PII',
        label: 'National Identity Number (CNIC)',
        maskedSnippet: `${cnic.slice(0, 5)}-*******-${cnic.slice(-1)}`,
        conversationTitle: conversationTitle || 'Direct Messaging Session',
        timestamp: m.sentAt || 'Today',
        severity: 'HIGH',
      });
    }

    // Bank Account / IBAN
    const bankMatch = text.match(/\b(PK\d{2}[A-Z]{4}\d{16}|(?:account|acc|ac|khata)\s*#?\s*[:=]?\s*\d{10,16})\b/i);
    if (bankMatch) {
      const bank = bankMatch[1];
      exposedSecrets.push({
        id: `sec-${idx}-bank`,
        type: 'BANK_ACCOUNT',
        label: 'Bank Account / IBAN Number',
        maskedSnippet: `${bank.slice(0, 4)}...${bank.slice(-4)}`,
        conversationTitle: conversationTitle || 'Direct Messaging Session',
        timestamp: m.sentAt || 'Today',
        severity: 'HIGH',
      });
    }

    // AWS / GitHub Tokens
    const tokMatch = text.match(/\b(AKIA[0-9A-Z]{16}|ghp_[0-9a-zA-Z]{36})\b/);
    if (tokMatch) {
      const tok = tokMatch[1];
      exposedSecrets.push({
        id: `sec-${idx}-tok`,
        type: 'API_KEY',
        label: 'Cloud Access Key / API Token',
        maskedSnippet: `${tok.slice(0, 4)}...${tok.slice(-4)}`,
        conversationTitle: conversationTitle || 'Direct Messaging Session',
        timestamp: m.sentAt || 'Today',
        severity: 'CRITICAL',
      });
    }
  });

  const filtered = exposedSecrets.filter((s) => {
    if (filterCategory === 'CRITICAL') return s.severity === 'CRITICAL';
    if (filterCategory === 'FINANCIAL') return s.type === 'CREDIT_CARD' || s.type === 'BANK_ACCOUNT';
    if (filterCategory === 'CREDENTIAL') return s.type === 'PASSWORD' || s.type === 'API_KEY' || s.type === 'OTP';
    return true;
  });

  return (
    <div
      style={{
        flex: 1,
        height: '100%',
        overflowY: 'auto',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        background: 'radial-gradient(ellipse at 20% 80%, rgba(245, 158, 11, 0.08), transparent 50%)',
      }}
    >
      {/* Top Header */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: '16px',
          padding: '20px',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--orange-warn)',
            }}
          >
            <Key size={26} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Secret Exposure Map</span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  background: 'rgba(245, 158, 11, 0.2)',
                  color: 'var(--orange-warn)',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                }}
              >
                SRS Advanced Feature (§93)
              </span>
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
              Continuous classification and tracking of credentials, financial data, and identity assets shared in conversation envelopes.
            </p>
          </div>
        </div>

        {onOpenDossierModal && (
          <button
            onClick={onOpenDossierModal}
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              border: 'none',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)',
            }}
          >
            <Download size={16} />
            <span>Export Law Enforcement Dossier (FIA)</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
        {[
          { id: 'ALL', label: `All Tracked Secrets (${exposedSecrets.length})` },
          { id: 'CRITICAL', label: 'Critical Secrets' },
          { id: 'FINANCIAL', label: 'Financial / Cards' },
          { id: 'CREDENTIAL', label: 'Passwords & Tokens' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setFilterCategory(t.id as any)}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              background: filterCategory === t.id ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
              border: filterCategory === t.id ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid transparent',
              color: filterCategory === t.id ? 'var(--orange-warn)' : 'var(--text-muted)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Secret Cards Grid */}
      {filtered.length === 0 ? (
        <div
          style={{
            padding: '40px',
            textAlign: 'center',
            background: 'rgba(15, 23, 42, 0.3)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <ShieldCheck size={36} style={{ color: 'var(--green-safe)' }} />
          <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Zero Exposed Secrets Found
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '400px' }}>
            No plain-text credentials, passwords, or credit card numbers have been transmitted in this conversation. DLP protection active.
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
          {filtered.map((item) => (
            <div
              key={item.id}
              style={{
                background: 'rgba(15, 23, 42, 0.55)',
                border: item.severity === 'CRITICAL' ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                backdropFilter: 'blur(12px)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {item.type === 'CREDIT_CARD' || item.type === 'BANK_ACCOUNT' ? (
                    <CreditCard size={18} style={{ color: 'var(--orange-warn)' }} />
                  ) : item.type === 'PASSWORD' || item.type === 'API_KEY' ? (
                    <Lock size={18} style={{ color: 'var(--red-danger)' }} />
                  ) : (
                    <Key size={18} style={{ color: '#38bdf8' }} />
                  )}
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {item.label}
                  </span>
                </div>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    fontSize: '10px',
                    fontWeight: 700,
                    background: item.severity === 'CRITICAL' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                    color: item.severity === 'CRITICAL' ? 'var(--red-danger)' : 'var(--orange-warn)',
                  }}
                >
                  {item.severity}
                </span>
              </div>

              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.35)',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  color: '#fcd34d',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>{item.maskedSnippet}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                <span>{item.conversationTitle}</span>
                <span>{item.timestamp}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
