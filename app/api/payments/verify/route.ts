import { NextRequest, NextResponse } from "next/server";
import { getPaymentOrder, verifyOrderWithUtr } from "@/lib/payment-order-store";
import { parseBankCreditSMS, isValidUTR } from "@/lib/upi-sms-parser";

export const dynamic = "force-dynamic";

/**
 * GET: Polling endpoint for real-time auto-verification
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "Missing orderId query parameter" },
        { status: 400 }
      );
    }

    const order = getPaymentOrder(orderId);
    if (!order) {
      return NextResponse.json({
        success: true,
        orderId,
        status: "pending",
        verified: false,
      });
    }

    return NextResponse.json({
      success: true,
      orderId: order.orderId,
      status: order.status,
      verified: order.status === "verified",
      amount: order.amount,
      utr: order.utr || null,
      bankName: order.bankName || null,
      verifiedAt: order.verifiedAt || null,
    });
  } catch (error: any) {
    console.error("[Verify GET Error]", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Verification polling error" },
      { status: 500 }
    );
  }
}

/**
 * POST: Manual UTR or Bank SMS verification
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { orderId, utr, smsText, customerPhone } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "Missing required orderId" },
        { status: 400 }
      );
    }

    let extractedUtr = (utr || "").trim();
    let bankName = "UPI Bank";
    let rawSms = smsText;

    // If user pasted bank SMS text message, parse it
    if (smsText && typeof smsText === "string" && smsText.trim().length > 0) {
      const parsedSms = parseBankCreditSMS(smsText);
      if (!parsedSms.isValid) {
        return NextResponse.json(
          {
            success: false,
            error:
              parsedSms.error ||
              "Could not parse valid UPI credit details from the provided SMS text.",
          },
          { status: 422 }
        );
      }
      extractedUtr = parsedSms.utr!;
      bankName = parsedSms.bank;
    }

    if (!extractedUtr || !isValidUTR(extractedUtr)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid 12-digit UPI UTR. Please ensure you entered the complete 12-digit transaction reference number.",
        },
        { status: 422 }
      );
    }

    // Attach phone number if passed
    const existingOrder = getPaymentOrder(orderId);
    if (existingOrder && customerPhone && !existingOrder.customerPhone) {
      existingOrder.customerPhone = customerPhone;
    }

    const verificationResult = await verifyOrderWithUtr(
      orderId,
      extractedUtr,
      bankName,
      rawSms
    );

    if (!verificationResult.success) {
      return NextResponse.json(
        { success: false, error: verificationResult.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      verified: true,
      order: verificationResult.order,
    });
  } catch (error: any) {
    console.error("[Verify POST Error]", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Verification failed" },
      { status: 500 }
    );
  }
}
