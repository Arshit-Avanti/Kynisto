export function GET() {
  const origin = "https://kynisto.in";
  const content = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /owner/
Disallow: /account/
Disallow: /api/

User-agent: Mediapartners-Google
Disallow:
Allow: /

User-agent: Mediapartners-Google*
Disallow:
Allow: /

User-agent: Google-Display-Ads-Bot
Disallow:
Allow: /

User-agent: GoogleAdSenseInfeed
Disallow:
Allow: /

User-agent: Google-AdSense-Infeed
Disallow:
Allow: /

User-agent: GoogleAdSense
Disallow:
Allow: /

User-agent: Google-AdSense
Disallow:
Allow: /

User-agent: Google-AdSense-AutoAds
Disallow:
Allow: /

User-agent: Google-AdSense-AutoAds-Preflight
Disallow:
Allow: /

User-agent: Google-AdSense-AdsBot
Disallow:
Allow: /

User-agent: AdsBot-Google
Disallow:
Allow: /

User-agent: AdsBot-Google-Mobile
Disallow:
Allow: /

User-agent: Googlebot
Allow: /
Disallow: /admin/
Disallow: /owner/
Disallow: /account/
Disallow: /api/

User-agent: Googlebot-Image
Allow: /

User-agent: bingbot
Allow: /

User-agent: AdIdxBot
Allow: /

User-agent: msnbot
Allow: /

User-agent: BingPreview
Allow: /

Sitemap: ${origin}/sitemap.xml
`;
  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
