import { APP_VERSION } from "@/lib/app-version";

export const dynamic = "force-dynamic";

export async function GET() {
  const source = `
const VERSION=${JSON.stringify(APP_VERSION)};
const CACHE="kynisto-"+VERSION;
const OFFLINE="/offline.html";
const PRECACHE=[OFFLINE,"/kynisto-mark.svg","/kynisto-logo.svg"];
self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(PRECACHE)));
});
self.addEventListener("activate",event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith("kynisto-")&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener("message",event=>{
  if(event.data&&event.data.type==="SKIP_WAITING")self.skipWaiting();
  if(event.data&&event.data.type==="CLEAR_OLD_CACHES")event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))));
});
self.addEventListener("fetch",event=>{
  const request=event.request;
  if(request.method!=="GET")return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;
  if(url.pathname.startsWith("/api/")||url.pathname.startsWith("/media/")||url.pathname.startsWith("/login")||url.pathname.startsWith("/register"))return;
  if(request.mode==="navigate"){
    event.respondWith(fetch(request,{cache:"no-store"}).catch(()=>caches.match(OFFLINE)));
    return;
  }
  if(url.pathname.startsWith("/assets/")||url.pathname.startsWith("/_next/")||/\\.(?:css|js|svg|png|jpg|jpeg|webp|avif|woff2?)$/i.test(url.pathname)){
    event.respondWith(caches.open(CACHE).then(async cache=>{
      const cached=await cache.match(request);
      const network=fetch(request).then(response=>{if(response.ok)cache.put(request,response.clone());return response;}).catch(()=>cached);
      return cached||network;
    }));
  }
});
`;
  return new Response(source, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Service-Worker-Allowed": "/",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

