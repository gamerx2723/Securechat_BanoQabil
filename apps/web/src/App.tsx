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
import { ApiClient } from './api/client';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(ApiClient.getCurrentUser());
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConvId, setActiveConvId] = useState<string>('');
  const [messagesMap, setMessagesMap] = useState<Record<string, ChatMessage[]>>({});
  const [activeTab, setActiveTab] = useState<'CHATS' | 'GUARDIAN' | 'SECOPS'>('CHATS');
  const [inspectedMessage, setInspectedMessage] = useState<ChatMessage | null>(null);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [copilotInitialQuery, setCopilotInitialQuery] = useState('');
  const wsRef = useRef<WebSocket | null>(null);

  // Load conversations whenever authenticated user is active
  const loadConversations = async () => {
    if (!currentUser) return;
    const convs = await ApiClient.getConversations();
    setConversations(convs);
    if (convs.length > 0 && !activeConvId) {
      setActiveConvId(convs[0].id);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadConversations();
    }
  }, [currentUser]);

  // Load messages for active conversation
  useEffect(() => {
    if (!currentUser || !activeConvId) return;

    ApiClient.getMessages(activeConvId).then((msgs) => {
      setMessagesMap((prev) => ({
        ...prev,
        [activeConvId]: msgs,
      }));
    });
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
            let text = '';
            try {
              const parsed = JSON.parse(raw.encryptedPayload);
              text = parsed.plaintext || raw.encryptedPayload;
            } catch {
              text = raw.encryptedPayload;
            }

            const secEvent = raw.securityEvents?.[0];
            const incomingMsg: ChatMessage = {
              id: raw.id,
              conversationId: raw.conversationId,
              senderId: raw.senderId,
              senderName: raw.sender?.displayName || raw.sender?.username || 'Contact',
              plaintext: text,
              sentAt: new Date(raw.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              status: raw.status || 'DELIVERED',
              isSelf: raw.senderId === currentUser.id,
              reactions: raw.reactions || [],
              securityAnalysis: {
                riskScore: secEvent?.riskScore || 0,
                indicatorColor: secEvent?.indicatorColor || 'GREEN',
                primaryThreat: secEvent?.type || 'SAFE',
                confidence: secEvent?.confidence ? Math.round(secEvent.confidence * 100) : 95,
                evidenceList: [],
                explanation: secEvent?.explanation || 'Clean message envelope.',
                recommendation: secEvent?.recommendation || 'Safe.',
                suggestedActions: secEvent?.recommendation ? [secEvent.recommendation] : [],
              },
            };

            setMessagesMap((prev) => ({
              ...prev,
              [raw.conversationId]: [...(prev[raw.conversationId] || []), incomingMsg],
            }));

            loadConversations();
          }
        } catch {}
      };

      return () => {
        ws.close();
      };
    } catch {}
  }, [currentUser]);

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
        onSelect={(id) => setActiveConvId(id)}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        onOpenCopilot={() => setIsCopilotOpen(true)}
        onNewChat={() => setIsNewChatOpen(true)}
        onLogout={handleLogout}
        currentUsername={currentUser.displayName || currentUser.username}
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
            }}
          />
        )}
      </div>
    </div>
  );
};
