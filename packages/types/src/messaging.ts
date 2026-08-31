export type ConversationType = 'DIRECT' | 'GROUP';

export type MemberRole = 'ADMIN' | 'MEMBER';

export type MessageStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';

export type AttachmentType = 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | 'LOCATION';

export interface AttachmentMetadata {
  id: string;
  type: AttachmentType;
  fileName: string;
  fileSize: number;
  mimeType: string;
  encryptedUrl: string;
  thumbnailUrl?: string;
  sha256Checksum: string;
}

export interface MessageReactionDTO {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  createdAt: string;
}

export interface MessageDTO {
  id: string;
  conversationId: string;
  senderId: string;
  senderDeviceId: string;
  encryptedPayload: string; // Serialized EncryptedMessagePayload JSON string
  attachments: AttachmentMetadata[];
  reactions: MessageReactionDTO[];
  replyToMessageId?: string;
  status: MessageStatus;
  isEdited: boolean;
  isDeleted: boolean;
  disappearsInSeconds?: number;
  sentAt: string;
  deliveredAt?: string;
  readAt?: string;
}

export interface ConversationSummary {
  id: string;
  type: ConversationType;
  title?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
  isExcludedFromAi: boolean;
  unreadCount: number;
  lastMessage?: MessageDTO;
  members: Array<{
    userId: string;
    role: MemberRole;
    displayName: string;
    username: string;
    avatarUrl?: string;
  }>;
}
