/**
 * SMANA Hotel Admin — Production Service Worker
 *
 * Strategy overview:
 *  - Static assets (JS, CSS, fonts, images)  → Cache-First
 *  - API GET requests (api.smanahotels.com)   → Network-First, no cache for auth routes
 *  - POST / PUT / PATCH / DELETE              → Network-Only (never cached)
 *  - Auth routes (/login, /logout, /auth)     → Network-Only (never intercepted)
 *  - Navigation requests                       → Network-First with offline fallback
 */

const CACHE_VERSION = "v1.2.0"; // Bump this on every production deploy
const STATIC_CACHE = `smana-admin-static-${CACHE_VERSION}`;
const API_CACHE = `smana-admin-api-${CACHE_VERSION}`;

// ---------------------------------------------------------------------------
// Assets to pre-cache on install (shell)
// ---------------------------------------------------------------------------
const PRE_CACHE_ASSETS = [
    "/",
    "/offline.html",
    "/manifest.json",
    "/icon-96.png",
    "/icon-192.png",
    "/icon-512.png",
    "/smana_logo.png",
    "/screenshot-desktop.png",
    "/screenshot-mobile.png",
];

// ---------------------------------------------------------------------------
// Routes that must NEVER be intercepted by the service worker.
// Requests to these paths always go straight to the network.
// ---------------------------------------------------------------------------
const AUTH_ROUTE_PATTERNS = [
    /\/login/i,
    /\/logout/i,
    /\/auth/i,
    /\/refresh/i,
    /\/api\/auth/i,
];

// ---------------------------------------------------------------------------
// Mutation methods — never read from or write to cache
// ---------------------------------------------------------------------------
const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

// ---------------------------------------------------------------------------
// Socket.IO URL pattern — MUST be completely ignored by the SW.
// Socket.IO uses HTTP long-polling AND WebSocket upgrades. If the SW intercepts
// the polling requests it corrupts the transport negotiation, causing the socket
// to stall or disconnect immediately.
// ---------------------------------------------------------------------------
const SOCKETIO_PATH_PATTERN = /\/socket\.io\//i;

// ---------------------------------------------------------------------------
// Only cache GET responses from our own API
// ---------------------------------------------------------------------------
const API_ORIGIN = "https://api.smanahotels.com";
const ADMIN_ORIGIN = "https://admin.smanahotels.com";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns true if the request matches any auth route pattern */
function isAuthRoute(url) {
    return AUTH_ROUTE_PATTERNS.some((pattern) => pattern.test(url.pathname + url.search));
}

/** Returns true if the request is an API call we are allowed to cache */
function isApiRequest(url) {
    return url.origin === API_ORIGIN;
}

/** Returns true if the request is for a static asset */
function isStaticAsset(url) {
    return (
        url.pathname.startsWith("/_next/static/") ||
        url.pathname.startsWith("/icons/") ||
        /\.(js|css|woff2?|ttf|otf|eot|svg|png|jpg|jpeg|gif|ico|webp)$/i.test(url.pathname)
    );
}

// ---------------------------------------------------------------------------
// INSTALL — pre-cache the app shell
// ---------------------------------------------------------------------------
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches
            .open(STATIC_CACHE)
            .then((cache) => cache.addAll(PRE_CACHE_ASSETS))
            .then(() => self.skipWaiting()) // Activate immediately, do not wait for old SW to die
    );
});

// ---------------------------------------------------------------------------
// ACTIVATE — clean up old caches from previous versions
// ---------------------------------------------------------------------------
self.addEventListener("activate", (event) => {
    const currentCaches = new Set([STATIC_CACHE, API_CACHE]);

    event.waitUntil(
        caches
            .keys()
            .then((cacheNames) =>
                Promise.all(
                    cacheNames
                        .filter((name) => !currentCaches.has(name)) // Delete anything not in current set
                        .map((name) => {
                            console.log(`[SW] Deleting old cache: ${name}`);
                            return caches.delete(name);
                        })
                )
            )
            .then(() => self.clients.claim()) // Take control of all tabs immediately
    );
});

// ---------------------------------------------------------------------------
// MESSAGE — handle commands sent from the page (e.g. from ServiceWorkerRegistrar)
//
// SKIP_WAITING: When ServiceWorkerRegistrar detects a new SW version is
// waiting (state === 'installed'), it posts this message to make the new SW
// take over immediately instead of waiting for all tabs to close.
//
// Without this handler the registrar's postMessage({ type: 'SKIP_WAITING' })
// would have no effect, leaving the new SW stuck in 'waiting' state.
// ---------------------------------------------------------------------------
self.addEventListener("message", (event) => {
    if (event.data && event.data.type === "SKIP_WAITING") {
        self.skipWaiting();
    }
});

// ---------------------------------------------------------------------------
// FETCH — main routing logic
// ---------------------------------------------------------------------------
self.addEventListener("fetch", (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // 0. CRITICAL: Pass through all Socket.IO traffic unconditionally.
    //    Socket.IO polling requests look like GET /socket.io/?EIO=4&...
    //    Caching or delaying them breaks real-time connectivity entirely.
    if (SOCKETIO_PATH_PATTERN.test(url.pathname)) {
        return; // Do not call event.respondWith → browser handles normally
    }

    // 1. Ignore non-GET mutations entirely — let them hit the network as normal
    if (MUTATION_METHODS.has(request.method)) {
        return; // Do not call event.respondWith → browser handles normally
    }

    // 2. Ignore auth routes — security critical, must never be served from cache
    if (isAuthRoute(url)) {
        return;
    }

    // 3. Ignore cross-origin requests we don't own
    if (url.origin !== ADMIN_ORIGIN && url.origin !== API_ORIGIN) {
        return;
    }

    // 4. Static assets → Cache-First
    //    Rationale: JS/CSS/fonts change only on deploy (cache version handles invalidation)
    if (isStaticAsset(url)) {
        event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
        return;
    }

    // 5. API GET requests → Network-First
    //    Rationale: Admin data must always be fresh; cache is a fallback only
    if (isApiRequest(url)) {
        event.respondWith(networkFirstStrategy(request, API_CACHE));
        return;
    }

    // 6. Navigation requests (HTML pages) → Network-First with offline fallback
    if (request.mode === "navigate") {
        event.respondWith(navigationStrategy(request));
        return;
    }

    // 7. Anything else → straight to network
});

// ---------------------------------------------------------------------------
// Strategy: Cache-First
// Try cache → if miss, fetch from network and cache the response
// ---------------------------------------------------------------------------
async function cacheFirstStrategy(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);

    if (cached) {
        return cached;
    }

    try {
        const response = await fetch(request);
        if (response.ok) {
            cache.put(request, response.clone()); // Cache for next time
        }
        return response;
    } catch {
        // Asset not in cache and network failed — nothing we can do
        return new Response("Asset unavailable offline.", { status: 503 });
    }
}

// ---------------------------------------------------------------------------
// Strategy: Network-First
// Always try network first → on failure, return stale cache → on both fail, 503
// ---------------------------------------------------------------------------
async function networkFirstStrategy(request, cacheName) {
    const cache = await caches.open(cacheName);

    try {
        const response = await fetch(request);

        if (response.ok) {
            // Store a fresh copy for offline fallback
            cache.put(request, response.clone());
        }

        return response;
    } catch {
        // Network failed — serve stale data with a warning header
        const cached = await cache.match(request);
        if (cached) {
            // Clone and add a header so the frontend can detect stale data
            const headers = new Headers(cached.headers);
            headers.set("X-Cached", "stale");
            return new Response(cached.body, { status: cached.status, headers });
        }

        return new Response(
            JSON.stringify({ error: "Offline — no cached data available." }),
            { status: 503, headers: { "Content-Type": "application/json" } }
        );
    }
}

// ---------------------------------------------------------------------------
// Strategy: Navigation (HTML pages)
// Try network → on failure, serve offline.html
// ---------------------------------------------------------------------------
async function navigationStrategy(request) {
    try {
        const response = await fetch(request);
        return response;
    } catch {
        const cache = await caches.open(STATIC_CACHE);
        const offline = await cache.match("/offline.html");
        return offline || new Response("<h1>You are offline.</h1>", {
            headers: { "Content-Type": "text/html" },
        });
    }
}

// ---------------------------------------------------------------------------
// PUSH — receive a Web Push from the backend and show an OS notification
//
// The backend (pushService.ts) sends a JSON payload:
// {
//   title: "New Service Request",
//   body: "Room 204 — Maintenance requested (Priority: High)",
//   icon: "/icon-192.png",
//   badge: "/icon-96.png",
//   tag: "<referenceId>",     ← collapses duplicate notifications
//   data: { url: "/dashboard/requests" }
// }
// ---------------------------------------------------------------------------
self.addEventListener("push", (event) => {
    if (!event.data) return;

    let payload;
    try {
        payload = event.data.json();
    } catch {
        payload = { title: "SMANA Admin", body: event.data.text() };
    }

    const {
        title = "SMANA Admin",
        body = "",
        icon = "/icon-192.png",
        badge = "/icon-96.png",
        tag,
        data = {},
    } = payload;

    const options = {
        body,
        icon,
        badge,
        tag,                // Same tag = new push replaces existing notification (no spam)
        renotify: !!tag,    // Vibrate/ring even if same tag replaces an existing one
        data,
        requireInteraction: false,  // Auto-dismiss after a few seconds
        actions: [
            { action: "open", title: "View" },
            { action: "dismiss", title: "Dismiss" },
        ],
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// ---------------------------------------------------------------------------
// NOTIFICATIONCLICK — when the user clicks the OS notification
// Open (or focus) the admin panel at the URL embedded in notification.data.url
// ---------------------------------------------------------------------------
self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    if (event.action === "dismiss") return;

    const targetUrl = (event.notification.data && event.notification.data.url)
        ? event.notification.data.url
        : "/dashboard";

    event.waitUntil(
        clients
            .matchAll({ type: "window", includeUncontrolled: true })
            .then((clientList) => {
                // If admin tab is already open, focus it and navigate
                for (const client of clientList) {
                    if (client.url.includes("/dashboard") && "focus" in client) {
                        client.focus();
                        client.navigate(targetUrl);
                        return;
                    }
                }
                // Otherwise open a new tab
                if (clients.openWindow) {
                    return clients.openWindow(targetUrl);
                }
            })
    );
});
