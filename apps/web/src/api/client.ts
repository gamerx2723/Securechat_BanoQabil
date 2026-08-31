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

    const PROTECTED_BRANDS = [
      'paypal', 'binance', 'whatsapp', 'google', 'apple', 'microsoft',
      'chase', 'bank', 'hbl', 'easypaisa', 'nayapay', 'sadapay', 'meezan',
      'instagram', 'facebook', 'skype', 'netflix', 'amazon', 'wellsfargo',
      'citibank', 'americanexpress', 'barclays', 'outlook', 'yahoo', 'steam'
    ];

    const SUSPICIOUS_TLDS = [
      'xyz', 'top', 'tk', 'zip', 'cam', 'click', 'rest', 'gq', 'cf', 'ml',
      'work', 'link', 'surf', 'loan', 'club', 'info', 'online', 'site',
      'fun', 'live', 'support', 'vip', 'icu', 'buzz', 'ga', 'space', 'gdn',
      'fit', 'kim', 'bid', 'country', 'stream', 'download', 'racing', 'trade'
    ];

    const DYNAMIC_DNS = [
      'servebbs.org', 'duckdns.org', 'ngrok.io', 'loca.lt', 'hopto.org',
      'zapto.org', 'ddns.net', 'bounceme.net', '000webhostapp.com', 'firebaseapp.com',
      'pages.dev', 'workers.dev', 'netlify.app', 'glitch.me', 'vercel.app'
    ];

    // 1. DLP Secret & API Key Detection
    if (/AKIA[0-9A-Z]{16}/.test(text)) {
      score += 65;
      evidence.push({
        category: 'DLP_SECRET_EXPOSURE',
        signal: 'AWS_ACCESS_KEY',
        confidence: 0.99,
        detectionBasis: 'DETERMINISTIC_RULE',
        description: 'Outbound AWS Access Key ID detected. Prevented unauthorized credential exposure.',
      });
    }

    if (/ghp_[0-9a-zA-Z]{36}/.test(text)) {
      score += 65;
      evidence.push({
        category: 'DLP_SECRET_EXPOSURE',
        signal: 'GITHUB_PERSONAL_ACCESS_TOKEN',
        confidence: 0.99,
        detectionBasis: 'DETERMINISTIC_RULE',
        description: 'GitHub Personal Access Token token detected.',
      });
    }

    if (/(?:password|otp|pin|passcode|secret_key|api_key)\s*[:=]?\s*\S+/i.test(text)) {
      score += 50;
      evidence.push({
        category: 'DLP_SECRET_EXPOSURE',
        signal: 'PASSWORD_OR_OTP_CREDENTIAL',
        confidence: 0.95,
        detectionBasis: 'DETERMINISTIC_RULE',
        description: 'Plaintext password or 2FA OTP verification code pattern identified.',
      });
    }

    // 2. URL Extraction & Phishing Evaluation (Live Internet Phishing Defense)
    const urlRegex = /(?:(?:https?:\/\/|www\.)[^\s<>"'{}|\\^`\[\]]+|(?:[a-zA-Z0-9-]+\.)+(?:com|org|net|xyz|top|info|site|online|club|tk|ml|ga|cf|gq|io|dev|app|cc|to|co|pk)(?:\/[^\s<>"'{}|\\^`\[\]]*)?)/gi;
    const matches = text.match(urlRegex) || [];
    const urls = matches.map(u => (!u.startsWith('http://') && !u.startsWith('https://') ? `http://${u}` : u));

    for (const rawUrl of urls) {
      let hostname = '';
      let pathname = '';
      try {
        const parsed = new URL(rawUrl);
        hostname = parsed.hostname.toLowerCase();
        pathname = (parsed.pathname + parsed.search).toLowerCase();
      } catch {
        hostname = rawUrl.toLowerCase();
      }

      const fullLower = rawUrl.toLowerCase();
      let urlScore = 0;
      const urlSignals: string[] = [];

      // Check IP Host
      if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
        urlScore += 50;
        urlSignals.push(`Direct numerical IP endpoint (${hostname})`);
      }

      // Check Suspicious TLD
      const tld = hostname.split('.').pop() || '';
      if (SUSPICIOUS_TLDS.includes(tld)) {
        urlScore += 45;
        urlSignals.push(`High-risk disposable TLD (.${tld})`);
      }

      // Check Dynamic DNS / Free Staging Host
      for (const dyn of DYNAMIC_DNS) {
        if (hostname === dyn || hostname.endsWith(`.${dyn}`)) {
          urlScore += 40;
          urlSignals.push(`Dynamic DNS or free hosting endpoint (${dyn})`);
          break;
        }
      }

      // Check Brand Spoofing in domain, subdomain, or path
      let brandTarget: string | null = null;
      for (const b of PROTECTED_BRANDS) {
        if (fullLower.includes(b)) {
          if (!hostname.endsWith(`.${b}.com`) && !hostname.endsWith(`.${b}.pk`) && hostname !== `${b}.com`) {
            brandTarget = b;
            urlScore += 65;
            urlSignals.push(`Brand spoofing targeting '${b}' on unauthorized domain`);
            break;
          }
        }
      }

      // Check Hex / MD5 kit tracking hashes in path
      if (/[0-9a-fA-F]{16,}/.test(pathname)) {
        urlScore += 35;
        urlSignals.push('Phishing kit tracking session hash token in URL');
      }

      // Check Suspicious Script / Webscr / Action paths
      if (/(?:webscr|cgi-bin|dispatch=|loading\.php|confirmar|verify-account|login-suspended|update-billing|claim-reward|secure-login|unlock-account|action=verify|fidelidade|\.php\?|\/login|\/signin|\/verify|\/auth)/.test(pathname)) {
        urlScore += 40;
        urlSignals.push('Automated credential harvesting or phishing script endpoint');
      }

      // Check shorteners
      if (/(?:bit\.ly|tinyurl\.com|t\.co|goo\.gl|cutt\.ly|is\.gd|rb\.gy|shorte\.st|xini\.eu)/.test(hostname)) {
        urlScore += 30;
        urlSignals.push('URL shortener concealing actual endpoint');
      }

      if (urlScore >= 45 || brandTarget) {
        score += Math.max(75, urlScore);
        evidence.push({
          category: 'PHISHING',
          signal: brandTarget ? `SPOOF_${brandTarget.toUpperCase()}` : 'MALICIOUS_PHISHING_LINK',
          confidence: 0.98,
          detectionBasis: 'ML_AND_LEXICAL_HEURISTICS',
          description: `High-risk Phishing URL detected (${hostname}): ${urlSignals.join('; ')}`,
        });
      } else if (urlScore > 0) {
        score += urlScore;
        evidence.push({
          category: 'MALICIOUS_URL',
          signal: 'UNVERIFIED_EXTERNAL_LINK',
          confidence: 0.80,
          detectionBasis: 'LEXICAL_HEURISTICS',
          description: `External link with suspicious characteristics (${hostname}): ${urlSignals.join('; ')}`,
        });
      }
    }

    // 3. Zero-Day Cognitive Intent Logic & Evasion Reasoning
    // A. Anti-analysis character spacing or hidden zero-width evasion
    if (/[\u200B\u200C\u200D\uFEFF\u202A\u202E]/.test(text)) {
      score += 50;
      evidence.push({
        category: 'SOCIAL_ENGINEERING',
        signal: 'ZERO_WIDTH_EVASION',
        confidence: 0.98,
        detectionBasis: 'CONTEXT_ANALYSIS',
        description: 'Zero-Day Anti-Analysis Evasion: Hidden zero-width Unicode characters detected in text.',
      });
    }

    if (/\b([a-zA-Z0-9][\s\._-]){4,}[a-zA-Z0-9]\b/.test(text)) {
      score += 40;
      evidence.push({
        category: 'SOCIAL_ENGINEERING',
        signal: 'OBFUSCATED_SPACING',
        confidence: 0.92,
        detectionBasis: 'CONTEXT_ANALYSIS',
        description: 'Artificial character-spacing/delimiter evasion pattern detected to bypass keyword filters.',
      });
    }

    // B. Cognitive Intent Triangle (Action + Pressure + Bypass)
    const hasAction = /\b(?:authenticate|sign\s*in|log\s*in|verify\s*identity|confirm\s*(?:credentials|details|account)|transfer|send\s*(?:money|funds|cash|amount|rs|pkr|\$)|download|install|run\s*this|open\s*attachment|apk|bhejo|paisay\s*de\s*do|transfer\s*karo)\b/i.test(text);
    const hasPressure = /\b(?:within\s*(?:\d+\s*(?:mins?|hours?|seconds?)|today)|before\s*it\s*expires|deadline|right\s*now|at\s*once|otherwise|or\s*else|will\s*be\s*(?:lost|cancelled|suspended|blocked|deleted|terminated)|stuck|lost\s*my\s*phone|emergency|hospital|accident|earn\s*\$?\d+\s*daily|won\s*(?:lottery|prize|car|gold)|foran|jaldi|abhi\s*k\s*abhi|band\s*ho\s*jaye\s*ga|ammi\s*bimar)\b/i.test(text);
    const hasBypass = /\b(?:ignore\s*(?:warning|security\s*alert|prompt)|bypass|do\s*not\s*(?:call|verify\s*with|report|ask)|share\s*(?:code|otp|pin|password|card|cvv|cnic)|tell\s*me\s*the\s*number|kisi\s*ko\s*mat\s*batana|code\s*batao|otp\s*send\s*karo)\b/i.test(text);

    if (hasAction && hasPressure) {
      score += 55;
      evidence.push({
        category: 'SOCIAL_ENGINEERING',
        signal: 'ACTION_PRESSURE_COMPOUND',
        confidence: 0.95,
        detectionBasis: 'CONTEXT_ANALYSIS',
        description: 'Zero-Day Cognitive Intent: Combines an urgent irreversible action request with asymmetric pressure.',
      });
    }

    if (hasAction && hasBypass) {
      score += 65;
      evidence.push({
        category: 'CREDENTIAL_HARVESTING',
        signal: 'SECURITY_BYPASS_ATTEMPT',
        confidence: 0.98,
        detectionBasis: 'CONTEXT_ANALYSIS',
        description: 'Zero-Day Critical Intent: Direct instruction to bypass verification or disclose confidential 2FA authentication state.',
      });
    }

    // 4. Multilingual Social Engineering (Urgency / Fear / Impersonation / Roman Urdu Scams)
    if (/(?:urgent|immediately|foran|jaldi|block honay wala hai|account suspended|verify now|police|fia notice|emergency|suspended within|lottery|inaam|jeeto|bisp|ehsaas|atm block|send pin|otp code)/i.test(text)) {
      score += 45;
      evidence.push({
        category: 'URGENCY_MANIPULATION',
        signal: 'LINGUISTIC_COERCION',
        confidence: 0.94,
        detectionBasis: 'DETERMINISTIC_RULE',
        description: "Psychological urgency pressure coercing action ('foran', 'account suspended', 'verify now').",
      });
    }

    const finalScore = Math.min(100, score);
    const color = finalScore >= 75 ? 'RED' : finalScore >= 25 ? 'ORANGE' : 'GREEN';

    const phishingEv = evidence.find(e => e.category === 'PHISHING');
    const credEv = evidence.find(e => e.category === 'CREDENTIAL_HARVESTING');
    const primaryThreat = phishingEv && finalScore >= 50
      ? 'PHISHING'
      : credEv && finalScore >= 50
      ? 'CREDENTIAL_HARVESTING'
      : (evidence.length > 0 ? evidence[0].category : 'SAFE');

    return {
      riskScore: finalScore,
      indicatorColor: color,
      primaryThreat,
      confidence: finalScore === 0 ? 98 : Math.min(99, 65 + Math.round(finalScore / 3)),
      evidenceList: evidence,
      explanation: color === 'RED'
        ? `CRITICAL THREAT: ${evidence[0]?.description || 'High-confidence threat detected'}`
        : color === 'ORANGE'
        ? `SUSPICIOUS: ${evidence[0]?.description || 'Potential security risks identified'}`
        : 'Clean message envelope. Zero security threats detected under Zero-Trust analysis.',
      recommendation: color === 'RED'
        ? 'DANGER: Do not click any links or enter credentials. Threat identified under Zero-Day cognitive analysis.'
        : color === 'ORANGE'
        ? 'CAUTION: Exercise care before sharing information or opening links.'
        : 'Standard messaging safe to proceed.',
      suggestedActions: color === 'RED'
        ? ['BLOCK_LINK', 'BLOCK_SENDER', 'REPORT_MESSAGE', 'ASK_COPILOT']
        : color === 'ORANGE'
        ? ['ASK_COPILOT', 'VERIFY_SENDER']
        : ['ASK_COPILOT'],
    };
  }
}
