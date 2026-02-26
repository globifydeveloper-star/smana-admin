/**
 * SMANA Hotel Admin — Production Service Worker
 *
 * Strategy overview:
 *  - Static assets (JS, CSS, fonts, images)  → Cache-First
 *  - API GET requests (api.smanahotels.com)   → Network-First, no cache for auth routes
 *  - POST / PUT / PATCH / DELETE              → Network-Only (never cached)
 *  - Auth routes (/login, /logout, /auth)     → Network-Only (never intercepted)
 *  - Navigation requests                       → Network-First with offline fallback
 *
 * Firebase Cloud Messaging (FCM):
 *  - The backend sends FCM messages using the `webpush` property in MulticastMessage.
 *  - FCM delivers these as standard Web Push messages through the browser Push API.
 *  - Our `push` event handler below processes them — NO Firebase SDK is needed here.
 *  - importScripts from external CDNs would be blocked by CSP and crash SW registration.
 */

const CACHE_VERSION = "v1.4.0"; // Bumped: fixed manifest.webmanifest path

const STATIC_CACHE = `smana-admin-static-${CACHE_VERSION}`;
const API_CACHE = `smana-admin-api-${CACHE_VERSION}`;

// ---------------------------------------------------------------------------
// Assets to pre-cache on install (shell)
// ---------------------------------------------------------------------------
const PRE_CACHE_ASSETS = [
    "/",
    "/offline.html",
    "/manifest.webmanifest",  // Next.js serves manifest.ts at /manifest.webmanifest (NOT /manifest.json)
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
// PUSH — handle push events for browsers where FCM does not intercept directly
//
// When the Firebase Messaging SDK (via onBackgroundMessage above) handles a
// push it calls showNotification internally — this plain push listener acts
// as a fallback to ensure Chrome/Edge never penalise us for
// "push event without notification".
//
// FCM messages with a `notification` payload are handled by the Firebase SDK.
// Data-only FCM messages fall through to this handler.
//
// COMPATIBILITY NOTES:
// - `actions` are NOT supported on iOS Safari, Firefox, or Android Firefox.
// - `badge` is Chromium-only; other browsers ignore it.
// - `vibrate` works on Android Chrome; silently ignored on iOS.
// ---------------------------------------------------------------------------
self.addEventListener("push", (event) => {
    // Firebase Messaging SDK intercepts FCM push events first via onBackgroundMessage.
    // This listener only runs for non-FCM pushes or data-only FCM messages.
    event.waitUntil(
        (async () => {
            let title = "SMANA Admin";
            let body = "You have a new notification.";
            let icon = "/icon-192.png";
            let badge = "/icon-96.png";
            let tag = undefined;
            let notifData = { url: "/dashboard" };

            if (event.data) {
                try {
                    const payload = event.data.json();
                    // Support both FCM notification format and our custom format
                    const n = payload.notification || {};
                    const d = payload.data || payload;
                    title = n.title || d.title || title;
                    body = n.body || d.body || body;
                    icon = n.icon || d.icon || icon;
                    badge = d.badge || badge;
                    tag = d.tag;
                    notifData = { url: d.url || n.click_action || '/dashboard', ...(d || {}) };
                } catch {
                    body = event.data.text() || body;
                }
            }

            const options = {
                body,
                icon,
                badge,
                tag,
                renotify: !!tag,
                data: notifData,
                vibrate: [200, 100, 200],
            };

            try {
                await self.registration.showNotification(title, options);
            } catch (err) {
                console.error("[SW Push] showNotification failed:", err);
                await self.registration.showNotification("SMANA Admin", {
                    body: "You have a new notification.",
                    icon: "/icon-192.png",
                });
            }
        })()
    );
});

// ---------------------------------------------------------------------------
// NOTIFICATIONCLICK — open the admin dashboard at the correct URL
// ---------------------------------------------------------------------------
self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    const targetUrl = (event.notification.data && event.notification.data.url)
        ? event.notification.data.url
        : "/dashboard";

    event.waitUntil(
        clients
            .matchAll({ type: "window", includeUncontrolled: true })
            .then((clientList) => {
                // If admin tab is already open, focus and navigate it
                for (const client of clientList) {
                    if ("focus" in client) {
                        try {
                            client.focus();
                            // navigate() is not available on iOS — guard it
                            if ("navigate" in client) {
                                client.navigate(targetUrl);
                            }
                            return;
                        } catch {
                            // Fall through to open new window
                        }
                    }
                }
                // No existing window — open a new one
                if (clients.openWindow) {
                    return clients.openWindow(targetUrl);
                }
            })
    );
});
