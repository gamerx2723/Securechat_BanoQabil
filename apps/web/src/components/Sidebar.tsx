import React, { useState } from 'react';
import { ConversationItem, SecurityIndicatorColor } from '../types';
import { Shield, ShieldAlert, ShieldCheck, MessageSquare, Activity, ShieldQuestion, Plus, Lock, Search, LogOut, Crown, CheckSquare, Square, Trash2, X, Check } from 'lucide-react';

interface SidebarProps {
  conversations: ConversationItem[];
  activeId: string;
  onSelect: (id: string) => void;
  activeTab: 'CHATS' | 'GUARDIAN' | 'SECOPS' | 'ADMIN';
  onTabChange: (tab: 'CHATS' | 'GUARDIAN' | 'SECOPS' | 'ADMIN') => void;
  onOpenCopilot: () => void;
  onNewChat: () => void;
  onLogout: () => void;
  onOpenProfile?: () => void;
  onBulkDelete?: (ids: string[]) => void;
  currentUsername: string;
  userAvatarUrl?: string;
  userRole?: string;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeId,
  onSelect,
  activeTab,
  onTabChange,
  onOpenCopilot,
  onNewChat,
  onLogout,
  onOpenProfile,
  onBulkDelete,
  currentUsername,
  userAvatarUrl,
  userRole = 'USER',
  className = '',
}) => {
  const [search, setSearch] = useState('');
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filtered = conversations.filter(c => 
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const getSecurityIcon = (state: SecurityIndicatorColor) => {
    switch (state) {
      case 'RED':
        return <ShieldAlert size={16} className="text-rose-500 animate-pulse" />;
      case 'ORANGE':
        return <ShieldAlert size={16} className="text-amber-500" />;
      case 'GREEN':
      default:
        return <ShieldCheck size={16} className="text-emerald-400" />;
    }
  };

  const isAdmin = userRole === 'ADMIN';

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map(c => c.id));
    }
  };

  const handleExecuteBulkDelete = () => {
    if (selectedIds.length === 0) return;
    if (confirm(`Are you sure you want to permanently delete ${selectedIds.length} selected conversation${selectedIds.length > 1 ? 's' : ''}?`)) {
      if (onBulkDelete) {
        onBulkDelete(selectedIds);
      }
      setSelectedIds([]);
      setIsSelecting(false);
    }
  };

  return (
    <aside className={`sidebar-container ${className}`}>
      {/* User Header */}
      <div style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div
          onClick={onOpenProfile}
          title="Click to view & edit your profile"
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '4px', borderRadius: '10px', transition: 'background 0.2s ease' }}
        >
          {userAvatarUrl ? (
            <img
              src={userAvatarUrl}
              alt={currentUsername}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                objectFit: 'cover',
                border: '2px solid var(--accent-cyan)',
                boxShadow: '0 0 12px rgba(6, 182, 212, 0.4)',
              }}
            />
          ) : (
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: isAdmin ? 'linear-gradient(135deg, #f59e0b, #ef4444)' : 'linear-gradient(135deg, #10b981, #0284c7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '16px',
              color: '#fff',
              boxShadow: isAdmin ? '0 0 15px rgba(245, 158, 11, 0.4)' : '0 0 15px var(--green-glow)'
            }}>
              {isAdmin ? <Crown size={18} /> : currentUsername.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {currentUsername}
              {isAdmin ? (
                <span style={{ fontSize: '9px', fontWeight: 800, padding: '1px 5px', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.4)' }}>ADMIN</span>
              ) : (
                <Lock size={12} style={{ color: 'var(--green-safe)' }} />
              )}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isAdmin ? '#fbbf24' : 'var(--green-safe)', display: 'inline-block' }}></span>
              {isAdmin ? 'Master SuperAdmin Mode' : 'Online & E2EE Protected'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button 
            onClick={onOpenCopilot} 
            title="Open Security Copilot"
            style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: 'var(--green-safe)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <ShieldQuestion size={16} />
          </button>
          <button 
            onClick={onLogout} 
            title="Sign Out"
            style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', padding: '8px 10px', gap: '4px', background: 'rgba(0, 0, 0, 0.2)' }}>
        <button
          onClick={() => onTabChange('CHATS')}
          style={{
            flex: 1,
            padding: '7px 0',
            border: 'none',
            borderRadius: '6px',
            background: activeTab === 'CHATS' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
            color: activeTab === 'CHATS' ? 'var(--text-primary)' : 'var(--text-muted)',
            fontWeight: 600,
            fontSize: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px'
          }}
        >
          <MessageSquare size={13} /> Chats
        </button>

        <button
          onClick={() => onTabChange('GUARDIAN')}
          style={{
            flex: 1,
            padding: '7px 0',
            border: 'none',
            borderRadius: '6px',
            background: activeTab === 'GUARDIAN' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
            color: activeTab === 'GUARDIAN' ? 'var(--green-safe)' : 'var(--text-muted)',
            fontWeight: 600,
            fontSize: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px'
          }}
        >
          <Shield size={13} /> AI Guardian
        </button>

        {/* Admin-Only SecOps & SuperAdmin Tabs */}
        {isAdmin && (
          <button
            onClick={() => onTabChange('SECOPS')}
            style={{
              flex: 1,
              padding: '7px 0',
              border: 'none',
              borderRadius: '6px',
              background: activeTab === 'SECOPS' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
              color: activeTab === 'SECOPS' ? '#60a5fa' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px'
            }}
          >
            <Activity size={13} /> SecOps
          </button>
        )}

        {isAdmin && (
          <button
            onClick={() => onTabChange('ADMIN')}
            style={{
              flex: 1.2,
              padding: '7px 0',
              border: 'none',
              borderRadius: '6px',
              background: activeTab === 'ADMIN' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(245, 158, 11, 0.08)',
              color: activeTab === 'ADMIN' ? '#fcd34d' : '#fbbf24',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              borderBottom: activeTab === 'ADMIN' ? '2px solid #f59e0b' : 'none'
            }}
          >
            <Crown size={13} /> Admin
          </button>
        )}
      </div>

      {/* Search Bar & New Chat Button */}
      <div style={{ padding: '10px 14px', display: 'flex', gap: '8px' }}>
        <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search zero-trust chats..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '7px 10px 7px 30px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontSize: '12px',
              outline: 'none',
            }}
          />
        </div>
        <button
          onClick={onNewChat}
          title="Start New Secure Chat"
          style={{
            background: 'var(--green-safe)',
            color: '#000',
            border: 'none',
            borderRadius: '8px',
            padding: '0 10px',
            cursor: 'pointer',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            fontSize: '12px'
          }}
        >
          <Plus size={16} /> New
        </button>
      </div>

      {/* Conversation Header & Bulk Delete Controls */}
      <div style={{ padding: '4px 14px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>
          {isSelecting ? `${selectedIds.length} Selected` : 'Active Conversations'}
        </div>

        {conversations.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {isSelecting ? (
              <>
                <button
                  onClick={handleSelectAll}
                  style={{ background: 'transparent', border: 'none', color: 'var(--accent-cyan)', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                >
                  {selectedIds.length === filtered.length ? 'Deselect' : 'Select All'}
                </button>
                {selectedIds.length > 0 && (
                  <button
                    onClick={handleExecuteBulkDelete}
                    style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.35)', color: '#f43f5e', fontSize: '11px', fontWeight: 700, borderRadius: '6px', padding: '2px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Trash2 size={11} /> Delete ({selectedIds.length})
                  </button>
                )}
                <button
                  onClick={() => {
                    setIsSelecting(false);
                    setSelectedIds([]);
                  }}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  <X size={13} />
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsSelecting(true)}
                title="Select chats to bulk delete"
                style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '2px 8px', color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <CheckSquare size={11} /> Select
              </button>
            )}
          </div>
        )}
      </div>

      {/* Conversation List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 8px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 12px', color: 'var(--text-muted)', fontSize: '12px' }}>
            No conversations found. Click <strong>+ New</strong> to start a chat!
          </div>
        ) : (
          filtered.map(c => {
            const isActive = c.id === activeId && activeTab === 'CHATS';
            const isChecked = selectedIds.includes(c.id);
            return (
              <div
                key={c.id}
                onClick={() => {
                  if (isSelecting) {
                    toggleSelect(c.id);
                  } else {
                    onSelect(c.id);
                    onTabChange('CHATS');
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  marginBottom: '4px',
                  background: isChecked ? 'rgba(6, 182, 212, 0.12)' : isActive ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                  border: isChecked ? '1px solid rgba(6, 182, 212, 0.4)' : isActive ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid transparent',
                  transition: 'all 0.15s ease',
                }}
              >
                {/* Bulk Selection Checkbox */}
                {isSelecting && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelect(c.id);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isChecked ? 'var(--accent-cyan)' : 'var(--text-muted)',
                    }}
                  >
                    {isChecked ? <CheckSquare size={18} /> : <Square size={18} />}
                  </div>
                )}

                <div style={{ position: 'relative' }}>
                  <img
                    src={c.avatar}
                    alt={c.title}
                    style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', background: 'var(--bg-secondary)', borderRadius: '50%', padding: '2px' }}>
                    {getSecurityIcon(c.securityState)}
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                    <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.title}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      {c.lastMessageTime}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
                      {c.lastMessageText}
                    </p>
                    {c.unreadCount > 0 && (
                      <span style={{ background: 'var(--green-safe)', color: '#000', fontSize: '9px', fontWeight: 800, padding: '2px 5px', borderRadius: '8px' }}>
                        {c.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
