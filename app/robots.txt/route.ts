export function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const content = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /owner/
Disallow: /account/
Disallow: /api/

User-agent: Mediapartners-Google
Allow: /

User-agent: Google-AdSense-AutoAds
Allow: /

User-agent: Google-AdSense-AutoAds-Preflight
Allow: /

User-agent: Googlebot
Allow: /

User-agent: Googlebot-Image
Allow: /

Sitemap: ${origin}/sitemap.xml
`;
  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
