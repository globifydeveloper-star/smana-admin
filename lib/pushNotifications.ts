/**
 * lib/pushNotifications.ts
 *
 * Handles Firebase Cloud Messaging (FCM) token registration in the admin PWA.
 * Replaces the old VAPID / PushManager.subscribe implementation.
 *
 * Flow:
 *  1. Request notification permission (browser prompt)
 *  2. Get FCM token via getToken() using the service worker registration
 *  3. POST the token to the backend (/api/push/subscribe) with Bearer auth
 *
 * Called automatically on login — completely transparent to users.
 */

import { getToken } from 'firebase/messaging';
import { getFirebaseMessaging } from './firebase';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
const FCM_VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || '';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Read the JWT token saved by the login page */
function getAuthToken(): string | null {
    try {
        const raw = localStorage.getItem('userInfo');
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed.token || null;
    } catch {
        return null;
    }
}

/** Build headers with Bearer token */
function authHeaders(): Record<string, string> {
    const token = getAuthToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
}

// ---------------------------------------------------------------------------
// isPushSupported — quick platform check
// ---------------------------------------------------------------------------
export function isPushSupported(): boolean {
    return (
        typeof window !== 'undefined' &&
        'serviceWorker' in navigator &&
        'Notification' in window
    );
}

// ---------------------------------------------------------------------------
// requestNotificationPermission
// ---------------------------------------------------------------------------
export async function requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const result = await Notification.requestPermission();
    return result === 'granted';
}

// ---------------------------------------------------------------------------
// subscribeToPush
// Gets an FCM registration token and registers it with the backend.
// Called automatically on login — completely transparent to users.
// ---------------------------------------------------------------------------
export async function subscribeToPush(
    registration: ServiceWorkerRegistration
): Promise<boolean> {
    try {
        // ── 1. Get Firebase Messaging instance ──────────────────────────────
        const messaging = await getFirebaseMessaging();
        if (!messaging) {
            console.warn('[FCM] ⚠️ Firebase Messaging not supported in this browser — push skipped');
            return false;
        }

        // ── 2. Validate VAPID key is configured ─────────────────────────────
        if (!FCM_VAPID_KEY) {
            console.error(
                '[FCM] ❌ NEXT_PUBLIC_FIREBASE_VAPID_KEY is not set!\n' +
                '      → In production: add this env var to your hosting platform (Vercel/Railway/etc.)\n' +
                '      → Value: BArc2aJAcYvl4x7Kxr0P-H5oFPpLOG5gu0iJw9GLGTj6F2_4_LI0v9oszIt4H-VzOJF3dUCScjhoxbIsBSzSShs'
            );
            return false;
        }

        console.log('[FCM] Requesting token with VAPID key:', FCM_VAPID_KEY.slice(0, 20) + '…');

        // ── 3. Get (or refresh) the FCM registration token ──────────────────
        let fcmToken: string;
        try {
            fcmToken = await getToken(messaging, {
                vapidKey: FCM_VAPID_KEY,
                serviceWorkerRegistration: registration,
            });
        } catch (tokenErr: any) {
            console.error('[FCM] ❌ getToken() threw an error:', tokenErr?.message || tokenErr);
            console.error('[FCM]    Common causes: notification permission denied, SW not active, wrong VAPID key');
            return false;
        }

        if (!fcmToken) {
            console.error('[FCM] ❌ getToken() returned empty string — notification permission may be denied in browser settings');
            return false;
        }

        console.log('[FCM] Token obtained:', fcmToken.slice(0, 20) + '…');

        // ── 4. Send token to backend ─────────────────────────────────────────
        const jwtToken = getAuthToken();
        if (!jwtToken) {
            console.warn('[FCM] No JWT token found — user must be logged in to register FCM token');
            return false;
        }

        const saveRes = await fetch(`${API_BASE}/api/push/subscribe`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ token: fcmToken }),
        });

        if (saveRes.ok) {
            console.log('[FCM] ✅ FCM push notifications activated successfully');
            return true;
        } else {
            const errText = await saveRes.text().catch(() => '');
            console.error('[FCM] ❌ Failed to save FCM token to backend:', saveRes.status, errText);
            return false;
        }
    } catch (err: any) {
        console.error('[FCM] subscribeToPush unexpected error:', err?.message || err);
        return false;
    }
}


// ---------------------------------------------------------------------------
// unsubscribeFromPush — call on logout to de-register FCM token
// ---------------------------------------------------------------------------
export async function unsubscribeFromPush(registration: ServiceWorkerRegistration): Promise<void> {
    try {
        const messaging = await getFirebaseMessaging();
        if (!messaging) return;

        const fcmToken = await getToken(messaging, {
            vapidKey: FCM_VAPID_KEY,
            serviceWorkerRegistration: registration,
        }).catch(() => null);

        if (!fcmToken) return;

        await fetch(`${API_BASE}/api/push/unsubscribe`, {
            method: 'DELETE',
            headers: authHeaders(),
            body: JSON.stringify({ token: fcmToken }),
        });

        console.log('[FCM] FCM token removed on logout');
    } catch (err: any) {
        console.warn('[FCM] unsubscribeFromPush error:', err?.message || err);
    }
}
