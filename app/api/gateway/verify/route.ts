import { NextRequest, NextResponse } from "next/server";
import { verifyAndProcessRazorpayPayment } from "@/lib/razorpay-gateway";
import { verifyOrderWithUtr } from "@/lib/payment-order-store";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      customerPhone,
      customerEmail,
      amount,
      title,
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required Razorpay parameters (order_id, payment_id, or signature).",
        },
        { status: 400 }
      );
    }

    const verification = await verifyAndProcessRazorpayPayment({
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      customerPhone,
      customerEmail,
      amount: Number(amount) || 499,
      title: title || "Kynisto Order",
    });

    if (!verification.isValid) {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          error: verification.error || "Payment verification failed",
        },
        { status: 400 }
      );
    }

    // Synchronize with Kynisto Payment Ledger
    try {
      await verifyOrderWithUtr(
        razorpay_order_id,
        // If razorpay_payment_id starts with "pay_", extract numeric or hash suffix for 12-digit ledger
        razorpay_payment_id.replace(/^pay_/, "").slice(0, 12).padStart(12, "0"),
        "Razorpay Gateway",
        JSON.stringify({ razorpay_order_id, razorpay_payment_id })
      );
    } catch {
      // Non-blocking ledger sync
    }

    return NextResponse.json({
      success: true,
      verified: true,
      paymentId: verification.paymentId,
      orderId: verification.orderId,
      timestamp: verification.timestamp,
      smsDispatched: verification.smsDispatched,
    });
  } catch (error: any) {
    console.error("[Razorpay Verify Route Error]", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error during verification" },
      { status: 500 }
    );
  }
}
