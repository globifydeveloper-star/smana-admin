'use client';

import { useEffect } from 'react';
import {
    isPushSupported,
    requestNotificationPermission,
    subscribeToPush,
} from '@/lib/pushNotifications';

/**
 * ServiceWorkerRegistrar
 *
 * Registers /sw.js and subscribes to Web Push notifications.
 *
 * Key behaviours:
 * - Works in BOTH development (npm run dev) and production.
 * - On every page load after login, re-syncs the push subscription with the
 *   backend. This ensures the subscription is never stale (e.g. VAPID keys
 *   rotated, user logged in on new device, backend DB wiped, etc.).
 * - Permission is requested once; subsequent visits skip the dialog.
 */
export function ServiceWorkerRegistrar() {
    useEffect(() => {
        if (!('serviceWorker' in navigator)) return;

        let registration: ServiceWorkerRegistration | null = null;

        async function register() {
            try {
                registration = await navigator.serviceWorker.register('/sw.js', {
                    scope: '/',
                    updateViaCache: 'none',
                });

                console.log('[SW] Registered:', registration.scope);

                // ── Auto-update: detect new SW version ──────────────────────────
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration!.installing;
                    if (!newWorker) return;

                    newWorker.addEventListener('statechange', () => {
                        if (
                            newWorker.state === 'installed' &&
                            navigator.serviceWorker.controller
                        ) {
                            console.log('[SW] New version — activating…');
                            newWorker.postMessage({ type: 'SKIP_WAITING' });
                        }
                    });
                });

                // Reload once the new SW takes over
                navigator.serviceWorker.addEventListener('controllerchange', () => {
                    window.location.reload();
                });

                // ── Push notification subscription ───────────────────────────────
                if (!isPushSupported()) {
                    console.warn('[Push] Not supported in this browser');
                    return;
                }

                // If permission is already denied, stop early (do not re-prompt)
                if (Notification.permission === 'denied') {
                    console.warn('[Push] Notification permission was blocked by the user. Reset in browser settings.');
                    return;
                }

                // Request permission (shows dialog once, then silently returns result)
                const granted = await requestNotificationPermission();
                if (!granted) {
                    console.warn('[Push] Notification permission not granted');
                    return;
                }

                // ── ALWAYS re-sync subscription with the backend on each login ──
                // Rationale: the backend subscription record may be stale (VAPID keys
                // rotated, backend DB reset, new deployment). We always call subscribe
                // which uses upsert on the server — safe to call repeatedly.
                const result = await subscribeToPush(registration);
                if (result) {
                    console.log('[Push] Subscription synced with backend ✓');
                } else {
                    console.error(
                        '[Push] Subscription FAILED. Check:\n' +
                        '  1. VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY set on the backend server\n' +
                        '  2. NEXT_PUBLIC_BACKEND_URL set correctly (current: ' +
                        (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000') + ')\n' +
                        '  3. You are logged in (the /api/push/subscribe endpoint requires auth)'
                    );
                }

                // Trigger SW update check on tab focus
                document.addEventListener('visibilitychange', () => {
                    if (document.visibilityState === 'visible' && registration) {
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
