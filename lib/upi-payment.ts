/**
 * ==============================================================================
 * 🇮🇳 Kynisto UPI Payment Engine (Standard NPCI Specification)
 * High-reliability UPI payment URI constructor, Chrome Intent deep-link generator,
 * and browser fallback launcher.
 *
 * Supported Apps: PhonePe, Google Pay (Tez), Paytm, FamPay (FamApp), BHIM, Cred, etc.
 * ==============================================================================
 */

export interface UPIPaymentConfig {
  upiId: string;
  merchantName: string;
  amount: number;
  currency: string;
  orderId: string;
  note?: string;
  url?: string;
  theme?: {
    mode: string;
    background: string;
    cardBackground: string;
    textColor: string;
    accentColor: string;
    borderColor: string;
  };
}

export const defaultPaymentConfig: UPIPaymentConfig = {
  upiId: "YOUR_UPI_ID@upi",
  merchantName: "Kynisto",
  amount: 499,
  currency: "INR",
  orderId: "KYN-1024",
  note: "Kynisto Order #KYN-1024",
};

/**
 * Light-Mode Theme and Payment Configurations
 */
export const lightModeThemeConfig = {
  mode: "light",
  background: "#f8fafc",
  cardBackground: "#ffffff",
  textColor: "#1e293b",
  accentColor: "#2563eb",
  borderColor: "#e2e8f0",
};

export const lightModePaymentConfig: UPIPaymentConfig = {
  ...defaultPaymentConfig,
  theme: lightModeThemeConfig,
};

/**
 * Normalizes user-supplied or button-supplied UPI app identifier.
 * Handles spaces, hyphens, underscores, casing, and common Indian fintech typos
 * (e.g., "google pay", "Google Pay", "g-pay", "phone pay", "patym", "fam pay", "other upi").
 */
export function normalizeUPIApp(app: string = "generic"): string {
  if (!app) return "generic";
  const cleaned = app.toLowerCase().trim().replace(/[\s\-_]+/g, "");
  if (!cleaned || cleaned === "generic" || cleaned === "other" || cleaned === "otherupi" || cleaned === "upi") {
    return "generic";
  }
  if (cleaned === "googlepay" || cleaned === "gpay" || cleaned === "tez") {
    return "googlepay";
  }
  if (cleaned === "phonepay" || cleaned === "phonepe") {
    return "phonepe";
  }
  if (cleaned === "patym" || cleaned === "paytm" || cleaned === "paytmmp") {
    return "paytm";
  }
  if (cleaned === "fampay" || cleaned === "famapp") {
    return "fampay";
  }
  if (cleaned === "amazonpay" || cleaned === "amazon") {
    return "amazonpay";
  }
  if (cleaned === "bhim" || cleaned === "bhimupi") {
    return "bhim";
  }
  if (cleaned === "cred" || cleaned === "credpay") {
    return "cred";
  }
  if (cleaned === "whatsapp" || cleaned === "whatsapppay") {
    return "whatsapp";
  }
  return cleaned;
}

/**
 * Android package identifiers for registered Indian UPI payment applications.
 * Used for Chrome Intent syntax:
 * intent://pay?{query}#Intent;scheme=upi;package={package};end
 */
export const UPI_APP_PACKAGES: Record<string, string> = {
  phonepe: "com.phonepe.app",
  phonepay: "com.phonepe.app",
  paytm: "net.one97.paytm",
  patym: "net.one97.paytm",
  paytmmp: "net.one97.paytm",
  gpay: "com.google.android.apps.nbu.paisa.user",
  googlepay: "com.google.android.apps.nbu.paisa.user",
  tez: "com.google.android.apps.nbu.paisa.user",
  fampay: "com.fampay.in",
  famapp: "com.fampay.in",
  bhim: "in.org.npci.upiapp",
  cred: "com.dreamplug.androidapp",
  amazonpay: "in.amazon.mShop.android.shopping",
  whatsapp: "com.whatsapp",
};

/**
 * Standard URL schemes for direct app launching (primarily iOS and custom schemes).
 */
export const UPI_APP_SCHEMES: Record<string, string> = {
  phonepe: "phonepe://pay?",
  phonepay: "phonepe://pay?",
  paytm: "paytmmp://pay?",
  patym: "paytmmp://pay?",
  paytmmp: "paytmmp://pay?",
  gpay: "tez://upi/pay?",
  googlepay: "tez://upi/pay?",
  tez: "tez://upi/pay?",
  fampay: "fampay://upi/pay?",
  famapp: "fampay://upi/pay?",
  bhim: "upi://pay?",
  cred: "cred://pay?",
  amazonpay: "amazonpay://upi/pay?",
  whatsapp: "whatsapp://pay?",
  generic: "upi://pay?",
};

/**
 * Validates and sanitizes payment configuration against null/undefined inputs,
 * preventing NaN amounts or literal "undefined" query values.
 */
export function sanitizeUPIConfig(
  config?: Partial<UPIPaymentConfig> | null
): UPIPaymentConfig {
  const base = defaultPaymentConfig;
  if (!config) return base;

  const upiId = (config.upiId || base.upiId || "").trim();
  const merchantName = (config.merchantName || base.merchantName || "").trim();
  const rawAmount = Number(config.amount !== undefined ? config.amount : base.amount);
  const amount = isNaN(rawAmount) || rawAmount < 0 ? 0 : rawAmount;
  const currency = (config.currency || base.currency || "INR").trim();
  const orderId = (config.orderId || base.orderId || `KYN-${Date.now()}`).trim();
  const note = config.note || `Kynisto Order #${orderId}`;

  return {
    ...base,
    ...config,
    upiId,
    merchantName,
    amount,
    currency,
    orderId,
    note,
  };
}

/**
 * Builds the standard NPCI compliant UPI query parameter string.
 * Strictly guarantees valid non-empty fields without literal "undefined" or "NaN".
 */
export function getUPIQueryString(
  config?: Partial<UPIPaymentConfig> | null
): string {
  const safeConfig = sanitizeUPIConfig(config);

  const params = new URLSearchParams({
    pa: safeConfig.upiId,
    pn: safeConfig.merchantName,
    am: Number(safeConfig.amount).toFixed(2),
    cu: safeConfig.currency || "INR",
    tn: safeConfig.note || `Kynisto Order #${safeConfig.orderId}`,
    tr: safeConfig.orderId,
  });

  if (safeConfig.url) {
    params.set("url", safeConfig.url);
  }

  return params.toString();
}

/**
 * Constructs an Android Intent URI with package name for direct app launching
 * on Android Chrome, Samsung Internet, and Android WebViews.
 *
 * Syntax: intent://pay?{query}#Intent;scheme=upi;package={package};end
 */
export function getUpiAppIntent(
  app: string = "generic",
  config?: Partial<UPIPaymentConfig> | null
): string {
  const safeConfig = sanitizeUPIConfig(config);
  const query = getUPIQueryString(safeConfig);
  const normalized = normalizeUPIApp(app);

  const packageName = UPI_APP_PACKAGES[normalized];
  if (packageName && normalized !== "generic") {
    return `intent://pay?${query}#Intent;scheme=upi;package=${packageName};end`;
  }

  // Fallback to standard generic upi://pay? for unmapped or generic apps
  return `upi://pay?${query}`;
}

/**
 * Alias for getUpiAppIntent
 */
export const createAndroidUPIIntent = getUpiAppIntent;

/**
 * Resolves standard generic upi://pay fallback link.
 */
export function resolveUPIFallback(
  app: string = "generic",
  config?: Partial<UPIPaymentConfig> | null
): string {
  const safeConfig = sanitizeUPIConfig(config);
  const query = getUPIQueryString(safeConfig);
  return `upi://pay?${query}`;
}

/**
 * Constructs a custom app URI scheme (primarily for iOS or environments
 * where custom schemes are explicitly registered).
 */
export function getUpiAppScheme(
  app: string = "generic",
  config?: Partial<UPIPaymentConfig> | null
): string {
  const safeConfig = sanitizeUPIConfig(config);
  const query = getUPIQueryString(safeConfig);
  const normalized = normalizeUPIApp(app);

  switch (normalized) {
    case "phonepe":
    case "phonepay":
      return `phonepe://pay?${query}`;
    case "paytm":
    case "patym":
    case "paytmmp":
      return `paytmmp://pay?${query}`;
    case "gpay":
    case "googlepay":
    case "tez":
      return `tez://upi/pay?${query}`;
    case "fampay":
    case "famapp":
      return `fampay://upi/pay?${query}`;
    case "amazonpay":
      return `amazonpay://upi/pay?${query}`;
    case "cred":
      return `cred://pay?${query}`;
    case "whatsapp":
      return `whatsapp://pay?${query}`;
    case "generic":
    default:
      return `upi://pay?${query}`;
  }
}

/**
 * Detects whether the current runtime is a mobile device (Android/iOS/tablet).
 * Includes detection for modern iPadOS devices.
 */
export function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = (navigator.userAgent || "").toLowerCase();
  const isTouchDevice = typeof navigator !== "undefined" && (navigator.maxTouchPoints || 0) > 1;
  const isIPadOS = /macintosh/i.test(ua) && isTouchDevice;
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua) || isIPadOS;
}

/**
 * Detects whether the current client is Android.
 */
export function isAndroid(): boolean {
  if (typeof navigator === "undefined") return false;
  return /android/i.test(navigator.userAgent || "");
}

/**
 * Detects whether the current client is iOS (including iPadOS).
 */
export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = (navigator.userAgent || "").toLowerCase();
  const isIPadOS = /macintosh/i.test(ua) && (navigator.maxTouchPoints || 0) > 1;
  return /iphone|ipad|ipod/i.test(ua) || isIPadOS;
}

/**
 * Constructs a valid standard NPCI UPI Payment URI.
 *
 * - On Android devices (mobile Chrome/WebViews), returns the Android Intent URI
 *   with the specific app package to bypass Chrome's protocol blocking.
 * - On iOS, desktop, or Node.js environments, returns the custom app scheme or generic URI.
 * - Passing format="intent" or format="scheme" (or useAndroidIntent=true/false) forces a specific format.
 */
export function createUPILink(
  app: string = "generic",
  config?: Partial<UPIPaymentConfig> | null,
  formatOrIntent?: "auto" | "intent" | "scheme" | boolean
): string {
  const safeConfig = sanitizeUPIConfig(config);
  const normalized = normalizeUPIApp(app);

  if (formatOrIntent === true || formatOrIntent === "intent") {
    return getUpiAppIntent(normalized, safeConfig);
  }

  if (formatOrIntent === false || formatOrIntent === "scheme") {
    return getUpiAppScheme(normalized, safeConfig);
  }

  // Format is "auto" or undefined:
  // On Android mobile devices, the Android Intent URI with package name is
  // the gold standard for opening apps directly without ERR_UNKNOWN_URL_SCHEME.
  if (isAndroid()) {
    return getUpiAppIntent(normalized, safeConfig);
  }

  // In Node.js / SSR / iOS / Desktop, return custom scheme or generic upi://
  return getUpiAppScheme(normalized, safeConfig);
}

/**
 * Safely dispatches a deep-link URI in browser environments.
 * Uses a clean anchor element click to preserve user gesture context in modern mobile browsers,
 * falling back to window.location.href.
 * Returns true if dispatched without synchronous error, false otherwise.
 */
export function launchDeepLink(uri: string): boolean {
  if (typeof window === "undefined") return false;

  try {
    if (typeof document !== "undefined" && document.createElement && document.body) {
      const link = document.createElement("a");
      link.href = uri;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        try {
          if (link.parentNode) {
            link.parentNode.removeChild(link);
          }
        } catch {}
      }, 300);
      return true;
    }
  } catch (err) {
    console.debug("[Kynisto UPI] Anchor dispatch failed, falling back to window.location:", err);
  }

  try {
    window.location.href = uri;
    return true;
  } catch (locErr) {
    console.warn("[Kynisto UPI] window.location assignment failed:", locErr);
    return false;
  }
}

export interface TriggerUPIResult {
  targetUrl: string;
  fallbackUrl: string;
  isMobile: boolean;
  isAndroid: boolean;
  isIOS: boolean;
  launched: boolean;
  method: "intent" | "scheme" | "generic" | "desktop_fallback";
}

let activeFallbackTimer: ReturnType<typeof setTimeout> | null = null;
let activeCleanup: (() => void) | null = null;

/**
 * Cancels any active fallback timers and cleans up window/document listeners.
 */
export function resetUPILauncher(): void {
  if (activeFallbackTimer !== null) {
    clearTimeout(activeFallbackTimer);
    activeFallbackTimer = null;
  }
  if (activeCleanup !== null) {
    activeCleanup();
    activeCleanup = null;
  }
}

/**
 * Alias for resetUPILauncher
 */
export const cancelActiveUPILaunch = resetUPILauncher;

/**
 * Bulletproof launcher function for UPI payment apps.
 *
 * 1. First attempts to open the app-targeted URL:
 *    - On Android: Android Intent URI with package name (com.phonepe.app, net.one97.paytm, etc.)
 *    - On iOS: Registered custom scheme (phonepe://, tez://upi/pay, etc.)
 * 2. If on desktop browsers where custom intents aren't supported, seamlessly
 *    falls back to standard upi://pay?... and invokes onFallback.
 * 3. On mobile, monitors page visibility/focus. If the targeted app fails to open within
 *    2000ms (e.g. app not installed or blocked), seamlessly falls back to standard
 *    upi://pay?... and invokes onFallback.
 */
export function triggerUPIApp(
  app: string = "generic",
  config?: Partial<UPIPaymentConfig> | null,
  onFallback?: () => void
): TriggerUPIResult {
  const safeConfig = sanitizeUPIConfig(config);
  const normalized = normalizeUPIApp(app);
  const query = getUPIQueryString(safeConfig);
  const genericUrl = `upi://pay?${query}`;
  const mobile = isMobileDevice();
  const android = isAndroid();
  const ios = isIOS();

  // Clear any existing active launcher timer from a previous click
  resetUPILauncher();

  // Server-Side Rendering (Node.js) Guard
  if (typeof window === "undefined") {
    return {
      targetUrl: genericUrl,
      fallbackUrl: genericUrl,
      isMobile: false,
      isAndroid: false,
      isIOS: false,
      launched: false,
      method: "generic",
    };
  }

  // 1. Desktop Browser Handling
  // On desktop (Windows/Mac/Linux), mobile app intents cannot be launched natively.
  // Seamlessly fall back to standard upi://pay?... and trigger onFallback (e.g., QR Code modal).
  if (!mobile) {
    launchDeepLink(genericUrl);
    if (typeof onFallback === "function") {
      onFallback();
    }
    return {
      targetUrl: genericUrl,
      fallbackUrl: genericUrl,
      isMobile: false,
      isAndroid: false,
      isIOS: false,
      launched: true,
      method: "desktop_fallback",
    };
  }

  // 2. Generic UPI Option on Mobile
  // "Other UPI" opens the OS-level app chooser directly via OS-registered upi:// scheme
  if (normalized === "generic") {
    launchDeepLink(genericUrl);
    return {
      targetUrl: genericUrl,
      fallbackUrl: genericUrl,
      isMobile: true,
      isAndroid: android,
      isIOS: ios,
      launched: true,
      method: "generic",
    };
  }

  // 3. App-Targeted URL for Mobile Devices
  // On Android, use intent:// URI with package name to launch directly
  // On iOS, use custom URL scheme
  const targetUrl = android
    ? getUpiAppIntent(normalized, safeConfig)
    : getUpiAppScheme(normalized, safeConfig);

  const launchMethod = android ? "intent" : "scheme";

  // Track if user was switched away from the browser (meaning the app successfully launched)
  let appSwitchedAway = false;

  const cleanup = () => {
    if (typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    }
    if (typeof window !== "undefined") {
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("pagehide", onPageHide);
    }
  };

  const onVisibilityChange = () => {
    if (typeof document !== "undefined" && document.hidden) {
      appSwitchedAway = true;
      // App opened and browser was backgrounded -> cancel watchdog timer immediately
      if (activeFallbackTimer !== null) {
        clearTimeout(activeFallbackTimer);
        activeFallbackTimer = null;
      }
      cleanup();
      activeCleanup = null;
    }
  };

  const onBlur = () => {
    appSwitchedAway = true;
  };

  const onPageHide = () => {
    appSwitchedAway = true;
    if (activeFallbackTimer !== null) {
      clearTimeout(activeFallbackTimer);
      activeFallbackTimer = null;
    }
    cleanup();
    activeCleanup = null;
  };

  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", onVisibilityChange, { passive: true });
  }
  window.addEventListener("blur", onBlur, { passive: true });
  window.addEventListener("pagehide", onPageHide, { passive: true });

  activeCleanup = cleanup;

  // First: attempt to launch the app-targeted URL
  const dispatched = launchDeepLink(targetUrl);
  if (!dispatched) {
    // If target URL dispatch failed immediately (e.g. security error or unsupported protocol),
    // fall back immediately to standard upi://pay?...
    console.warn(`[Kynisto UPI] Immediate launch failed for ${app}, trying fallback.`);
    cleanup();
    activeCleanup = null;
    launchDeepLink(genericUrl);
    if (typeof onFallback === "function") {
      onFallback();
    }
    return {
      targetUrl,
      fallbackUrl: genericUrl,
      isMobile: true,
      isAndroid: android,
      isIOS: ios,
      launched: true,
      method: launchMethod,
    };
  }

  // Second: Watchdog timer for app failure fallback.
  // If the app is installed, the OS switches windows within 500-1200ms.
  // If the page remains visible and active after 2000ms, the app failed to open.
  activeFallbackTimer = setTimeout(() => {
    cleanup();
    activeCleanup = null;
    activeFallbackTimer = null;

    if (typeof window === "undefined") return;

    const isStillVisible = typeof document !== "undefined" ? !document.hidden : true;
    if (!appSwitchedAway && isStillVisible) {
      console.warn(
        `[Kynisto UPI] Targeted app "${app}" did not launch within timeout. Seamlessly falling back to standard upi://.`
      );
      launchDeepLink(genericUrl);
      if (typeof onFallback === "function") {
        onFallback();
      }
    }
  }, 2000);

  if (typeof activeFallbackTimer === "object" && activeFallbackTimer !== null && typeof (activeFallbackTimer as any)?.unref === "function") {
    (activeFallbackTimer as any).unref();
  }

  return {
    targetUrl,
    fallbackUrl: genericUrl,
    isMobile: true,
    isAndroid: android,
    isIOS: ios,
    launched: true,
    method: launchMethod,
  };
}

/**
 * Universal alias for triggerUPIApp
 */
export const openUPIPayment = triggerUPIApp;

/**
 * Calculates cart price, delivery charges, discounts, and total formatted price.
 * Non-negative, rounding-safe currency calculation.
 */
export function calculateUPIPrice(
  subtotal: number,
  deliveryFee: number = 0,
  discount: number = 0
) {
  const safeSubtotal = Math.max(0, Number(subtotal) || 0);
  const safeDelivery = Math.max(0, Number(deliveryFee) || 0);
  const safeDiscount = Math.max(0, Number(discount) || 0);
  const total = Math.max(0, Math.round((safeSubtotal + safeDelivery - safeDiscount) * 100) / 100);

  return {
    subtotal: safeSubtotal,
    deliveryFee: safeDelivery,
    discount: safeDiscount,
    total,
    formattedTotal: total.toFixed(2),
  };
}
