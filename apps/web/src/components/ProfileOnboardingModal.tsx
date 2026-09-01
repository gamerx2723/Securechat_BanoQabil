import React, { useState, useRef } from 'react';
import { UserProfile } from '../types';
import { ApiClient } from '../api/client';
import { Camera, User, Sparkles, ArrowRight, Check, X, Upload } from 'lucide-react';

interface ProfileOnboardingModalProps {
  user: UserProfile;
  onClose: () => void;
  onComplete: (updatedUser: UserProfile) => void;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
];

export const ProfileOnboardingModal: React.FC<ProfileOnboardingModalProps> = ({
  user,
  onClose,
  onComplete,
}) => {
  const [displayName, setDisplayName] = useState(user.displayName || user.username || '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || AVATAR_PRESETS[0]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Please choose an image under 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const updated = await ApiClient.updateProfile({
        displayName: displayName.trim() || user.username,
        avatarUrl,
      });
      onComplete(updated);
    } catch (e) {
      console.error('Failed to update profile:', e);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(6, 9, 17, 0.85)',
        backdropFilter: 'blur(16px)',
        padding: '20px',
        overflowY: 'auto',
      }}
    >
      <div
        className="glass-modal fade-in"
        style={{
          width: '100%',
          maxWidth: '460px',
          borderRadius: '24px',
          padding: '32px',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          background: 'rgba(11, 17, 32, 0.95)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 50px rgba(6, 182, 212, 0.2)',
          margin: 'auto',
        }}
      >
        {/* Modal Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(16, 185, 129, 0.2))',
              border: '1px solid rgba(6, 182, 212, 0.4)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-cyan)',
              marginBottom: '12px',
            }}
          >
            <Sparkles size={26} />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.02em' }}>
            Welcome to SecureChat!
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
            Personalize your identity so friends recognize you. You can update this or skip at any time.
          </p>
        </div>

        {/* Avatar Upload / Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ position: 'relative', marginBottom: '14px' }}>
            <img
              src={avatarUrl}
              alt="Avatar Preview"
              style={{
                width: '96px',
                height: '96px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid var(--accent-cyan)',
                boxShadow: '0 0 25px rgba(6, 182, 212, 0.4)',
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                position: 'absolute',
                bottom: '0',
                right: '0',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #0284c7, #06b6d4)',
                border: '2px solid var(--bg-primary)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 0 10px rgba(6, 182, 212, 0.5)',
              }}
              title="Upload your photo"
            >
              <Camera size={16} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn-ghost"
            style={{ fontSize: '12px', padding: '6px 14px', marginBottom: '16px' }}
          >
            <Upload size={13} style={{ marginRight: '6px' }} />
            Upload Custom Photo
          </button>

          {/* Preset Avatars */}
          <div style={{ width: '100%' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textAlign: 'center' }}>
              OR CHOOSE AN AVATAR PRESET
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {AVATAR_PRESETS.map((preset, idx) => (
                <img
                  key={idx}
                  src={preset}
                  alt={`Preset ${idx + 1}`}
                  onClick={() => setAvatarUrl(preset)}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    cursor: 'pointer',
                    border: avatarUrl === preset ? '2px solid var(--accent-cyan)' : '2px solid transparent',
                    boxShadow: avatarUrl === preset ? '0 0 10px rgba(6, 182, 212, 0.5)' : 'none',
                    opacity: avatarUrl === preset ? 1 : 0.7,
                    transition: 'all 0.15s ease',
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Display Name Input */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Your Display Name
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="secure-input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Alex Hunter"
              style={{ paddingLeft: '38px', fontSize: '14px' }}
            />
            <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>
        </div>

        {/* Actions: Save or Skip */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost"
            style={{ flex: 1, padding: '12px', fontSize: '13px' }}
          >
            Skip for now
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="btn-primary"
            style={{ flex: 1.4, padding: '12px', fontSize: '13px' }}
          >
            {loading ? 'Saving...' : (
              <>
                <span>Save & Continue</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
