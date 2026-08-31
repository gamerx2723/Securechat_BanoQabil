import React, { useState, useEffect } from 'react';
import { User, Users, Plus, X, Shield, Search, Check } from 'lucide-react';
import { ApiClient } from '../api/client';

interface NewChatModalProps {
  onClose: () => void;
  onCreated: (newConv: any) => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({ onClose, onCreated }) => {
  const [users, setUsers] = useState<Array<{ id: string; username: string; displayName: string; role: string }>>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [groupTitle, setGroupTitle] = useState('');
  const [isGroup, setIsGroup] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ApiClient.getDirectoryUsers().then(setUsers);
  }, []);

  const filteredUsers = users.filter(
    (u) =>
      u.displayName.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelectUser = (id: string) => {
    if (isGroup) {
      if (selectedUserIds.includes(id)) {
        setSelectedUserIds(selectedUserIds.filter((uid) => uid !== id));
      } else {
        setSelectedUserIds([...selectedUserIds, id]);
      }
    } else {
      setSelectedUserIds([id]);
    }
  };

  const handleCreate = async () => {
    if (selectedUserIds.length === 0) {
      setError('Please select at least one contact.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const conv = await ApiClient.createConversation({
        type: isGroup ? 'GROUP' : 'DIRECT',
        title: isGroup ? groupTitle || 'New Secure Group' : undefined,
        participantUserIds: selectedUserIds,
      });
      onCreated(conv);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create conversation');
    } finally {
      setLoading(false);
    }
  };

  return (
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
        maxWidth: '460px',
        borderRadius: '20px',
        padding: '24px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 30px rgba(16, 185, 129, 0.2)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.2)', color: 'var(--green-safe)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Plus size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Start New Secure Chat</h3>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>Double Ratchet E2EE Key Exchange</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Mode Toggle */}
        <div style={{
          display: 'flex',
          background: 'rgba(0, 0, 0, 0.35)',
          padding: '4px',
          borderRadius: '10px',
          marginBottom: '16px',
          border: '1px solid var(--border-subtle)',
        }}>
          <button
            type="button"
            onClick={() => { setIsGroup(false); setSelectedUserIds([]); }}
            style={{
              flex: 1,
              padding: '8px 0',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              background: !isGroup ? 'var(--green-safe)' : 'transparent',
              color: !isGroup ? '#000' : 'var(--text-secondary)',
              transition: 'all 0.2s ease',
            }}
          >
            <User size={14} /> Direct 1:1 Chat
          </button>
          <button
            type="button"
            onClick={() => { setIsGroup(true); setSelectedUserIds([]); }}
            style={{
              flex: 1,
              padding: '8px 0',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              background: isGroup ? 'var(--green-safe)' : 'transparent',
              color: isGroup ? '#000' : 'var(--text-secondary)',
              transition: 'all 0.2s ease',
            }}
          >
            <Users size={14} /> Secure Group
          </button>
        </div>

        {/* Group Name input */}
        {isGroup && (
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Group Channel Name
            </label>
            <input
              type="text"
              value={groupTitle}
              onChange={(e) => setGroupTitle(e.target.value)}
              placeholder="e.g. Red Team SecOps"
              className="secure-input"
              style={{ padding: '8px 12px', fontSize: '13px' }}
            />
          </div>
        )}

        {/* Search */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search directory by username..."
            className="secure-input"
            style={{ padding: '8px 12px 8px 34px', fontSize: '12px' }}
          />
        </div>

        {error && (
          <div style={{ color: 'var(--red-critical)', fontSize: '11px', marginBottom: '8px', fontWeight: 600 }}>
            {error}
          </div>
        )}

        {/* Users List */}
        <div style={{ maxHeight: '220px', overflowY: 'auto', paddingRight: '4px', marginBottom: '18px' }}>
          {filteredUsers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '12px' }}>
              No contacts found
            </div>
          ) : (
            filteredUsers.map((u) => {
              const selected = selectedUserIds.includes(u.id);
              return (
                <div
                  key={u.id}
                  onClick={() => toggleSelectUser(u.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    marginBottom: '6px',
                    background: selected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    border: selected ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-subtle)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #0284c7, #06b6d4)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 'bold',
                    }}>
                      {u.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{u.displayName}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>@{u.username} • <span style={{ color: 'var(--green-safe)' }}>Verified</span></div>
                    </div>
                  </div>

                  <div style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    border: selected ? 'none' : '1px solid var(--border-medium)',
                    background: selected ? 'var(--green-safe)' : 'transparent',
                    color: '#000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {selected && <Check size={12} strokeWidth={3} />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost"
            style={{ flex: 1, padding: '10px' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={loading || selectedUserIds.length === 0}
            className="btn-success"
            style={{ flex: 1, padding: '10px', opacity: (loading || selectedUserIds.length === 0) ? 0.5 : 1, cursor: (loading || selectedUserIds.length === 0) ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Opening...' : 'Open Secure Channel'}
          </button>
        </div>
      </div>
    </div>
  );
};
