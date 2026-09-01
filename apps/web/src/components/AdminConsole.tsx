import React, { useState, useEffect } from 'react';
import { Shield, Users, Database, AlertTriangle, UserPlus, Trash2, ShieldCheck, ShieldAlert, RefreshCw, Key, Lock, Activity, CheckCircle, Ban, Crown, ArrowRight, X } from 'lucide-react';
import { ApiClient } from '../api/client';

export const AdminConsole: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'USERS' | 'CONVERSATIONS' | 'TELEMETRY'>('USERS');
  const [users, setUsers] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [telemetry, setTelemetry] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New User Creation Modal Form
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'USER' | 'ADMIN'>('USER');

  const API_BASE = (import.meta.env.VITE_API_URL as string) || 'http://localhost:4000/api/v1';

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
    const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
    if (!confirm(`Change role of this user to ${newRole}?`)) return;

    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) loadData();
    } catch {
      alert('Failed to update role');
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    if (!confirm(`Set user status to ${newStatus}?`)) return;

    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) loadData();
    } catch {
      alert('Failed to update status');
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`Are you sure you want to permanently delete account '@${username}' and all associated keys?`)) return;

    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (res.ok) loadData();
      else {
        const err = await res.json();
        alert(err.error || 'Failed to delete user');
      }
    } catch {
      alert('Failed to delete user');
    }
  };

  const handleDeleteConversation = async (convId: string) => {
    if (!confirm('Are you sure you want to delete this conversation channel?')) return;

    try {
      const res = await fetch(`${API_BASE}/admin/conversations/${convId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (res.ok) loadData();
    } catch {
      alert('Failed to delete conversation');
    }
  };

  return (
    <div style={{ flex: 1, height: '100vh', overflowY: 'auto', background: 'var(--bg-primary)', padding: '32px', color: 'var(--text-primary)' }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '24px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 0 25px rgba(245, 158, 11, 0.35)',
          }}>
            <Crown size={28} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                SuperAdmin Governance Console
              </h1>
              <span style={{ fontSize: '10px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.4)' }}>
                ROOT PERMISSIONS
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
              Full database governance, user account management & zero-trust threat telemetry
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={loadData}
            disabled={loading}
            className="btn-ghost"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh Data
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
            style={{ fontSize: '12px', padding: '9px 16px' }}
          >
            <UserPlus size={16} /> Provision User
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      {telemetry && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
              <span>Total Accounts</span>
              <Users size={18} color="var(--accent-cyan)" />
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>{telemetry.metrics.totalUsers}</div>
            <div style={{ fontSize: '11px', color: 'var(--green-safe)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle size={12} /> Active in SQLite Database
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
              <span>Registered Devices</span>
              <Key size={18} color="var(--orange-warn)" />
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>{telemetry.metrics.totalDevices}</div>
            <div style={{ fontSize: '11px', color: 'var(--accent-cyan)', marginTop: '4px' }}>
              E2EE Curve25519 Keys
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
              <span>Encrypted Messages</span>
              <Lock size={18} color="var(--green-safe)" />
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>{telemetry.metrics.totalMessages}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Double Ratchet Frames
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
              <span>Security Interceptions</span>
              <ShieldAlert size={18} color="var(--red-critical)" />
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--red-critical)' }}>{telemetry.metrics.totalSecurityEvents}</div>
            <div style={{ fontSize: '11px', color: '#fb7185', marginTop: '4px' }}>
              {telemetry.metrics.redEvents} Critical Threat Blocks
            </div>
          </div>
        </div>
      )}

      {/* Sub Tabs */}
      <div style={{ display: 'flex', gap: '20px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveSubTab('USERS')}
          style={{
            paddingBottom: '12px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeSubTab === 'USERS' ? '2px solid var(--accent-cyan)' : '2px solid transparent',
            color: activeSubTab === 'USERS' ? 'var(--accent-cyan)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Users size={16} /> User Accounts Directory ({users.length})
        </button>

        <button
          onClick={() => setActiveSubTab('CONVERSATIONS')}
          style={{
            paddingBottom: '12px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeSubTab === 'CONVERSATIONS' ? '2px solid var(--accent-cyan)' : '2px solid transparent',
            color: activeSubTab === 'CONVERSATIONS' ? 'var(--accent-cyan)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Database size={16} /> Database Channels ({conversations.length})
        </button>

        <button
          onClick={() => setActiveSubTab('TELEMETRY')}
          style={{
            paddingBottom: '12px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeSubTab === 'TELEMETRY' ? '2px solid var(--accent-cyan)' : '2px solid transparent',
            color: activeSubTab === 'TELEMETRY' ? 'var(--accent-cyan)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Activity size={16} /> Threat Audit Stream ({telemetry?.recentEvents?.length || 0})
        </button>
      </div>

      {/* 1. USERS DIRECTORY TAB */}
      {activeSubTab === 'USERS' && (
        <div className="glass-panel" style={{ borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Registered Database Accounts</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{users.length} Total Users</span>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'rgba(0, 0, 0, 0.4)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '14px 20px' }}>User Identity</th>
                <th style={{ padding: '14px 20px' }}>Role</th>
                <th style={{ padding: '14px 20px' }}>Status</th>
                <th style={{ padding: '14px 20px' }}>Device Keys</th>
                <th style={{ padding: '14px 20px' }}>Activity</th>
                <th style={{ padding: '14px 20px' }}>Created</th>
                <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '10px',
                        background: u.role === 'ADMIN' ? 'linear-gradient(135deg, #f59e0b, #ef4444)' : 'linear-gradient(135deg, #0284c7, #06b6d4)',
                        color: '#fff',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '13px',
                      }}>
                        {u.displayName?.charAt(0) || u.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{u.displayName || u.username}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>@{u.username} {u.email ? `• ${u.email}` : ''}</div>
                      </div>
                    </div>
                  </td>

                  <td style={{ padding: '14px 20px' }}>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      padding: '3px 7px',
                      borderRadius: '5px',
                      background: u.role === 'ADMIN' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                      color: u.role === 'ADMIN' ? '#fbbf24' : 'var(--text-secondary)',
                      border: u.role === 'ADMIN' ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--border-subtle)',
                    }}>
                      {u.role}
                    </span>
                  </td>

                  <td style={{ padding: '14px 20px' }}>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      padding: '3px 7px',
                      borderRadius: '5px',
                      background: u.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                      color: u.status === 'ACTIVE' ? 'var(--green-safe)' : 'var(--red-critical)',
                    }}>
                      {u.status}
                    </span>
                  </td>

                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                      {u.devices?.length || 0} Device(s)
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Curve25519 Initialized</div>
                  </td>

                  <td style={{ padding: '14px 20px', color: 'var(--text-secondary)' }}>
                    <div>{u._count?.sentMessages || 0} messages</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{u._count?.conversationMembers || 0} channels</div>
                  </td>

                  <td style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '12px' }}>
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>

                  <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                      <button
                        onClick={() => handleChangeRole(u.id, u.role)}
                        style={{ padding: '5px 10px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}
                      >
                        {u.role === 'ADMIN' ? 'Demote' : 'Make Admin'}
                      </button>

                      <button
                        onClick={() => handleToggleStatus(u.id, u.status)}
                        style={{
                          padding: '5px 10px',
                          background: u.status === 'ACTIVE' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                          border: 'none',
                          borderRadius: '6px',
                          color: u.status === 'ACTIVE' ? 'var(--orange-warn)' : 'var(--green-safe)',
                          fontSize: '11px',
                          cursor: 'pointer',
                          fontWeight: 700,
                        }}
                      >
                        {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                      </button>

                      <button
                        onClick={() => handleDeleteUser(u.id, u.username)}
                        style={{ padding: '5px 8px', background: 'rgba(244, 63, 94, 0.15)', border: 'none', borderRadius: '6px', color: 'var(--red-critical)', cursor: 'pointer' }}
                        title="Delete User"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 2. CONVERSATIONS TAB */}
      {activeSubTab === 'CONVERSATIONS' && (
        <div className="glass-panel" style={{ borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Active Database Communication Channels</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{conversations.length} Total</span>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'rgba(0, 0, 0, 0.4)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '14px 20px' }}>Channel Name / ID</th>
                <th style={{ padding: '14px 20px' }}>Type</th>
                <th style={{ padding: '14px 20px' }}>Members</th>
                <th style={{ padding: '14px 20px' }}>Message Count</th>
                <th style={{ padding: '14px 20px' }}>Last Updated</th>
                <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {conversations.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{c.title || 'Direct Conversation'}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{c.id}</div>
                  </td>

                  <td style={{ padding: '14px 20px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 800, padding: '3px 7px', borderRadius: '5px', background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)' }}>
                      {c.type}
                    </span>
                  </td>

                  <td style={{ padding: '14px 20px', color: 'var(--text-secondary)' }}>
                    {c.members?.map((m: any) => m.user?.displayName || m.user?.username).join(', ') || 'No members'}
                  </td>

                  <td style={{ padding: '14px 20px', fontFamily: 'var(--font-mono)' }}>
                    {c._count?.messages || 0} frames
                  </td>

                  <td style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '12px' }}>
                    {new Date(c.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>

                  <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                    <button
                      onClick={() => handleDeleteConversation(c.id)}
                      style={{ padding: '6px 10px', background: 'rgba(244, 63, 94, 0.15)', border: 'none', borderRadius: '6px', color: 'var(--red-critical)', cursor: 'pointer' }}
                      title="Delete Channel"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 3. TELEMETRY TAB */}
      {activeSubTab === 'TELEMETRY' && telemetry && (
        <div>
          <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px' }}>Threat Category Distribution</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {telemetry.threatBreakdown?.map((t: any) => (
                <div key={t.category} style={{ padding: '14px', background: 'rgba(0, 0, 0, 0.35)', border: '1px solid var(--border-subtle)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{t.category}</span>
                  <span style={{ fontSize: '12px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', background: 'rgba(244, 63, 94, 0.2)', color: 'var(--red-critical)' }}>
                    {t.count} detected
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel" style={{ borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Real-Time Security Event Audit Stream</h3>
            </div>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {telemetry.recentEvents?.map((e: any) => (
                <div key={e.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: e.indicatorColor === 'RED' ? 'var(--red-critical)' : e.indicatorColor === 'ORANGE' ? 'var(--orange-warn)' : 'var(--green-safe)',
                      boxShadow: e.indicatorColor === 'RED' ? '0 0 10px var(--red-glow)' : 'none',
                    }} />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{e.type}</span>
                        <span style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-secondary)' }}>{e.severity}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {e.explanation || 'Zero trust security inspection event.'}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--red-critical)' }}>
                      {e.riskScore}% Risk
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{new Date(e.createdAt).toLocaleTimeString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CREATE USER MODAL */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(12px)',
          padding: '20px',
        }}>
          <div className="glass-modal fade-in" style={{
            width: '100%',
            maxWidth: '440px',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 30px rgba(6, 182, 212, 0.2)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <UserPlus size={18} color="var(--accent-cyan)" /> Provision User Account
              </h3>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="e.g. sec_engineer"
                  className="secure-input"
                  style={{ padding: '9px 12px', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  placeholder="e.g. Security Engineer"
                  className="secure-input"
                  style={{ padding: '9px 12px', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Email (Optional)
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="engineer@securechat.internal"
                  className="secure-input"
                  style={{ padding: '9px 12px', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Initial Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Set initial password"
                  className="secure-input"
                  style={{ padding: '9px 12px', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Account Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="secure-input"
                  style={{ padding: '9px 12px', fontSize: '13px' }}
                >
                  <option value="USER">Standard User (Messaging & Guardian)</option>
                  <option value="ADMIN">SuperAdmin (Full DB & User Control)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
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
                  Create & Provision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
