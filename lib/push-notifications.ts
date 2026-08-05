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
      return { ok: false, message: "Service worker is not supported on this browser." };
    }

    // Default VAPID key for local / fallback push subscriptions
    const vapidKey = "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDnzxRXSzu5Gk3o7_J91k7bQ5yE3vS6Rz0aH8S8q9O0=";
    const applicationServerKey = urlBase64ToUint8Array(vapidKey);

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
    }

    // Save push subscription to server backend
    await apiFetch("/api/notifications/push", {
      method: "POST",
      body: JSON.stringify({ subscription: subscription.toJSON() }),
    }).catch(() => {});

    return { ok: true, subscription };
  } catch (error) {
    console.error("Push subscription error:", error);
    return { ok: false, message: error instanceof Error ? error.message : "Failed to subscribe to Push notifications." };
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
