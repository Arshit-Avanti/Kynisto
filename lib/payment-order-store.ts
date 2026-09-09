/**
 * ==============================================================================
 * 🇮🇳 Kynisto Payment Order Ledger & Auto-Verification Matcher
 * In-memory & edge-resilient storage for active payment intents, UTR tracking,
 * and bank SMS reconciliation.
 * ==============================================================================
 */

import type { ParsedBankSMS } from "./upi-sms-parser.ts";
import { sendPaymentReceiptSMS } from "./sms-dispatcher.ts";

export interface PaymentOrder {
  orderId: string;
  amount: number;
  currency: string;
  customerPhone?: string;
  title: string;
  upiId: string;
  status: "pending" | "verified" | "expired" | "failed";
  utr?: string;
  verifiedAt?: string;
  createdAt: number; // Unix epoch ms
  expiresAt: number; // Unix epoch ms (15 minutes default)
  bankName?: string;
  rawSms?: string;
}

// Global edge/runtime memory store
declare global {
  // eslint-disable-next-line no-var
  var __kynistoPaymentOrders: Map<string, PaymentOrder> | undefined;
  // eslint-disable-next-line no-var
  var __kynistoUsedUtrs: Set<string> | undefined;
}

if (!globalThis.__kynistoPaymentOrders) {
  globalThis.__kynistoPaymentOrders = new Map<string, PaymentOrder>();
}

if (!globalThis.__kynistoUsedUtrs) {
  globalThis.__kynistoUsedUtrs = new Set<string>();
}

const orderStore = globalThis.__kynistoPaymentOrders;
const usedUtrs = globalThis.__kynistoUsedUtrs;

export const ORDER_EXPIRATION_MS = 15 * 60 * 1000; // 15 minutes
export const DEFAULT_MERCHANT_UPI = "9315678560@fam";
export const DEFAULT_MERCHANT_NAME = "Kynisto";

/**
 * Registers a new pending payment order.
 */
export function registerPaymentOrder(params: {
  orderId: string;
  amount: number;
  customerPhone?: string;
  title?: string;
  upiId?: string;
}): PaymentOrder {
  const now = Date.now();
  const order: PaymentOrder = {
    orderId: params.orderId.trim(),
    amount: Math.round(Number(params.amount) * 100) / 100,
    currency: "INR",
    customerPhone: params.customerPhone ? params.customerPhone.trim() : undefined,
    title: params.title || "Kynisto Purchase",
    upiId: params.upiId || DEFAULT_MERCHANT_UPI,
    status: "pending",
    createdAt: now,
    expiresAt: now + ORDER_EXPIRATION_MS,
  };

  orderStore.set(order.orderId, order);
  return order;
}

/**
 * Retrieves a payment order by ID.
 */
export function getPaymentOrder(orderId: string): PaymentOrder | null {
  if (!orderId) return null;
  const order = orderStore.get(orderId.trim());
  if (!order) return null;

  // Auto-expire orders after 15 minutes if still pending
  if (order.status === "pending" && Date.now() > order.expiresAt) {
    order.status = "expired";
  }

  return order;
}

/**
 * Checks if a UTR has already been claimed / spent.
 */
export function isUtrAlreadyClaimed(utr: string): boolean {
  if (!utr) return false;
  return usedUtrs.has(utr.trim());
}

/**
 * Verifies a specific order using a 12-digit UTR.
 */
export async function verifyOrderWithUtr(
  orderId: string,
  utr: string,
  bankName: string = "UPI Bank",
  rawSms?: string
): Promise<{ success: boolean; order?: PaymentOrder; error?: string }> {
  const cleanUtr = utr.trim();
  if (!/^[0-9]{12}$/.test(cleanUtr)) {
    return { success: false, error: "Invalid UTR format. Expected 12 numeric digits." };
  }

  if (isUtrAlreadyClaimed(cleanUtr)) {
    return { success: false, error: "This UTR has already been redeemed for another transaction." };
  }

  let order = getPaymentOrder(orderId);
  if (!order) {
    // If order was generated client-side without calling create-order first,
    // auto-register it so the customer transaction isn't dropped!
    order = registerPaymentOrder({
      orderId,
      amount: 499,
      title: "Kynisto Order",
    });
  }

  if (order.status === "verified") {
    return { success: true, order };
  }

  // Mark as verified
  const istDate = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  order.status = "verified";
  order.utr = cleanUtr;
  order.bankName = bankName;
  order.rawSms = rawSms;
  order.verifiedAt = istDate.toISOString();

  // Mark UTR as claimed
  usedUtrs.add(cleanUtr);
  orderStore.set(order.orderId, order);

  // Dispatch customer SMS text message if customerPhone is present
  if (order.customerPhone) {
    try {
      await sendPaymentReceiptSMS({
        customerPhone: order.customerPhone,
        orderId: order.orderId,
        amount: order.amount,
        utr: cleanUtr,
        planName: order.title,
      });
    } catch (smsErr) {
      console.error("[Kynisto SMS] Error dispatching receipt SMS:", smsErr);
    }
  }

  return { success: true, order };
}

/**
 * Reconciles an incoming parsed Bank SMS against active pending orders.
 * Matches by exact ₹ amount and unexpired creation window.
 */
export async function matchAndVerifySms(
  sms: ParsedBankSMS
): Promise<{ success: boolean; verifiedOrder?: PaymentOrder; order?: PaymentOrder; error?: string }> {
  if (!sms.isValid || !sms.amount || !sms.utr) {
    return { success: false, error: sms.error || "Invalid SMS format" };
  }

  if (isUtrAlreadyClaimed(sms.utr)) {
    return { success: false, error: `UTR ${sms.utr} has already been reconciled.` };
  }

  const now = Date.now();
  let candidateOrder: PaymentOrder | null = null;

  // Search in memory for pending order with matching amount created within last 15 minutes
  for (const order of orderStore.values()) {
    if (order.status === "pending" && order.amount === sms.amount && order.expiresAt > now) {
      candidateOrder = order;
      break;
    }
  }

  // If no matching pending order found, create a ledger record for this received payment
  if (!candidateOrder) {
    const unmappedId = "KYN-UNMAPPED-" + Date.now().toString(36).toUpperCase();
    candidateOrder = registerPaymentOrder({
      orderId: unmappedId,
      amount: sms.amount,
      title: "Direct UPI Deposit",
    });
  }

  const res = await verifyOrderWithUtr(
    candidateOrder.orderId,
    sms.utr,
    sms.bank,
    sms.rawMessage
  );

  return {
    success: res.success,
    verifiedOrder: res.order,
    order: res.order,
    error: res.error,
  };
}
