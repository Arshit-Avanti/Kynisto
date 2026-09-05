import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("⚡ TurboCore & TurboTouch Architecture Verification Suite", async (t) => {
  await t.test("1. Verify turbocore.ts exports and inverted indexing engine", () => {
    const fileContent = fs.readFileSync(path.resolve("lib/turbocore.ts"), "utf-8");
    assert.ok(fileContent.includes("export const turboCore"), "turbocore must export singleton instance");
    assert.ok(fileContent.includes("queryStores"), "turbocore must implement sub-2ms queryStores");
    assert.ok(fileContent.includes("updateStores"), "turbocore must implement background SWR updateStores");
    assert.ok(fileContent.includes("searchIndex"), "turbocore must build in-memory inverted search index");
  });

  await t.test("2. Verify turbotouch.ts native haptics and instant touch physics", () => {
    const fileContent = fs.readFileSync(path.resolve("lib/turbotouch.ts"), "utf-8");
    assert.ok(fileContent.includes("triggerHaptic"), "turbotouch must export triggerHaptic helper");
    assert.ok(fileContent.includes("onPointerDown"), "turbotouch must capture pointerdown for 0ms response");
    assert.ok(fileContent.includes("turboTouch = Object.assign"), "turbotouch must export turboTouch with .haptic method");
  });

  await t.test("3. Verify device-profiler.ts low-RAM & battery adaptation", () => {
    const fileContent = fs.readFileSync(path.resolve("lib/device-profiler.ts"), "utf-8");
    assert.ok(fileContent.includes("memoryGb <= 2"), "device-profiler must detect <=2GB RAM devices");
    assert.ok(fileContent.includes("turbo-lite"), "device-profiler must toggle .turbo-lite class");
    assert.ok(fileContent.includes("applyDeviceOptimizations"), "device-profiler must export applyDeviceOptimizations");
  });

  await t.test("4. Verify GEMINI.md standards in globals.css", () => {
    const cssContent = fs.readFileSync(path.resolve("app/globals.css"), "utf-8");
    assert.ok(cssContent.includes(".turbo-lite"), "globals.css must contain .turbo-lite styles");
    assert.ok(cssContent.includes("overflow-x: clip"), "globals.css must use overflow-x: clip per GEMINI.md Section 1");
    // Ensure no root overflow-x: hidden
    const rootMatches = cssContent.match(/html,\s*body\s*\{[^}]*overflow-x:\s*hidden/);
    assert.equal(rootMatches, null, "html, body must never have overflow-x: hidden per GEMINI.md Section 1");
  });

  await t.test("5. Verify app/layout.tsx zero-blocking font and AdSense deferral", () => {
    const layoutContent = fs.readFileSync(path.resolve("app/layout.tsx"), "utf-8");
    assert.ok(layoutContent.includes("TurboCoreRuntime"), "layout must render TurboCoreRuntime component");
    assert.ok(layoutContent.includes("strategy=\"lazyOnload\""), "AdSense must be deferred with lazyOnload");
    assert.ok(layoutContent.includes("turbo-lite"), "layout head must execute inline zero-FOUC hardware profiler");
  });

  await t.test("6. Verify public/sw.js and app/sw.js/route.ts cache synchronization", () => {
    const publicSw = fs.readFileSync(path.resolve("public/sw.js"), "utf-8");
    const appSw = fs.readFileSync(path.resolve("app/sw.js/route.ts"), "utf-8");
    assert.ok(publicSw.includes("kynisto-turbocore"), "public/sw.js must use kynisto-turbocore cache prefix");
    assert.ok(appSw.includes("kynisto-turbocore"), "app/sw.js/route.ts must use kynisto-turbocore cache prefix");
    assert.ok(publicSw.includes("CLEAR_OLD_CACHES"), "public/sw.js must include CLEAR_OLD_CACHES handler");
  });
});
