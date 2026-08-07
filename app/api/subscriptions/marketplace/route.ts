import { NextResponse } from "next/server";
import { getMarketplaceFeatures, getMarketplaceCombos } from "@/lib/subscriptions";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("includeInactive") === "true";

    const [features, combos] = await Promise.all([
      getMarketplaceFeatures(!includeInactive),
      getMarketplaceCombos(!includeInactive),
    ]);

    return NextResponse.json({
      success: true,
      features,
      combos,
    });
  } catch (error: any) {
    console.error("Marketplace fetch error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load marketplace items" },
      { status: 500 }
    );
  }
}
