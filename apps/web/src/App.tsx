import React, { useState, useEffect, useRef } from 'react';
import { ConversationItem, ChatMessage, SecurityAnalysis, UserProfile } from './types';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { GuardianPanel } from './components/GuardianPanel';
import { SecurityCenter } from './components/SecurityCenter';
import { EvidenceModal } from './components/EvidenceModal';
import { CopilotDrawer } from './components/CopilotDrawer';
import { AuthModal } from './components/AuthModal';
import { NewChatModal } from './components/NewChatModal';
import { AdminConsole } from './components/AdminConsole';
import { ApiClient } from './api/client';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(ApiClient.getCurrentUser());
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConvId, setActiveConvId] = useState<string>('');
  const [messagesMap, setMessagesMap] = useState<Record<string, ChatMessage[]>>({});
  const [activeTab, setActiveTab] = useState<'CHATS' | 'GUARDIAN' | 'SECOPS' | 'ADMIN'>('CHATS');
  const [inspectedMessage, setInspectedMessage] = useState<ChatMessage | null>(null);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [copilotInitialQuery, setCopilotInitialQuery] = useState('');
  const wsRef = useRef<WebSocket | null>(null);

  // Load conversations from SQLite
  const loadConversations = async () => {
    if (!currentUser) return;
    const convs = await ApiClient.getConversations();
    setConversations(convs);
    if (convs.length > 0 && !activeConvId) {
      setActiveConvId(convs[0].id);
    }
  };

  // Load messages for active conversation
  const loadActiveMessages = async (convId: string) => {
    if (!currentUser || !convId) return;
    const msgs = await ApiClient.getMessages(convId);
    setMessagesMap((prev) => ({
      ...prev,
      [convId]: msgs,
    }));
  };

  useEffect(() => {
    if (currentUser) {
      loadConversations();
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser && activeConvId) {
      loadActiveMessages(activeConvId);
    }
  }, [currentUser, activeConvId]);

  // Real-Time Background Auto-Sync (Every 1.5 seconds so messages arrive automatically without refresh)
  useEffect(() => {
    if (!currentUser) return;

    const interval = setInterval(() => {
      if (activeConvId) {
        ApiClient.getMessages(activeConvId).then((latestMsgs) => {
          setMessagesMap((prev) => {
            const currentMsgs = prev[activeConvId] || [];
            if (latestMsgs.length !== currentMsgs.length || JSON.stringify(latestMsgs) !== JSON.stringify(currentMsgs)) {
              return { ...prev, [activeConvId]: latestMsgs };
            }
            return prev;
          });
        });
      }
      ApiClient.getConversations().then(setConversations);
    }, 1500);

    return () => clearInterval(interval);
  }, [currentUser, activeConvId]);

  // Real-time WebSocket connection
  useEffect(() => {
    if (!currentUser) return;

    const token = ApiClient.getToken();
    const device = ApiClient.getDevice();
    const wsUrl = `ws://localhost:4000/ws/v1?token=${token}&deviceId=${device.deviceId}`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.event === 'message:receive') {
            const raw = payload.data;
            if (raw.conversationId === activeConvId) {
              loadActiveMessages(activeConvId);
            }
            loadConversations();
          }
        } catch {}
      };

      return () => {
        ws.close();
      };
    } catch {}
  }, [currentUser, activeConvId]);

  const handleSendMessage = async (text: string, _analysis: SecurityAnalysis) => {
    if (!activeConvId) return;

    try {
      const sent = await ApiClient.sendMessage(activeConvId, text);

      setMessagesMap((prev) => ({
        ...prev,
        [activeConvId]: [...(prev[activeConvId] || []), sent],
      }));

      // Update sidebar preview
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConvId
            ? {
                ...c,
                lastMessageText: text,
                lastMessageTime: sent.sentAt,
                securityState: sent.securityAnalysis.indicatorColor,
              }
            : c
        )
      );

      // Re-sync conversation messages
      loadActiveMessages(activeConvId);
    } catch (err: any) {
      console.error('Send error:', err);
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

  const handleOpenCopilotWithQuery = (query: string) => {
    setCopilotInitialQuery(query);
    setIsCopilotOpen(true);
  };

  // If user is not authenticated, display login & registration modal
  if (!currentUser) {
    return <AuthModal onSuccess={(u) => setCurrentUser(u)} />;
  }

  const currentConv = conversations.find((c) => c.id === activeConvId) || {
    id: activeConvId || 'default',
    title: 'Select or Start a Conversation',
    type: 'DIRECT',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    unreadCount: 0,
    lastMessageText: '',
    lastMessageTime: '',
    securityState: 'GREEN',
    isExcluded: false,
  };
  const currentMessages = messagesMap[activeConvId] || [];

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: 'var(--bg-primary)' }}>
      {/* Left Sidebar */}
      <Sidebar
        conversations={conversations}
        activeId={activeConvId}
        onSelect={(id) => {
          setActiveConvId(id);
          loadActiveMessages(id);
        }}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        onOpenCopilot={() => setIsCopilotOpen(true)}
        onNewChat={() => setIsNewChatOpen(true)}
        onLogout={handleLogout}
        currentUsername={currentUser.displayName || currentUser.username}
        userRole={currentUser.role}
      />

      {/* Main Viewport Content */}
      <div style={{ flex: 1, display: 'flex', position: 'relative' }}>
        {activeTab === 'CHATS' && (
          <ChatArea
            conversation={currentConv}
            messages={currentMessages}
            onSendMessage={handleSendMessage}
            onInspectSecurity={(msg) => setInspectedMessage(msg)}
            onTogglePrivacy={handleTogglePrivacy}
          />
        )}

        {activeTab === 'GUARDIAN' && (
          <GuardianPanel
            conversation={currentConv}
            messages={currentMessages}
          />
        )}

        {activeTab === 'SECOPS' && (
          <SecurityCenter />
        )}

        {activeTab === 'ADMIN' && currentUser.role === 'ADMIN' && (
          <AdminConsole />
        )}

        {/* Inspectable Evidence Modal */}
        {inspectedMessage && (
          <EvidenceModal
            message={inspectedMessage}
            onClose={() => setInspectedMessage(null)}
            onAskCopilot={handleOpenCopilotWithQuery}
          />
        )}

        {/* Security Copilot Assistant Drawer */}
        <CopilotDrawer
          isOpen={isCopilotOpen}
          onClose={() => setIsCopilotOpen(false)}
          initialQuery={copilotInitialQuery}
        />

        {/* New Chat Modal */}
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
      </div>
    </div>
  );
};
