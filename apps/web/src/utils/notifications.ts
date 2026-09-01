// Zero-Trust SecureChat In-App and System Notification Engine

/**
 * Plays an elegant, modern, high-frequency crystal chime using the Web Audio API.
 * Uses pure synthetic sound - requires zero external MP3/WAV assets.
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
 * Requests browser system notification permissions if not already decided.
 */
export const requestNotificationPermission = async () => {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch {}
    }
  }
};

/**
 * Triggers a native desktop/mobile system notification with fallback protection.
 */
export const triggerSystemNotification = (senderName: string, textSnippet: string, avatarUrl?: string) => {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      try {
        const notif = new Notification(`🔒 ${senderName}`, {
          body: textSnippet || 'New encrypted zero-trust message received.',
          icon: avatarUrl || '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'securechat-message',
        });
        notif.onclick = () => {
          window.focus();
          notif.close();
        };
      } catch (e) {
        console.debug('Notification trigger error:', e);
      }
    }
  }
};
