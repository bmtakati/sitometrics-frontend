import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchOrderNotifications, readOrderNotification } from '../utils/waiterOrderApi';

const playTone = (frequency = 880, durationMs = 280) => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = frequency;
    gain.gain.value = 0.08;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    setTimeout(() => {
      osc.stop();
      ctx.close();
    }, durationMs);
  } catch {
    // Ignore audio errors in restricted browsers.
  }
};

export const playNotificationBell = () => {
  playTone(880, 200);
  setTimeout(() => playTone(1100, 240), 220);
};

export const playReadyRingtone = () => {
  playTone(660, 180);
  setTimeout(() => playTone(990, 180), 200);
  setTimeout(() => playTone(1320, 260), 420);
};

export default function useOrderNotifications(audience, { enabled = true, intervalMs = 8000 } = {}) {
  const [notifications, setNotifications] = useState([]);
  const seenIdsRef = useRef(new Set());

  const refresh = useCallback(async () => {
    if (!enabled || !audience) return;
    const rows = await fetchOrderNotifications(audience, true);
    setNotifications(rows);

    const newOnes = rows.filter((row) => !seenIdsRef.current.has(row.id));
    if (newOnes.length > 0) {
      newOnes.forEach((row) => seenIdsRef.current.add(row.id));
      if (audience === 'WAITER') {
        playReadyRingtone();
      } else {
        playNotificationBell();
      }
    }
  }, [audience, enabled]);

  useEffect(() => {
    seenIdsRef.current = new Set();
    refresh();
    if (!enabled) return undefined;
    const timer = setInterval(refresh, intervalMs);
    return () => clearInterval(timer);
  }, [enabled, intervalMs, refresh]);

  const markRead = useCallback(async (id) => {
    await readOrderNotification(id);
    seenIdsRef.current.add(id);
    setNotifications((prev) => prev.filter((row) => row.id !== id));
  }, []);

  return { notifications, refresh, markRead, unreadCount: notifications.length };
}
