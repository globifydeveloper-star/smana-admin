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
 * Registers /sw.js in production and — after the user grants notification
 * permission — subscribes to Web Push notifications.
 *
 * Flow:
 * 1. Register /sw.js (same as before)
 * 2. Prompt for notification permission (first visit only)
 * 3. Call pushManager.subscribe() → POST subscription to backend
 * 4. On detect of a new SW version → silent SKIP_WAITING + reload
 */
export function ServiceWorkerRegistrar() {
    useEffect(() => {
        if (process.env.NODE_ENV !== 'production') return;
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
                            console.log('[SW] New version detected. Activating…');
                            newWorker.postMessage({ type: 'SKIP_WAITING' });
                        }
                    });
                });

                // Reload after controller change (new SW took over)
                navigator.serviceWorker.addEventListener('controllerchange', () => {
                    window.location.reload();
                });

                // ── Push notification subscription ───────────────────────────────
                if (!isPushSupported()) {
                    console.warn('[Push] Not supported in this browser');
                    return;
                }

                // Don't ask again if already subscribed
                const alreadySubscribed = localStorage.getItem('pushSubscribed') === 'true';
                if (alreadySubscribed) {
                    // Re-check subscription is still valid on every page load
                    const existingSub = await registration.pushManager.getSubscription();
                    if (existingSub) {
                        console.log('[Push] Already subscribed ✓');
                        return;
                    }
                    // Subscription was cleared — re-subscribe
                    localStorage.removeItem('pushSubscribed');
                }

                const granted = await requestNotificationPermission();
                if (!granted) {
                    console.warn('[Push] Permission not granted');
                    return;
                }

                await subscribeToPush(registration);

                // Check for SW updates on each visibility change (tab focus)
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

    return null; // Renders no UI
}
