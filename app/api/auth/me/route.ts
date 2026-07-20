import { getSessionUser } from "@/lib/auth";
import { apiError, noStoreJson } from "@/lib/security";

export async function GET() {
  try {
    const session = await getSessionUser();
    return noStoreJson({ user: session?.user ?? null });
  } catch (error) {
    return apiError(error);
  }
}
