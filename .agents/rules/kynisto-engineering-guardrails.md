# Kynisto Engineering Standards & Guardrails

This document defines critical architecture, platform invariants, and development rules for the Kynisto codebase. All agents and developers must strictly adhere to these rules to avoid regressions.

---

## 1. Mobile Scrolling & Touch Invariants

### ❌ NEVER:
- **NEVER** apply `overflow-x: hidden` to `html`, `body`, `#root`, or top-level layout containers.
  - *Why*: Per the W3C CSS Overflow Module Level 3 specification, if `overflow-x` is `hidden` and `overflow-y` is `visible`, the browser automatically computes `overflow-y` to `auto`. On mobile touchscreens (WebKit & Blink), this creates an internal nested scroll container that captures and swallows vertical touch-pan gestures, locking or freezing page scrolling.

### ✅ ALWAYS:
- **ALWAYS** use `overflow-x: clip` on root or page-level wrappers to prevent horizontal content overflow without altering the `overflow-y` computation or creating a scroll container.
- Always include explicit touch-action and smooth touch scrolling in `app/globals.css`:
  ```css
  html, body {
    touch-action: pan-y pinch-zoom;
    -webkit-overflow-scrolling: touch;
  }
  ```
- Cap expensive GPU filters on mobile viewports (`<768px`):
  ```css
  @media (max-width: 768px) {
    .backdrop-blur-2xl, .backdrop-blur-xl, .backdrop-blur-lg, .backdrop-blur-md {
      backdrop-filter: blur(6px) !important;
      -webkit-backdrop-filter: blur(6px) !important;
    }
    .arise-on-scroll {
      will-change: auto !important;
    }
  }
  ```

---

## 2. Android Native WebView & Network Invariants

### ❌ NEVER:
- **NEVER** hardcode single domain hosts (e.g. only `kynisto.nxt-arshit.workers.dev`) in `MainActivity.java` or `network_security_config.xml`.
- **NEVER** leave `onReceivedSslError()` unimplemented (default cancels the connection).
- **NEVER** enable `setSafeBrowsingEnabled(true)` on release WebView builds without a fallback; external SafeBrowsing verification latency or throttling can abort web requests with `net::ERR_FAILED`.

### ✅ ALWAYS:
- Use `isTrustedHost(String host)` helper to validate all production and worker staging hosts:
  ```java
  private boolean isTrustedHost(String host) {
      if (host == null) return false;
      return host.equals("kynisto.in") ||
             host.endsWith(".kynisto.in") ||
             host.equals("kynisto.nxt-arshit.workers.dev") ||
             host.endsWith(".workers.dev") ||
             host.equals("localhost") ||
             host.equals("10.0.2.2");
  }
  ```
- In `WebViewClient`, override `onReceivedSslError`: verify domain with `isTrustedHost()` and invoke `handler.proceed()` for verified production domains.
- Set `WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE`.
- Ensure `android/app/src/main/res/xml/network_security_config.xml` allows both system and user CA certificates and permits traffic to all trusted operational domains.

---

## 3. Service Worker Navigation & Offline Reliability

### ❌ NEVER:
- **NEVER** let an `event.respondWith()` promise resolve to `undefined` or reject unhandled in `sw.js` navigation fetch handlers.
  - *Why*: Chromium treats an unresolved or undefined `respondWith()` response as an unhandled network abort, triggering `net::ERR_FAILED`.
- **NEVER** set ultra-aggressive navigation fetch timeouts (< 3000ms) without a guaranteed HTTP 200 fallback response.

### ✅ ALWAYS:
- Guarantee a valid `Response` object at all times. If network fetch fails and cache has no match, return a pre-defined inline `OFFLINE_FALLBACK_HTML`:
  ```javascript
  return new Response(OFFLINE_FALLBACK_HTML, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
  ```
- Keep `public/sw.js` and `app/sw.js/route.ts` in sync.

---

## 4. Native Release & Asset Deployment Process

### ❌ NEVER:
- **NEVER** update native Android code (`android/app/src/...`) or deploy web fixes without updating and compiling the release APK.
- **NEVER** ship an APK with the same `versionCode` when making changes.

### ✅ ALWAYS:
- Increment `versionCode` and update `versionName` in `android/app/build.gradle`.
- Compile the signed release APK using Gradle:
  ```powershell
  cd android; ./gradlew.bat assembleRelease; cd ..
  ```
- Copy the output APK (`android/app/build/outputs/apk/release/app-release.apk`) to:
  1. `public/downloads/kynisto.apk`
  2. `dist/client/downloads/kynisto.apk`
- Verify APK size (~760 KB) and test download endpoints before final production deployment.

---

## 5. UI Cleanliness & Timezone Operations

### ❌ NEVER:
- **NEVER** render wide disabled buttons for absent features (e.g. disabled `[No Appts]` button occupying 30% of card width). If a clinic doesn't support appointments, omit the button completely or display a subtle indicator.
- **NEVER** calculate clinic opening/closing hours using the user device's local system time.

### ✅ ALWAYS:
- Center single items in responsive grids:
  ```tsx
  className={`grid grid-cols-1 ${items.length === 1 ? 'max-w-2xl mx-auto' : 'md:grid-cols-2 max-w-5xl mx-auto'} gap-6`}
  ```
- Always calculate clinic operating hours against **India Standard Time (IST - Asia/Kolkata)**:
  ```typescript
  const istDate = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  ```
- When a clinic queue is closed, render a clear, full-width `Queue Closed` state rather than mixed open/closed badges.

---

## 6. Healthcare Prescription Integrity & Immutability

### ❌ NEVER:
- **NEVER** allow in-place modification of prescriptions with status `issued`.
- **NEVER** expose customer or patient prescription data without authorization verification.

### ✅ ALWAYS:
- Enforce the explicit lifecycle: `draft` -> `issued` -> `superseded`.
- Saving intermediate work must explicitly use `action: "save_draft"` with `status: "draft"`.
- Once issued, prescriptions are immutable and locked. Any revisions must go through a formal Reissue / Correction flow creating a new prescription linked via `original_prescription_id` and `superseded_by_id` with an explicit reason for correction.

---

## 7. Mobile Navigation Latency & Sub-20ms Route Transitions

### ❌ NEVER:
- **NEVER** apply `export const dynamic = "force-dynamic"` to pages that only render client components without server-side request data.
  - *Why*: It prevents static pre-rendering and disables framework prefetching, forcing cold server roundtrips on route navigation.
- **NEVER** unmount existing UI content to display skeleton placeholders during interactive category filtering or tab switching.
- **NEVER** wait on network fetches in Service Worker navigation handlers when a valid cached version exists in CacheStorage.

### ✅ ALWAYS:
- **ALWAYS** include `prefetch={true}` and touch-start prefetching (`onTouchStart={() => router.prefetch(href)}`) on primary navigation links (bottom app dock, header links).
- **ALWAYS** pre-populate client component initial state (`useState(() => defaultItems)`) with compiled fallback seed data so every route renders content in <20ms on mount.
- **ALWAYS** apply `touch-action: manipulation` and `user-select: none` to mobile dock navigation bars to eliminate the 300ms double-tap delay.
- **ALWAYS** serve cached navigation pages immediately from CacheStorage (<5ms) while revalidating in the background (Stale-While-Revalidate).

