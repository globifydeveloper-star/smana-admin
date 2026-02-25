"use client";

/**
 * ServiceWorkerRegistrar
 *
 * Client-side component that registers the custom service worker (public/sw.js).
 * Mounted once in the root layout. Handles:
 *  - Registration on first load
 *  - Auto-update detection when a new SW version is available
 *  - Console logging in development for debugging
 *
 * This component renders nothing visible — it is purely functional.
 */

import { useEffect } from "react";

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    // Service workers are not supported in all environments
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    // Only register in production — avoid interfering with Next.js HMR in development
    if (process.env.NODE_ENV !== "production") {
      console.log("[SW] Skipping registration in development mode.");
      return;
    }

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          // Scope is set to "/" to cover the entire admin panel.
          // Change to "/dashboard/" if you want a more restricted scope.
          scope: "/",
          updateViaCache: "none", // Always check the network for a new SW on navigation
        });

        console.log("[SW] Registered. Scope:", registration.scope);

        // Check for updates every time the page becomes visible
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") {
            registration.update().catch(console.warn);
          }
        });

        // Detect when a new service worker is waiting to activate
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // A new version is ready — you can prompt the user to refresh.
              // For admin panels, a silent auto-refresh is usually fine.
              console.log("[SW] New version available. Refreshing…");
              newWorker.postMessage({ type: "SKIP_WAITING" });
              window.location.reload();
            }
          });
        });

        // Reload the page when the SW takes control (after update)
        let refreshing = false;
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (!refreshing) {
            refreshing = true;
            window.location.reload();
          }
        });
      } catch (err) {
        console.error("[SW] Registration failed:", err);
      }
    };

    // Register after the page fully loads to not compete with critical resources
    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register);
    }

    return () => {
      window.removeEventListener("load", register);
    };
  }, []);

  // No visible output
  return null;
}
