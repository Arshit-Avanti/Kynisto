import { getD1 } from "@/db/runtime";
import { requireApiPermission } from "@/lib/auth";
import { ensureHealthcareTables } from "@/lib/healthcare";
import { requireOwnedStore, writeAudit } from "@/lib/ownership";
import { apiError, HttpError, noStoreJson } from "@/lib/security";
import { cleanText, safeJson } from "@/lib/validation";
import {
  ensurePrescriptionTables,
  getDefaultTemplateLayout,
  type PrescriptionTemplateLayout,
} from "@/lib/prescriptions";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await ensureHealthcareTables();
    await ensurePrescriptionTables();
    const db = getD1();
    const url = new URL(request.url);
    const storeId = cleanText(url.searchParams.get("storeId"), "Clinic", { max: 80 });

    const store = await db
      .prepare("SELECT id, name, address, phone, logo_url FROM stores WHERE id = ?")
      .bind(storeId)
      .first<any>();

    if (!store) throw new HttpError(404, "Clinic not found.", "NOT_FOUND");

    const templateRow = await db
      .prepare("SELECT * FROM healthcare_prescription_templates WHERE store_id = ? AND is_default = 1 LIMIT 1")
      .bind(storeId)
      .first<any>();

    let layout: PrescriptionTemplateLayout;
    if (templateRow?.layout_json) {
      try {
        layout = JSON.parse(templateRow.layout_json);
      } catch {
        layout = getDefaultTemplateLayout({
          name: store.name,
          address: store.address,
          phone: store.phone,
          logoUrl: store.logo_url,
        });
      }
    } else {
      layout = getDefaultTemplateLayout({
        name: store.name,
        address: store.address,
        phone: store.phone,
        logoUrl: store.logo_url,
      });
    }

    return noStoreJson({
      template: {
        id: templateRow?.id || "default",
        name: templateRow?.name || "Standard Clinical Rx",
        isDefault: true,
        layout,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await ensureHealthcareTables();
    await ensurePrescriptionTables();
    const session = await requireApiPermission(request, "queue.manage_own", { csrf: true });
    const body = await safeJson(request);
    const storeId = cleanText(body.storeId, "Clinic", { max: 80 });

    if (session.user.role !== "admin") {
      await requireOwnedStore(session.user.id, storeId);
    }

    const db = getD1();
    const name = cleanText(body.name ?? "Clinic Prescription Template", "Template Name", { min: 2, max: 100 });
    const layout = body.layout as PrescriptionTemplateLayout;
    if (!layout || typeof layout !== "object") {
      throw new HttpError(400, "Valid template layout data is required.", "INVALID_LAYOUT");
    }

    const templateId = cleanText(body.templateId, "Template ID", { max: 80, required: false }) || `tmpl-${crypto.randomUUID()}`;
    const isDefault = body.isDefault !== false;
    const isDefaultNum = isDefault ? 1 : 0;
    const now = Math.floor(Date.now() / 1000);

    if (isDefault) {
      await db.prepare("UPDATE healthcare_prescription_templates SET is_default = 0 WHERE store_id = ?").bind(storeId).run();
    }

    await db.prepare(`
      INSERT INTO healthcare_prescription_templates (
        id, store_id, name, is_default, layout_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        is_default = excluded.is_default,
        layout_json = excluded.layout_json,
        updated_at = excluded.updated_at
    `).bind(templateId, storeId, name, isDefaultNum, JSON.stringify(layout), now, now).run();

    await writeAudit(request, session.user.id, "healthcare.template.saved", "store", storeId, {
      templateId,
      name,
      isDefault,
    });

    return noStoreJson({
      ok: true,
      template: {
        id: templateId,
        name,
        isDefault,
        layout,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
