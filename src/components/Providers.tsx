"use client";

import React from "react";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { OfflineBanner } from "@/components/OfflineBanner";
import { KeyboardShortcutsModal } from "@/components/KeyboardShortcutsModal";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <OfflineBanner />
        <KeyboardShortcutsModal />
        {children}
      </AuthProvider>
    </ThemeProvider>
  );
}
