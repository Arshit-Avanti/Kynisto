import { apiError, noStoreJson } from "@/lib/security";
import { supabasePublicConfiguration } from "@/lib/supabase-auth";

export async function GET() {
  try {
    const { url, publishableKey } = supabasePublicConfiguration();
    return noStoreJson({ url, publishableKey });
  } catch (error) {
    return apiError(error);
  }
}
