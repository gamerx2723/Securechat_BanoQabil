import React, { useState } from 'react';
import { Shield, Lock, User, Key, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { ApiClient } from '../api/client';
import { UserProfile } from '../types';

interface AuthModalProps {
  onSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
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
        const res = await ApiClient.login(identifier, password);
        onSuccess(res.user);
      } else {
        if (!username || !password || !displayName) {
          throw new Error('Please fill in all required fields');
        }
        const res = await ApiClient.register({
          username,
          displayName,
          email: email || undefined,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/60 rounded-2xl p-8 shadow-2xl shadow-cyan-950/40">
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/30 mb-3">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">SecureChat Zero-Trust</h2>
          <p className="text-xs text-slate-400 mt-1">E2EE Cryptographic Identity & Real-Time Security</p>
        </div>

        {/* Mode Tabs */}
        <div className="flex bg-slate-800/80 p-1 rounded-xl mb-6 border border-slate-700/50">
          <button
            type="button"
            onClick={() => { setIsLogin(true); setError(null); }}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
              isLogin ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setError(null); }}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
              !isLogin ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-400 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isLogin ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Username or Email</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. alice or bob"
                    className="w-full bg-slate-950 border border-slate-700/60 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full bg-slate-950 border border-slate-700/60 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Username (Handle)</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. charlie_dev"
                    className="w-full bg-slate-950 border border-slate-700/60 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Display Name</label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Charlie Ross"
                  className="w-full bg-slate-950 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email (Optional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="charlie@example.com"
                  className="w-full bg-slate-950 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create secure password"
                    className="w-full bg-slate-950 border border-slate-700/60 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-600/30 transition-all flex items-center justify-center gap-2 mt-6 disabled:opacity-50"
          >
            {loading ? (
              <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
            ) : isLogin ? (
              <>
                <Key className="w-4 h-4" />
                Authenticate & Unlock Vault
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Keys & Create Account
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Logins */}
        {isLogin && (
          <div className="mt-6 pt-6 border-t border-slate-800">
            <p className="text-xs text-slate-400 text-center mb-3">Quick Demo Authentication:</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('alice', 'Password123!')}
                className="p-2.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-xl text-left transition-colors flex items-center gap-2"
              >
                <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold">A</div>
                <div>
                  <div className="text-xs font-bold text-white">Alice (Dev)</div>
                  <div className="text-[10px] text-slate-400">@alice</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('bob', 'Password123!')}
                className="p-2.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-xl text-left transition-colors flex items-center gap-2"
              >
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">B</div>
                <div>
                  <div className="text-xs font-bold text-white">Bob (SecOps)</div>
                  <div className="text-[10px] text-slate-400">@bob</div>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
