import { NextRequest, NextResponse } from "next/server";
import { parseBankCreditSMS } from "@/lib/upi-sms-parser";
import { matchAndVerifySms } from "@/lib/payment-order-store";

export const dynamic = "force-dynamic";

/**
 * POST /api/payments/sms-webhook
 * Merchant Bank SMS Webhook Receiver
 * Triggered by Android SMS forwarder apps (e.g. SMS Forwarder, Tasker, Macrodroid)
 * or cloud SMS forwarders when FamPay/Bank credit SMS arrives.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawMessage = body.message || body.body || body.text || body.content;
    const sender = body.sender || body.from || body.originatingAddress;
    const secret = body.secret || body.apiKey || req.headers.get("x-sms-webhook-secret");

    const expectedSecret = process.env.PAYMENT_SMS_WEBHOOK_SECRET;
    if (expectedSecret && secret !== expectedSecret) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Invalid webhook secret" },
        { status: 401 }
      );
    }

    if (!rawMessage || typeof rawMessage !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing message body in webhook payload" },
        { status: 400 }
      );
    }

    // Parse the incoming bank/wallet SMS
    const parsed = parseBankCreditSMS(rawMessage, sender);

    if (!parsed.isValid) {
      return NextResponse.json({
        success: false,
        message: "Message received but not identified as valid UPI credit",
        details: parsed,
      });
    }

    // Match against active pending orders
    const matchResult = await matchAndVerifySms(parsed);

    if (!matchResult.success) {
      return NextResponse.json({
        success: false,
        message: "Bank SMS parsed successfully, but could not reconcile order",
        error: matchResult.error,
        parsed,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Payment successfully auto-verified via Bank SMS!",
      verifiedOrder: matchResult.verifiedOrder?.orderId,
      amount: matchResult.verifiedOrder?.amount,
      utr: matchResult.verifiedOrder?.utr,
      bank: parsed.bank,
    });
  } catch (error: any) {
    console.error("[SMS Webhook Exception]", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error in SMS webhook" },
      { status: 500 }
    );
  }
}
