import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  getMarketplaceFeatures,
  getMarketplaceCombos,
  saveMarketplaceFeature,
  saveMarketplaceCombo,
  deleteMarketplaceFeature,
  deleteMarketplaceCombo,
} from "@/lib/subscriptions";

export const dynamic = "force-dynamic";

async function verifyAdmin() {
  const session = await getSessionUser();
  if (!session || session.user.role !== "admin") {
    return false;
  }
  return true;
}

export async function GET(request: Request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
  }

  try {
    const [features, combos] = await Promise.all([
      getMarketplaceFeatures(false),
      getMarketplaceCombos(false),
    ]);

    return NextResponse.json({
      success: true,
      features,
      combos,
    });
  } catch (error: any) {
    console.error("Admin marketplace GET error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch admin marketplace items" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const action = body.action || "";
    const type = (body.type || body.itemType || "").toLowerCase();

    if (action === "delete" || body.isDelete) {
      if (type === "combo") {
        await deleteMarketplaceCombo(body.id);
      } else {
        await deleteMarketplaceFeature(body.id);
      }
      return NextResponse.json({ success: true, message: "Item deleted successfully" });
    }

    if (type === "combo" || action === "create_combo" || action === "update_combo") {
      if (!body.name) {
        return NextResponse.json({ error: "Combo name is required" }, { status: 400 });
      }
      const combo = await saveMarketplaceCombo(body);
      return NextResponse.json({ success: true, item: combo, type: "combo" });
    } else {
      if (!body.name) {
        return NextResponse.json({ error: "Feature name is required" }, { status: 400 });
      }
      const feature = await saveMarketplaceFeature(body);
      return NextResponse.json({ success: true, item: feature, type: "feature" });
    }
  } catch (error: any) {
    console.error("Admin marketplace POST error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save marketplace item" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  return POST(request);
}

export async function PATCH(request: Request) {
  return POST(request);
}

export async function DELETE(request: Request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get("id");
    let type = searchParams.get("type");

    if (!id) {
      try {
        const body = await request.json();
        id = body.id;
        type = body.type || body.itemType;
      } catch {}
    }

    if (!id) {
      return NextResponse.json({ error: "Missing item ID for deletion" }, { status: 400 });
    }

    if (type === "combo") {
      await deleteMarketplaceCombo(id);
    } else {
      await deleteMarketplaceFeature(id);
    }

    return NextResponse.json({ success: true, message: "Item deleted successfully" });
  } catch (error: any) {
    console.error("Admin marketplace DELETE error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete marketplace item" },
      { status: 500 }
    );
  }
}
