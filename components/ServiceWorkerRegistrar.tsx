'use client';

import { useEffect } from 'react';

/**
 * ServiceWorkerRegistrar
 *
 * Registers /sw.js for offline support and push notification delivery.
 * Push subscriptions are handled separately in the login flow — not here.
 * This component only handles SW lifecycle (registration + updates).
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

                // Auto-update: detect new SW version waiting to activate
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    if (!newWorker) return;

                    newWorker.addEventListener('statechange', () => {
                        if (
                            newWorker.state === 'installed' &&
                            navigator.serviceWorker.controller
                        ) {
                            // Silently activate new SW
                            newWorker.postMessage({ type: 'SKIP_WAITING' });
                        }
                    });
                });

                // Reload once the new SW takes over all tabs
                navigator.serviceWorker.addEventListener('controllerchange', () => {
                    window.location.reload();
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
