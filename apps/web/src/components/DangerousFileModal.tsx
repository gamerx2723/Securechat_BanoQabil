import React from 'react';
import { ShieldAlert, AlertTriangle, FileCode, X, Ban, Send } from 'lucide-react';
import { FileScanResult } from '../utils/fileSecurityScanner';

interface DangerousFileModalProps {
  isOpen: boolean;
  file: File | null;
  scanResult: FileScanResult | null;
  onCancel: () => void;
  onProceedAnyway: () => void;
}

export const DangerousFileModal: React.FC<DangerousFileModalProps> = ({
  isOpen,
  file,
  scanResult,
  onCancel,
  onProceedAnyway,
}) => {
  if (!isOpen || !file || !scanResult) return null;

  const isCritical = scanResult.threatLevel === 'CRITICAL';

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(5, 7, 10, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: isCritical ? '1px solid rgba(239, 68, 68, 0.6)' : '1px solid rgba(245, 158, 11, 0.6)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '520px',
          padding: '24px',
          boxShadow: isCritical
            ? '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(239, 68, 68, 0.25)'
            : '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(245, 158, 11, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: isCritical ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                border: isCritical ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isCritical ? 'var(--red-danger)' : 'var(--orange-warn)',
              }}
            >
              <ShieldAlert size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {isCritical ? 'DANGEROUS ATTACHMENT BLOCKED' : 'SUSPICIOUS ATTACHMENT WARNING'}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                Zero-Trust File Security & Malware Pipeline (SRS §44)
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
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

        {/* File Info */}
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '10px',
            padding: '12px 16px',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <FileCode size={24} style={{ color: isCritical ? 'var(--red-danger)' : 'var(--orange-warn)' }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', wordBreak: 'break-all' }}>
              {file.name}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {(file.size / 1024).toFixed(1)} KB • {scanResult.fileTypeLabel}
            </div>
          </div>
        </div>

        {/* Security Warning Body */}
        <div
          style={{
            background: isCritical ? 'rgba(239, 68, 68, 0.08)' : 'rgba(245, 158, 11, 0.08)',
            border: isCritical ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '10px',
            padding: '12px',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
          }}
        >
          <div style={{ fontWeight: 700, color: isCritical ? 'var(--red-danger)' : 'var(--orange-warn)', marginBottom: '4px' }}>
            Risk Assessment:
          </div>
          <div>{scanResult.riskReason}</div>
          <div style={{ marginTop: '8px', fontWeight: 600, color: 'var(--text-primary)' }}>
            💡 Recommendation: {scanResult.recommendation}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '6px' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: 'var(--red-danger)',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Ban size={14} />
            <span>Block / Do Not Send</span>
          </button>
          {!isCritical && (
            <button
              onClick={onProceedAnyway}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Send size={14} />
              <span>Send Anyway</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
