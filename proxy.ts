import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "kynisto_session";
const SUPABASE_ACCESS_COOKIE = "kynisto_supabase_access_token";

const BOT_USER_AGENTS = /Googlebot|Mediapartners-Google|Google-AdSense-AdsBot|AdsBot-Google|bingbot|yandexbot|duckduckbot|slurp|facebookexternalhit|twitterbot/i;

/** Allow public landing page / access for guests & Google AdSense crawlers. */
export function proxy(request: NextRequest) {
  const userAgent = request.headers.get("user-agent") || "";
  const isBot = BOT_USER_AGENTS.test(userAgent);

  // Allow bots (Google AdSense crawler, Googlebot, etc.) to view / directly with 200 OK
  if (isBot) {
    return NextResponse.next();
  }

  const isGoogleReturn =
    request.nextUrl.searchParams.has("code") ||
    request.nextUrl.searchParams.has("error");
  const hasSession =
    Boolean(request.cookies.get(SESSION_COOKIE)?.value) ||
    Boolean(request.cookies.get(SUPABASE_ACCESS_COOKIE)?.value);

  // Allow public visitors to view the landing page / with 200 OK for AdSense preview
  if (request.nextUrl.pathname === "/" && !hasSession && !isGoogleReturn) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = { matcher: ["/"] };
