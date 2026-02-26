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
            console.warn('[FCM] Firebase Messaging not supported in this browser — skipping');
            return false;
        }

        // ── 2. Validate VAPID key is configured ─────────────────────────────
        if (!FCM_VAPID_KEY) {
            console.error('[FCM] NEXT_PUBLIC_FIREBASE_VAPID_KEY is not set — cannot get FCM token');
            return false;
        }

        // ── 3. Get (or refresh) the FCM registration token ──────────────────
        const fcmToken = await getToken(messaging, {
            vapidKey: FCM_VAPID_KEY,
            serviceWorkerRegistration: registration,
        });

        if (!fcmToken) {
            console.error('[FCM] getToken() returned empty — notification permission may have been denied');
            return false;
        }

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
            console.error('[FCM] Failed to save FCM token:', saveRes.status, errText);
            return false;
        }
    } catch (err: any) {
        console.error('[FCM] subscribeToPush error:', err?.message || err);
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
