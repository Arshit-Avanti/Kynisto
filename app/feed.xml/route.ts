import { getAllArticles } from "@/lib/articles-data";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const origin = "https://kynisto.in";
  const articles = getAllArticles();
  const buildDate = new Date().toUTCString();

  const items = articles
    .map(
      (a) => `    <item>
      <title>${escapeXml(a.title)}</title>
      <link>${origin}/blog/${a.slug}</link>
      <guid isPermaLink="true">${origin}/blog/${a.slug}</guid>
      <description>${escapeXml(a.summary)}</description>
      <category>${escapeXml(a.category)}</category>
      <pubDate>${new Date(a.publishedAt).toUTCString()}</pubDate>
    </item>`
    )
    .join("\n");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Kynisto Knowledge Hub &amp; Locality Guides</title>
    <link>${origin}/blog</link>
    <description>Expert guides, clinical research, urban locality living manuals, and small business insights curated by the Kynisto Editorial Team.</description>
    <language>en-in</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <atom:link href="${origin}/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=1800, s-maxage=3600",
    },
  });
}
