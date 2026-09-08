import { getD1 } from "@/db/runtime";
import { ensureSeeded } from "@/db/seed";
import { kynistoTriageSymptoms, getKynistoPythonStatus } from "@/lib/kynisto-python";
import { cleanText } from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * 🐍 Python Clinical Triage & Specialty Matching API
 * Standardized Emergency Severity Index (ESI 1-5) evaluation
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const symptoms = cleanText(body.symptoms, "Symptoms", { max: 1000, required: true });
    const age = typeof body.age === "number" ? Math.max(0, Math.min(120, body.age)) : undefined;
    const durationHours = typeof body.durationHours === "number" ? Math.max(1, body.durationHours) : undefined;

    const triage = kynistoTriageSymptoms(symptoms, age, durationHours);

    // Find doctors or clinics matching the triage specialty
    await ensureSeeded();
    const db = getD1();

    const clinics = await db
      .prepare(
        `SELECT s.id, s.name, s.slug, s.address, s.area, s.city, s.rating_average AS ratingAverage,
                hp.provider_type AS providerType,
                hqs.status AS queueStatus,
                hqs.current_token_number AS currentTokenNumber,
                (SELECT COUNT(*) FROM healthcare_queue_entries e WHERE e.store_id = s.id AND e.status = 'waiting') AS waitingCount
         FROM stores s
         JOIN categories c ON c.id = s.category_id
         LEFT JOIN healthcare_provider_profiles hp ON hp.store_id = s.id
         LEFT JOIN healthcare_queue_settings hqs ON hqs.store_id = s.id
         WHERE (
           c.module = 'healthcare' 
           OR s.name LIKE ? 
           OR s.description LIKE ?
           OR c.name LIKE ?
         )
         AND s.status IN ('approved', 'active')
         LIMIT 6`,
      )
      .bind(
        `%${triage.primaryDepartment}%`,
        `%${triage.primaryDepartment}%`,
        `%${triage.primaryDepartment}%`
      )
      .all();

    return Response.json(
      {
        ok: true,
        triage,
        recommendedClinics: clinics.results || [],
      },
      {
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      }
    );
  } catch (error: any) {
    return Response.json(
      {
        ok: false,
        error: error.message || "Failed to process symptom triage",
      },
      { status: 400 }
    );
  }
}

export async function GET() {
  return Response.json({
    ok: true,
    engine: getKynistoPythonStatus(),
  });
}
