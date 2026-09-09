import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, "../public");
const prototypeHtml = path.resolve(publicDir, "prototype/upi-checkout.html");

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-cache, no-store, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

const server = http.createServer((req, res) => {
  const url = req.url ? req.url.split("?")[0] : "/";

  // Handle Prototype HTML routes
  if (
    url === "/" ||
    url === "/checkout/upi" ||
    url === "/checkout" ||
    url === "/prototype" ||
    url === "/prototype/upi-checkout.html"
  ) {
    if (!fs.existsSync(prototypeHtml)) {
      res.writeHead(404, { "Content-Type": "text/plain", ...NO_CACHE_HEADERS });
      res.end("Prototype HTML not found");
      return;
    }

    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      ...NO_CACHE_HEADERS,
    });

    if (req.method === "HEAD") {
      res.end();
      return;
    }

    fs.createReadStream(prototypeHtml).pipe(res);
    return;
  }

  // Healthcheck route
  if (url === "/health" || url === "/api/health") {
    res.writeHead(200, { "Content-Type": "application/json", ...NO_CACHE_HEADERS });
    res.end(JSON.stringify({ status: "ok", mode: "light", prototype: "ready" }));
    return;
  }

  // Handle static assets from publicDir
  const filePath = path.join(publicDir, url);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    const mimeMap = {
      ".html": "text/html; charset=utf-8",
      ".js": "text/javascript",
      ".css": "text/css",
      ".svg": "image/svg+xml",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".json": "application/json",
    };
    res.writeHead(200, {
      "Content-Type": mimeMap[ext] || "application/octet-stream",
      ...NO_CACHE_HEADERS,
    });

    if (req.method === "HEAD") {
      res.end();
      return;
    }

    fs.createReadStream(filePath).pipe(res);
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain", ...NO_CACHE_HEADERS });
  res.end("Not Found");
});

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Kynisto UPI Prototype (Light Mode) running at http://localhost:${PORT}/checkout/upi`);
});
