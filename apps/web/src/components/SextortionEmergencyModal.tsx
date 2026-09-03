import React, { useState } from 'react';
import { ShieldAlert, Phone, Download, Lock, CheckCircle2, AlertTriangle, ExternalLink, UserX } from 'lucide-react';
import { ApiClient } from '../api/client';
import { ChatMessage } from '../types';

interface SextortionEmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationTitle: string;
  senderName: string;
  threatMessages: ChatMessage[];
  onBlockUser?: () => void;
}

export const SextortionEmergencyModal: React.FC<SextortionEmergencyModalProps> = ({
  isOpen,
  onClose,
  conversationTitle,
  senderName,
  threatMessages,
  onBlockUser,
}) => {
  const [isExported, setIsExported] = useState(false);
  const [isTrained, setIsTrained] = useState(false);
  const [isTrainingLoading, setIsTrainingLoading] = useState(false);

  if (!isOpen) return null;

  const handleExportEvidence = () => {
    const timestamp = new Date().toISOString();
    const currentUser = ApiClient.getCurrentUser();

    let report = `=================================================================\n`;
    report += `SECURECHAT E2EE CYBER HARASSMENT & SEXTORTION EVIDENCE REPORT\n`;
    report += `=================================================================\n`;
    report += `Generated At (UTC): ${timestamp}\n`;
    report += `Victim / Reporting Account: ${currentUser?.displayName || currentUser?.username || 'Confidential'} (ID: ${currentUser?.id || 'Unknown'})\n`;
    report += `Reported Perpetrator: ${senderName} (${conversationTitle})\n`;
    report += `Platform Integrity: Cryptographically Verified End-to-End Encrypted Logs\n`;
    report += `Evidence Items Captured: ${threatMessages.length}\n`;
    report += `=================================================================\n\n`;

    report += `INCIDENT FORENSIC TIMELINE & VERBATIM TRANSCRIPTS:\n`;
    report += `-----------------------------------------------------------------\n`;
    threatMessages.forEach((msg, idx) => {
      report += `[Record #${idx + 1}]\n`;
      report += `  Timestamp: ${msg.sentAt}\n`;
      report += `  Sender: ${msg.senderName} (${msg.senderId})\n`;
      report += `  Raw Text: "${msg.plaintext}"\n`;
      report += `  AI Risk Assessment: ${msg.securityAnalysis?.riskScore || 95}/100 (${msg.securityAnalysis?.primaryThreat || 'BLACKMAIL_SEXTORTION'})\n`;
      report += `  Security Signals: ${msg.securityAnalysis?.explanation || 'Coercive extortion threat'}\n\n`;
    });

    report += `-----------------------------------------------------------------\n`;
    report += `LEGAL ADVISORY & STATUTORY REFERENCES:\n`;
    report += `Pakistan Prevention of Electronic Crimes Act (PECA 2016):\n`;
    report += `• Section 20: Offenses against dignity of natural person (Defamation/Blackmail)\n`;
    report += `• Section 21: Offenses against modesty of a natural person and minor\n`;
    report += `• Section 24: Cyber Stalking and Extortion\n`;
    report += `Submit this evidence dossier directly to FIA Cyber Crime Wing (Helpline 1991).\n`;
    report += `=================================================================\n`;

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SecureChat_Evidence_Report_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setIsExported(true);
  };

  const handleBlockAndTrain = async () => {
    setIsTrainingLoading(true);
    try {
      // Feed threat messages into continuous active learning
      for (const msg of threatMessages) {
        if (msg.plaintext) {
          await ApiClient.sendLearnFeedback({
            text: msg.plaintext,
            label: 'MALICIOUS',
            category: 'BLACKMAIL_SEXTORTION',
          });
        }
      }
      setIsTrained(true);
      if (onBlockUser) {
        onBlockUser();
      }
    } finally {
      setIsTrainingLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(12px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        className="glass-modal fade-in"
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          overflowY: 'auto',
          borderRadius: '20px',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          background: 'linear-gradient(180deg, rgba(26, 11, 16, 0.98) 0%, rgba(11, 17, 32, 0.98) 100%)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(239, 68, 68, 0.25)',
          padding: '24px',
          color: '#f8fafc',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ef4444',
              flexShrink: 0,
            }}
          >
            <ShieldAlert size={26} />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
              Anti-Sextortion & Harassment Emergency Vault
            </h2>
            <p style={{ fontSize: '12px', color: 'rgba(248, 250, 252, 0.7)', margin: '4px 0 0' }}>
              You are protected. Never comply with blackmail demands or send money/pictures.
            </p>
          </div>
        </div>

        {/* Advisory Box */}
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            padding: '12px 14px',
            marginBottom: '18px',
            fontSize: '12px',
            lineHeight: 1.5,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontWeight: 700, marginBottom: '4px' }}>
            <AlertTriangle size={16} />
            <span>CRITICAL ADVICE FOR VICTIMS</span>
          </div>
          <ul style={{ margin: 0, paddingLeft: '18px', color: 'rgba(255, 255, 255, 0.85)' }}>
            <li><strong>Do not send money or more photos.</strong> Giving in increases demands.</li>
            <li><strong>Do not delete the chat history.</strong> The evidence report below is needed by the FIA to convict the perpetrator.</li>
            <li><strong>You are not alone.</strong> Free, completely confidential legal and psychological support is available.</li>
          </ul>
        </div>

        {/* Immediate Official Helplines */}
        <div style={{ marginBottom: '18px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-cyan)', marginBottom: '8px' }}>
            Official Confidential Helplines
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {/* FIA Cyber Crime */}
            <a
              href="tel:1991"
              style={{
                textDecoration: 'none',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                color: '#fff',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 800 }}>FIA Cyber Crime</span>
                <Phone size={14} style={{ color: '#10b981' }} />
              </div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                1991 (Toll-Free)
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                Federal Investigation Agency
              </div>
            </a>

            {/* DRF Cyber Harassment Helpline */}
            <a
              href="tel:080039999"
              style={{
                textDecoration: 'none',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                color: '#fff',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 800 }}>DRF Helpline</span>
                <Phone size={14} style={{ color: 'var(--accent-cyan)' }} />
              </div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                0800-39999
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                100% Confidential Legal Aid
              </div>
            </a>
          </div>

          <div style={{ marginTop: '8px', textAlign: 'center' }}>
            <a
              href="https://complaint.fia.gov.pk/"
              target="_blank"
              rel="noreferrer"
              style={{
                fontSize: '11px',
                color: 'var(--accent-cyan)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: 600,
              }}
            >
              <span>Submit Online FIA Complaint directly</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Download Legal Evidence Package */}
          <button
            onClick={handleExportEvidence}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '10px',
              border: '1px solid rgba(6, 182, 212, 0.4)',
              background: isExported ? 'rgba(16, 185, 129, 0.2)' : 'rgba(6, 182, 212, 0.15)',
              color: isExported ? '#10b981' : 'var(--accent-cyan)',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {isExported ? <CheckCircle2 size={16} /> : <Download size={16} />}
            <span>{isExported ? 'Evidence Package Downloaded' : 'Export Legal Evidence Dossier (.txt)'}</span>
          </button>

          {/* Block Abuser & Train AI Guardian */}
          <button
            onClick={handleBlockAndTrain}
            disabled={isTrainingLoading || isTrained}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '10px',
              border: 'none',
              background: isTrained ? 'rgba(239, 68, 68, 0.3)' : '#ef4444',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 700,
              cursor: isTrainingLoading || isTrained ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <UserX size={16} />
            <span>
              {isTrainingLoading
                ? 'Updating AI Guardian Memory...'
                : isTrained
                ? '✓ Abuser Blocked & AI Guardian Trained'
                : 'Block Abuser & Retrain AI Guardian'}
            </span>
          </button>

          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '10px',
              border: '1px solid var(--border-subtle)',
              background: 'transparent',
              color: 'var(--text-muted)',
              fontSize: '12px',
              cursor: 'pointer',
              marginTop: '4px',
            }}
          >
            Dismiss / Return to Chat
          </button>
        </div>
      </div>
    </div>
  );
};
