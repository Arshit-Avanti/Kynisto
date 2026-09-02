import { getD1 } from "@/db/runtime";
import { ensureSeeded } from "@/db/seed";
import { getAllArticles } from "@/lib/articles-data";

function xml(value: string) {
  const entities: Record<string, string> = { "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" };
  return value.replace(/[<>&'\"]/g, (character) => entities[character] ?? character);
}

export async function GET() {
  await ensureSeeded();
  const origin = "https://kynisto.in";
  const stores = await getD1().prepare("SELECT slug, updated_at AS updatedAt FROM stores WHERE status IN ('approved', 'active') ORDER BY updated_at DESC").all<{ slug: string; updatedAt: number }>();
  const articles = getAllArticles();

  const urls = [
    `<url><loc>${xml(`${origin}/`)}</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`,
    `<url><loc>${xml(`${origin}/healthcare`)}</loc><changefreq>daily</changefreq><priority>0.9</priority></url>`,
    `<url><loc>${xml(`${origin}/search`)}</loc><changefreq>daily</changefreq><priority>0.9</priority></url>`,
    `<url><loc>${xml(`${origin}/products`)}</loc><changefreq>daily</changefreq><priority>0.9</priority></url>`,
    `<url><loc>${xml(`${origin}/services`)}</loc><changefreq>daily</changefreq><priority>0.8</priority></url>`,
    `<url><loc>${xml(`${origin}/blog`)}</loc><changefreq>weekly</changefreq><priority>0.9</priority></url>`,
    ...articles.map((article) => `<url><loc>${xml(`${origin}/blog/${article.slug}`)}</loc><lastmod>${article.updatedAt}T00:00:00.000Z</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`),
    `<url><loc>${xml(`${origin}/guide`)}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`,
    `<url><loc>${xml(`${origin}/faq`)}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`,
    `<url><loc>${xml(`${origin}/about`)}</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>`,
    `<url><loc>${xml(`${origin}/contact`)}</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>`,
    `<url><loc>${xml(`${origin}/privacy`)}</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>`,
    `<url><loc>${xml(`${origin}/terms`)}</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>`,
    `<url><loc>${xml(`${origin}/pricing`)}</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>`,
    ...(stores.results ?? []).map((store) => `<url><loc>${xml(`${origin}/stores/${store.slug}`)}</loc><lastmod>${new Date(store.updatedAt * 1000).toISOString()}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`),
  ];
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join("")}</urlset>`, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
