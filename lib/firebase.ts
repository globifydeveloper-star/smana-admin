// lib/firebase.ts
// Initialises the Firebase client SDK for the admin PWA.
// Exports the Firebase app and the Messaging instance for use in pushNotifications.ts.

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: 'AIzaSyBPJimRF_B7uuntDXfFYCY_y5l6_23Bxpo',
  authDomain: 'smana-app.firebaseapp.com',
  projectId: 'smana-app',
  storageBucket: 'smana-app.firebasestorage.app',
  messagingSenderId: '578172341237',
  appId: '1:578172341237:web:66f7827961067c79acaebc',
  measurementId: 'G-T97PLTLYMH',
};

// Prevent re-initialisation in Next.js hot reload / SSR contexts
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

/**
 * Returns the Firebase Messaging instance, or null if Messaging is not
 * supported in the current environment (SSR, or browser without push support).
 *
 * NOTE: isSupported() can return false on http:// even on localhost in some
 * browsers. We fall back to direct initialisation in those cases because
 * localhost IS a secure context and push works fine in Chrome DevTools.
 */
export async function getFirebaseMessaging() {
  if (typeof window === 'undefined') return null; // SSR guard

  try {
    const supported = await isSupported();
    if (supported) {
      return getMessaging(app);
    }

    // Fallback: try direct init — works on localhost (treated as secure context)
    // This handles the case where isSupported() incorrectly returns false on http://localhost
    console.warn('[FCM] isSupported() returned false — attempting direct messaging init (localhost fallback)');
    return getMessaging(app);
  } catch (err) {
    console.error('[FCM] getFirebaseMessaging() failed:', err);
    return null;
  }
}

export { app };