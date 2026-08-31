import React, { useState } from 'react';
import { Shield, Lock, User, Key, AlertCircle, Sparkles, Crown, ArrowRight, Phone, Camera, Check } from 'lucide-react';
import { ApiClient } from '../api/client';
import { UserProfile } from '../types';

interface AuthModalProps {
  onSuccess: (user: UserProfile) => void;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
];

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  
  // Registration fields
  const [phone, setPhone] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_PRESETS[0]);
  const [customAvatar, setCustomAvatar] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleQuickLogin = async (user: string, pass: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await ApiClient.login(user, pass);
      onSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        if (!identifier.trim() || !password.trim()) {
          throw new Error('Please enter your phone number / username and password');
        }
        const res = await ApiClient.login(identifier.trim(), password);
        onSuccess(res.user);
      } else {
        if (!phone.trim()) {
          throw new Error('Phone number is required for registration');
        }
        if (!displayName.trim()) {
          throw new Error('Please enter your full name');
        }
        if (!username.trim() || !password.trim()) {
          throw new Error('Please provide a username handle and password');
        }
        const finalAvatar = customAvatar.trim() || selectedAvatar;

        const res = await ApiClient.register({
          phone: phone.trim(),
          displayName: displayName.trim(),
          username: username.trim().toLowerCase().replace(/\s+/g, '_'),
          email: email.trim() || undefined,
          avatarUrl: finalAvatar,
          password,
        });
        onSuccess(res.user);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
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
        background: 'radial-gradient(circle at 50% 30%, rgba(6, 182, 212, 0.15), rgba(6, 9, 17, 0.96) 70%)',
        backdropFilter: 'blur(16px)',
        padding: '20px',
        overflowY: 'auto',
      }}
    >
      <div
        className="glass-modal fade-in"
        style={{
          width: '100%',
          maxWidth: '480px',
          borderRadius: '24px',
          padding: '32px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 50px rgba(6, 182, 212, 0.15)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          margin: 'auto',
        }}
      >
        {/* Logo & Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #0284c7, #06b6d4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
              boxShadow: '0 0 30px rgba(6, 182, 212, 0.4)',
            }}
          >
            <Shield size={30} color="#ffffff" />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: '0 0 4px' }}>
            SecureChat Zero-Trust
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
            E2EE Signal Ratchet & AI-Guarded Security Platform
          </p>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(0, 0, 0, 0.35)',
            padding: '4px',
            borderRadius: '12px',
            marginBottom: '20px',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <button
            type="button"
            onClick={() => { setIsLogin(true); setError(null); }}
            style={{
              flex: 1,
              padding: '10px 0',
              border: 'none',
              borderRadius: '9px',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              background: isLogin ? 'linear-gradient(135deg, #0284c7, #06b6d4)' : 'transparent',
              color: isLogin ? '#ffffff' : 'var(--text-secondary)',
              boxShadow: isLogin ? '0 0 15px rgba(6, 182, 212, 0.35)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setError(null); }}
            style={{
              flex: 1,
              padding: '10px 0',
              border: 'none',
              borderRadius: '9px',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              background: !isLogin ? 'linear-gradient(135deg, #0284c7, #06b6d4)' : 'transparent',
              color: !isLogin ? '#ffffff' : 'var(--text-secondary)',
              boxShadow: !isLogin ? '0 0 15px rgba(6, 182, 212, 0.35)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            Register (Phone)
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            className="animate-shake"
            style={{
              marginBottom: '16px',
              padding: '10px 14px',
              borderRadius: '10px',
              background: 'rgba(244, 63, 94, 0.12)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#fb7185',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Form Fields */}
        <form onSubmit={handleSubmit}>
          {isLogin ? (
            <>
              {/* Login Identifier (Phone / Username / Email) */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Phone Number or Username
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <User size={16} style={{ position: 'absolute', left: '14px', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. +92 300 1234567 or alice"
                    className="secure-input"
                    style={{ paddingLeft: '40px' }}
                  />
                </div>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Sign in using your registered mobile number or handle
                </span>
              </div>

              {/* Password */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Password
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '14px', color: 'var(--text-muted)' }} />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="secure-input"
                    style={{ paddingLeft: '40px' }}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Profile Picture Selector */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Profile Picture (Avatar)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <img
                    src={customAvatar.trim() || selectedAvatar}
                    alt="Selected Avatar"
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid var(--accent-cyan)',
                      boxShadow: '0 0 12px rgba(6, 182, 212, 0.4)',
                    }}
                  />
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', flex: 1 }}>
                    {AVATAR_PRESETS.slice(0, 6).map((preset, idx) => (
                      <img
                        key={idx}
                        src={preset}
                        alt={`Preset ${idx + 1}`}
                        onClick={() => {
                          setSelectedAvatar(preset);
                          setCustomAvatar('');
                        }}
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          cursor: 'pointer',
                          border: (!customAvatar && selectedAvatar === preset) ? '2px solid var(--accent-cyan)' : '1px solid rgba(255,255,255,0.2)',
                          transform: (!customAvatar && selectedAvatar === preset) ? 'scale(1.15)' : 'scale(1)',
                          transition: 'all 0.15s ease',
                        }}
                      />
                    ))}
                  </div>
                </div>
                <div style={{ position: 'relative' }}>
                  <Camera size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Or paste custom image URL..."
                    value={customAvatar}
                    onChange={(e) => setCustomAvatar(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      padding: '6px 10px 6px 30px',
                      color: 'var(--text-primary)',
                      fontSize: '11px',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Phone Number Input */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Phone Number (Required)
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Phone size={16} style={{ position: 'absolute', left: '14px', color: 'var(--text-muted)' }} />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+92 300 1234567"
                    className="secure-input"
                    style={{ paddingLeft: '40px' }}
                  />
                </div>
              </div>

              {/* Full Name */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Full Name / Display Name
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Muhammad Ali"
                  className="secure-input"
                />
              </div>

              {/* Username Handle */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Username (Handle)
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <User size={16} style={{ position: 'absolute', left: '14px', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. muhammad_ali"
                    className="secure-input"
                    style={{ paddingLeft: '40px' }}
                  />
                </div>
              </div>

              {/* Password */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Password (Min 8 Characters)
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '14px', color: 'var(--text-muted)' }} />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Choose secure password"
                    className="secure-input"
                    style={{ paddingLeft: '40px' }}
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{
              width: '100%',
              padding: '13px',
              fontSize: '13px',
              borderRadius: '12px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? (
              <span>Authenticating Secure Keys...</span>
            ) : isLogin ? (
              <>
                <Key size={16} /> Authenticate & Unlock Vault
              </>
            ) : (
              <>
                <Sparkles size={16} /> Complete Registration & Generate Keys
              </>
            )}
          </button>
        </form>

        {/* Quick Role Selection for Demos */}
        {isLogin && (
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ textAlign: 'center', fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '10px' }}>
              Quick Demo Accounts
            </div>

            {/* SuperAdmin Master Access Button */}
            <button
              type="button"
              onClick={() => handleQuickLogin('admin', 'AdminPass2026!')}
              style={{
                width: '100%',
                marginBottom: '8px',
                padding: '10px 12px',
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(239, 68, 68, 0.15))',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                textAlign: 'left',
                boxShadow: '0 0 15px rgba(245, 158, 11, 0.15)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    background: 'rgba(245, 158, 11, 0.25)',
                    color: '#fbbf24',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Crown size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#fef08a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    SuperAdmin Account
                    <span style={{ fontSize: '8px', fontWeight: 800, padding: '1px 4px', borderRadius: '4px', background: '#f59e0b', color: '#000' }}>MASTER</span>
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Admin dashboard, user management & models</div>
                </div>
              </div>
              <ArrowRight size={14} color="#fbbf24" />
            </button>

            {/* Standard User Quick Select */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={() => handleQuickLogin('alice', 'Password123!')}
                style={{
                  padding: '8px 10px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(6, 182, 212, 0.2)', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold' }}>A</div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)' }}>Alice Vance</div>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>User View</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('bob', 'Password123!')}
                style={{
                  padding: '8px 10px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', color: 'var(--green-safe)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold' }}>B</div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)' }}>Bob Martinez</div>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>User View</div>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
