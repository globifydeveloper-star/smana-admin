/**
 * lib/pushNotifications.ts
 * 
 * Client-side helpers for the Web Push API.
 * Handles requesting permission, creating a PushManager subscription,
 * and syncing it with the backend.
 *
 * Usage: called from ServiceWorkerRegistrar after SW registration.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.smanahotels.com';

// ---------------------------------------------------------------------------
// Convert a URL-safe base64 string to a Uint8Array (required by PushManager)
// Uses explicit ArrayBuffer to satisfy TypeScript's strict PushManager types.
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

// ---------------------------------------------------------------------------
// requestPermission
// Shows the browser's notification permission prompt.
// Returns true if permission was granted.
// ---------------------------------------------------------------------------
export async function requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
        console.warn('[Push] Notifications API not supported in this browser.');
        return false;
    }

    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') {
        console.warn('[Push] Notification permission denied by user.');
        return false;
    }

    const result = await Notification.requestPermission();
    return result === 'granted';
}

// ---------------------------------------------------------------------------
// subscribeToPush
// Creates a PushManager subscription in the browser and POSTs it to the backend.
// Should be called after SW registration and permission grant.
// ---------------------------------------------------------------------------
export async function subscribeToPush(
    registration: ServiceWorkerRegistration
): Promise<PushSubscription | null> {
    try {
        // Fetch VAPID public key from backend
        const res = await fetch(`${API_BASE}/api/push/vapid-public-key`, {
            credentials: 'include',
        });

        if (!res.ok) {
            console.error('[Push] Failed to get VAPID public key:', res.status);
            return null;
        }

        const { publicKey } = await res.json();
        const applicationServerKey = urlBase64ToUint8Array(publicKey);

        // Create subscription in the browser
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true, // Required: push must always show a notification
            applicationServerKey: applicationServerKey as BufferSource,
        });

        // Save subscription to backend
        const saveRes = await fetch(`${API_BASE}/api/push/subscribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(subscription.toJSON()),
        });

        if (saveRes.ok) {
            console.log('[Push] Subscribed to push notifications ✓');
            localStorage.setItem('pushSubscribed', 'true');
            return subscription;
        } else {
            console.error('[Push] Failed to save subscription to server:', saveRes.status);
            return null;
        }
    } catch (err) {
        console.error('[Push] subscribeToPush failed:', err);
        return null;
    }
}

// ---------------------------------------------------------------------------
// unsubscribeFromPush
// Removes the PushManager subscription and DELETEs it from the backend.
// ---------------------------------------------------------------------------
export async function unsubscribeFromPush(
    registration: ServiceWorkerRegistration
): Promise<void> {
    try {
        const subscription = await registration.pushManager.getSubscription();
        if (!subscription) return;

        await fetch(`${API_BASE}/api/push/unsubscribe`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ endpoint: subscription.endpoint }),
        });

        await subscription.unsubscribe();
        localStorage.removeItem('pushSubscribed');
        console.log('[Push] Unsubscribed from push notifications');
    } catch (err) {
        console.error('[Push] unsubscribeFromPush failed:', err);
    }
}

// ---------------------------------------------------------------------------
// isPushSupported
// Quick platform check before attempting to subscribe.
// ---------------------------------------------------------------------------
export function isPushSupported(): boolean {
    return (
        typeof window !== 'undefined' &&
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window
    );
}
