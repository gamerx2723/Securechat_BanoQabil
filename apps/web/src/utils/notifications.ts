// Zero-Trust SecureChat In-App, System Push Notification, and AI Threat Alert Engine

/**
 * Plays an elegant, modern, high-frequency crystal chime using Web Audio API for normal safe messages.
 */
export const playNotificationChime = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    // Dual-tone harmonic crystal chime: E5 (659.25Hz) -> B5 (987.77Hz)
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(987.77, ctx.currentTime + 0.12);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1318.5, ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(1975.5, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.45);
    osc2.stop(ctx.currentTime + 0.45);
  } catch (e) {
    console.debug('Audio notification omitted:', e);
  }
};

/**
 * Plays an urgent multi-harmonic warning tone when AI models flag a malicious or high-risk threat.
 */
export const playThreatWarningSound = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    // Aggressive dual-pulse low/high warble tone for immediate alert
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.setValueAtTime(440, now + 0.1);
    osc.frequency.setValueAtTime(880, now + 0.2);
    osc.frequency.setValueAtTime(440, now + 0.3);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.45);

    // Vibration API support for mobile devices
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 250]);
    }
  } catch (e) {
    console.debug('Threat audio omitted:', e);
  }
};

/**
 * Requests browser & mobile system notification permissions.
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch {
      return false;
    }
  }
  return false;
};

/**
 * Checks if system push notification permission is granted.
 */
export const isNotificationPermissionGranted = (): boolean => {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    return Notification.permission === 'granted';
  }
  return false;
};

/**
 * Gets or sets the local listener toggle state.
 */
const LISTENER_KEY = 'securechat_notifications_enabled';

export const getNotificationListenerState = (): boolean => {
  if (typeof window === 'undefined') return true;
  const stored = localStorage.getItem(LISTENER_KEY);
  return stored === null ? true : stored === 'true';
};

export const setNotificationListenerState = (enabled: boolean) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LISTENER_KEY, enabled ? 'true' : 'false');
  }
};

/**
 * Triggers a standard encrypted message notification.
 */
export const triggerSystemNotification = (senderName: string, textSnippet: string, avatarUrl?: string, onClick?: () => void) => {
  if (!getNotificationListenerState()) return;

  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      try {
        const notif = new Notification(`🔒 ${senderName}`, {
          body: textSnippet || 'New encrypted zero-trust message received.',
          icon: avatarUrl || '/favicon.ico',
          badge: '/favicon.ico',
          tag: `securechat-msg-${Date.now()}`,
          requireInteraction: false,
        });

        notif.onclick = () => {
          window.focus();
          notif.close();
          if (onClick) onClick();
        };
      } catch (e) {
        console.debug('Notification trigger error:', e);
      }
    }
  }
};

/**
 * Triggers an URGENT Zero-Trust AI Flagged Malicious Message Notification.
 */
export const triggerThreatPushNotification = (
  senderName: string,
  threatType: string,
  explanation: string,
  textSnippet: string,
  avatarUrl?: string,
  onClick?: () => void
) => {
  if (!getNotificationListenerState()) return;

  // 1. Play Warning Sound
  playThreatWarningSound();

  // 2. Dispatch High-Priority System Push Notification
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      try {
        const notif = new Notification(`🚨 THREAT FLAGGED: ${threatType || 'Suspicious Content'}`, {
          body: `From ${senderName}: "${textSnippet.slice(0, 70)}..."\n⚠️ ${explanation || 'AI Security Shield detected malicious coercion or phishing payload.'}`,
          icon: avatarUrl || '/favicon.ico',
          badge: '/favicon.ico',
          tag: `securechat-threat-${Date.now()}`,
          requireInteraction: true,
        });

        notif.onclick = () => {
          window.focus();
          notif.close();
          if (onClick) onClick();
        };
      } catch (e) {
        console.debug('Threat notification error:', e);
      }
    }
  }
};
