import React from 'react';
import { SidebarTab } from './Sidebar';
import { MessageSquare, Smartphone, KeyRound, Shield, Crown } from 'lucide-react';

interface MobileBottomNavBarProps {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  unreadCount: number;
  isAdmin: boolean;
  isVisible: boolean;
}

export const MobileBottomNavBar: React.FC<MobileBottomNavBarProps> = ({
  activeTab,
  onTabChange,
  unreadCount,
  isAdmin,
  isVisible,
}) => {
  if (!isVisible) return null;

  const tabs: Array<{
    id: SidebarTab;
    label: string;
    icon: React.ReactNode;
    color: string;
    activeBg: string;
    badge?: number;
  }> = [
    {
      id: 'CHATS',
      label: 'Chats',
      icon: <MessageSquare size={19} />,
      color: 'var(--green-safe)',
      activeBg: 'rgba(16, 185, 129, 0.15)',
      badge: unreadCount,
    },
    {
      id: 'SECURE_BRIDGE',
      label: 'Bridge',
      icon: <Smartphone size={19} />,
      color: 'var(--accent-cyan)',
      activeBg: 'rgba(6, 182, 212, 0.18)',
    },
    {
      id: 'SECRET_MAP',
      label: 'Secrets',
      icon: <KeyRound size={19} />,
      color: '#f472b6',
      activeBg: 'rgba(236, 72, 153, 0.18)',
    },
    {
      id: 'GUARDIAN',
      label: 'Guardian',
      icon: <Shield size={19} />,
      color: 'var(--green-safe)',
      activeBg: 'rgba(16, 185, 129, 0.15)',
    },
  ];

  if (isAdmin) {
    tabs.push({
      id: 'ADMIN',
      label: 'Admin',
      icon: <Crown size={19} />,
      color: '#fbbf24',
      activeBg: 'rgba(245, 158, 11, 0.2)',
    });
  }

  return (
    <nav className="mobile-bottom-nav">
      <div className="mobile-bottom-nav-inner">
        {tabs.map((t) => {
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onTabChange(t.id)}
              className={`mobile-nav-item ${isActive ? 'active' : ''}`}
              style={{
                color: isActive ? t.color : 'var(--text-muted)',
                background: isActive ? t.activeBg : 'transparent',
              }}
              title={t.label}
            >
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {t.icon}
                {t.badge !== undefined && t.badge > 0 && (
                  <span className="mobile-nav-badge">
                    {t.badge > 99 ? '99+' : t.badge}
                  </span>
                )}
              </div>
              <span className="mobile-nav-label" style={{ fontWeight: isActive ? 800 : 500 }}>
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
