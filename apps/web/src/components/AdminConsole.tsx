import React, { useState, useEffect } from 'react';
import { Shield, Users, Database, AlertTriangle, UserPlus, Trash2, ShieldCheck, ShieldAlert, RefreshCw, Key, Lock, Activity, CheckCircle, Ban } from 'lucide-react';
import { ApiClient } from '../api/client';

export const AdminConsole: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'USERS' | 'CONVERSATIONS' | 'DATABASE' | 'TELEMETRY'>('USERS');
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

  const API_BASE = 'http://localhost:4000/api/v1';

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
    } catch (err) {
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
    } catch (err) {
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
    } catch (err) {
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
    } catch (err) {
      alert('Failed to delete conversation');
    }
  };

  return (
    <div className="flex-1 h-screen overflow-y-auto bg-slate-950 text-slate-100 p-8 custom-scrollbar">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-800 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-red-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">SuperAdmin Management Portal</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                MASTER ROOT ACCESS
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Full database governance, user account management & zero-trust threat telemetry</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center gap-2 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            Create Account
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      {telemetry && (
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Total Accounts</span>
              <Users className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold text-white">{telemetry.metrics.totalUsers}</div>
            <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> All active in SQLite DB
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Registered Devices</span>
              <Key className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-white">{telemetry.metrics.totalDevices}</div>
            <div className="text-[11px] text-cyan-400 mt-1">E2EE Curve25519 Keys</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Encrypted Messages</span>
              <Lock className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white">{telemetry.metrics.totalMessages}</div>
            <div className="text-[11px] text-slate-400 mt-1">Double Ratchet Frames</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Security Interceptions</span>
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-bold text-rose-400">{telemetry.metrics.totalSecurityEvents}</div>
            <div className="text-[11px] text-rose-400/80 mt-1">{telemetry.metrics.redEvents} Critical Blocks</div>
          </div>
        </div>
      )}

      {/* Sub Tabs */}
      <div className="flex border-b border-slate-800 mb-6 gap-6">
        <button
          onClick={() => setActiveSubTab('USERS')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeSubTab === 'USERS' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          All User Accounts ({users.length})
        </button>

        <button
          onClick={() => setActiveSubTab('CONVERSATIONS')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeSubTab === 'CONVERSATIONS' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-4 h-4" />
          Database Channels ({conversations.length})
        </button>

        <button
          onClick={() => setActiveSubTab('TELEMETRY')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeSubTab === 'TELEMETRY' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          Live Threat Logs ({telemetry?.recentEvents?.length || 0})
        </button>
      </div>

      {/* 1. USERS TAB */}
      {activeSubTab === 'USERS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Database User Accounts</h3>
            <span className="text-xs text-slate-400">Total: {users.length} registered accounts</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3.5">User Identity</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Devices / E2EE Keys</th>
                  <th className="p-3.5">Activity</th>
                  <th className="p-3.5">Created Date</th>
                  <th className="p-3.5 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-600 text-white font-bold flex items-center justify-center text-xs">
                          {u.displayName?.charAt(0) || u.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-white">{u.displayName || u.username}</div>
                          <div className="text-[11px] text-slate-400">@{u.username} {u.email ? `• ${u.email}` : ''}</div>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                        u.role === 'ADMIN' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {u.role}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                        u.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {u.status}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <div className="text-slate-300 font-mono text-[11px]">
                        {u.devices?.length || 0} Device(s)
                      </div>
                      <div className="text-[10px] text-slate-500">Curve25519 Provisioned</div>
                    </td>

                    <td className="p-3.5 text-slate-300">
                      <div>{u._count?.sentMessages || 0} msgs sent</div>
                      <div className="text-[10px] text-slate-500">{u._count?.conversationMembers || 0} channels</div>
                    </td>

                    <td className="p-3.5 text-slate-400">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleChangeRole(u.id, u.role)}
                          title="Toggle Admin / User Role"
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300 border border-slate-700"
                        >
                          {u.role === 'ADMIN' ? 'Demote to User' : 'Make Admin'}
                        </button>

                        <button
                          onClick={() => handleToggleStatus(u.id, u.status)}
                          title="Suspend / Activate Account"
                          className={`px-2 py-1 rounded text-[11px] font-semibold ${
                            u.status === 'ACTIVE' ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                          }`}
                        >
                          {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                        </button>

                        <button
                          onClick={() => handleDeleteUser(u.id, u.username)}
                          title="Permanently Delete Account"
                          className="p-1 rounded bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. CONVERSATIONS TAB */}
      {activeSubTab === 'CONVERSATIONS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Database Channels & Conversations</h3>
            <span className="text-xs text-slate-400">{conversations.length} total channels</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Channel Name / ID</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Members</th>
                  <th className="p-3.5">Message Count</th>
                  <th className="p-3.5">Last Active</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {conversations.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3.5">
                      <div className="font-bold text-white">{c.title || 'Direct Chat'}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{c.id}</div>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-400 font-bold text-[10px]">
                        {c.type}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-300">
                      {c.members?.map((m: any) => m.user?.displayName || m.user?.username).join(', ') || 'No members'}
                    </td>
                    <td className="p-3.5 text-slate-300 font-mono">
                      {c._count?.messages || 0} msgs
                    </td>
                    <td className="p-3.5 text-slate-400">
                      {new Date(c.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => handleDeleteConversation(c.id)}
                        title="Delete Channel"
                        className="p-1.5 rounded bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. THREAT LOGS TAB */}
      {activeSubTab === 'TELEMETRY' && telemetry && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-4">Threat Detection Breakdown</h3>
            <div className="grid grid-cols-3 gap-3">
              {telemetry.threatBreakdown?.map((t: any) => (
                <div key={t.category} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">{t.category}</span>
                  <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold text-xs">{t.count} detected</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">Real-Time Security Event Audit Stream</h3>
            </div>
            <div className="divide-y divide-slate-800/60 max-h-96 overflow-y-auto">
              {telemetry.recentEvents?.map((e: any) => (
                <div key={e.id} className="p-3.5 flex items-center justify-between hover:bg-slate-800/30">
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${e.indicatorColor === 'RED' ? 'bg-rose-500 animate-ping' : e.indicatorColor === 'ORANGE' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>{e.type}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">{e.severity}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{e.explanation || 'Zero trust security inspection event.'}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-rose-400">{e.riskScore}% Risk</div>
                    <div className="text-[10px] text-slate-500">{new Date(e.createdAt).toLocaleTimeString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CREATE USER MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/60 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-cyan-400" />
              Provision New User Account
            </h3>

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="e.g. dev_analyst"
                  className="w-full bg-slate-950 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Display Name</label>
                <input
                  type="text"
                  required
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  placeholder="e.g. Developer Analyst"
                  className="w-full bg-slate-950 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email (Optional)</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="analyst@securechat.internal"
                  className="w-full bg-slate-950 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Initial Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Set initial password"
                  className="w-full bg-slate-950 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Account Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="USER">Standard User (Messaging & Guardian)</option>
                  <option value="ADMIN">SuperAdmin (Full DB & User Control)</option>
                </select>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white shadow-md shadow-cyan-500/20"
                >
                  Create & Provision Keys
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
