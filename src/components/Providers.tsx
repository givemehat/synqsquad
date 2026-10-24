"use client";

import React from "react";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { OfflineBanner } from "@/components/OfflineBanner";
import { InAppBrowserWarning } from "@/components/InAppBrowserWarning";
import { KeyboardShortcutsModal } from "@/components/KeyboardShortcutsModal";
import { PwaManager } from "@/components/PwaManager";
import { SplashScreen } from "@/components/SplashScreen";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PwaManager>
          <SplashScreen />
          <InAppBrowserWarning />
          <OfflineBanner />
          <KeyboardShortcutsModal />
          {children}
        </PwaManager>
      </AuthProvider>
    </ThemeProvider>
  );
}
