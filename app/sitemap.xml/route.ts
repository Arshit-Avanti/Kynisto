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
  const today = new Date().toISOString().split("T")[0] + "T00:00:00.000Z";
  
  const stores = await getD1()
    .prepare("SELECT slug, updated_at AS updatedAt FROM stores WHERE status IN ('approved', 'active') ORDER BY updated_at DESC")
    .all<{ slug: string; updatedAt: number }>();
    
  const articles = getAllArticles();

  const coreRoutes = [
    { path: "/", priority: "1.0", changefreq: "daily" },
    { path: "/healthcare", priority: "0.9", changefreq: "daily" },
    { path: "/search", priority: "0.9", changefreq: "daily" },
    { path: "/products", priority: "0.9", changefreq: "daily" },
    { path: "/services", priority: "0.8", changefreq: "daily" },
    { path: "/blog", priority: "0.9", changefreq: "daily" },
    { path: "/guide", priority: "0.8", changefreq: "weekly" },
    { path: "/faq", priority: "0.8", changefreq: "weekly" },
    { path: "/about", priority: "0.8", changefreq: "monthly" },
    { path: "/contact", priority: "0.8", changefreq: "monthly" },
    { path: "/privacy", priority: "0.7", changefreq: "monthly" },
    { path: "/terms", priority: "0.7", changefreq: "monthly" },
    { path: "/pricing", priority: "0.7", changefreq: "weekly" },
  ];

  const urls = [
    ...coreRoutes.map(
      (r) =>
        `  <url>\n    <loc>${xml(`${origin}${r.path}`)}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${r.changefreq}</changefreq>\n    <priority>${r.priority}</priority>\n  </url>`
    ),
    ...articles.map(
      (article) =>
        `  <url>\n    <loc>${xml(`${origin}/blog/${article.slug}`)}</loc>\n    <lastmod>${article.updatedAt}T00:00:00.000Z</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`
    ),
    ...(stores.results ?? []).map(
      (store) =>
        `  <url>\n    <loc>${xml(`${origin}/stores/${store.slug}`)}</loc>\n    <lastmod>${new Date(store.updatedAt * 1000).toISOString()}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`
    ),
  ];

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;

  return new Response(xmlContent, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=1800, s-maxage=3600",
    },
  });
}
