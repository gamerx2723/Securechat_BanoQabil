import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, EyeOff, ShieldCheck, XCircle, Stamp } from 'lucide-react';

interface SensitiveMediaModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onSendSafe: (options: { viewOnce: boolean; watermark: boolean }) => void;
  previewUrl: string | null;
  recipientTitle: string;
}

export const SensitiveMediaModal: React.FC<SensitiveMediaModalProps> = ({
  isOpen,
  onCancel,
  onSendSafe,
  previewUrl,
  recipientTitle,
}) => {
  const [viewOnce, setViewOnce] = useState(true);
  const [watermark, setWatermark] = useState(true);

  if (!isOpen) return null;

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
          maxWidth: '520px',
          maxHeight: '90vh',
          overflowY: 'auto',
          borderRadius: '20px',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          background: 'linear-gradient(180deg, rgba(28, 20, 10, 0.98) 0%, rgba(11, 17, 32, 0.98) 100%)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(245, 158, 11, 0.25)',
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
              background: 'rgba(245, 158, 11, 0.2)',
              border: '1px solid rgba(245, 158, 11, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f59e0b',
              flexShrink: 0,
            }}
          >
            <ShieldAlert size={26} />
          </div>
          <div>
            <h2 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
              Sensitive Media Protection Advisory
            </h2>
            <p style={{ fontSize: '12px', color: 'rgba(248, 250, 252, 0.7)', margin: '4px 0 0' }}>
              Client-side scan detected a potentially private or intimate photograph.
            </p>
          </div>
        </div>

        {/* Thumbnail Preview with Privacy Blur */}
        {previewUrl && (
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '140px',
              borderRadius: '12px',
              overflow: 'hidden',
              marginBottom: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: '#000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              src={previewUrl}
              alt="Sensitive Media"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: 'blur(20px)',
                transform: 'scale(1.1)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(0, 0, 0, 0.7)',
                padding: '6px 14px',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                fontSize: '11px',
                fontWeight: 700,
                color: '#fbbf24',
              }}
            >
              <EyeOff size={14} />
              <span>Image Blurred for Privacy</span>
            </div>
          </div>
        )}

        {/* Reality Check Advisory */}
        <div
          style={{
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            borderRadius: '12px',
            padding: '12px 14px',
            marginBottom: '18px',
            fontSize: '12px',
            lineHeight: 1.5,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontWeight: 700, marginBottom: '4px' }}>
            <AlertTriangle size={15} />
            <span>ARE YOU UNDER PRESSURE OR COERCION?</span>
          </div>
          <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.9)' }}>
            Once transmitted, private media can be saved, captured via secondary devices, or weaponized for blackmail and extortion. If anyone is pressuring you to <em>"prove your love"</em> or demanding private photos, <strong>do not send this image</strong>.
          </p>
        </div>

        {/* Anti-Leak Media Safeguards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 12px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            <input
              type="checkbox"
              checked={viewOnce}
              onChange={(e) => setViewOnce(e.target.checked)}
              style={{ accentColor: 'var(--green-safe)', width: '16px', height: '16px' }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: '#f8fafc' }}>View-Once / Ephemeral Mode</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Auto-destructs after a single 5-second view.</div>
            </div>
            <EyeOff size={16} style={{ color: 'var(--accent-cyan)' }} />
          </label>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 12px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            <input
              type="checkbox"
              checked={watermark}
              onChange={(e) => setWatermark(e.target.checked)}
              style={{ accentColor: 'var(--green-safe)', width: '16px', height: '16px' }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: '#f8fafc' }}>Recipient Identity Watermark</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                Faintly embeds recipient identifier to prevent non-consensual leaking.
              </div>
            </div>
            <Stamp size={16} style={{ color: '#fbbf24' }} />
          </label>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Cancel button (Safest choice, highlighted) */}
          <button
            onClick={onCancel}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '10px',
              border: 'none',
              background: 'var(--green-safe)',
              color: '#000',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <ShieldCheck size={16} />
            <span>Cancel & Keep Media Private (Safest)</span>
          </button>

          {/* Send with safeguards */}
          <button
            onClick={() => onSendSafe({ viewOnce, watermark })}
            style={{
              width: '100%',
              padding: '11px',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#f8fafc',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <span>Proceed with Anti-Leak Protection</span>
          </button>
        </div>
      </div>
    </div>
  );
};
