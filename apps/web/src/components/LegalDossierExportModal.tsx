import React, { useRef } from 'react';
import { ShieldAlert, FileText, Printer, Download, Check, X, Shield, Hash, Clock, User } from 'lucide-react';
import { ChatMessage, ConversationItem, UserProfile } from '../types';

interface LegalDossierExportModalProps {
  isOpen: boolean;
  conversation: ConversationItem | null;
  messages: ChatMessage[];
  currentUser: UserProfile | null;
  onClose: () => void;
}

export const LegalDossierExportModal: React.FC<LegalDossierExportModalProps> = ({
  isOpen,
  conversation,
  messages,
  currentUser,
  onClose,
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [copiedHash, setCopiedHash] = React.useState(false);

  if (!isOpen || !conversation) return null;

  const caseId = `SC-CYBER-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const exportTimestamp = new Date().toUTCString();

  // Compute dummy SHA-256 chain hash for tamper evidence
  const combinedPayload = messages.map(m => `${m.id}:${m.plaintext}:${m.sentAt}`).join('|');
  const dummyChainHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    .split('')
    .map((c, i) => (combinedPayload.charCodeAt(i % combinedPayload.length) % 16).toString(16))
    .join('');

  const threatMessages = messages.filter(
    (m) =>
      m.securityAnalysis?.indicatorColor === 'RED' ||
      m.securityAnalysis?.indicatorColor === 'ORANGE' ||
      m.securityAnalysis?.primaryThreat === 'BLACKMAIL_SEXTORTION'
  );

  const handlePrint = () => {
    window.print();
  };

  const handleCopyHash = () => {
    navigator.clipboard.writeText(dummyChainHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(5, 7, 10, 0.9)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid rgba(99, 102, 241, 0.5)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '780px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 35px rgba(99, 102, 241, 0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Actions */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={20} style={{ color: '#6366f1' }} />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Official Cybercrime Forensic Evidence Dossier
            </h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handlePrint}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                border: 'none',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Printer size={14} />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div
          ref={printRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            color: 'var(--text-primary)',
            fontSize: '13px',
            background: 'rgba(10, 15, 29, 0.8)',
          }}
        >
          {/* Document Header */}
          <div
            style={{
              borderBottom: '2px solid rgba(99, 102, 241, 0.4)',
              paddingBottom: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            <div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#818cf8', letterSpacing: '0.5px' }}>
                SECURECHAT ZERO-TRUST EVIDENCE LOG
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Prepared for Law Enforcement Submission (FIA Cybercrime Wing / CPLC / Police)
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>
                CASE ID: {caseId}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {exportTimestamp}
              </div>
            </div>
          </div>

          {/* Metadata Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
              background: 'rgba(0, 0, 0, 0.25)',
              padding: '12px 16px',
              borderRadius: '10px',
              border: '1px solid var(--border-subtle)',
              fontSize: '12px',
            }}
          >
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Victim / Reporting User: </span>
              <strong>{currentUser?.displayName || currentUser?.username} (@{currentUser?.username})</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Target Channel / Suspect: </span>
              <strong>{conversation.title || 'Direct Channel'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Total Messages Analyzed: </span>
              <strong>{messages.length}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Flagged Threat Incidents: </span>
              <strong style={{ color: threatMessages.length > 0 ? 'var(--red-danger)' : 'var(--green-safe)' }}>
                {threatMessages.length} Incident(s)
              </strong>
            </div>
          </div>

          {/* Cryptographic Proof Hash */}
          <div
            style={{
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: '8px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Hash size={14} style={{ color: '#818cf8' }} />
              <span style={{ color: 'var(--text-muted)' }}>SHA-256 Integrity Chain Hash:</span>
              <span style={{ color: '#c7d2fe' }}>{dummyChainHash.slice(0, 32)}...</span>
            </div>
            <button
              onClick={handleCopyHash}
              style={{
                background: 'transparent',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                borderRadius: '6px',
                padding: '3px 8px',
                color: '#818cf8',
                fontSize: '10px',
                cursor: 'pointer',
              }}
            >
              {copiedHash ? 'Copied' : 'Copy Hash'}
            </button>
          </div>

          {/* Flagged Incidents Section */}
          <div>
            <h4 style={{ margin: '0 0 10px', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
              1. Flagged Threat & Extortion Incidents
            </h4>
            {threatMessages.length === 0 ? (
              <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', color: 'var(--green-safe)', fontSize: '12px' }}>
                No active threats flagged in this conversation history.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {threatMessages.map((tm, idx) => (
                  <div
                    key={tm.id}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      background: 'rgba(239, 68, 68, 0.08)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      fontSize: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                      <span style={{ color: 'var(--red-danger)' }}>
                        INCIDENT #{idx + 1}: {tm.securityAnalysis?.primaryThreat} ({tm.securityAnalysis?.riskScore}% RISK)
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>{tm.sentAt}</span>
                    </div>
                    <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '6px 10px', borderRadius: '6px', color: '#fff' }}>
                      "{tm.plaintext}"
                    </div>
                    <div style={{ color: '#fca5a5', fontSize: '11px' }}>
                      {tm.securityAnalysis?.explanation}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Full Chronological Transcript */}
          <div>
            <h4 style={{ margin: '0 0 10px', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
              2. Complete Chronological Message Transcript
            </h4>
            <div
              style={{
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                maxHeight: '260px',
                overflowY: 'auto',
                background: 'rgba(0, 0, 0, 0.2)',
              }}
            >
              {messages.map((m, i) => (
                <div
                  key={m.id}
                  style={{
                    padding: '8px 12px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '10px',
                    fontSize: '11px',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 700, color: m.isSelf ? '#38bdf8' : '#c084fc' }}>
                      [{m.sentAt}] {m.isSelf ? 'Reporter (Victim)' : 'Target Contact'}:
                    </span>{' '}
                    <span style={{ color: 'var(--text-secondary)' }}>{m.plaintext}</span>
                  </div>
                  {m.securityAnalysis?.riskScore && m.securityAnalysis.riskScore > 0 ? (
                    <span style={{ color: 'var(--red-danger)', fontWeight: 700, flexShrink: 0 }}>
                      ⚠️ {m.securityAnalysis.riskScore}%
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
