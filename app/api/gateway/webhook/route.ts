import { NextRequest, NextResponse } from "next/server";
import { verifyRazorpayWebhookSignature } from "@/lib/razorpay-gateway";
import { verifyOrderWithUtr } from "@/lib/payment-order-store";
import { sendPaymentReceiptSMS } from "@/lib/sms-dispatcher";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json(
        { success: false, error: "Missing X-Razorpay-Signature header" },
        { status: 400 }
      );
    }

    const isValid = verifyRazorpayWebhookSignature(rawBody, signature);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Invalid webhook cryptographic signature" },
        { status: 401 }
      );
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event;

    // Handle payment.captured and order.paid
    if (eventType === "payment.captured" || eventType === "order.paid") {
      const payment = event.payload?.payment?.entity;
      const orderId = payment?.order_id || event.payload?.order?.entity?.id;
      const paymentId = payment?.id;
      const amountRupees = payment?.amount ? payment.amount / 100 : 499;
      const customerContact = payment?.contact;

      if (orderId && paymentId) {
        try {
          await verifyOrderWithUtr(
            orderId,
            paymentId.replace(/^pay_/, "").slice(0, 12).padStart(12, "0"),
            "Razorpay Webhook",
            rawBody
          );

          if (customerContact) {
            await sendPaymentReceiptSMS({
              customerPhone: customerContact,
              orderId,
              amount: amountRupees,
              utr: paymentId,
              planName: "Kynisto Gateway Order",
            });
          }
        } catch (syncErr) {
          console.error("[Razorpay Webhook Order Processing Error]", syncErr);
        }
      }
    }

    return NextResponse.json({ success: true, received: true });
  } catch (error: any) {
    console.error("[Razorpay Webhook Exception]", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Webhook processing error" },
      { status: 500 }
    );
  }
}
