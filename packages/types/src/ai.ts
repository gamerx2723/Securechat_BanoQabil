import { SecurityAnalysisResult, SecurityIndicatorColor } from './security.js';

export type AIMode = 'GUARDIAN' | 'BALANCED' | 'PRIVACY' | 'PERFORMANCE' | 'CUSTOM';

export interface AIContextState {
  conversationId: string;
  userId: string;
  contextVersion: number;
  currentRiskScore: number;
  currentIndicatorColor: SecurityIndicatorColor;
  summary: string;
  observations: string[];
  lastEvaluatedAt: string;
}

export interface RiskTimelineNode {
  timestamp: string;
  messageId: string;
  senderName: string;
  riskScore: number;
  indicatorColor: SecurityIndicatorColor;
  eventSummary: string;
}

export interface SecretExposureItem {
  timestamp: string;
  conversationId: string;
  secretType: string;
  direction: 'SENT' | 'RECEIVED';
  riskMitigated: boolean;
}

export interface CopilotQueryRequest {
  conversationId: string;
  query: string;
  currentContext?: string;
}

export interface CopilotQueryResponse {
  answer: string;
  relatedRiskScore?: number;
  suggestedFollowups?: string[];
}
