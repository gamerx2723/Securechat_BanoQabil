import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ConversationItem, ChatMessage, SecurityAnalysis, UserProfile } from './types';
import { Sidebar, SidebarTab } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { GuardianPanel } from './components/GuardianPanel';
import { EvidenceModal } from './components/EvidenceModal';
import { CopilotDrawer } from './components/CopilotDrawer';
import { ConversationTopicModal } from './components/ConversationTopicModal';
import { AuthModal } from './components/AuthModal';
import { NewChatModal } from './components/NewChatModal';
import { CreateGroupModal } from './components/CreateGroupModal';
import { SecureBridgeView } from './components/SecureBridgeView';
import { SecretExposureMapView } from './components/SecretExposureMapView';
import { AdminConsole } from './components/AdminConsole';
import { ProfileModal } from './components/ProfileModal';
import { ProfileOnboardingModal } from './components/ProfileOnboardingModal';
import { ApiClient } from './api/client';
import { playNotificationChime, requestNotificationPermission, triggerSystemNotification } from './utils/notifications';
import { ArrowLeft, Shield, Crown, Plus, ShieldCheck, Smartphone, KeyRound } from 'lucide-react';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(ApiClient.getCurrentUser());
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConvId, setActiveConvId] = useState<string>('');
  const [messagesMap, setMessagesMap] = useState<Record<string, ChatMessage[]>>({});
  const [activeTab, setActiveTab] = useState<SidebarTab>('CHATS');
  const [inspectedMessage, setInspectedMessage] = useState<ChatMessage | null>(null);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [directoryUsers, setDirectoryUsers] = useState<Array<{ id: string; username: string; displayName: string; avatarUrl?: string }>>([]);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [copilotInitialQuery, setCopilotInitialQuery] = useState('');

  const wsRef = useRef<WebSocket | null>(null);
  const activeConvIdRef = useRef<string>(activeConvId);
  activeConvIdRef.current = activeConvId;
  const isSyncingRef = useRef<boolean>(false);
  const prevTotalUnreadRef = useRef<number>(0);

  // Load conversations (DO NOT auto-select the first chat on login)
  const loadConversations = useCallback(async () => {
    if (!currentUser) return;
    try {
      const convs = await ApiClient.getConversations();
      setConversations(convs);
      const totalUnread = convs.reduce((s, c) => s + (c.unreadCount || 0), 0);
      prevTotalUnreadRef.current = totalUnread;
    } catch (e) {
      console.error('Failed to load conversations:', e);
    }
  }, [currentUser]);

  // Load messages for active conversation
  const loadActiveMessages = useCallback(async (convId: string) => {
    if (!currentUser || !convId) return;
    try {
      const msgs = await ApiClient.getMessages(convId);
      setMessagesMap((prev) => ({
        ...prev,
        [convId]: msgs,
      }));
    } catch (e) {
      console.error('Failed to load messages:', e);
    }
  }, [currentUser]);

  // Initial load on authentication & request notification permissions
  useEffect(() => {
    if (currentUser) {
      loadConversations();
      requestNotificationPermission();
    }
  }, [currentUser, loadConversations]);

  // Load messages when conversation switches
  useEffect(() => {
    if (currentUser && activeConvId) {
      loadActiveMessages(activeConvId);
    }
  }, [currentUser, activeConvId, loadActiveMessages]);

  // Optimized Background Auto-Sync (Prevents backloops & overlapping requests)
  useEffect(() => {
    if (!currentUser) return;

    const interval = setInterval(async () => {
      if (isSyncingRef.current) return;
      isSyncingRef.current = true;

      try {
        const currentActiveId = activeConvIdRef.current;
        if (currentActiveId) {
          const latestMsgs = await ApiClient.getMessages(currentActiveId);
          setMessagesMap((prev) => {
            const currentMsgs = prev[currentActiveId] || [];
            if (latestMsgs.length !== currentMsgs.length || JSON.stringify(latestMsgs) !== JSON.stringify(currentMsgs)) {
              return { ...prev, [currentActiveId]: latestMsgs };
            }
            return prev;
          });
        }

        const latestConvs = await ApiClient.getConversations();
        const newTotalUnread = latestConvs.reduce((s, c) => s + (c.unreadCount || 0), 0);

        // Chime if new unread messages arrived in background
        if (newTotalUnread > prevTotalUnreadRef.current && prevTotalUnreadRef.current >= 0) {
          playNotificationChime();
        }
        prevTotalUnreadRef.current = newTotalUnread;
        setConversations(latestConvs);
      } catch {
        // Network resilience
      } finally {
        isSyncingRef.current = false;
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [currentUser]);

  // Mobile Software Keyboard Viewport Geometry Management
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const handleResize = () => {
      if (window.visualViewport) {
        document.documentElement.style.setProperty(
          '--app-height',
          `${window.visualViewport.height}px`
        );
      }
    };

    window.visualViewport.addEventListener('resize', handleResize);
    window.visualViewport.addEventListener('scroll', handleResize);
    handleResize();

    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('scroll', handleResize);
    };
  }, []);

  // Real-time Single WebSocket Connection with Audio & Native Notifications
  useEffect(() => {
    if (!currentUser) return;

    const token = ApiClient.getToken();
    const device = ApiClient.getDevice();
    const wsBase = (import.meta.env.VITE_WS_URL as string) || 'ws://localhost:4000';
    const wsUrl = `${wsBase.replace(/\/$/, '')}/ws/v1?token=${token}&deviceId=${device.deviceId}`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.event === 'message:receive') {
            const raw = payload.data;
            const messageObj = raw?.message || raw;
            const convId = raw?.conversationId || messageObj?.conversationId;
            const senderId = messageObj?.senderId;
            const senderName = messageObj?.sender?.displayName || messageObj?.sender?.username || 'Encrypted Message';

            let previewText = '';
            if (messageObj?.encryptedPayload) {
              try {
                const parsed = JSON.parse(messageObj.encryptedPayload);
                previewText = parsed.plaintext || messageObj.encryptedPayload;
              } catch {
                previewText = messageObj.encryptedPayload;
              }
            }

            // Incoming message from another user -> Play chime and trigger notification
            if (senderId && senderId !== currentUser.id) {
              playNotificationChime();
              triggerSystemNotification(senderName, previewText.slice(0, 80) || 'New message received');
            }

            if (convId === activeConvIdRef.current) {
              loadActiveMessages(activeConvIdRef.current);
            }
            loadConversations();
          }
        } catch {}
      };

      return () => {
        ws.close();
      };
    } catch {}
  }, [currentUser, loadActiveMessages, loadConversations]);

  // Zero-Lag Immediate Optimistic Message Response
  const handleSendMessage = async (text: string, _analysis: SecurityAnalysis) => {
    if (!activeConvId || !currentUser) return;

    // 1. Optimistic Local Bubble Insertion (0ms responsiveness)
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const currentTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const optimisticMsg: ChatMessage = {
      id: tempId,
      conversationId: activeConvId,
      senderId: currentUser.id,
      senderName: currentUser.displayName || currentUser.username,
      isSelf: true,
      plaintext: text,
      status: 'SENDING', // 🕒 Clock timer spinning in message bubble immediately!
      sentAt: currentTimeStr,
      reactions: [],
      securityAnalysis: _analysis || {
        riskScore: 0,
        indicatorColor: 'GREEN',
        primaryThreat: 'NONE',
        confidence: 1,
        evidenceList: [],
        explanation: 'Zero-trust pre-send scan completed.',
        recommendation: 'Safe to send',
        suggestedActions: [],
      },
    };

    // Immediately render in active conversation stream
    setMessagesMap((prev) => ({
      ...prev,
      [activeConvId]: [...(prev[activeConvId] || []), optimisticMsg],
    }));

    // Immediately update sidebar preview and bring to top
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConvId
          ? {
              ...c,
              lastMessageText: text,
              lastMessageTime: currentTimeStr,
              lastMessageTimestamp: new Date().toISOString(),
              securityState: optimisticMsg.securityAnalysis.indicatorColor,
            }
          : c
      )
    );

    // 2. Transmit to server in background
    try {
      const sent = await ApiClient.sendMessage(activeConvId, text);

      // Replace optimistic message with confirmed server message (Single tick or double tick)
      setMessagesMap((prev) => {
        const list = prev[activeConvId] || [];
        const index = list.findIndex((m) => m.id === tempId);
        if (index !== -1) {
          const updated = [...list];
          updated[index] = {
            ...sent,
            status: sent.status || 'SENT',
          };
          return { ...prev, [activeConvId]: updated };
        }
        return { ...prev, [activeConvId]: [...list, sent] };
      });

      // Background re-sync
      loadActiveMessages(activeConvId);
    } catch (err: any) {
      console.error('Send error:', err);
      // If error occurs, leave as sent or failed
      setMessagesMap((prev) => {
        const list = prev[activeConvId] || [];
        return {
          ...prev,
          [activeConvId]: list.map((m) =>
            m.id === tempId ? { ...m, status: 'SENT' } : m
          ),
        };
      });
    }
  };

  const handleLogout = () => {
    ApiClient.logout();
    setCurrentUser(null);
    setConversations([]);
    setActiveConvId('');
    setMessagesMap({});
    setActiveTab('CHATS');
  };

  const handleTogglePrivacy = () => {
    setConversations((prev) =>
      prev.map((c) => (c.id === activeConvId ? { ...c, isExcluded: !c.isExcluded } : c))
    );
  };

  const handleBlockUser = async (conversationId: string) => {
    try {
      await ApiClient.blockConversation(conversationId);
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, isBlocked: true } : c))
      );
    } catch (e) {
      console.error('Failed to block user:', e);
    }
  };

  const handleUnblockUser = async (conversationId: string) => {
    try {
      await ApiClient.unblockConversation(conversationId);
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, isBlocked: false } : c))
      );
    } catch (e) {
      console.error('Failed to unblock user:', e);
    }
  };

  const handleReportChat = async (conversationId: string) => {
    const msgs = messagesMap[conversationId] || [];
    if (msgs.length > 0) {
      const transcript = msgs.map((m) => `${m.senderName}: ${m.plaintext}`).slice(-8).join(' \n ');
      await ApiClient.reportMessage(transcript, 'THREAT', conversationId, 90, 'USER_REPORTED_CONVERSATION');
    }
  };

  const handleDeleteChat = async (conversationId: string) => {
    await ApiClient.deleteConversation(conversationId);
    setMessagesMap((prev) => {
      const copy = { ...prev };
      delete copy[conversationId];
      return copy;
    });
    setConversations((prev) => prev.filter((c) => c.id !== conversationId));
    if (activeConvId === conversationId) {
      const remaining = conversations.filter((c) => c.id !== conversationId);
      setActiveConvId(remaining.length > 0 ? remaining[0].id : '');
    }
  };

  // Bulk Delete Functionality
  const handleBulkDeleteChats = async (conversationIds: string[]) => {
    for (const id of conversationIds) {
      try {
        await ApiClient.deleteConversation(id);
      } catch (e) {
        console.error(`Failed to delete conversation ${id}:`, e);
      }
    }
    setMessagesMap((prev) => {
      const copy = { ...prev };
      for (const id of conversationIds) {
        delete copy[id];
      }
      return copy;
    });
    setConversations((prev) => {
      const remaining = prev.filter((c) => !conversationIds.includes(c.id));
      if (conversationIds.includes(activeConvId)) {
        setActiveConvId(remaining.length > 0 ? remaining[0].id : '');
      }
      return remaining;
    });
  };

  const handleEditMessage = async (messageId: string, newText: string) => {
    try {
      const updated = await ApiClient.editMessage(messageId, newText);
      setMessagesMap((prev) => {
        const list = prev[activeConvId] || [];
        return {
          ...prev,
          [activeConvId]: list.map((m) =>
            m.id === messageId
              ? {
                  ...m,
                  plaintext: updated.plaintext,
                  isEdited: true,
                  securityAnalysis: updated.securityAnalysis,
                }
              : m
          ),
        };
      });
    } catch (e) {
      console.error('Failed to edit message:', e);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await ApiClient.deleteMessage(messageId);
      setMessagesMap((prev) => {
        const list = prev[activeConvId] || [];
        return {
          ...prev,
          [activeConvId]: list.filter((m) => m.id !== messageId),
        };
      });
    } catch (e) {
      console.error('Failed to delete message:', e);
    }
  };

  const handleOpenCopilotWithQuery = (query: string) => {
    setCopilotInitialQuery(query);
    setIsCopilotOpen(true);
  };

  // Load directory users for group creation
  useEffect(() => {
    if (currentUser) {
      ApiClient.getDirectoryUsers()
        .then((users) => {
          setDirectoryUsers(users.filter((u) => u.id !== currentUser.id));
        })
        .catch(() => {});
    }
  }, [currentUser]);

  // Create encrypted group conversation
  const handleCreateGroup = async (title: string, participantUserIds: string[]) => {
    try {
      const group = await ApiClient.createConversation({
        type: 'GROUP',
        title,
        participantUserIds,
      });
      await loadConversations();
      setActiveConvId(group.id);
      loadActiveMessages(group.id);
    } catch (err) {
      console.error('Failed to create group:', err);
    }
  };

  // Flattened array of all loaded messages across conversations for exposure mapping
  const allMessages = React.useMemo(() => {
    const list: ChatMessage[] = [];
    for (const id of Object.keys(messagesMap)) {
      list.push(...(messagesMap[id] || []));
    }
    return list;
  }, [messagesMap]);

  // If user is not authenticated, display login & registration modal
  if (!currentUser) {
    return (
      <AuthModal
        onSuccess={(u, isNewRegistration) => {
          setCurrentUser(u);
          if (isNewRegistration) {
            setIsOnboardingOpen(true);
          }
        }}
      />
    );
  }

  const currentConv = conversations.find((c) => c.id === activeConvId) || null;
  const currentMessages = activeConvId ? (messagesMap[activeConvId] || []) : [];

  return (
    <div className="app-container">
      {/* Dynamic Aurora Ambient Background */}
      <div className="aurora-glow-1" />
      <div className="aurora-glow-2" />

      {/* Sidebar with Navigation Tabs & Contacts */}
      <Sidebar
        conversations={conversations}
        activeId={activeConvId}
        onSelect={(id) => {
          setActiveConvId(id);
          setActiveTab('CHATS');
          // Optimistically clear unread count for opened conversation
          setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)));
          loadActiveMessages(id);
        }}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab !== 'CHATS') {
            setActiveConvId('');
          }
        }}
        onOpenCopilot={() => setIsCopilotOpen(true)}
        onNewChat={() => setIsNewChatOpen(true)}
        onCreateGroup={() => setIsCreateGroupOpen(true)}
        onLogout={handleLogout}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onBulkDelete={handleBulkDeleteChats}
        currentUsername={currentUser.displayName || currentUser.username}
        userAvatarUrl={currentUser.avatarUrl}
        userRole={currentUser.role}
      />

      {/* Main Viewport Content (Hidden on mobile if viewing conversation list on CHATS tab) */}
      <div className={`main-viewport ${!activeConvId && activeTab === 'CHATS' ? 'main-hidden-mobile' : ''}`}>
        {/* Mobile Header Bar for non-chat tabs */}
        {activeTab !== 'CHATS' && (
          <div
            className="mobile-tab-header"
            style={{
              padding: '12px 16px',
              background: 'var(--bg-secondary)',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              zIndex: 50,
            }}
          >
            <button
              onClick={() => {
                setActiveTab('CHATS');
                setActiveConvId('');
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '7px 14px',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: 700,
              }}
            >
              <ArrowLeft size={16} />
              <span>Back to Chats</span>
            </button>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {activeTab === 'SECURE_BRIDGE' && <><Smartphone size={16} /> WhatsApp Bridge</>}
              {activeTab === 'SECRET_MAP' && <><KeyRound size={16} /> Secret Exposure Map</>}
              {activeTab === 'GUARDIAN' && <><Shield size={16} /> AI Guardian</>}
              {activeTab === 'ADMIN' && <><Crown size={16} style={{ color: '#fbbf24' }} /> Admin Console</>}
            </div>
          </div>
        )}

        {/* 1. CHATS TAB */}
        {activeTab === 'CHATS' && (
          activeConvId ? (
            <ChatArea
              conversation={currentConv!}
              messages={currentMessages}
              onSendMessage={handleSendMessage}
              onInspectSecurity={(msg) => setInspectedMessage(msg)}
              onTogglePrivacy={handleTogglePrivacy}
              onOpenTopicModal={() => setIsTopicModalOpen(true)}
              onOpenCopilot={() => setIsCopilotOpen(true)}
              onBlockUser={handleBlockUser}
              onUnblockUser={handleUnblockUser}
              onReportChat={handleReportChat}
              onDeleteChat={handleDeleteChat}
              onEditMessage={handleEditMessage}
              onDeleteMessage={handleDeleteMessage}
              onBack={() => setActiveConvId('')}
            />
          ) : (
            // Desktop Welcome Hub when no conversation is selected
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px', textAlign: 'center', background: 'var(--bg-primary)' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(16, 185, 129, 0.2))', border: '1px solid rgba(6, 182, 212, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-cyan)', marginBottom: '18px', boxShadow: '0 0 30px rgba(6, 182, 212, 0.25)' }}>
                <ShieldCheck size={36} />
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
                SecureChat Zero-Trust Network
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '420px', lineHeight: 1.6, margin: '0 0 24px' }}>
                Select an existing conversation on the left, or start a new encrypted zero-trust chat with real-time AI security.
              </p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                  onClick={() => setIsNewChatOpen(true)}
                  className="btn-primary"
                  style={{ padding: '10px 20px', fontSize: '13px' }}
                >
                  <Plus size={16} /> Start New Chat
                </button>
                <button
                  onClick={() => setIsCreateGroupOpen(true)}
                  className="btn-secondary"
                  style={{ padding: '10px 18px', fontSize: '13px', border: '1px solid rgba(6, 182, 212, 0.4)', color: 'var(--accent-cyan)' }}
                >
                  <Plus size={16} /> Create Group
                </button>
                <button
                  onClick={() => setActiveTab('SECURE_BRIDGE')}
                  className="btn-ghost"
                  style={{ padding: '10px 18px', fontSize: '13px' }}
                >
                  <Smartphone size={16} style={{ color: 'var(--accent-cyan)', marginRight: '6px' }} />
                  SecureBridge (WhatsApp)
                </button>
                <button
                  onClick={() => setActiveTab('GUARDIAN')}
                  className="btn-ghost"
                  style={{ padding: '10px 18px', fontSize: '13px' }}
                >
                  <Shield size={16} style={{ color: 'var(--green-safe)', marginRight: '6px' }} />
                  AI Guardian
                </button>
              </div>
            </div>
          )
        )}

        {/* 2. PRODUCT B: SECURE BRIDGE COMPANION TAB */}
        {activeTab === 'SECURE_BRIDGE' && (
          <SecureBridgeView />
        )}

        {/* 3. SECRET & CREDENTIAL EXPOSURE MAP TAB */}
        {activeTab === 'SECRET_MAP' && (
          <SecretExposureMapView
            messages={allMessages}
            conversationTitle={currentConv?.title}
          />
        )}

        {/* 4. AI GUARDIAN TAB */}
        {activeTab === 'GUARDIAN' && (
          <GuardianPanel
            conversations={conversations}
            messagesMap={messagesMap}
            activeConvId={activeConvId}
            onSelectConversation={(id) => {
              setActiveConvId(id);
              loadActiveMessages(id);
            }}
          />
        )}

        {/* 5. COMBINED SUPERADMIN CONSOLE TAB (ADMIN ONLY) */}
        {activeTab === 'ADMIN' && currentUser.role === 'ADMIN' && (
          <AdminConsole />
        )}
      </div>

      {/* Global Modals & Drawers rendered at root level */}
      {isOnboardingOpen && currentUser && (
        <ProfileOnboardingModal
          user={currentUser}
          onClose={() => setIsOnboardingOpen(false)}
          onComplete={(updated) => {
            setCurrentUser(updated);
            loadConversations();
            setIsOnboardingOpen(false);
          }}
        />
      )}

      {/* User Profile Controls & Avatar Management Modal */}
      {isProfileModalOpen && currentUser && (
        <ProfileModal
          user={currentUser}
          onClose={() => setIsProfileModalOpen(false)}
          onUpdate={(updated) => {
            setCurrentUser(updated);
            loadConversations();
          }}
        />
      )}

      {/* Inspectable Evidence Modal */}
      {inspectedMessage && (
        <EvidenceModal
          message={inspectedMessage}
          onClose={() => setInspectedMessage(null)}
          onAskCopilot={handleOpenCopilotWithQuery}
          userRole={currentUser.role}
        />
      )}

      {/* Conversation Topic & Risk Analysis Modal */}
      <ConversationTopicModal
        isOpen={isTopicModalOpen}
        onClose={() => setIsTopicModalOpen(false)}
        conversationId={activeConvId}
        conversationName={currentConv?.title || 'Active Conversation'}
        onOpenCopilotWithQuery={handleOpenCopilotWithQuery}
      />

      {/* Security Copilot Assistant Drawer */}
      <CopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => {
          setIsCopilotOpen(false);
          setCopilotInitialQuery('');
        }}
        initialQuery={copilotInitialQuery}
        conversationId={activeConvId}
      />

      {/* New Direct Chat Modal */}
      {isNewChatOpen && (
        <NewChatModal
          onClose={() => setIsNewChatOpen(false)}
          onCreated={(newConv) => {
            loadConversations();
            setActiveConvId(newConv.id);
            loadActiveMessages(newConv.id);
          }}
        />
      )}

      {/* Encrypted Group Creation Modal */}
      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        contacts={directoryUsers}
        onClose={() => setIsCreateGroupOpen(false)}
        onCreateGroup={handleCreateGroup}
      />
    </div>
  );
};
