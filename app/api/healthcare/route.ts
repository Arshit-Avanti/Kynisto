import { getD1 } from "@/db/runtime";
import { ensureSeeded } from "@/db/seed";
import { expireHealthcareQueueEntries, HEALTHCARE_LABELS, HEALTHCARE_TYPES, patientQueueState } from "@/lib/healthcare";
import { apiError, noStoreJson } from "@/lib/security";
import { d1SearchText } from "@/lib/validation";

export async function GET(request: Request) {
  try {
    await ensureSeeded();
    await expireHealthcareQueueEntries();
    const params = new URL(request.url).searchParams;
    const conditions = ["s.status = 'approved'", "c.module = 'healthcare'", "hp.verification_status = 'verified'"];
    const bindings: unknown[] = [];
    const type = params.get("type");
    if (type && HEALTHCARE_TYPES.includes(type as never)) { conditions.push("hp.provider_type = ?"); bindings.push(type); }
    const query = d1SearchText((params.get("q") ?? "").replace(/[%_]/g, "").trim());
    if (query) { const pattern = `%${query}%`; conditions.push("(s.name LIKE ? OR s.address LIKE ? OR c.name LIKE ? OR sc.name LIKE ?)"); bindings.push(pattern, pattern, pattern, pattern); }
    if (params.get("queue") === "true") conditions.push("hp.admin_queue_enabled = 1 AND hp.owner_queue_enabled = 1 AND qs.status = 'open'");
    const result = await getD1().prepare(
      `SELECT s.id, s.name, s.slug, s.description, s.address, s.area, s.city, s.state,
        s.latitude, s.longitude, s.phone, s.whatsapp, s.rating_average AS rating,
        s.rating_count AS reviews, s.logo_url AS logoUrl, c.name AS category,
        sc.name AS subcategory, hp.provider_type AS providerType,
        hp.accepting_patients AS acceptingPatients, hp.emergency_available AS emergencyAvailable,
        hp.admin_queue_enabled AS adminQueueEnabled, hp.owner_queue_enabled AS ownerQueueEnabled,
        hp.queue_activation_status AS queueActivationStatus,
        qs.status AS queueStatus, COALESCE((SELECT current.token_number FROM healthcare_queue_entries current
          WHERE current.store_id = s.id AND current.service_date = qs.service_date AND current.status = 'called' LIMIT 1), 0) AS currentTokenNumber,
        qs.consultation_minutes AS consultationMinutes,
        qs.opening_time AS openingTime, qs.closing_time AS closingTime,
        qs.maximum_daily_patients AS maximumDailyPatients,
        (SELECT COUNT(*) FROM healthcare_queue_entries qe WHERE qe.store_id = s.id AND qe.service_date = qs.service_date AND qe.status = 'waiting') AS waitingCount
       FROM stores s JOIN categories c ON c.id = s.category_id
       LEFT JOIN categories sc ON sc.id = s.subcategory_id
       JOIN healthcare_provider_profiles hp ON hp.store_id = s.id
       LEFT JOIN healthcare_queue_settings qs ON qs.store_id = s.id
       WHERE ${conditions.join(" AND ")}
       ORDER BY CASE qs.status WHEN 'open' THEN 0 WHEN 'paused' THEN 1 ELSE 2 END,
         s.rating_average DESC, s.rating_count DESC LIMIT 100`,
    ).bind(...bindings).all();
    return noStoreJson({
      items: result.results ?? [],
      types: HEALTHCARE_TYPES.map((value) => ({ value, label: HEALTHCARE_LABELS[value] })),
    });
  } catch (error) { return apiError(error); }
}

export async function HEAD(request: Request) {
  try {
    const storeId = new URL(request.url).searchParams.get("storeId");
    if (storeId) await patientQueueState(storeId);
    return new Response(null, { status: 204 });
  } catch (error) { return apiError(error); }
}
