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
    <div style={{ flex: 1, padding: '14px 16px', overflowY: 'auto', overflowX: 'hidden', background: 'var(--bg-primary)', color: 'var(--text-primary)', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(239, 68, 68, 0.2))', border: '1px solid rgba(245, 158, 11, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24', flexShrink: 0 }}>
            <Crown size={20} />
          </div>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ fontSize: '17px', fontWeight: 800, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>SuperAdmin Console</h2>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>SecOps telemetry, moderation & AI calibration</p>
          </div>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="btn-ghost"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 12px' }}
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', marginBottom: '14px', fontSize: '12px' }}>
          {error}
        </div>
      )}

      {/* Sub-tabs Navigation (Horizontally scrollable with smooth touch) */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '16px', WebkitOverflowScrolling: 'touch', width: '100%' }}>
        {[
          { id: 'USERS', label: 'Users & Access', icon: Users },
          { id: 'SECOPS', label: 'SecOps Telemetry', icon: Activity },
          { id: 'THREATS', label: 'Threat Queue', icon: AlertTriangle },
          { id: 'AI_CALIBRATION', label: 'AI Calibration', icon: Brain },
          { id: 'CONVERSATIONS', label: 'Conversations', icon: Database },
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
                padding: '7px 12px',
                borderRadius: '8px',
                border: isActive ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                background: isActive ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              <Icon size={13} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. USERS & ACCESS SUB-TAB */}
      {activeSubTab === 'USERS' && (
        <div style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Accounts: <strong style={{ color: 'var(--text-primary)' }}>{users.length}</strong>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', padding: '6px 12px' }}
            >
              <UserPlus size={13} /> Create User
            </button>
          </div>

          <div className="glass-panel" style={{ borderRadius: '12px', overflow: 'hidden', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left', minWidth: '450px' }}>
                <thead>
                  <tr style={{ background: 'rgba(255, 255, 255, 0.04)', borderBottom: '1px solid var(--border-subtle)' }}>
                    <th style={{ padding: '10px 12px' }}>User</th>
                    <th style={{ padding: '10px 12px' }}>Role</th>
                    <th style={{ padding: '10px 12px' }}>Devices</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          {u.displayName || u.username}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>@{u.username}</div>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          fontSize: '9px',
                          fontWeight: 800,
                          padding: '2px 5px',
                          borderRadius: '4px',
                          background: u.role === 'ADMIN' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                          color: u.role === 'ADMIN' ? '#fbbf24' : 'var(--green-safe)',
                        }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontSize: '11px' }}>
                        {u.devices?.length || 1}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '4px' }}>
                          <button
                            onClick={() => handleChangeRole(u.id, u.role)}
                            title="Toggle Admin / User role"
                            style={{
                              background: 'rgba(255, 255, 255, 0.06)',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: '6px',
                              padding: '4px 6px',
                              fontSize: '10px',
                              color: 'var(--text-secondary)',
                              cursor: 'pointer',
                            }}
                          >
                            Role
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id, u.username)}
                            title="Delete User"
                            style={{
                              background: 'rgba(239, 68, 68, 0.15)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              borderRadius: '6px',
                              padding: '4px 6px',
                              fontSize: '10px',
                              color: '#f87171',
                              cursor: 'pointer',
                            }}
                          >
                            <Trash2 size={11} />
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
        <div style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '16px' }}>
            <div className="glass-panel" style={{ padding: '14px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Total Messages</span>
                <ShieldCheck size={15} style={{ color: 'var(--green-safe)' }} />
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                {telemetry?.totalProtectedMessages || telemetry?.totalMessages || 0}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--green-safe)' }}>Double Ratchet</div>
            </div>

            <div className="glass-panel" style={{ padding: '14px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Threats Intercepted</span>
                <ShieldAlert size={15} style={{ color: 'var(--red-critical)' }} />
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--red-critical)', fontFamily: 'var(--font-mono)' }}>
                {telemetry?.redThreats || 0}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--red-critical)' }}>Zero-Trust Evaluated</div>
            </div>

            <div className="glass-panel" style={{ padding: '14px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Active Devices</span>
                <Server size={15} style={{ color: '#60a5fa' }} />
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#60a5fa', fontFamily: 'var(--font-mono)' }}>
                {telemetry?.activeDevices || telemetry?.totalDevices || 0}
              </div>
              <div style={{ fontSize: '10px', color: '#60a5fa' }}>Curve25519 Keys</div>
            </div>

            <div className="glass-panel" style={{ padding: '14px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Vector Exemplars</span>
                <Brain size={15} style={{ color: '#a78bfa' }} />
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#a78bfa', fontFamily: 'var(--font-mono)' }}>
                {learningStats?.total_exemplars || 0}
              </div>
              <div style={{ fontSize: '10px', color: '#a78bfa' }}>SGD Online Memory</div>
            </div>
          </div>
        </div>
      )}

      {/* 3. THREAT REVIEW QUEUE SUB-TAB */}
      {activeSubTab === 'THREATS' && (
        <div style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
          <AdminThreatReviewQueue />
        </div>
      )}

      {/* 4. AI MODEL CALIBRATION SUB-TAB */}
      {activeSubTab === 'AI_CALIBRATION' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
          <div className="glass-panel" style={{ padding: '16px', borderRadius: '12px', border: '1px solid rgba(139, 92, 246, 0.3)', width: '100%', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <Sparkles size={18} style={{ color: '#a78bfa', flexShrink: 0 }} />
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>Active Online Learning: Teach AI Signatures</h3>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                  Fine-tune SGD model weights in memory for Zero-Day patterns or clear false alarms.
                </p>
              </div>
            </div>

            <form onSubmit={handleManualTeach} style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', boxSizing: 'border-box' }}>
              <input
                type="text"
                className="secure-input"
                placeholder="Enter sample phrase, URL, or pretext..."
                value={teachInput}
                onChange={(e) => setTeachInput(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '8px', padding: '9px 12px', fontSize: '12px' }}
              />

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', width: '100%', boxSizing: 'border-box' }}>
                <select
                  value={teachLabel}
                  onChange={(e) => setTeachLabel(e.target.value as any)}
                  style={{
                    flex: 1,
                    minWidth: '160px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    color: teachLabel === 'MALICIOUS' ? '#ef4444' : '#10b981',
                    fontWeight: 700,
                    fontSize: '11px',
                  }}
                >
                  <option value="MALICIOUS" style={{ background: '#0b1120', color: '#ef4444' }}>Mark as MALICIOUS</option>
                  <option value="BENIGN" style={{ background: '#0b1120', color: '#10b981' }}>Mark as BENIGN</option>
                </select>

                <button
                  type="submit"
                  disabled={teaching || !teachInput.trim()}
                  className="btn-primary"
                  style={{ fontSize: '11px', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
                >
                  {teaching ? <RefreshCw size={13} className="animate-spin" /> : <Brain size={13} />}
                  <span>Calibrate Weights</span>
                </button>
              </div>

              {teachFeedback && (
                <div style={{ padding: '8px 10px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--green-safe)', fontSize: '11px' }}>
                  {teachFeedback}
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* 5. CONVERSATIONS AUDIT SUB-TAB */}
      {activeSubTab === 'CONVERSATIONS' && (
        <div className="glass-panel" style={{ borderRadius: '12px', overflow: 'hidden', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left', minWidth: '450px' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.04)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '10px 12px' }}>Channel / ID</th>
                  <th style={{ padding: '10px 12px' }}>Type</th>
                  <th style={{ padding: '10px 12px' }}>Members</th>
                  <th style={{ padding: '10px 12px' }}>Security</th>
                </tr>
              </thead>
              <tbody>
                {conversations.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{c.title || c.id}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{c.id.slice(0, 8)}...</div>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ fontSize: '9px', padding: '2px 5px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.08)' }}>
                        {c.type}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontSize: '11px' }}>
                      {c.members?.length || 2} Users
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        fontSize: '9px',
                        fontWeight: 800,
                        padding: '2px 5px',
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
          <div className="glass-modal" style={{ width: '100%', maxWidth: '400px', padding: '18px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0 }}>Create User Account</h3>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>Username *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. alice_sec"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="secure-input"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: '8px', fontSize: '12px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>Display Name</label>
                <input
                  type="text"
                  placeholder="e.g. Alice Smith"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  className="secure-input"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: '8px', fontSize: '12px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="secure-input"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: '8px', fontSize: '12px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: '12px' }}
                >
                  <option value="USER" style={{ background: '#0b1120' }}>Standard User</option>
                  <option value="ADMIN" style={{ background: '#0b1120' }}>SuperAdmin</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-ghost"
                  style={{ flex: 1, padding: '8px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 1, padding: '8px' }}
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
