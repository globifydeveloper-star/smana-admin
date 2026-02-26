'use client';

import { useEffect } from 'react';

/**
 * ServiceWorkerRegistrar
 *
 * Registers /sw.js for offline support and push notification delivery.
 * Push subscriptions are handled separately in the login flow — not here.
 * This component only handles SW lifecycle (registration + updates).
 *
 * ⚠️  IMPORTANT: We intentionally do NOT listen for `controllerchange` and
 * call `window.location.reload()`.  Doing so caused a race condition: when a
 * new SW was deployed and activated mid-login (via skipWaiting → clients.claim),
 * the page reload aborted the in-flight /auth/login request, wiped the JWT from
 * localStorage, and left the user staring at "Invalid email or password".
 *
 * The SW's `clients.claim()` call in the activate handler is sufficient — all
 * open tabs are adopted by the new SW without a forced reload.  The updated
 * code only takes effect on the next natural navigation (F5, link click, etc.).
 */
export function ServiceWorkerRegistrar() {
    useEffect(() => {
        if (!('serviceWorker' in navigator)) return;

        async function register() {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js', {
                    scope: '/',
                    updateViaCache: 'none',
                });

                console.log('[SW] Registered:', registration.scope);

                // Detect a new SW version waiting to activate and let it skip
                // the waiting phase so it becomes active immediately — but we
                // do NOT force a page reload.  The new SW's clients.claim()
                // silently adopts this tab; the updated fetch handlers will be
                // used for all subsequent requests without disrupting the user.
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    if (!newWorker) return;

                    newWorker.addEventListener('statechange', () => {
                        if (
                            newWorker.state === 'installed' &&
                            navigator.serviceWorker.controller
                        ) {
                            // Tell the waiting SW to activate — no page reload.
                            newWorker.postMessage({ type: 'SKIP_WAITING' });
                        }
                    });
                });

                // Check for updates when tab regains focus
                document.addEventListener('visibilitychange', () => {
                    if (document.visibilityState === 'visible') {
                        registration.update();
                    }
                });
            } catch (err) {
                console.error('[SW] Registration failed:', err);
            }
        }

        register();
    }, []);

    return null;
}
