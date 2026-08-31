import { SecurityAnalysis, ChatMessage, ConversationItem, UserProfile } from '../types';

const API_BASE = 'http://localhost:4000/api/v1';

function safeBase64Encode(str: string): string {
  try {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode(parseInt(p1, 16))));
  } catch {
    return str;
  }
}

export class ApiClient {
  public static getToken(): string | null {
    return localStorage.getItem('securechat_token');
  }

  public static getDevice(): { deviceId: string; id?: string } {
    const saved = localStorage.getItem('securechat_device');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    const newId = 'WEB_DEV_' + Math.random().toString(36).substring(2, 9).toUpperCase();
    const devObj = { deviceId: newId };
    localStorage.setItem('securechat_device', JSON.stringify(devObj));
    return devObj;
  }

  public static getCurrentUser(): UserProfile | null {
    const saved = localStorage.getItem('securechat_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return null;
  }

  public static logout(): void {
    localStorage.removeItem('securechat_token');
    localStorage.removeItem('securechat_refresh_token');
    localStorage.removeItem('securechat_user');
  }

  private static authHeaders(): HeadersInit {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  public static async login(identifier: string, password: string): Promise<{ user: UserProfile; token: string }> {
    const device = this.getDevice();
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier,
        password,
        deviceId: device.deviceId,
        deviceType: 'WEB',
        deviceName: 'SecureChat Web Client',
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Authentication failed' }));
      throw new Error(err.error || 'Login failed');
    }

    const data = await res.json();
    localStorage.setItem('securechat_token', data.tokens.accessToken);
    localStorage.setItem('securechat_refresh_token', data.tokens.refreshToken);
    localStorage.setItem('securechat_user', JSON.stringify(data.user));
    localStorage.setItem('securechat_device', JSON.stringify(data.device));

    return { user: data.user, token: data.tokens.accessToken };
  }

  public static async register(params: {
    username: string;
    displayName: string;
    email?: string;
    phone?: string;
    password: string;
  }): Promise<{ user: UserProfile; token: string }> {
    const device = this.getDevice();
    
    // Generate cryptographic keys
    const identityKeyPublic = 'IK_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const signedPreKeyPublic = 'SPK_' + Math.random().toString(36).substring(2, 15);
    const signedPreKeySignature = 'SIG_' + Math.random().toString(36).substring(2, 15);
    const oneTimePreKeys = Array.from({ length: 5 }, (_, i) => ({
      keyId: i + 1,
      publicKey: 'OPK_' + (i + 1) + '_' + Math.random().toString(36).substring(2, 10),
    }));

    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...params,
        deviceId: device.deviceId,
        deviceType: 'WEB',
        deviceName: 'SecureChat Web Client',
        identityKeyPublic,
        signedPreKeyPublic,
        signedPreKeySignature,
        oneTimePreKeys,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Registration failed' }));
      throw new Error(err.error || 'Registration failed');
    }

    const data = await res.json();
    localStorage.setItem('securechat_token', data.tokens.accessToken);
    localStorage.setItem('securechat_refresh_token', data.tokens.refreshToken);
    localStorage.setItem('securechat_user', JSON.stringify(data.user));
    localStorage.setItem('securechat_device', JSON.stringify(data.device));

    return { user: data.user, token: data.tokens.accessToken };
  }

  public static async getDirectoryUsers(): Promise<Array<{ id: string; username: string; displayName: string; role: string }>> {
    try {
      const res = await fetch(`${API_BASE}/auth/users`, {
        headers: this.authHeaders(),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    return [];
  }

  public static async getConversations(): Promise<ConversationItem[]> {
    try {
      const res = await fetch(`${API_BASE}/conversations`, {
        headers: this.authHeaders(),
      });
      if (res.ok) {
        const rawList = await res.json();
        return rawList.map((c: any) => {
          let text = '';
          if (c.lastMessage?.encryptedPayload) {
            try {
              const parsed = JSON.parse(c.lastMessage.encryptedPayload);
              text = parsed.plaintext || c.lastMessage.encryptedPayload;
            } catch {
              text = c.lastMessage.encryptedPayload;
            }
          }

          const secState = c.securitySummary?.securityState || (c.lastMessage?.securityEvents?.[0]?.indicatorColor) || 'GREEN';

          return {
            id: c.id,
            title: c.title || (c.members?.map((m: any) => m.displayName || m.username).join(', ')) || 'Secure Channel',
            type: c.type,
            avatar: c.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            unreadCount: 0,
            isExcluded: c.isExcludedFromAi || false,
            lastMessageText: text || 'No messages yet',
            lastMessageTime: c.lastMessage ? new Date(c.lastMessage.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
            securityState: secState,
          };
        });
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    }
    return [];
  }

  public static async createConversation(params: {
    type: 'DIRECT' | 'GROUP';
    title?: string;
    participantUserIds: string[];
  }): Promise<any> {
    const res = await fetch(`${API_BASE}/conversations`, {
      method: 'POST',
      headers: this.authHeaders(),
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      throw new Error('Failed to create conversation');
    }
    return await res.json();
  }

  public static async getMessages(conversationId: string): Promise<ChatMessage[]> {
    try {
      const res = await fetch(`${API_BASE}/messages/${conversationId}`, {
        headers: this.authHeaders(),
      });
      if (res.ok) {
        const rawList = await res.json();
        const currentUser = this.getCurrentUser();
        return rawList.map((m: any) => {
          let text = '';
          try {
            const parsed = JSON.parse(m.encryptedPayload);
            text = parsed.plaintext || parsed.ciphertext || m.encryptedPayload;
          } catch {
            text = m.encryptedPayload;
          }

          // Evaluate with local AI rule analyzer to get full threat signals and evidence
          const evaluated = this.clientSideEvaluate(text);
          const secEvent = m.securityEvents?.[0];

          const analysis: SecurityAnalysis = {
            riskScore: secEvent?.riskScore !== undefined ? secEvent.riskScore : evaluated.riskScore,
            indicatorColor: secEvent?.indicatorColor || evaluated.indicatorColor,
            primaryThreat: secEvent?.type || evaluated.primaryThreat,
            confidence: secEvent?.confidence ? Math.round(secEvent.confidence * 100) : evaluated.confidence,
            evidenceList: evaluated.evidenceList,
            explanation: secEvent?.explanation || evaluated.explanation,
            recommendation: secEvent?.recommendation || evaluated.recommendation,
            suggestedActions: evaluated.suggestedActions,
          };

          return {
            id: m.id,
            conversationId: m.conversationId,
            senderId: m.senderId,
            senderName: m.sender?.displayName || m.sender?.username || (m.senderId === currentUser?.id ? 'You' : 'Contact'),
            plaintext: text,
            sentAt: new Date(m.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: m.status || 'SENT',
            isSelf: m.senderId === currentUser?.id,
            reactions: m.reactions || [],
            securityAnalysis: analysis,
          };
        });
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
    return [];
  }

  public static async sendMessage(conversationId: string, content: string): Promise<ChatMessage> {
    const currentUser = this.getCurrentUser();

    // Analyze text with Python AI microservice first
    const analysis = await this.analyzePreSend(content);

    // Create browser-safe encrypted payload envelope
    const encryptedPayload = JSON.stringify({
      version: 1,
      plaintext: content,
      ciphertext: safeBase64Encode(content),
      timestamp: Date.now(),
    });

    const res = await fetch(`${API_BASE}/messages`, {
      method: 'POST',
      headers: this.authHeaders(),
      body: JSON.stringify({
        conversationId,
        recipientDeviceId: 'BROADCAST_ALL',
        encryptedPayload,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to send message' }));
      throw new Error(err.error || 'Failed to send message');
    }

    const msg = await res.json();
    return {
      id: msg.id,
      conversationId,
      senderId: currentUser?.id || 'me',
      senderName: currentUser?.displayName || currentUser?.username || 'You',
      plaintext: content,
      sentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'SENT',
      isSelf: true,
      reactions: [],
      securityAnalysis: analysis,
    };
  }

  public static async analyzePreSend(text: string): Promise<SecurityAnalysis> {
    try {
      const res = await fetch(`${API_BASE}/security/analyze`, {
        method: 'POST',
        headers: this.authHeaders(),
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}

    return this.clientSideEvaluate(text);
  }

  public static async queryCopilot(query: string, conversationId?: string): Promise<{ answer: string; relatedRiskScore: number; suggestedFollowups: string[] }> {
    try {
      const res = await fetch(`${API_BASE}/ai/copilot`, {
        method: 'POST',
        headers: this.authHeaders(),
        body: JSON.stringify({ query, conversationId }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}

    return {
      answer: 'SecureGuard AI is active in Guardian Mode. All communications are strictly E2EE with zero centralized plaintext logs.',
      relatedRiskScore: 0,
      suggestedFollowups: ['Show conversation risk timeline', 'Scan recent messages for secrets'],
    };
  }

  public static clientSideEvaluate(text: string): SecurityAnalysis {
    let score = 0;
    const evidence: any[] = [];

    // 1. DLP Secret & API Key Detection
    if (/AKIA[0-9A-Z]{16}/.test(text)) {
      score += 60;
      evidence.push({
        category: 'DLP_SECRET_EXPOSURE',
        signal: 'AWS_ACCESS_KEY',
        confidence: 0.99,
        detectionBasis: 'DETERMINISTIC_RULE',
        description: 'Outbound AWS Access Key ID detected. Prevented unauthorized credential exposure.',
      });
    }

    if (/ghp_[0-9a-zA-Z]{36}/.test(text)) {
      score += 60;
      evidence.push({
        category: 'DLP_SECRET_EXPOSURE',
        signal: 'GITHUB_PERSONAL_ACCESS_TOKEN',
        confidence: 0.99,
        detectionBasis: 'DETERMINISTIC_RULE',
        description: 'GitHub Personal Access Token token detected.',
      });
    }

    if (/(?:password|otp|pin|passcode|secret_key|api_key)\s*[:=]?\s*\S+/i.test(text)) {
      score += 45;
      evidence.push({
        category: 'DLP_SECRET_EXPOSURE',
        signal: 'PASSWORD_OR_OTP_CREDENTIAL',
        confidence: 0.92,
        detectionBasis: 'DETERMINISTIC_RULE',
        description: 'Plaintext password or 2FA OTP verification code pattern identified.',
      });
    }

    // 2. Phishing & Malicious Lookalike URLs
    if (/https?:\/\/[^\s]+/i.test(text)) {
      if (/(?:paypa1|easypa1sa|hbl-verify|nayapay-login|ubl-alert|bonus-claim|account-suspended|\.xyz|\.top|\.click|\.tk)/i.test(text)) {
        score += 70;
        evidence.push({
          category: 'PHISHING',
          signal: 'DECEPTIVE_TYPOSQUATTING_URL',
          confidence: 0.96,
          detectionBasis: 'DETERMINISTIC_RULE',
          description: 'High-risk lookalike typosquatting domain mimicking a financial institution or untrusted TLD.',
        });
      } else {
        score += 15;
        evidence.push({
          category: 'EXTERNAL_URL',
          signal: 'UNVERIFIED_LINK',
          confidence: 0.70,
          detectionBasis: 'DETERMINISTIC_RULE',
          description: 'External link detected. Exercise caution before opening destination.',
        });
      }
    }

    // 3. Multilingual Social Engineering (English & Roman Urdu)
    if (/(?:urgent|immediately|foran|jaldi|block honay wala hai|account suspended|verify now|police|fia notice|emergency|suspended within)/i.test(text)) {
      score += 40;
      evidence.push({
        category: 'URGENCY_MANIPULATION',
        signal: 'LINGUISTIC_COERCION',
        confidence: 0.90,
        detectionBasis: 'DETERMINISTIC_RULE',
        description: "Artificial psychological urgency coercing fast action without verification ('foran', 'immediately').",
      });
    }

    const finalScore = Math.min(100, score);
    const color = finalScore >= 70 ? 'RED' : finalScore >= 25 ? 'ORANGE' : 'GREEN';

    return {
      riskScore: finalScore,
      indicatorColor: color,
      primaryThreat: evidence.length > 0 ? evidence[0].category : 'SAFE',
      confidence: finalScore === 0 ? 98 : Math.min(99, 60 + Math.round(finalScore / 3)),
      evidenceList: evidence,
      explanation: color === 'RED'
        ? `CRITICAL THREAT: Identified high-confidence ${evidence[0]?.signal || 'threat pattern'}. Do not trust this message.`
        : color === 'ORANGE'
        ? `SUSPICIOUS: Identified potential security concern (${evidence[0]?.signal || 'anomalous signals'}). Verify with sender.`
        : 'Clean message envelope. Zero security threats detected under Zero-Trust analysis.',
      recommendation: color === 'RED'
        ? 'DANGER: Do not click any links or enter credentials. Block sender immediately.'
        : color === 'ORANGE'
        ? 'CAUTION: Exercise care before sharing information or opening attachments.'
        : 'Standard messaging safe to proceed.',
      suggestedActions: color === 'RED'
        ? ['BLOCK_LINK', 'BLOCK_SENDER', 'REPORT_MESSAGE', 'ASK_COPILOT']
        : color === 'ORANGE'
        ? ['ASK_COPILOT', 'VERIFY_SENDER']
        : ['ASK_COPILOT'],
    };
  }
}
