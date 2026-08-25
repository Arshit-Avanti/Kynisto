export function GET() {
  const origin = "https://kynisto.in";
  const content = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /owner/
Disallow: /account/
Disallow: /api/
Disallow: /*?*q=*
Disallow: /*{search_term_string}*
Disallow: /*?*fbclid=*
Disallow: /*?*gclid=*

User-agent: bingbot
Allow: /

User-agent: AdIdxBot
Allow: /

User-agent: msnbot
Allow: /

User-agent: BingPreview
Allow: /

User-agent: Mediapartners-Google
Allow: /

User-agent: Google-AdSense-AutoAds
Allow: /

User-agent: Google-AdSense-AutoAds-Preflight
Allow: /

User-agent: Googlebot
Allow: /
Disallow: /admin/
Disallow: /owner/
Disallow: /account/
Disallow: /api/
Disallow: /*?*q=*
Disallow: /*{search_term_string}*

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
