export type SecurityIndicatorColor = 'GREEN' | 'ORANGE' | 'RED';

export interface ThreatEvidence {
  category: string;
  signal: string;
  confidence: number;
  detectionBasis: string;
  description: string;
}

export interface SecurityAnalysis {
  riskScore: number;
  indicatorColor: SecurityIndicatorColor;
  primaryThreat: string;
  confidence: number;
  evidenceList: ThreatEvidence[];
  explanation: string;
  recommendation: string;
  suggestedActions: string[];
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  isSelf: boolean;
  plaintext: string;
  isEdited?: boolean;
  status: 'SENT' | 'DELIVERED' | 'READ';
  sentAt: string;
  reactions: Array<{ emoji: string; count: number }>;
  securityAnalysis: SecurityAnalysis;
}

export interface ConversationItem {
  id: string;
  title: string;
  type: 'DIRECT' | 'GROUP';
  avatar: string;
  unreadCount: number;
  lastMessageText: string;
  lastMessageTime: string;
  securityState: SecurityIndicatorColor;
  isExcluded: boolean;
}

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  role: string;
  status: string;
}
