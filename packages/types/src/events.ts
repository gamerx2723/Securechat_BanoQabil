import { MessageDTO } from './messaging.js';
import { SecurityAnalysisResult } from './security.js';

export type WebSocketClientEvent =
  | 'message:send'
  | 'message:ack'
  | 'typing:start'
  | 'typing:stop'
  | 'security:feedback';

export type WebSocketServerEvent =
  | 'message:receive'
  | 'message:status'
  | 'typing:update'
  | 'security:alert'
  | 'device:revoked';

export interface WsMessageSendPayload {
  conversationId: string;
  recipientUserId: string;
  recipientDeviceId: string;
  encryptedEnvelope: string; // JSON serialized EncryptedMessagePayload
  replyToId?: string;
  disappearsInSeconds?: number;
}

export interface WsMessageReceivePayload {
  message: MessageDTO;
}

export interface WsSecurityAlertPayload {
  conversationId: string;
  messageId: string;
  analysis: SecurityAnalysisResult;
}
