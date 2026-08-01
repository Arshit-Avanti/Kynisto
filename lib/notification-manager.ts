// Notification Manager for Kynisto (Web & Android APK)

export interface KynistoNotificationOptions {
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  silent?: boolean;
  url?: string;
  category?: "promotion" | "announcement" | "urgent" | "system";
}

/** Plays a pleasant 3-note crystal harmonic chime (E5 -> G#5 -> B5) */
export function playNotificationSound(): void {
  if (typeof window === "undefined") return;
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const playNote = (freq: number, startTime: number, duration: number, gainValue: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(gainValue, startTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    // Pleasant crystal chord sequence: E5 (659Hz), G#5 (830Hz), B5 (987Hz)
    playNote(659.25, now, 0.35, 0.2);
    playNote(830.61, now + 0.08, 0.35, 0.25);
    playNote(987.77, now + 0.16, 0.45, 0.3);
  } catch (err) {
    console.warn("Web audio chime failed:", err);
  }
}

export function isNotificationSupported(): boolean {
  if (typeof window === "undefined") return false;
  return (
    "Notification" in window ||
    "serviceWorker" in navigator ||
    (window as any).AndroidNotification !== undefined
  );
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  // Check Android APK bridge
  if ((window as any).AndroidNotification?.requestPermission) {
    (window as any).AndroidNotification.requestPermission();
    return true;
  }

  // Web Notification API
  if ("Notification" in window) {
    if (Notification.permission === "granted") return true;
    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }
  }
  return false;
}

export function sendDeviceNotification(
  title: string,
  options: KynistoNotificationOptions = {}
): boolean {
  if (typeof window === "undefined") return false;

  const defaultIcon = options.icon || "/kynisto-mark.svg";
  const bodyText = options.body || "";

  // Determine target link URL based on explicit URL or category
  let targetUrl = options.url;
  if (!targetUrl) {
    if (options.category === "urgent" || options.category === "system") {
      targetUrl = "/account?tab=notifications";
    } else if (options.category === "promotion") {
      targetUrl = "/pricing";
    }
  }

  // Play pleasant audio chime if not silenced
  if (!options.silent) {
    playNotificationSound();
  }

  // 1. Send via Android Native APK JS Interface
  const androidBridge = (window as any).AndroidNotification;
  if (androidBridge) {
    try {
      if (targetUrl && typeof androidBridge.showNotificationWithUrl === "function") {
        androidBridge.showNotificationWithUrl(title, bodyText, targetUrl);
      } else if (typeof androidBridge.showNotification === "function") {
        androidBridge.showNotification(title, bodyText);
      }
      return true;
    } catch (e) {
      console.warn("Android native notification fallback:", e);
    }
  }

  // 2. Send via Web Notification API if permission granted
  if ("Notification" in window && Notification.permission === "granted") {
    try {
      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification(title, {
            body: bodyText,
            icon: defaultIcon,
            badge: options.badge || defaultIcon,
            tag: options.tag || "kynisto-notice",
            data: { ...(options.data || {}), url: targetUrl },
          });
        });
      } else {
        const notif = new Notification(title, {
          body: bodyText,
          icon: defaultIcon,
          tag: options.tag || "kynisto-notice",
          data: { url: targetUrl },
        });

        if (targetUrl) {
          notif.onclick = (e) => {
            e.preventDefault();
            window.focus();
            if (targetUrl.startsWith("/")) {
              window.location.href = targetUrl;
            } else {
              window.open(targetUrl, "_blank");
            }
          };
        }
      }
      return true;
    } catch (err) {
      console.error("Web notification error:", err);
    }
  }

  return false;
}
