import { apiError, noStoreJson } from "@/lib/security";
import { supabasePublicConfiguration } from "@/lib/supabase-auth";

export async function GET() {
  try {
    const { url, publishableKey } = supabasePublicConfiguration();
    const googleClientId = "434985444161-mbbrsie2g2tmf1o9kbcalnm2kussn4ur.apps.googleusercontent.com";
    return noStoreJson({ url, publishableKey, googleClientId });
  } catch (error) {
    return apiError(error);
  }
}
