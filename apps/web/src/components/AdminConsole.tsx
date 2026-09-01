import React, { useState, useEffect } from 'react';
import { Shield, Users, Database, AlertTriangle, UserPlus, Trash2, ShieldCheck, ShieldAlert, RefreshCw, Key, Lock, Activity, CheckCircle, Ban, Crown, ArrowRight, X, Sparkles, Brain, Server, Check } from 'lucide-react';
import { ApiClient, API_BASE } from '../api/client';
import { AdminThreatReviewQueue } from './AdminThreatReviewQueue';

export const AdminConsole: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'USERS' | 'SECOPS' | 'THREATS' | 'AI_CALIBRATION' | 'CONVERSATIONS'>('USERS');
  const [users, setUsers] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [telemetry, setTelemetry] = useState<any>(null);
  const [learningStats, setLearningStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New User Creation Modal Form
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'USER' | 'ADMIN'>('USER');

  // AI Model Manual Teaching State
  const [teachInput, setTeachInput] = useState('');
  const [teachLabel, setTeachLabel] = useState<'MALICIOUS' | 'BENIGN'>('MALICIOUS');
  const [teachFeedback, setTeachFeedback] = useState<string | null>(null);
  const [teaching, setTeaching] = useState(false);

  const authHeaders = () => {
    const token = ApiClient.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Telemetry
      const telRes = await fetch(`${API_BASE}/admin/telemetry`, { headers: authHeaders() });
      if (telRes.ok) {
        setTelemetry(await telRes.json());
      } else {
        const secTelRes = await fetch(`${API_BASE}/security/telemetry`, { headers: authHeaders() });
        if (secTelRes.ok) {
          setTelemetry(await secTelRes.json());
        }
      }

      // 2. Users
      const usersRes = await fetch(`${API_BASE}/admin/users`, { headers: authHeaders() });
      if (usersRes.ok) {
        setUsers(await usersRes.json());
      }

      // 3. Conversations
      const convRes = await fetch(`${API_BASE}/admin/conversations`, { headers: authHeaders() });
      if (convRes.ok) {
        setConversations(await convRes.json());
      }

      // 4. Learning stats
      const stats = await ApiClient.getLearningStats();
      setLearningStats(stats);
    } catch (err: any) {
      setError(err.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/admin/users`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          username: newUsername,
          displayName: newDisplayName,
          email: newEmail || undefined,
          password: newPassword,
          role: newRole,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create user');
      }

      setShowCreateModal(false);
      setNewUsername('');
      setNewDisplayName('');
      setNewEmail('');
      setNewPassword('');
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleChangeRole = async (userId: string, currentRole: string) => {
    const nextRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
    if (!confirm(`Change role of this user to ${nextRole}?`)) return;

    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ role: nextRole }),
      });

      if (!res.ok) throw new Error('Failed to update role');
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`Are you sure you want to permanently delete user @${username}? This action cannot be undone.`)) return;

    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });

      if (!res.ok) throw new Error('Failed to delete user');
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleManualTeach = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teachInput.trim()) return;
    setTeaching(true);
    try {
      const res = await ApiClient.teachAI(teachInput, teachLabel, 'ADMIN_MANUAL_TEACHING');
      if (res.success) {
        setTeachFeedback(`✅ Successfully calibrated weights for ${teachLabel}. SGD weights updated online.`);
        setTeachInput('');
        loadData();
        setTimeout(() => setTeachFeedback(null), 4000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTeaching(false);
    }
  };

  return (
    <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(239, 68, 68, 0.2))', border: '1px solid rgba(245, 158, 11, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24', flexShrink: 0 }}>
            <Crown size={22} />
          </div>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>SuperAdmin Command Center</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Unified administration, SecOps telemetry & AI calibration</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={loadData}
            disabled={loading}
            className="btn-ghost"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 12px' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', marginBottom: '16px', fontSize: '13px' }}>
          {error}
        </div>
      )}

      {/* Sub-tabs Navigation (Horizontally scrollable on mobile) */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '18px', WebkitOverflowScrolling: 'touch' }}>
        {[
          { id: 'USERS', label: 'Users & Access', icon: Users },
          { id: 'SECOPS', label: 'SecOps Telemetry', icon: Activity },
          { id: 'THREATS', label: 'Threat Review Queue', icon: AlertTriangle },
          { id: 'AI_CALIBRATION', label: 'AI Model Calibration', icon: Brain },
          { id: 'CONVERSATIONS', label: 'Conversations Audit', icon: Database },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                border: isActive ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                background: isActive ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. USERS & ACCESS SUB-TAB */}
      {activeSubTab === 'USERS' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Registered Network Accounts: <strong style={{ color: 'var(--text-primary)' }}>{users.length}</strong>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '7px 14px' }}
            >
              <UserPlus size={14} /> Create New User
            </button>
          </div>

          <div className="glass-panel" style={{ borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left', minWidth: '500px' }}>
                <thead>
                  <tr style={{ background: 'rgba(255, 255, 255, 0.04)', borderBottom: '1px solid var(--border-subtle)' }}>
                    <th style={{ padding: '12px 14px' }}>User</th>
                    <th style={{ padding: '12px 14px' }}>Role</th>
                    <th style={{ padding: '12px 14px' }}>E2EE Devices</th>
                    <th style={{ padding: '12px 14px' }}>Registered</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          {u.displayName || u.username}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>@{u.username}</div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: u.role === 'ADMIN' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                          color: u.role === 'ADMIN' ? '#fbbf24' : 'var(--green-safe)',
                        }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                        {u.devices?.length || 1} Enclaves
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: '11px' }}>
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            onClick={() => handleChangeRole(u.id, u.role)}
                            title="Toggle Admin / User role"
                            style={{
                              background: 'rgba(255, 255, 255, 0.06)',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: '6px',
                              padding: '4px 8px',
                              fontSize: '11px',
                              color: 'var(--text-secondary)',
                              cursor: 'pointer',
                            }}
                          >
                            Toggle Role
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id, u.username)}
                            title="Delete User"
                            style={{
                              background: 'rgba(239, 68, 68, 0.15)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              borderRadius: '6px',
                              padding: '4px 8px',
                              fontSize: '11px',
                              color: '#f87171',
                              cursor: 'pointer',
                            }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. SECOPS TELEMETRY SUB-TAB */}
      {activeSubTab === 'SECOPS' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '20px' }}>
            <div className="glass-panel" style={{ padding: '16px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Total Messages</span>
                <ShieldCheck size={16} style={{ color: 'var(--green-safe)' }} />
              </div>
              <div style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                {telemetry?.totalProtectedMessages || telemetry?.totalMessages || 0}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--green-safe)' }}>Double Ratchet Active</div>
            </div>

            <div className="glass-panel" style={{ padding: '16px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Threats Intercepted</span>
                <ShieldAlert size={16} style={{ color: 'var(--red-critical)' }} />
              </div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--red-critical)', fontFamily: 'var(--font-mono)' }}>
                {telemetry?.redThreats || 0}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--red-critical)' }}>100% Zero-Trust</div>
            </div>

            <div className="glass-panel" style={{ padding: '16px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Active Devices</span>
                <Server size={16} style={{ color: '#60a5fa' }} />
              </div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#60a5fa', fontFamily: 'var(--font-mono)' }}>
                {telemetry?.activeDevices || telemetry?.totalDevices || 0}
              </div>
              <div style={{ fontSize: '10px', color: '#60a5fa' }}>Curve25519 Enclaves</div>
            </div>

            <div className="glass-panel" style={{ padding: '16px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>AI Exemplars</span>
                <Brain size={16} style={{ color: '#a78bfa' }} />
              </div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#a78bfa', fontFamily: 'var(--font-mono)' }}>
                {learningStats?.total_exemplars || 0}
              </div>
              <div style={{ fontSize: '10px', color: '#a78bfa' }}>Vector Signatures</div>
            </div>
          </div>
        </div>
      )}

      {/* 3. THREAT REVIEW QUEUE SUB-TAB */}
      {activeSubTab === 'THREATS' && (
        <div>
          <AdminThreatReviewQueue />
        </div>
      )}

      {/* 4. AI MODEL CALIBRATION SUB-TAB */}
      {activeSubTab === 'AI_CALIBRATION' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="glass-panel" style={{ padding: '20px', borderRadius: '14px', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <Sparkles size={20} style={{ color: '#a78bfa' }} />
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>Active Online Learning: Teach AI New Threat Signatures</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                  Fine-tune SGD model weights in memory for Zero-Day patterns or clear false alarms.
                </p>
              </div>
            </div>

            <form onSubmit={handleManualTeach} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input
                type="text"
                className="secure-input"
                placeholder="Enter sample phrase, URL, or pretext..."
                value={teachInput}
                onChange={(e) => setTeachInput(e.target.value)}
                style={{ width: '100%', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px' }}
              />

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <select
                  value={teachLabel}
                  onChange={(e) => setTeachLabel(e.target.value as any)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: teachLabel === 'MALICIOUS' ? '#ef4444' : '#10b981',
                    fontWeight: 700,
                    fontSize: '12px',
                  }}
                >
                  <option value="MALICIOUS" style={{ background: '#0b1120', color: '#ef4444' }}>Mark as MALICIOUS / THREAT</option>
                  <option value="BENIGN" style={{ background: '#0b1120', color: '#10b981' }}>Mark as BENIGN / SAFE</option>
                </select>

                <button
                  type="submit"
                  disabled={teaching || !teachInput.trim()}
                  className="btn-primary"
                  style={{ fontSize: '12px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {teaching ? <RefreshCw size={14} className="animate-spin" /> : <Brain size={14} />}
                  <span>Calibrate Online Model</span>
                </button>
              </div>

              {teachFeedback && (
                <div style={{ padding: '8px 12px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--green-safe)', fontSize: '12px' }}>
                  {teachFeedback}
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* 5. CONVERSATIONS AUDIT SUB-TAB */}
      {activeSubTab === 'CONVERSATIONS' && (
        <div className="glass-panel" style={{ borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left', minWidth: '500px' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.04)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '12px 14px' }}>Channel ID / Title</th>
                  <th style={{ padding: '12px 14px' }}>Type</th>
                  <th style={{ padding: '12px 14px' }}>Members</th>
                  <th style={{ padding: '12px 14px' }}>Security State</th>
                </tr>
              </thead>
              <tbody>
                {conversations.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{c.title || c.id}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{c.id}</div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.08)' }}>
                        {c.type}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                      {c.members?.length || 2} Users
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: c.securityState === 'RED' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                        color: c.securityState === 'RED' ? '#ef4444' : 'var(--green-safe)',
                      }}>
                        {c.securityState || 'GREEN'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="glass-modal" style={{ width: '100%', maxWidth: '420px', padding: '20px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>Create User Account</h3>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Username *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. alice_sec"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="secure-input"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Display Name</label>
                <input
                  type="text"
                  placeholder="e.g. Alice Smith"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  className="secure-input"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Email (Optional)</label>
                <input
                  type="email"
                  placeholder="alice@secure.chat"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="secure-input"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="secure-input"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>System Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: '13px' }}
                >
                  <option value="USER" style={{ background: '#0b1120' }}>Standard User</option>
                  <option value="ADMIN" style={{ background: '#0b1120' }}>SuperAdmin</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-ghost"
                  style={{ flex: 1, padding: '10px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 1, padding: '10px' }}
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
