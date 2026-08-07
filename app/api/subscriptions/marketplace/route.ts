import { NextResponse } from "next/server";
import { getMarketplaceFeatures, getMarketplaceCombos } from "@/lib/subscriptions";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [features, combos] = await Promise.all([
      getMarketplaceFeatures(true),
      getMarketplaceCombos(true),
    ]);

    return NextResponse.json({
      success: true,
      features,
      combos,
    });
  } catch (error: any) {
    console.error("Public marketplace fetch error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch marketplace items" },
      { status: 500 }
    );
  }
}
