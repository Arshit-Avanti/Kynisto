import { getD1 } from "@/db/runtime";
import { ensureSeeded } from "@/db/seed";

function xml(value: string) {
  const entities: Record<string, string> = { "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" };
  return value.replace(/[<>&'\"]/g, (character) => entities[character] ?? character);
}

export async function GET(request: Request) {
  await ensureSeeded();
  const origin = new URL(request.url).origin;
  const stores = await getD1().prepare("SELECT slug, updated_at AS updatedAt FROM stores WHERE status = 'approved' ORDER BY updated_at DESC").all<{ slug: string; updatedAt: number }>();
  const urls = [
    `<url><loc>${xml(origin)}</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`,
    `<url><loc>${xml(`${origin}/products`)}</loc><changefreq>daily</changefreq><priority>0.9</priority></url>`,
    `<url><loc>${xml(`${origin}/healthcare`)}</loc><changefreq>daily</changefreq><priority>0.9</priority></url>`,
    ...(stores.results ?? []).map((store) => `<url><loc>${xml(`${origin}/stores/${store.slug}`)}</loc><lastmod>${new Date(store.updatedAt * 1000).toISOString()}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`),
  ];
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join("")}</urlset>`, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
