import { NextRequest, NextResponse } from "next/server";
import { registerPaymentOrder, DEFAULT_MERCHANT_UPI, DEFAULT_MERCHANT_NAME } from "@/lib/payment-order-store";
import { createUPILink, UPIPaymentConfig } from "@/lib/upi-payment";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { amount, title, customerPhone, upiId, merchantName } = body;

    const safeAmount = Math.max(1, Number(amount) || 499);
    const orderId = (body.orderId || "KYN-" + Date.now().toString(36).toUpperCase()).trim();
    const effectiveUpi = (upiId || DEFAULT_MERCHANT_UPI).trim();
    const effectiveMerchant = (merchantName || DEFAULT_MERCHANT_NAME).trim();

    const order = registerPaymentOrder({
      orderId,
      amount: safeAmount,
      customerPhone,
      title: title || "Kynisto VIP Membership",
      upiId: effectiveUpi,
    });

    const paymentConfig: UPIPaymentConfig = {
      upiId: effectiveUpi,
      merchantName: effectiveMerchant,
      amount: safeAmount,
      currency: "INR",
      orderId: order.orderId,
      note: `${order.title} - #${order.orderId}`.slice(0, 70),
    };

    const universalUpiUri = createUPILink("generic", paymentConfig, "scheme");

    return NextResponse.json({
      success: true,
      order: {
        orderId: order.orderId,
        amount: order.amount,
        currency: order.currency,
        title: order.title,
        upiId: order.upiId,
        status: order.status,
        expiresAt: order.expiresAt,
        universalUpiUri,
        qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=8&data=${encodeURIComponent(
          universalUpiUri
        )}`,
      },
    });
  } catch (error: any) {
    console.error("[Create Order Error]", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to create payment order" },
      { status: 500 }
    );
  }
}
