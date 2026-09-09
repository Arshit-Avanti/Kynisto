import { NextRequest, NextResponse } from "next/server";
import { createRazorpayOrder } from "@/lib/razorpay-gateway";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { amount, receipt, notes, title } = body;

    const safeAmount = Math.max(1, Number(amount) || 499);
    const safeReceipt = (receipt || "KYN-" + Date.now().toString(36).toUpperCase()).trim();

    const order = await createRazorpayOrder({
      amount: safeAmount,
      currency: "INR",
      receipt: safeReceipt,
      notes: {
        title: title || "Kynisto Purchase",
        ...notes,
      },
    });

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error: any) {
    console.error("[Razorpay Create Order Route Error]", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to create payment gateway order" },
      { status: 500 }
    );
  }
}
