import test from "node:test";
import assert from "node:assert/strict";
import {
  defaultPaymentConfig as paymentConfig,
  lightModePaymentConfig,
  lightModeThemeConfig,
  UPI_APP_PACKAGES,
  createUPILink,
  createAndroidUPIIntent,
  getUpiAppIntent,
  getUpiAppScheme,
  resolveUPIFallback,
  calculateUPIPrice,
  triggerUPIApp,
  cancelActiveUPILaunch,
} from "../lib/upi-payment.ts";

test("1. Kynisto UPI Payment Configuration", () => {
  assert.equal(paymentConfig.upiId, "YOUR_UPI_ID@upi");
  assert.equal(paymentConfig.merchantName, "Kynisto");
  assert.equal(paymentConfig.amount, 499);
  assert.equal(paymentConfig.currency, "INR");
  assert.equal(paymentConfig.orderId, "KYN-1024");
});

test("2. Generic UPI Payment Deep Link Construction", () => {
  const link = createUPILink("generic");
  assert.ok(link.startsWith("upi://pay?"), `Expected upi://pay? prefix, got: ${link}`);
  assert.ok(link.includes("pa=YOUR_UPI_ID%40upi"), "Missing encoded Payee VPA");
  assert.ok(link.includes("pn=Kynisto"), "Missing Payee Name");
  assert.ok(link.includes("am=499.00"), "Missing formatted Amount");
  assert.ok(link.includes("cu=INR"), "Missing INR currency");
  assert.ok(link.includes("tr=KYN-1024"), "Missing Order Reference");
});

test("3. App-Specific Custom URI Scheme Construction", () => {
  const phonePe = createUPILink("phonepe");
  assert.ok(phonePe.startsWith("phonepe://pay?"), "PhonePe scheme mismatch");

  const paytm = createUPILink("paytm");
  assert.ok(paytm.startsWith("paytmmp://pay?"), "Paytm scheme mismatch");

  const gpay = createUPILink("gpay");
  assert.ok(gpay.startsWith("tez://upi/pay?"), "Google Pay scheme mismatch");

  const famPay = createUPILink("fampay");
  assert.ok(famPay.startsWith("fampay://upi/pay?"), "FamPay scheme mismatch");
});

test("4. Android Package Intent Formats for Indian UPI Apps", () => {
  // PhonePe Intent Verification
  assert.equal(UPI_APP_PACKAGES.phonepe, "com.phonepe.app");
  const phonePeIntent = createAndroidUPIIntent("phonepe");
  assert.ok(phonePeIntent.startsWith("intent://pay?"), "PhonePe intent must start with intent://pay?");
  assert.ok(phonePeIntent.includes("#Intent;scheme=upi;package=com.phonepe.app;end"), "PhonePe package intent mismatch");
  assert.ok(phonePeIntent.includes("pa=YOUR_UPI_ID%40upi"), "PhonePe payee VPA missing");
  assert.ok(phonePeIntent.includes("am=499.00"), "PhonePe formatted amount missing");

  // Google Pay Intent Verification (gpay and googlepay aliases)
  assert.equal(UPI_APP_PACKAGES.gpay, "com.google.android.apps.nbu.paisa.user");
  assert.equal(UPI_APP_PACKAGES.googlepay, "com.google.android.apps.nbu.paisa.user");
  const gpayIntent = createAndroidUPIIntent("gpay");
  assert.ok(gpayIntent.startsWith("intent://pay?"), "GPay intent must start with intent://pay?");
  assert.ok(gpayIntent.includes("package=com.google.android.apps.nbu.paisa.user"), "Google Pay package intent mismatch");

  const googlePayAliasIntent = createAndroidUPIIntent("googlepay");
  assert.ok(googlePayAliasIntent.includes("package=com.google.android.apps.nbu.paisa.user"), "Google Pay alias intent mismatch");

  // Paytm Intent Verification
  assert.equal(UPI_APP_PACKAGES.paytm, "net.one97.paytm");
  const paytmIntent = createAndroidUPIIntent("paytm");
  assert.ok(paytmIntent.startsWith("intent://pay?"), "Paytm intent must start with intent://pay?");
  assert.ok(paytmIntent.includes("package=net.one97.paytm"), "Paytm package intent mismatch");

  // FamPay Intent Verification
  assert.equal(UPI_APP_PACKAGES.fampay, "com.fampay.in");
  const famPayIntent = createAndroidUPIIntent("fampay");
  assert.ok(famPayIntent.startsWith("intent://pay?"), "FamPay intent must start with intent://pay?");
  assert.ok(famPayIntent.includes("package=com.fampay.in"), "FamPay package intent mismatch");

  // createUPILink with useAndroidIntent flag = true
  const linkWithIntentFlag = createUPILink("fampay", paymentConfig, true);
  assert.equal(linkWithIntentFlag, famPayIntent, "createUPILink with intent flag should match createAndroidUPIIntent");
});

test("5. Standard upi://pay Fallback Resolution", () => {
  // Test resolveUPIFallback across all named apps
  const apps = ["phonepe", "gpay", "googlepay", "paytm", "fampay", "generic", "unknown_app"];
  for (const app of apps) {
    const fallbackLink = resolveUPIFallback(app);
    assert.ok(fallbackLink.startsWith("upi://pay?"), `Expected upi://pay? fallback for app "${app}"`);
    assert.ok(fallbackLink.includes("pa=YOUR_UPI_ID%40upi"), "Fallback must contain payee VPA");
    assert.ok(fallbackLink.includes("am=499.00"), "Fallback must contain amount");
    assert.ok(fallbackLink.includes("cu=INR"), "Fallback must contain INR currency");
  }

  // Preserve original globals for restoration
  const originalNavigator = globalThis.navigator;
  const originalWindow = globalThis.window;
  const originalDocument = globalThis.document;

  const setMockNavigator = (ua) => {
    Object.defineProperty(globalThis, "navigator", {
      value: { userAgent: ua },
      configurable: true,
      writable: true,
    });
  };

  try {
    // Test Case A: Desktop Browser (Windows PC)
    globalThis.window = {
      location: { href: "" },
      addEventListener: () => {},
      removeEventListener: () => {},
    };
    globalThis.document = {
      hidden: false,
      createElement: () => ({ click: () => {}, style: {}, setAttribute: () => {} }),
      body: { appendChild: () => {}, removeChild: () => {} },
      addEventListener: () => {},
      removeEventListener: () => {},
    };
    setMockNavigator("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0");

    let desktopFallbackFired = false;
    const desktopResult = triggerUPIApp("phonepe", paymentConfig, () => {
      desktopFallbackFired = true;
    });

    assert.equal(desktopResult.isMobile, false, "Desktop user agent should not be mobile");
    assert.equal(desktopResult.method, "desktop_fallback");
    assert.equal(desktopFallbackFired, true, "Desktop launch should immediately invoke fallback");
    assert.ok(desktopResult.fallbackUrl.startsWith("upi://pay?"));

    // Test Case B: Android Mobile Browser (Chrome on Android)
    setMockNavigator("Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/125.0.0.0 Mobile");

    const androidResult = triggerUPIApp("fampay", paymentConfig);
    assert.equal(androidResult.isMobile, true);
    assert.equal(androidResult.isAndroid, true);
    assert.equal(androidResult.method, "intent");
    assert.ok(androidResult.targetUrl.startsWith("intent://pay?"));
    assert.ok(androidResult.targetUrl.includes("package=com.fampay.in"));

    // Test Case C: Android Mobile Generic UPI
    const genericAndroidResult = triggerUPIApp("generic", paymentConfig);
    assert.equal(genericAndroidResult.method, "generic");
    assert.ok(genericAndroidResult.targetUrl.startsWith("upi://pay?"));

    // Test Case D: iOS Safari (iPhone)
    setMockNavigator("Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1");

    const iosResult = triggerUPIApp("paytm", paymentConfig);
    assert.equal(iosResult.isMobile, true);
    assert.equal(iosResult.isIOS, true);
    assert.equal(iosResult.method, "scheme");
    assert.ok(iosResult.targetUrl.startsWith("paytmmp://pay?"));

    const unknownIntentFallback = createAndroidUPIIntent("unknown_wallet_app");
    assert.ok(unknownIntentFallback.startsWith("upi://pay?"), "Unknown app should fallback to upi://pay?");
  } finally {
    cancelActiveUPILaunch();
    if (originalWindow !== undefined) globalThis.window = originalWindow;
    else delete globalThis.window;
    if (originalDocument !== undefined) globalThis.document = originalDocument;
    else delete globalThis.document;
    if (originalNavigator !== undefined) {
      Object.defineProperty(globalThis, "navigator", {
        value: originalNavigator,
        configurable: true,
        writable: true,
      });
    }
  }
});

test("6. Accurate Price Calculations and Currency Formatting", () => {
  // Base cart price calculation
  const calc1 = calculateUPIPrice(499, 0, 0);
  assert.equal(calc1.subtotal, 499);
  assert.equal(calc1.deliveryFee, 0);
  assert.equal(calc1.discount, 0);
  assert.equal(calc1.total, 499);
  assert.equal(calc1.formattedTotal, "499.00");

  // Cart with delivery fee and membership discount
  const calc2 = calculateUPIPrice(500, 40, 50);
  assert.equal(calc2.subtotal, 500);
  assert.equal(calc2.deliveryFee, 40);
  assert.equal(calc2.discount, 50);
  assert.equal(calc2.total, 490);
  assert.equal(calc2.formattedTotal, "490.00");

  // Discount exceeding total (must clamp to 0)
  const calc3 = calculateUPIPrice(100, 0, 150);
  assert.equal(calc3.total, 0);
  assert.equal(calc3.formattedTotal, "0.00");

  // Precision check with floating point values
  const calc4 = calculateUPIPrice(249.5, 0, 0);
  assert.equal(calc4.formattedTotal, "249.50");
});

test("7. UPI URL Parameter Encoding & Complex Notes", () => {
  const customConfig = {
    upiId: "merchant.kynisto@icici",
    merchantName: "Kynisto Daily Mart & Store",
    amount: 1250.75,
    currency: "INR",
    orderId: "KYN-SUB-9921",
    note: "Kynisto Store Owner Membership #9921 / Express Delivery",
  };

  const uri = createUPILink("generic", customConfig);
  assert.ok(uri.includes("pa=merchant.kynisto%40icici"), "Email-style UPI ID properly encoded");
  assert.ok(uri.includes("pn=Kynisto+Daily+Mart+%26+Store"), "Special characters in merchant name encoded");
  assert.ok(uri.includes("am=1250.75"), "Decimal amount properly formatted");
  assert.ok(uri.includes("tr=KYN-SUB-9921"), "Custom order ID present");
  assert.ok(uri.includes("tn=Kynisto+Store+Owner+Membership+%239921+%2F+Express+Delivery"), "Order note encoded");

  // Intent format also encodes correctly
  const intentUri = createAndroidUPIIntent("phonepe", customConfig);
  assert.ok(intentUri.startsWith("intent://pay?"), "Intent must start with intent://pay?");
  assert.ok(intentUri.includes("package=com.phonepe.app"), "Correct package");
  assert.ok(intentUri.includes("am=1250.75"), "Correct amount in intent");
});

test("8. Light-Mode Compatible Configurations", () => {
  // Verify theme configuration matches clean light mode standards
  assert.equal(lightModeThemeConfig.mode, "light");
  assert.equal(lightModeThemeConfig.background, "#f8fafc", "Background should be slate-50");
  assert.equal(lightModeThemeConfig.cardBackground, "#ffffff", "Card background should be crisp white");
  assert.equal(lightModeThemeConfig.textColor, "#1e293b", "Text color should be high-contrast slate-800");
  assert.equal(lightModeThemeConfig.accentColor, "#2563eb", "Accent should be brand blue-600");
  assert.equal(lightModeThemeConfig.borderColor, "#e2e8f0", "Border should be slate-200");

  // Verify lightModePaymentConfig integrity
  assert.equal(lightModePaymentConfig.upiId, "YOUR_UPI_ID@upi");
  assert.equal(lightModePaymentConfig.merchantName, "Kynisto");
  assert.equal(lightModePaymentConfig.amount, 499);
  assert.equal(lightModePaymentConfig.currency, "INR");
  assert.equal(lightModePaymentConfig.theme.mode, "light");
});
