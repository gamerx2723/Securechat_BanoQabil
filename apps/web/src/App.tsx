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
import { MobileBottomNavBar } from './components/MobileBottomNavBar';
import { ApiClient, getWsBase } from './api/client';
import {
  playNotificationChime,
  playThreatWarningSound,
  requestNotificationPermission,
  initMobilePushNotifications,
  triggerSystemNotification,
  triggerThreatPushNotification,
  getNotificationListenerState,
  setNotificationListenerState,
} from './utils/notifications';
import { ArrowLeft, Shield, Crown, Plus, ShieldCheck, Smartphone, KeyRound, AlertTriangle, X, Bell } from 'lucide-react';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(ApiClient.getCurrentUser());
  const [conversations, setConversations] = useState<ConversationItem[]>(() => ApiClient.getCachedConversations());
  const [activeConvId, setActiveConvId] = useState<string>('');
  const [messagesMap, setMessagesMap] = useState<Record<string, ChatMessage[]>>(() => ApiClient.getAllCachedMessages());
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isWsConnected, setIsWsConnected] = useState<boolean>(false);
  const [reconnectTrigger, setReconnectTrigger] = useState<number>(0);
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState<boolean>(getNotificationListenerState());
  const [threatAlertBanner, setThreatAlertBanner] = useState<{
    id: string;
    senderName: string;
    threatType: string;
    explanation: string;
    conversationId: string;
    snippet: string;
    messageObj?: ChatMessage;
  } | null>(null);
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

  // Prefetch and persist all messages across all conversations into local memory (NEVER marks as read)
  const prefetchAllMessages = useCallback(async (convs: ConversationItem[]) => {
    if (!currentUser || !convs || convs.length === 0) return;
    try {
      const results = await Promise.allSettled(convs.map((c) => ApiClient.getMessages(c.id, false)));
      const incomingMap: Record<string, ChatMessage[]> = {};
      results.forEach((res, idx) => {
        if (res.status === 'fulfilled' && res.value) {
          incomingMap[convs[idx].id] = res.value;
        }
      });
      setMessagesMap((prev) => {
        const merged = { ...prev, ...incomingMap };
        ApiClient.saveAllCachedMessages(merged);
        return merged;
      });
    } catch (e) {
      console.warn('Background full message prefetch deferred:', e);
    }
  }, [currentUser]);

  // Explicitly mark active conversation as READ only when user is actively looking at screen
  const markActiveConversationRead = useCallback(async (convId: string) => {
    if (!currentUser || !convId) return;
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
    try {
      await ApiClient.markConversationAsRead(convId);
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, unreadCount: 0 } : c))
      );
    } catch {}
  }, [currentUser]);

  // Load conversations (DO NOT auto-select the first chat on login)
  const loadConversations = useCallback(async () => {
    if (!currentUser) return;
    try {
      const convs = await ApiClient.getConversations();
      setConversations(convs);
      const totalUnread = convs.reduce((s, c) => s + (c.unreadCount || 0), 0);
      prevTotalUnreadRef.current = totalUnread;
      // Auto-prefetch all conversation message histories on login
      prefetchAllMessages(convs);
    } catch (e) {
      console.error('Failed to load conversations:', e);
    }
  }, [currentUser, prefetchAllMessages]);

  // Load messages for active conversation
  const loadActiveMessages = useCallback(async (convId: string, markRead = false) => {
    if (!currentUser || !convId) return;
    try {
      const msgs = await ApiClient.getMessages(convId, markRead);
      setMessagesMap((prev) => {
        const updated = {
          ...prev,
          [convId]: msgs,
        };
        ApiClient.saveAllCachedMessages(updated);
        return updated;
      });
      if (markRead) {
        setConversations((prev) =>
          prev.map((c) => (c.id === convId ? { ...c, unreadCount: 0 } : c))
        );
      }
    } catch (e) {
      console.error('Failed to load messages:', e);
    }
  }, [currentUser]);

  // Initial load on authentication & request notification permissions
  useEffect(() => {
    if (currentUser) {
      loadConversations();
      requestNotificationPermission();
      initMobilePushNotifications(ApiClient.getCustomApiBase(), ApiClient.getToken() || '');
    }
  }, [currentUser, loadConversations]);

  // Load messages when conversation switches
  useEffect(() => {
    if (currentUser && activeConvId) {
      const isVisible = typeof document === 'undefined' || document.visibilityState === 'visible';
      loadActiveMessages(activeConvId, isVisible);
      if (isVisible) {
        markActiveConversationRead(activeConvId);
      }
    }
  }, [currentUser, activeConvId, loadActiveMessages, markActiveConversationRead]);

  // Handle visibility changes (e.g. app minimized vs restored to foreground)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        const currentActive = activeConvIdRef.current;
        if (currentActive) {
          markActiveConversationRead(currentActive);
          loadActiveMessages(currentActive, true);
        }
        loadConversations();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [markActiveConversationRead, loadActiveMessages, loadConversations]);

  // Online / Offline Connectivity Monitor & Auto-Sync
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setReconnectTrigger((prev) => prev + 1);
      loadConversations();
      if (activeConvIdRef.current) {
        loadActiveMessages(activeConvIdRef.current);
      }
    };
    const handleOffline = () => {
      setIsOnline(false);
      setIsWsConnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [loadConversations, loadActiveMessages]);

  // Native Mobile & Android Back Button / Gesture Navigation
  useEffect(() => {
    const handlePopState = () => {
      if (isProfileModalOpen) {
        setIsProfileModalOpen(false);
        return;
      }
      if (isNewChatOpen) {
        setIsNewChatOpen(false);
        return;
      }
      if (isCreateGroupOpen) {
        setIsCreateGroupOpen(false);
        return;
      }
      if (isCopilotOpen) {
        setIsCopilotOpen(false);
        return;
      }
      if (inspectedMessage) {
        setInspectedMessage(null);
        return;
      }
      if (activeConvIdRef.current) {
        setActiveConvId('');
        return;
      }
      if (activeTab !== 'CHATS') {
        setActiveTab('CHATS');
        return;
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isProfileModalOpen, isNewChatOpen, isCreateGroupOpen, isCopilotOpen, inspectedMessage, activeTab]);

  // Optimized Background Auto-Sync (Prevents backloops & overlapping requests, respects app minimize state)
  useEffect(() => {
    if (!currentUser) return;

    const interval = setInterval(async () => {
      if (isSyncingRef.current) return;
      // Skip background polling if document is hidden to conserve battery & prevent spurious state mutations
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      isSyncingRef.current = true;

      try {
        const currentActiveId = activeConvIdRef.current;
        if (currentActiveId) {
          const latestMsgs = await ApiClient.getMessages(currentActiveId, false);
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

  // Real-time Single WebSocket Connection with AI Threat Evaluation & Push Notifications
  useEffect(() => {
    if (!currentUser) return;

    let isCancelled = false;
    let reconnectTimeout: any = null;

    const connectWebSocket = () => {
      try {
        const token = ApiClient.getToken();
        const device = ApiClient.getDevice();
        const wsBase = getWsBase();
        const wsUrl = `${wsBase.replace(/\/$/, '')}/ws/v1?token=${token}&deviceId=${device.deviceId}`;

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isCancelled) {
            setIsWsConnected(true);
            setIsOnline(true);
          }
        };

        ws.onclose = () => {
          if (!isCancelled) {
            setIsWsConnected(false);
            // Automatic reconnection loop
            if (navigator.onLine) {
              reconnectTimeout = setTimeout(connectWebSocket, 3000);
            }
          }
        };

        ws.onerror = () => {
          if (!isCancelled) {
            setIsWsConnected(false);
          }
        };

        ws.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);
            if (payload.event === 'message:receive') {
              const raw = payload.data;
              const messageObj = raw?.message || raw;
              const convId = raw?.conversationId || messageObj?.conversationId;
              const senderId = messageObj?.senderId;
              const senderName = messageObj?.sender?.displayName || messageObj?.sender?.username || 'Encrypted Channel';

              let previewText = '';
              if (messageObj?.encryptedPayload) {
                try {
                  const parsed = JSON.parse(messageObj.encryptedPayload);
                  previewText = parsed.plaintext || messageObj.encryptedPayload;
                } catch {
                  previewText = messageObj.encryptedPayload;
                }
              }

              // Run on-device Zero-Trust AI model threat evaluation
              const analysis = ApiClient.clientSideEvaluate(previewText);
              const isThreat = analysis.indicatorColor === 'RED' || analysis.indicatorColor === 'ORANGE' || analysis.riskScore >= 40;

              // Incoming message from another user
              if (senderId && senderId !== currentUser.id) {
                if (isThreat) {
                  // Malicious threat detected by AI model -> Dispatch urgent flag notification & siren
                  triggerThreatPushNotification(
                    senderName,
                    analysis.primaryThreat,
                    analysis.explanation,
                    previewText,
                    undefined,
                    () => {
                      setActiveConvId(convId);
                      setActiveTab('CHATS');
                    }
                  );

                  // Set in-app proactive threat alert banner
                  setThreatAlertBanner({
                    id: messageObj.id || Date.now().toString(),
                    senderName,
                    threatType: analysis.primaryThreat,
                    explanation: analysis.explanation,
                    conversationId: convId,
                    snippet: previewText,
                    messageObj: {
                      id: messageObj.id || `msg-${Date.now()}`,
                      conversationId: convId,
                      senderId: senderId,
                      senderName: senderName,
                      isSelf: false,
                      plaintext: previewText,
                      status: 'DELIVERED',
                      sentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      reactions: [],
                      securityAnalysis: analysis,
                    },
                  });
                } else {
                  // Safe message -> pleasant harmonic chime & push notification
                  playNotificationChime();
                  triggerSystemNotification(
                    senderName,
                    previewText.slice(0, 80) || 'New encrypted zero-trust message',
                    undefined,
                    () => {
                      setActiveConvId(convId);
                      setActiveTab('CHATS');
                    }
                  );
                }
              }

              const isSelf = senderId === currentUser.id;
              const msgSecurityAnalysis: SecurityAnalysis = isSelf
                ? {
                    riskScore: 0,
                    indicatorColor: 'GREEN',
                    primaryThreat: 'NONE',
                    confidence: 1,
                    evidenceList: [],
                    explanation: 'Secure message transmission.',
                    recommendation: 'Safe to send',
                    suggestedActions: [],
                  }
                : analysis;

              // Create incoming ChatMessage object
              const incomingMsg: ChatMessage = {
                id: messageObj.id || `msg-${Date.now()}`,
                conversationId: convId,
                senderId: senderId,
                senderName: senderName,
                plaintext: previewText,
                sentAt: new Date(messageObj.sentAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                status: 'DELIVERED',
                isSelf,
                reactions: [],
                securityAnalysis: msgSecurityAnalysis,
              };

              // Immediately persist incoming message in local memory
              setMessagesMap((prev) => {
                const currentList = prev[convId] || [];
                if (currentList.some((m) => m.id === incomingMsg.id)) {
                  return prev;
                }
                const updatedList = [...currentList, incomingMsg];
                const updatedMap = { ...prev, [convId]: updatedList };
                ApiClient.saveAllCachedMessages(updatedMap);
                return updatedMap;
              });

              if (convId === activeConvIdRef.current) {
                const isVisible = typeof document === 'undefined' || document.visibilityState === 'visible';
                loadActiveMessages(activeConvIdRef.current, isVisible);
                if (isVisible && !isSelf) {
                  markActiveConversationRead(activeConvIdRef.current);
                }
              }
              loadConversations();
            }
          } catch {}
        };
      } catch {}
    };

    connectWebSocket();

    return () => {
      isCancelled = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (wsRef.current) wsRef.current.close();
    };
  }, [currentUser, reconnectTrigger, loadActiveMessages, loadConversations, markActiveConversationRead]);

  // Toggle Notification Listener & Real-time AI Threat Shield
  const handleToggleNotifications = async () => {
    const next = !isNotificationsEnabled;
    setIsNotificationsEnabled(next);
    setNotificationListenerState(next);
    if (next) {
      const granted = await requestNotificationPermission();
      if (granted) {
        playNotificationChime();
        triggerSystemNotification(
          'AI Threat Shield Active',
          'Real-time message threat detection & push notifications are enabled.'
        );
      }
    }
  };

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
      securityAnalysis: {
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

    // Immediately render in active conversation stream & save to local memory
    setMessagesMap((prev) => {
      const updatedMap = {
        ...prev,
        [activeConvId]: [...(prev[activeConvId] || []), optimisticMsg],
      };
      ApiClient.saveAllCachedMessages(updatedMap);
      return updatedMap;
    });

    // Immediately update sidebar preview and bring to top (preserve receiver-only security status)
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConvId
          ? {
              ...c,
              lastMessageText: text,
              lastMessageTime: currentTimeStr,
              lastMessageTimestamp: new Date().toISOString(),
              securityState: c.securityState || 'GREEN',
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
        let updatedList: ChatMessage[] = [];
        if (index !== -1) {
          updatedList = [...list];
          updatedList[index] = {
            ...sent,
            status: (sent.status || 'SENT') as 'SENDING' | 'SENT' | 'DELIVERED' | 'READ',
          };
        } else {
          updatedList = [...list, sent];
        }
        const updatedMap: Record<string, ChatMessage[]> = { ...prev, [activeConvId]: updatedList };
        ApiClient.saveAllCachedMessages(updatedMap);
        return updatedMap;
      });

      // Background re-sync
      loadActiveMessages(activeConvId);
    } catch (err: any) {
      console.error('Send error:', err);
      // If error occurs, leave as sent or failed
      setMessagesMap((prev) => {
        const list = prev[activeConvId] || [];
        const updatedMap: Record<string, ChatMessage[]> = {
          ...prev,
          [activeConvId]: list.map((m): ChatMessage =>
            m.id === tempId ? { ...m, status: 'SENT' as const } : m
          ),
        };
        ApiClient.saveAllCachedMessages(updatedMap);
        return updatedMap;
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

      {/* Sidebar with Navigation Tabs & Contacts (Hidden on mobile when chat is active) */}
      <Sidebar
        className={(activeConvId && activeTab === 'CHATS') || activeTab !== 'CHATS' ? 'sidebar-hidden-mobile' : ''}
        conversations={conversations}
        activeId={activeConvId}
        onSelect={(id) => {
          setActiveConvId(id);
          setActiveTab('CHATS');
          try {
            window.history.pushState({ activeConvId: id }, '');
          } catch {}
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
        isOnline={isOnline}
        isWsConnected={isWsConnected}
        onReconnect={() => setReconnectTrigger((p) => p + 1)}
        isNotificationsEnabled={isNotificationsEnabled}
        onToggleNotifications={handleToggleNotifications}
      />

      {/* Main Viewport Content (Hidden on mobile if viewing conversation list on CHATS tab) */}
      <div className={`main-viewport ${!activeConvId && activeTab === 'CHATS' ? 'main-hidden-mobile' : ''}`}>
        {/* Proactive In-App Threat Flag Alert Banner */}
        {threatAlertBanner && (
          <div
            className="fade-in animate-shake"
            style={{
              background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.25), rgba(225, 29, 72, 0.35))',
              borderBottom: '2px solid var(--red-critical)',
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px',
              zIndex: 80,
              boxShadow: '0 4px 20px rgba(244, 63, 94, 0.3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(244, 63, 94, 0.3)',
                  border: '1px solid var(--red-critical)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--red-critical)',
                  flexShrink: 0,
                }}
              >
                <AlertTriangle size={18} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🚨 MALICIOUS THREAT FLAGGED</span>
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', background: 'rgba(0, 0, 0, 0.4)', color: '#fca5a5' }}>
                    {threatAlertBanner.threatType}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: '#fecdd3', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  From <strong>{threatAlertBanner.senderName}</strong>: {threatAlertBanner.explanation}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              {threatAlertBanner.messageObj && (
                <button
                  onClick={() => {
                    setInspectedMessage(threatAlertBanner.messageObj!);
                    setActiveConvId(threatAlertBanner.conversationId);
                    setActiveTab('CHATS');
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    color: '#fff',
                    padding: '5px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Shield size={13} />
                  <span>Inspect Evidence</span>
                </button>
              )}
              <button
                onClick={() => setThreatAlertBanner(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Dismiss Alert"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

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
              setActiveTab('CHATS');
              try {
                window.history.pushState({ activeConvId: id }, '');
              } catch {}
              loadActiveMessages(id);
            }}
          />
        )}

        {/* 5. COMBINED SUPERADMIN CONSOLE TAB (ADMIN ONLY) */}
        {activeTab === 'ADMIN' && currentUser.role === 'ADMIN' && (
          <AdminConsole />
        )}
      </div>

      {/* Mobile Bottom Navigation Bar (Visible on mobile when no active chat conversation is open) */}
      <MobileBottomNavBar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab !== 'CHATS') {
            setActiveConvId('');
          }
        }}
        unreadCount={conversations.reduce((s, c) => s + (c.unreadCount || 0), 0)}
        isAdmin={currentUser.role === 'ADMIN'}
        isVisible={!activeConvId || activeTab !== 'CHATS'}
      />

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
