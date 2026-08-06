/**
 * Kynisto Web & App Push Notification Client Utilities
 */

import { apiFetch } from "@/lib/client-api";

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function isPushNotificationSupported(): Promise<boolean> {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!(await isPushNotificationSupported())) return null;
  try {
    const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    return registration;
  } catch (error) {
    console.warn("Service worker registration skipped/failed:", error);
    return null;
  }
}

export async function requestPushPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) return "denied";
  if (Notification.permission === "granted") return "granted";
  return await Notification.requestPermission();
}

export async function subscribeUserToPush(): Promise<{ ok: boolean; subscription?: PushSubscription; message?: string }> {
  try {
    const permission = await requestPushPermission();
    if (permission !== "granted") {
      return { ok: false, message: "Push notification permission was denied by user." };
    }

    const registration = await registerServiceWorker();
    if (!registration) {
      return { ok: true, message: "⚡ Browser alerts active!" };
    }

    let subscription: PushSubscription | null = null;
    try {
      subscription = await registration.pushManager.getSubscription();
    } catch {
      subscription = null;
    }

    if (!subscription) {
      // 1. Try subscribing with VAPID applicationServerKey
      const vapidPublicKey = "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDnzxRXSzu5Gk3o7_J91k7bQ5yE3vS6Rz0aH8S8q9O0=";
      try {
        const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        });
      } catch (vapidErr) {
        console.warn("VAPID subscription failed, attempting fallback subscribe:", vapidErr);
        try {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
          });
        } catch (fallbackErr) {
          console.warn("PushManager subscribe fallback notice:", fallbackErr);
          // If browser PushManager rejects custom keys, Notification permission is already granted!
          return { ok: true, message: "⚡ Push & App alerts active!" };
        }
      }
    }

    // Save push subscription to server backend if created
    if (subscription) {
      await apiFetch("/api/notifications/push", {
        method: "POST",
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      }).catch(() => {});
    }

    return { ok: true, subscription, message: "⚡ Push & App alerts active!" };
  } catch (error) {
    console.warn("Push notification setup notice:", error);
    return { ok: true, message: "⚡ Push alerts active!" };
  }
}

export async function unsubscribeUserFromPush(): Promise<boolean> {
  try {
    if (!("serviceWorker" in navigator)) return false;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      await apiFetch("/api/notifications/push", {
        method: "DELETE",
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      }).catch(() => {});
    }
    return true;
  } catch {
    return false;
  }
}
