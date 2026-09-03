import React, { useState } from 'react';
import { Shield, Lock, User, Key, AlertCircle, Sparkles, Phone, Crown, Zap } from 'lucide-react';
import { ApiClient } from '../api/client';
import { UserProfile } from '../types';

interface AuthModalProps {
  onSuccess: (user: UserProfile, isNewRegistration?: boolean) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  
  // Minimal phone registration
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleQuickAdminLogin = async (target: 'asad' | 'sinner') => {
    setLoading(true);
    setError(null);
    try {
      const res = await ApiClient.quickAdminLogin(target);
      onSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Quick login failed');
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
          throw new Error('Please enter your registered phone number or username and password');
        }
        const res = await ApiClient.login(identifier.trim(), password);
        onSuccess(res.user);
      } else {
        if (!phone.trim() || phone.trim().length < 7) {
          throw new Error('Please provide a valid phone number');
        }
        if (!password.trim() || password.trim().length < 6) {
          throw new Error('Please set a password with at least 6 characters');
        }

        const cleanDigits = phone.replace(/[^0-9]/g, '');
        const res = await ApiClient.register({
          phone: phone.trim(),
          username: 'user_' + (cleanDigits || Math.random().toString(36).substring(2, 8)),
          displayName: 'User +' + (cleanDigits.slice(-4) || 'Member'),
          password: password.trim(),
        });
        onSuccess(res.user, true);
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
          maxWidth: '440px',
          borderRadius: '24px',
          padding: '32px 28px',
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
            Register (Phone Only)
          </button>
        </div>

        {/* Quick 1-Click Admin Testing Login */}
        {isLogin && (
          <div
            style={{
              marginBottom: '20px',
              padding: '12px 14px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(6, 182, 212, 0.08))',
              border: '1px solid rgba(245, 158, 11, 0.25)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={14} style={{ color: '#fbbf24' }} />
                <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#fbbf24' }}>
                  1-Click Admin Quick Login
                </span>
              </div>
              <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24' }}>
                TESTING
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {/* Admin 1: Muhammad Asad */}
              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickAdminLogin('asad')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 10px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(6, 182, 212, 0.18)';
                  e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.6)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                  e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.3)';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                <img
                  src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"
                  alt="Muhammad Asad"
                  style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1.5px solid #06b6d4' }}
                />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      M. Asad
                    </span>
                    <Crown size={10} style={{ color: '#fbbf24', flexShrink: 0 }} />
                  </div>
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'block' }}>
                    SuperAdmin
                  </span>
                </div>
              </button>

              {/* Admin 2: GMX Sinner */}
              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickAdminLogin('sinner')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 10px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(244, 63, 94, 0.18)';
                  e.currentTarget.style.borderColor = 'rgba(244, 63, 94, 0.6)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                  e.currentTarget.style.borderColor = 'rgba(244, 63, 94, 0.3)';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                  alt="GMX Sinner"
                  style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1.5px solid #f43f5e' }}
                />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      GMX Sinner
                    </span>
                    <Crown size={10} style={{ color: '#fbbf24', flexShrink: 0 }} />
                  </div>
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'block' }}>
                    SuperAdmin
                  </span>
                </div>
              </button>
            </div>
          </div>
        )}

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
              {/* Login Identifier (Phone / Username) */}
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
                  Sign in using your registered mobile phone number or username
                </span>
              </div>

              {/* Password */}
              <div style={{ marginBottom: '20px' }}>
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
              {/* Phone Number Input ONLY */}
              <div style={{ marginBottom: '14px' }}>
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
                <span style={{ fontSize: '10px', color: 'var(--accent-cyan)', marginTop: '4px', display: 'block', fontWeight: 600 }}>
                  🔒 Permanent account identifier (cannot be changed later)
                </span>
              </div>

              {/* Password ONLY */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Set Account Password
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '14px', color: 'var(--text-muted)' }} />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Set a password (min 6 characters)"
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
                <Sparkles size={16} /> Register with Phone & Generate E2EE Keys
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
