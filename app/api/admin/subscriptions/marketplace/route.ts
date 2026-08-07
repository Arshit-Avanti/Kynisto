import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  getMarketplaceFeatures,
  getMarketplaceCombos,
  saveMarketplaceFeature,
  saveMarketplaceCombo,
  deleteMarketplaceFeature,
  deleteMarketplaceCombo,
  getDbPlans,
  saveDbPlan,
  deleteDbPlan,
  getFeaturePlanPermissionMatrix,
  savePermissionCell,
  saveFullPermissionMatrix,
} from "@/lib/subscriptions";

export const dynamic = "force-dynamic";

async function verifyAdmin() {
  const session = await getSessionUser();
  if (!session || session.user.role !== "admin") {
    return false;
  }
  return true;
}

export async function GET() {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
  }

  try {
    const [plans, features, combos, matrix] = await Promise.all([
      getDbPlans(false),
      getMarketplaceFeatures(false),
      getMarketplaceCombos(false),
      getFeaturePlanPermissionMatrix(),
    ]);

    return NextResponse.json({
      success: true,
      plans,
      features,
      combos,
      matrix,
    });
  } catch (error: any) {
    console.error("Admin marketplace GET error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch admin marketplace data" },
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

    // Handling deletion actions
    if (action === "delete" || body.isDelete) {
      if (type === "plan" || action === "delete_plan") {
        await deleteDbPlan(body.id);
      } else if (type === "combo" || action === "delete_combo") {
        await deleteMarketplaceCombo(body.id);
      } else {
        await deleteMarketplaceFeature(body.id);
      }
      return NextResponse.json({ success: true, message: "Item deleted successfully" });
    }

    // Permission Matrix Actions
    if (action === "toggle_permission" || action === "save_permission_cell") {
      const { planId, featureKey, isEnabled } = body;
      if (!planId || !featureKey) {
        return NextResponse.json({ error: "Missing planId or featureKey" }, { status: 400 });
      }
      await savePermissionCell(planId, featureKey, Boolean(isEnabled));
      return NextResponse.json({ success: true, message: "Permission updated in D1" });
    }

    if (action === "save_matrix") {
      if (!body.matrix || typeof body.matrix !== "object") {
        return NextResponse.json({ error: "Invalid permission matrix object" }, { status: 400 });
      }
      await saveFullPermissionMatrix(body.matrix);
      return NextResponse.json({ success: true, message: "Permission matrix saved to D1" });
    }

    // Plan Actions
    if (type === "plan" || action === "create_plan" || action === "update_plan" || action === "save_plan") {
      if (!body.name) {
        return NextResponse.json({ error: "Plan name is required" }, { status: 400 });
      }
      const plan = await saveDbPlan(body);
      return NextResponse.json({ success: true, item: plan, type: "plan" });
    }

    // Combo Actions
    if (type === "combo" || action === "create_combo" || action === "update_combo" || action === "save_combo") {
      if (!body.name) {
        return NextResponse.json({ error: "Combo name is required" }, { status: 400 });
      }
      const combo = await saveMarketplaceCombo(body);
      return NextResponse.json({ success: true, item: combo, type: "combo" });
    }

    // Feature Actions (default)
    if (!body.name) {
      return NextResponse.json({ error: "Feature name is required" }, { status: 400 });
    }
    const feature = await saveMarketplaceFeature(body);
    return NextResponse.json({ success: true, item: feature, type: "feature" });
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

    if (type === "plan") {
      await deleteDbPlan(id);
    } else if (type === "combo") {
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
