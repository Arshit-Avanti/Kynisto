import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "kynisto_session";
const SUPABASE_ACCESS_COOKIE = "kynisto_supabase_access_token";

/** The main Kynisto URL is login-first; public deep links remain shareable. */
export function proxy(request: NextRequest) {
  const isGoogleReturn =
    request.nextUrl.searchParams.has("code") ||
    request.nextUrl.searchParams.has("error");
  const hasSession =
    Boolean(request.cookies.get(SESSION_COOKIE)?.value) ||
    Boolean(request.cookies.get(SUPABASE_ACCESS_COOKIE)?.value);
  if (request.nextUrl.pathname === "/" && !hasSession && !isGoogleReturn) {
    const login = new URL("/login", request.url);
    login.searchParams.set("returnTo", "/");
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/"] };
