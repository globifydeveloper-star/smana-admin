/**
 * lib/pushNotifications.ts
 *
 * Handles Web Push subscription in the admin PWA.
 * Subscription is automatic on login — no UI needed.
 * 
 * Auth strategy: reads JWT token from localStorage (same place login stores it)
 * and sends it as a Bearer header. This is MORE RELIABLE than cookies for
 * cross-origin requests (admin.smanahotels.com → api.smanahotels.com).
 */

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    const buffer = new ArrayBuffer(rawData.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < rawData.length; i++) {
        view[i] = rawData.charCodeAt(i);
    }
    return view;
}

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

/** Build headers with Bearer token — bypasses cross-origin cookie issues */
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
        'PushManager' in window &&
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
// Creates a PushManager subscription and registers it with the backend.
// Called automatically on login — completely transparent to users.
// ---------------------------------------------------------------------------
export async function subscribeToPush(
    registration: ServiceWorkerRegistration
): Promise<boolean> {
    try {
        // ── 1. Get VAPID public key ──────────────────────────────────────────
        const keyRes = await fetch(`${API_BASE}/api/push/vapid-public-key`);
        if (!keyRes.ok) {
            console.error('[Push] VAPID key endpoint returned', keyRes.status,
                '— check VAPID_PUBLIC_KEY is set on the backend server');
            return false;
        }
        const { publicKey } = await keyRes.json();
        if (!publicKey) {
            console.error('[Push] VAPID public key is empty');
            return false;
        }

        // ── 2. Create or retrieve browser PushSubscription ──────────────────
        // Unsubscribe any old subscription first to avoid stale endpoints
        // (e.g. after VAPID key rotation or backend DB reset)
        const existing = await registration.pushManager.getSubscription();
        if (existing) {
            await existing.unsubscribe();
        }

        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
        });

        // ── 3. Save subscription to backend ──────────────────────────────────
        // Uses Bearer token auth — works cross-origin regardless of cookie sameSite
        const token = getAuthToken();
        if (!token) {
            console.warn('[Push] No JWT token found — user must be logged in to subscribe. Will retry after login.');
            return false;
        }

        const saveRes = await fetch(`${API_BASE}/api/push/subscribe`, {
            method: 'POST',
            headers: authHeaders(),
            credentials: 'include',
            body: JSON.stringify(subscription.toJSON()),
        });

        if (saveRes.ok) {
            console.log('[Push] ✅ Push notifications activated successfully');
            return true;
        } else {
            const errText = await saveRes.text().catch(() => '');
            console.error('[Push] Failed to save subscription:', saveRes.status, errText);
            return false;
        }
    } catch (err: any) {
        console.error('[Push] subscribeToPush error:', err?.message || err);
        return false;
    }
}
