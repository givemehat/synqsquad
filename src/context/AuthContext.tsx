"use client";

import React, {
  createContext,
  useContext,
  useState,
  useSyncExternalStore,
  useCallback,
  useEffect,
} from "react";
import { UserProfile } from "@/types";
import { getSupabaseBrowserClient, isSupabaseBrowserConfigured } from "@/lib/supabase-browser";
import { authFetch } from "@/lib/api-client";

function makeTestJwt(user: UserProfile): string {
  try {
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" })).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    const payload = btoa(JSON.stringify({
      sub: user.id,
      id: user.id,
      email: user.email,
      name: user.name,
      exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
    })).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    return `${header}.${payload}.test_sig`;
  } catch {
    return "";
  }
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthModalOpen: boolean;
  isLoggingIn: boolean;
  loginError: string | null;
  openAuthModal: (returnAction?: () => void) => void;
  closeAuthModal: () => void;
  signInWithGoogle: (profileData?: Partial<UserProfile>) => Promise<boolean>;
  signOut: () => Promise<void>;
  updateProfile: (updated: Partial<UserProfile>) => void;
  contactedList: string[];
  addContactedId: (id: string) => void;
  retryLogin: () => void;
  isSessionExpired: boolean;
  acknowledgeExpiredSession: () => void;
  blockedUsers: string[];
  blockUser: (email: string) => void;
  unblockUser: (email: string) => void;
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
  consentAt: "2026-10-19T18:00:00.000Z",
  createdAt: "2026-10-19T18:00:00.000Z",
};

function subscribeAuth(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("synqsquad_auth_change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("synqsquad_auth_change", callback);
  };
}

function getUserSnapshot(): string {
  try {
    return localStorage.getItem("synqsquad_user") || "";
  } catch {
    return "";
  }
}

function getUserServerSnapshot(): string {
  return "";
}

function getContactsSnapshot(): string {
  try {
    return localStorage.getItem("synqsquad_contacted") || "";
  } catch {
    return "";
  }
}

function getContactsServerSnapshot(): string {
  return "";
}

function getBlockedSnapshot(): string {
  try {
    return localStorage.getItem("synqsquad_blocked") || "";
  } catch {
    return "";
  }
}

function getBlockedServerSnapshot(): string {
  return "";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const userJson = useSyncExternalStore(subscribeAuth, getUserSnapshot, getUserServerSnapshot);
  const contactsJson = useSyncExternalStore(
    subscribeAuth,
    getContactsSnapshot,
    getContactsServerSnapshot
  );
  const blockedJson = useSyncExternalStore(
    subscribeAuth,
    getBlockedSnapshot,
    getBlockedServerSnapshot
  );

  const user: UserProfile | null = userJson ? JSON.parse(userJson) : null;
  const contactedList: string[] = contactsJson ? JSON.parse(contactsJson) : [];
  const blockedUsers: string[] = blockedJson ? JSON.parse(blockedJson) : [];

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [isSessionExpired, setIsSessionExpired] = useState(false);

  // Sync Supabase Auth session if configured
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    // Check active session on mount
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("Supabase getSession error:", error.message);
        return;
      }
      if (session?.user && !user) {
        const u = session.user;
        const profile: UserProfile = {
          id: u.id,
          name: u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split("@")[0] || "User",
          email: u.email || "",
          photo: u.user_metadata?.avatar_url || undefined,
          role: "Developer",
          college: "Independent",
          skills: ["Next.js", "Python"],
          lookingFor: "both",
          bio: "",
          consentAt: new Date().toISOString(),
          createdAt: u.created_at || new Date().toISOString(),
        };
        try {
          localStorage.setItem("synqsquad_user", JSON.stringify(profile));
          window.dispatchEvent(new Event("synqsquad_auth_change"));
        } catch {}
      }
    });

    // Listen to auth state transitions (Token refresh, SIGNED_OUT, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        try {
          localStorage.removeItem("synqsquad_user");
          window.dispatchEvent(new Event("synqsquad_auth_change"));
        } catch {}
      } else if (event === "TOKEN_REFRESHED" && session?.user) {
        // Token refreshed successfully
      } else if (event === "SIGNED_IN" && session?.user) {
        const u = session.user;
        const profile: UserProfile = {
          id: u.id,
          name: u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split("@")[0] || "User",
          email: u.email || "",
          photo: u.user_metadata?.avatar_url || undefined,
          role: "Developer",
          college: "Independent",
          skills: ["Next.js", "Python"],
          lookingFor: "both",
          bio: "",
          consentAt: new Date().toISOString(),
          createdAt: u.created_at || new Date().toISOString(),
        };
        try {
          localStorage.setItem("synqsquad_user", JSON.stringify(profile));
          window.dispatchEvent(new Event("synqsquad_auth_change"));
        } catch {}
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const openAuthModal = useCallback((returnAction?: () => void) => {
    if (returnAction) {
      setPendingAction(() => returnAction);
    }
    setLoginError(null);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
    setIsLoggingIn(false);
    setLoginError(null);
  }, []);

  const acknowledgeExpiredSession = useCallback(() => {
    setIsSessionExpired(false);
  }, []);

  const signInWithGoogle = useCallback(
    async (profileData?: Partial<UserProfile>): Promise<boolean> => {
      // 1. Check network connectivity
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setLoginError("You are currently offline. Please connect to the internet to sign in.");
        return false;
      }

      // 2. Check storage capability
      try {
        localStorage.setItem("__test_storage__", "1");
        localStorage.removeItem("__test_storage__");
      } catch {
        setLoginError("Cookies or local storage are blocked in your browser. Please enable storage to sign in.");
        return false;
      }

      setIsLoggingIn(true);
      setLoginError(null);

      // 3. If Supabase is configured, use official Supabase Google OAuth
      if (isSupabaseBrowserConfigured()) {
        const supabase = getSupabaseBrowserClient();
        if (supabase) {
          try {
            const redirectUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent(
              window.location.pathname
            )}`;

            const { error } = await supabase.auth.signInWithOAuth({
              provider: "google",
              options: {
                scopes: "email profile",
                redirectTo: redirectUrl,
              },
            });

            if (error) {
              setLoginError(error.message);
              setIsLoggingIn(false);
              return false;
            }
            return true;
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Supabase OAuth initialization failed";
            setLoginError(msg);
            setIsLoggingIn(false);
            return false;
          }
        }
      }

      // 4. Fallback: Local demo Google verification (instant for development & testing)
      try {
        await new Promise((resolve) => setTimeout(resolve, 350));
        const verifiedUser: UserProfile = {
          ...DEMO_GOOGLE_USER,
          ...profileData,
          id: `usr-google-${Date.now().toString(36)}`,
          consentAt: new Date().toISOString(),
        };

        const token = makeTestJwt(verifiedUser);
        localStorage.setItem("synqsquad_token", token);
        localStorage.setItem("synqsquad_user", JSON.stringify(verifiedUser));
        window.dispatchEvent(new Event("synqsquad_auth_change"));

        setIsAuthModalOpen(false);
        setIsLoggingIn(false);
        setLoginError(null);

        if (pendingAction) {
          pendingAction();
          setPendingAction(null);
        }
        return true;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Authentication failed";
        setLoginError(msg);
        setIsLoggingIn(false);
        return false;
      }
    },
    [pendingAction]
  );

  const signOut = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch {}
    }
    try {
      localStorage.removeItem("synqsquad_user");
      localStorage.removeItem("synqsquad_token");
      window.dispatchEvent(new Event("synqsquad_auth_change"));
    } catch {}
  }, []);

  const updateProfile = useCallback(
    (updated: Partial<UserProfile>) => {
      if (!user) return;
      const nextUser = { ...user, ...updated };
      try {
        localStorage.setItem("synqsquad_user", JSON.stringify(nextUser));
        window.dispatchEvent(new Event("synqsquad_auth_change"));
      } catch {}

      // Asynchronously upsert to database with authenticated session
      authFetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextUser),
      }).catch((e) => console.error("Profile sync error:", e));
    },
    [user]
  );

  const addContactedId = useCallback((id: string) => {
    try {
      const stored = localStorage.getItem("synqsquad_contacted");
      const current: string[] = stored ? JSON.parse(stored) : [];
      if (!current.includes(id)) {
        const next = [id, ...current];
        localStorage.setItem("synqsquad_contacted", JSON.stringify(next));
        window.dispatchEvent(new Event("synqsquad_auth_change"));
      }
    } catch {}
  }, []);

  // Sync blocked users from server on login
  useEffect(() => {
    if (!user?.email) return;
    authFetch(`/api/blocks?email=${encodeURIComponent(user.email)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.blockedUsers)) {
          localStorage.setItem("synqsquad_blocked", JSON.stringify(data.blockedUsers));
          window.dispatchEvent(new Event("synqsquad_auth_change"));
        }
      })
      .catch(() => {});
  }, [user?.email]);

  const blockUser = useCallback(
    (emailToBlock: string) => {
      const lower = emailToBlock.toLowerCase();
      try {
        const stored = localStorage.getItem("synqsquad_blocked");
        const current: string[] = stored ? JSON.parse(stored) : [];
        if (!current.includes(lower)) {
          const next = [lower, ...current];
          localStorage.setItem("synqsquad_blocked", JSON.stringify(next));
          window.dispatchEvent(new Event("synqsquad_auth_change"));
        }
      } catch {}

      if (user?.email) {
        authFetch("/api/blocks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ blockedEmail: lower }),
        }).catch((e) => console.error("Error syncing block to server:", e));
      }
    },
    [user]
  );

  const unblockUser = useCallback(
    (emailToUnblock: string) => {
      const lower = emailToUnblock.toLowerCase();
      try {
        const stored = localStorage.getItem("synqsquad_blocked");
        const current: string[] = stored ? JSON.parse(stored) : [];
        const next = current.filter((e) => e !== lower);
        localStorage.setItem("synqsquad_blocked", JSON.stringify(next));
        window.dispatchEvent(new Event("synqsquad_auth_change"));
      } catch {}

      if (user?.email) {
        authFetch("/api/blocks", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ blockedEmail: lower }),
        }).catch((e) => console.error("Error syncing unblock to server:", e));
      }
    },
    [user]
  );

  const retryLogin = useCallback(() => {
    setLoginError(null);
    signInWithGoogle();
  }, [signInWithGoogle]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthModalOpen,
        isLoggingIn,
        loginError,
        openAuthModal,
        closeAuthModal,
        signInWithGoogle,
        signOut,
        updateProfile,
        contactedList,
        addContactedId,
        retryLogin,
        isSessionExpired,
        acknowledgeExpiredSession,
        blockedUsers,
        blockUser,
        unblockUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
