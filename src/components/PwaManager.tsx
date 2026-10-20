"use client";

import { useEffect, useState, createContext, useContext } from "react";

interface PwaContextType {
  isTwa: boolean;
  isStandalone: boolean;
  isOnline: boolean;
}

const PwaContext = createContext<PwaContextType>({
  isTwa: false,
  isStandalone: false,
  isOnline: true,
});

export const usePwa = () => useContext(PwaContext);

export function PwaManager({ children }: { children: React.ReactNode }) {
  const [isTwa, setIsTwa] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // 1. Detect TWA and standalone modes
    if (typeof window !== "undefined") {
      const isReferrerTwa = document.referrer.includes("android-app://");
      const isStandaloneMode =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        window.location.search.includes("utm_source=twa");

      const twaDetected = isReferrerTwa || isStandaloneMode;
      setIsTwa(twaDetected);
      setIsStandalone(isStandaloneMode);

      if (twaDetected) {
        document.documentElement.classList.add("is-twa");
        document.documentElement.setAttribute("data-twa", "true");
      }

      // Online status
      setIsOnline(navigator.onLine);
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      // 2. Register Service Worker in production or local testing
      if ("serviceWorker" in navigator && process.env.NODE_ENV !== "test") {
        navigator.serviceWorker
          .register("/sw.js", { scope: "/" })
          .then((reg) => {
            // Check for updates
            reg.onupdatefound = () => {
              const installingWorker = reg.installing;
              if (installingWorker) {
                installingWorker.onstatechange = () => {
                  if (
                    installingWorker.state === "installed" &&
                    navigator.serviceWorker.controller
                  ) {
                    console.log("SynqSquad update available.");
                  }
                };
              }
            };
          })
          .catch((err) => {
            console.warn("ServiceWorker registration skipped or failed:", err);
          });
      }

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  return (
    <PwaContext.Provider value={{ isTwa, isStandalone, isOnline }}>
      {children}
    </PwaContext.Provider>
  );
}
