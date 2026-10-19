"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { UserProfile } from "@/types";

interface AuthContextType {
  user: UserProfile | null;
  isAuthModalOpen: boolean;
  openAuthModal: (returnAction?: () => void) => void;
  closeAuthModal: () => void;
  signInWithGoogle: (profileData?: Partial<UserProfile>) => void;
  signOut: () => void;
  updateProfile: (updated: Partial<UserProfile>) => void;
  contactedList: string[]; // listing IDs contacted
  addContactedId: (id: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_GOOGLE_USER: UserProfile = {
  id: "usr-google-verified-01",
  name: "Rajnish Singh",
  email: "rajnishsingh.dev@gmail.com",
  photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
  role: "Full-Stack & ML Engineer",
  college: "Gautam Buddha University",
  skills: ["Next.js", "Python", "PyTorch", "Tailwind CSS"],
  lookingFor: "both",
  bio: "Building AI applications and edge systems. Looking for hackathon partners.",
  createdAt: new Date().toISOString(),
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [contactedList, setContactedList] = useState<string[]>([]);

  useEffect(() => {
    // Restore session from localStorage
    try {
      const stored = localStorage.getItem("synqsquad_user");
      if (stored) {
        setUser(JSON.parse(stored));
      }
      const storedContacts = localStorage.getItem("synqsquad_contacted");
      if (storedContacts) {
        setContactedList(JSON.parse(storedContacts));
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const openAuthModal = (returnAction?: () => void) => {
    if (returnAction) setPendingAction(() => returnAction);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setPendingAction(null);
  };

  const signInWithGoogle = (profileData?: Partial<UserProfile>) => {
    const newUser: UserProfile = {
      ...DEMO_GOOGLE_USER,
      ...profileData,
    };
    setUser(newUser);
    try {
      localStorage.setItem("synqsquad_user", JSON.stringify(newUser));
    } catch {}
    setIsAuthModalOpen(false);

    // If there was a pending action (e.g. user clicked Connect on a specific card), execute it!
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  const signOut = () => {
    setUser(null);
    try {
      localStorage.removeItem("synqsquad_user");
    } catch {}
  };

  const updateProfile = (updated: Partial<UserProfile>) => {
    if (!user) return;
    const nextUser = { ...user, ...updated };
    setUser(nextUser);
    try {
      localStorage.setItem("synqsquad_user", JSON.stringify(nextUser));
    } catch {}
  };

  const addContactedId = (id: string) => {
    setContactedList((prev) => {
      if (prev.includes(id)) return prev;
      const next = [id, ...prev];
      try {
        localStorage.setItem("synqsquad_contacted", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        signInWithGoogle,
        signOut,
        updateProfile,
        contactedList,
        addContactedId,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
