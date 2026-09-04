export type ZeroTrustState = 'UNKNOWN' | 'OBSERVED' | 'KNOWN' | 'VERIFIED';
export type TrustLevel = ZeroTrustState;

export interface ContactTrustProfile {
  contactId: string;
  displayName: string;
  username: string;
  trustState: ZeroTrustState;
  deviceCount: number;
  totalMessages: number;
  securityIncidents: number;
  suspiciousLinksCount: number;
  isRecentlyCreated: boolean;
  hasRecentIdentityChange: boolean;
  trustScore: number; // 0 - 100
  trustLabel: string;
}

export class ZeroTrustEngine {
  /**
   * Computes the zero-trust lifecycle state and reputation profile for a contact
   * strictly adhering to Section 45, 46, and 48 of the SecureChat SRS v1.0.
   */
  public static evaluateContact(contact: {
    id: string;
    username: string;
    displayName?: string;
    createdAt?: string;
    isBlocked?: boolean;
    messagesCount?: number;
    incidentCount?: number;
    isKeyVerified?: boolean;
  }): ContactTrustProfile {
    const totalMsgs = contact.messagesCount || 0;
    const incidents = contact.incidentCount || 0;
    const isVerifiedKey = !!contact.isKeyVerified;

    let trustState: ZeroTrustState = 'UNKNOWN';
    let trustScore = 20;
    let trustLabel = 'Untrusted / New Contact';

    if (isVerifiedKey) {
      trustState = 'VERIFIED';
      trustScore = Math.max(85, 100 - incidents * 15);
      trustLabel = 'Cryptographically Verified Identity';
    } else if (totalMsgs >= 15 && incidents === 0) {
      trustState = 'KNOWN';
      trustScore = 75;
      trustLabel = 'Established Regular Contact';
    } else if (totalMsgs >= 3 && incidents === 0) {
      trustState = 'OBSERVED';
      trustScore = 50;
      trustLabel = 'Observed Communication Baseline';
    } else {
      trustState = 'UNKNOWN';
      trustScore = Math.max(10, 30 - incidents * 10);
      trustLabel = 'Unverified New Contact (Zero-Trust Active)';
    }

    // Check newly created account (less than 2 days old)
    let isRecentlyCreated = false;
    if (contact.createdAt) {
      const createdTime = new Date(contact.createdAt).getTime();
      if (!isNaN(createdTime) && Date.now() - createdTime < 48 * 3600 * 1000) {
        isRecentlyCreated = true;
      }
    }

    return {
      contactId: contact.id,
      displayName: contact.displayName || contact.username,
      username: contact.username,
      trustState,
      deviceCount: 1,
      totalMessages: totalMsgs,
      securityIncidents: incidents,
      suspiciousLinksCount: 0,
      isRecentlyCreated,
      hasRecentIdentityChange: false,
      trustScore,
      trustLabel,
    };
  }

  public static getContactTrust(conversationId: string, messages: any[]): {
    level: ZeroTrustState;
    trustScore: number;
    verificationMethod: string;
    messageCount: number;
    badgeDescription: string;
    badgeColor: { bg: string; text: string; border: string };
  } {
    const msgCount = Array.isArray(messages) ? messages.length : 0;
    let level: ZeroTrustState = 'UNKNOWN';
    let score = 25;
    let verification = 'Standard Zero-Trust Baseline';
    let desc = 'New or unverified contact. Outbound links and credentials strictly monitored.';
    let badgeColor = {
      bg: 'rgba(245, 158, 11, 0.15)',
      text: '#f59e0b',
      border: 'rgba(245, 158, 11, 0.4)',
    };

    if (msgCount >= 15) {
      level = 'KNOWN';
      score = 75;
      verification = 'Established Communication Baseline (15+ msgs)';
      desc = 'Trusted conversation partner with established communication history.';
      badgeColor = {
        bg: 'rgba(168, 85, 247, 0.15)',
        text: '#c084fc',
        border: 'rgba(168, 85, 247, 0.4)',
      };
    } else if (msgCount >= 3) {
      level = 'OBSERVED';
      score = 50;
      verification = 'Observed Communication History';
      desc = 'Observed communication pattern with basic safety baselines.';
      badgeColor = {
        bg: 'rgba(56, 189, 248, 0.15)',
        text: '#38bdf8',
        border: 'rgba(56, 189, 248, 0.4)',
      };
    }

    return {
      level,
      trustScore: score,
      verificationMethod: verification,
      messageCount: msgCount,
      badgeDescription: desc,
      badgeColor,
    };
  }

  public static getBadgeStyle(state: ZeroTrustState): { bg: string; color: string; border: string } {
    switch (state) {
      case 'VERIFIED':
        return {
          bg: 'rgba(16, 185, 129, 0.15)',
          color: '#10b981',
          border: '1px solid rgba(16, 185, 129, 0.4)',
        };
      case 'KNOWN':
        return {
          bg: 'rgba(168, 85, 247, 0.15)',
          color: '#c084fc',
          border: '1px solid rgba(168, 85, 247, 0.4)',
        };
      case 'OBSERVED':
        return {
          bg: 'rgba(56, 189, 248, 0.15)',
          color: '#38bdf8',
          border: '1px solid rgba(56, 189, 248, 0.4)',
        };
      case 'UNKNOWN':
      default:
        return {
          bg: 'rgba(245, 158, 11, 0.15)',
          color: '#f59e0b',
          border: '1px solid rgba(245, 158, 11, 0.4)',
        };
    }
  }
}

export { ZeroTrustEngine as TrustEngine };

