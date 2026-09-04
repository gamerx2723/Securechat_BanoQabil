import React, { useState, useEffect, useRef } from 'react';
import { ConversationItem, SecurityIndicatorColor } from '../types';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  MessageSquare,
  Activity,
  ShieldQuestion,
  Plus,
  Lock,
  Search,
  LogOut,
  Crown,
  CheckSquare,
  Square,
  Trash2,
  X,
  MoreVertical,
  User,
  Sparkles,
  Smartphone,
  KeyRound,
  Users,
} from 'lucide-react';

export type SidebarTab = 'CHATS' | 'SECURE_BRIDGE' | 'SECRET_MAP' | 'GUARDIAN' | 'ADMIN';

interface SidebarProps {
  conversations: ConversationItem[];
  activeId: string;
  onSelect: (id: string) => void;
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  onOpenCopilot: () => void;
  onNewChat: () => void;
  onCreateGroup?: () => void;
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
  onCreateGroup,
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // 1. Search Filter
  const filtered = conversations.filter(c => 
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  // 2. Sort newest conversations to the very top based on last message timestamp
  const sorted = [...filtered].sort((a, b) => {
    const timeA = a.lastMessageTimestamp ? new Date(a.lastMessageTimestamp).getTime() : 0;
    const timeB = b.lastMessageTimestamp ? new Date(b.lastMessageTimestamp).getTime() : 0;
    return timeB - timeA;
  });

  // Calculate total unread messages across all conversations
  const totalUnreadCount = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

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

  // Click outside to close dropdown menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === sorted.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(sorted.map(c => c.id));
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
      {/* User Profile Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
        <div
          onClick={(e) => {
            e.stopPropagation();
            if (onOpenProfile) onOpenProfile();
          }}
          title="Click to view & edit your profile"
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '4px', borderRadius: '10px', transition: 'background 0.2s ease', flex: 1, minWidth: 0 }}
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
                flexShrink: 0,
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
              boxShadow: isAdmin ? '0 0 15px rgba(245, 158, 11, 0.4)' : '0 0 15px var(--green-glow)',
              flexShrink: 0,
            }}>
              {isAdmin ? <Crown size={18} /> : currentUsername.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentUsername}</span>
              {isAdmin ? (
                <span style={{ fontSize: '9px', fontWeight: 800, padding: '1px 5px', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.4)', flexShrink: 0 }}>ADMIN</span>
              ) : (
                <Lock size={12} style={{ color: 'var(--green-safe)', flexShrink: 0 }} />
              )}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isAdmin ? '#fbbf24' : 'var(--green-safe)', display: 'inline-block', flexShrink: 0 }}></span>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{isAdmin ? 'Master SuperAdmin' : 'E2EE Shield Active'}</span>
            </div>
          </div>
        </div>

        {/* Action buttons & Options Dropdown Trigger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onOpenCopilot();
            }} 
            title="Open Security Copilot AI"
            style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: 'var(--green-safe)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <ShieldQuestion size={16} />
          </button>

          <button
            ref={menuButtonRef}
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
            title="Profile & App Options"
            style={{
              background: isMenuOpen ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.06)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '6px',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
          >
            <MoreVertical size={16} />
          </button>
        </div>

        {/* Global Sidebar Dropdown Menu */}
        {isMenuOpen && (
          <div
            ref={menuRef}
            className="glass-modal fade-in"
            style={{
              position: 'absolute',
              top: '64px',
              right: '12px',
              width: '240px',
              zIndex: 100,
              padding: '6px',
              borderRadius: '14px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              background: 'rgba(11, 17, 32, 0.96)',
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(6, 182, 212, 0.2)',
            }}
          >
            <div style={{ padding: '8px 10px 6px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '4px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Signed in as
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentUsername}
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(false);
                if (onOpenProfile) onOpenProfile();
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 10px',
                border: 'none',
                borderRadius: '8px',
                background: 'transparent',
                color: 'var(--text-primary)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <User size={15} style={{ color: 'var(--accent-cyan)' }} />
              <span>My Profile & Avatar</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(false);
                onNewChat();
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 10px',
                border: 'none',
                borderRadius: '8px',
                background: 'transparent',
                color: 'var(--text-primary)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <Plus size={15} style={{ color: 'var(--green-safe)' }} />
              <span>New Secure Chat</span>
            </button>

            {onCreateGroup && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(false);
                  onCreateGroup();
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 10px',
                  border: 'none',
                  borderRadius: '8px',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <Users size={15} style={{ color: 'var(--accent-cyan)' }} />
                <span>New Secure Group</span>
              </button>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(false);
                onOpenCopilot();
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 10px',
                border: 'none',
                borderRadius: '8px',
                background: 'transparent',
                color: 'var(--text-primary)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <Sparkles size={15} style={{ color: '#a855f7' }} />
              <span>Security Copilot AI</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(false);
                onTabChange('GUARDIAN');
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 10px',
                border: 'none',
                borderRadius: '8px',
                background: 'transparent',
                color: 'var(--text-primary)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <Shield size={15} style={{ color: 'var(--green-safe)' }} />
              <span>AI Guardian Center</span>
            </button>

            {isAdmin && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(false);
                  onTabChange('ADMIN');
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 10px',
                  border: 'none',
                  borderRadius: '8px',
                  background: 'rgba(245, 158, 11, 0.1)',
                  color: '#fbbf24',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <Crown size={15} />
                <span>Admin Command Center</span>
              </button>
            )}

            <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '4px 0' }} />

            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(false);
                onLogout();
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 10px',
                border: 'none',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.08)',
                color: '#f87171',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <LogOut size={15} />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'grid', gridTemplateColumns: isAdmin ? 'repeat(5, 1fr)' : 'repeat(4, 1fr)', padding: '6px 8px', gap: '4px', background: 'rgba(0, 0, 0, 0.25)', borderBottom: '1px solid var(--border-subtle)' }}>
        <button
          onClick={() => onTabChange('CHATS')}
          title="Direct & Group Chats"
          style={{
            padding: '7px 2px',
            border: 'none',
            borderRadius: '6px',
            background: activeTab === 'CHATS' ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
            color: activeTab === 'CHATS' ? 'var(--text-primary)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '11px',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2px',
          }}
        >
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <MessageSquare size={14} />
            {totalUnreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-8px',
                  background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                  color: '#000',
                  fontSize: '8px',
                  fontWeight: 900,
                  padding: '1px 4px',
                  borderRadius: '6px',
                }}
              >
                {totalUnreadCount}
              </span>
            )}
          </div>
          <span>Chats</span>
        </button>

        <button
          onClick={() => onTabChange('SECURE_BRIDGE')}
          title="Product B: WhatsApp Companion & Deleted Message Vault"
          style={{
            padding: '7px 2px',
            border: 'none',
            borderRadius: '6px',
            background: activeTab === 'SECURE_BRIDGE' ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
            color: activeTab === 'SECURE_BRIDGE' ? 'var(--accent-cyan)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '11px',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2px',
          }}
        >
          <Smartphone size={14} />
          <span>Bridge</span>
        </button>

        <button
          onClick={() => onTabChange('SECRET_MAP')}
          title="Secret & Credentials Exposure Map"
          style={{
            padding: '7px 2px',
            border: 'none',
            borderRadius: '6px',
            background: activeTab === 'SECRET_MAP' ? 'rgba(236, 72, 153, 0.2)' : 'transparent',
            color: activeTab === 'SECRET_MAP' ? '#f472b6' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '11px',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2px',
          }}
        >
          <KeyRound size={14} />
          <span>Secrets</span>
        </button>

        <button
          onClick={() => onTabChange('GUARDIAN')}
          title="AI Guardian Threat Center & Behavioral Tracker"
          style={{
            padding: '7px 2px',
            border: 'none',
            borderRadius: '6px',
            background: activeTab === 'GUARDIAN' ? 'rgba(16, 185, 129, 0.18)' : 'transparent',
            color: activeTab === 'GUARDIAN' ? 'var(--green-safe)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '11px',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2px',
          }}
        >
          <Shield size={14} />
          <span>Guardian</span>
        </button>

        {/* Combined SuperAdmin Command Center Tab */}
        {isAdmin && (
          <button
            onClick={() => onTabChange('ADMIN')}
            title="SuperAdmin Command Center"
            style={{
              padding: '7px 2px',
              border: 'none',
              borderRadius: '6px',
              background: activeTab === 'ADMIN' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(245, 158, 11, 0.08)',
              color: activeTab === 'ADMIN' ? '#fcd34d' : '#fbbf24',
              fontWeight: 700,
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
            }}
          >
            <Crown size={14} />
            <span>Admin</span>
          </button>
        )}
      </div>

      {/* Search Bar & New Chat / Group Buttons */}
      <div style={{ padding: '10px 12px', display: 'flex', gap: '6px' }}>
        <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search chats..."
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
          onClick={(e) => {
            e.stopPropagation();
            onNewChat();
          }}
          title="Start New Direct Chat"
          style={{
            background: 'var(--green-safe)',
            color: '#000',
            border: 'none',
            borderRadius: '8px',
            padding: '0 8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2px',
            fontSize: '11px',
          }}
        >
          <Plus size={14} /> Chat
        </button>
        {onCreateGroup && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCreateGroup();
            }}
            title="Create Encrypted Group"
            style={{
              background: 'rgba(6, 182, 212, 0.15)',
              border: '1px solid rgba(6, 182, 212, 0.4)',
              color: 'var(--accent-cyan)',
              borderRadius: '8px',
              padding: '0 8px',
              cursor: 'pointer',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              fontSize: '11px',
            }}
          >
            <Users size={13} /> Group
          </button>
        )}
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
                  {selectedIds.length === sorted.length ? 'Deselect' : 'Select All'}
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

      {/* Conversation List (Always sorted with newest chat on top) */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 8px' }}>
        {sorted.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 12px', color: 'var(--text-muted)', fontSize: '12px' }}>
            No conversations found. Click <strong>+ New</strong> to start a chat!
          </div>
        ) : (
          sorted.map(c => {
            const isActive = c.id === activeId && activeTab === 'CHATS';
            const isChecked = selectedIds.includes(c.id);
            const hasUnread = (c.unreadCount || 0) > 0;

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
                  background: isChecked
                    ? 'rgba(6, 182, 212, 0.12)'
                    : isActive
                    ? 'rgba(16, 185, 129, 0.12)'
                    : hasUnread
                    ? 'rgba(6, 182, 212, 0.06)'
                    : 'transparent',
                  border: isChecked
                    ? '1px solid rgba(6, 182, 212, 0.4)'
                    : isActive
                    ? '1px solid rgba(16, 185, 129, 0.3)'
                    : hasUnread
                    ? '1px solid rgba(6, 182, 212, 0.2)'
                    : '1px solid transparent',
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
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: hasUnread ? '2px solid var(--accent-cyan)' : 'none',
                    }}
                  />
                  <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', background: 'var(--bg-secondary)', borderRadius: '50%', padding: '2px' }}>
                    {getSecurityIcon(c.securityState)}
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                    <span style={{
                      fontWeight: hasUnread ? 800 : 600,
                      fontSize: '13px',
                      color: hasUnread ? 'var(--accent-cyan)' : 'var(--text-primary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {c.title}
                    </span>
                    <span style={{ fontSize: '10px', color: hasUnread ? 'var(--accent-cyan)' : 'var(--text-muted)', fontWeight: hasUnread ? 700 : 400 }}>
                      {c.lastMessageTime}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{
                      fontSize: '11px',
                      color: hasUnread ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontWeight: hasUnread ? 600 : 400,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      margin: 0,
                    }}>
                      {c.lastMessageText}
                    </p>
                    {/* Glowing Notification Bubble with New Message Count */}
                    {hasUnread && (
                      <span style={{
                        background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                        color: '#000',
                        fontSize: '10px',
                        fontWeight: 900,
                        padding: '2px 7px',
                        borderRadius: '12px',
                        boxShadow: '0 0 10px rgba(6, 182, 212, 0.6)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: '18px',
                        height: '18px',
                        flexShrink: 0,
                        marginLeft: '6px',
                      }}>
                        {c.unreadCount > 99 ? '99+' : c.unreadCount}
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
