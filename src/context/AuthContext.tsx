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

function subscribeAuth(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("synqsquad_auth_change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("synqsquad_auth_change", callback);
  };
}

function notifyAuthChange() {
  window.dispatchEvent(new Event("rivq_auth_change"));
  window.dispatchEvent(new Event("synqsquad_auth_change"));
}

function getUserSnapshot(): string {
  try {
    return localStorage.getItem("rivq_user") || localStorage.getItem("synqsquad_user") || "";
  } catch {
    return "";
  }
}

function getUserServerSnapshot(): string {
  return "";
}

function getContactsSnapshot(): string {
  try {
    return localStorage.getItem("rivq_contacted") || localStorage.getItem("synqsquad_contacted") || "";
  } catch {
    return "";
  }
}

function getContactsServerSnapshot(): string {
  return "";
}

function getBlockedSnapshot(): string {
  try {
    return localStorage.getItem("rivq_blocked") || localStorage.getItem("synqsquad_blocked") || "";
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

    // Check for query param auth_error (e.g. from /auth/callback redirect)
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const authErr = urlParams.get("auth_error");
      if (authErr) {
        setLoginError(decodeURIComponent(authErr));
        setIsAuthModalOpen(true);
        // Clean query param
        urlParams.delete("auth_error");
        const newSearch = urlParams.toString();
        const cleanUrl = window.location.pathname + (newSearch ? `?${newSearch}` : "") + window.location.hash;
        window.history.replaceState(null, "", cleanUrl);
      }
    }

    const syncUserProfile = async (
      u: { id: string; email?: string; user_metadata?: Record<string, unknown>; created_at?: string },
      token?: string
    ) => {
      const email = (u.email || "").toLowerCase().trim();
      const collegeGuess = email.endsWith("@gbu.ac.in")
        ? "Gautam Buddha University"
        : email.includes(".ac.in") || email.includes(".edu")
        ? "University"
        : "Independent";

      let pendingData: Partial<UserProfile> = {};
      try {
        const storedPending = localStorage.getItem("rivq_pending_profile");
        if (storedPending) {
          pendingData = JSON.parse(storedPending);
          localStorage.removeItem("rivq_pending_profile");
        }
      } catch {}

      try {
        if (token) {
          const fetchRes = await fetch("/api/user", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const fetchData = await fetchRes.json();
          const existingProfile: UserProfile | null = fetchData.success && fetchData.data ? fetchData.data : null;

          const meta = (u.user_metadata || {}) as Record<string, string | undefined>;
          const metaName = meta.full_name || meta.name || "";
          const metaAvatar = typeof meta.avatar_url === "string" ? meta.avatar_url : undefined;

          const mergedProfile: UserProfile = {
            id: u.id,
            name:
              existingProfile?.name ||
              metaName ||
              email.split("@")[0] ||
              "Developer",
            email: email,
            photo: metaAvatar || existingProfile?.photo || undefined,
            role: pendingData.role || existingProfile?.role || "Developer",
            college: pendingData.college || existingProfile?.college || collegeGuess,
            skills: pendingData.skills?.length
              ? pendingData.skills
              : existingProfile?.skills?.length
              ? existingProfile.skills
              : ["React", "Python"],
            lookingFor: pendingData.lookingFor || existingProfile?.lookingFor || "both",
            bio: pendingData.bio ?? (existingProfile?.bio || ""),
            consentAt: existingProfile?.consentAt || new Date().toISOString(),
            createdAt: existingProfile?.createdAt || u.created_at || new Date().toISOString(),
          };

          // If we had pending data or no existing profile was found, persist to Supabase
          if (Object.keys(pendingData).length > 0 || !existingProfile) {
            const upsertRes = await fetch("/api/user", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(mergedProfile),
            });
            const upsertData = await upsertRes.json();
            const finalProfile = upsertData.success && upsertData.data ? upsertData.data : mergedProfile;
            localStorage.setItem("rivq_user", JSON.stringify(finalProfile));
            localStorage.setItem("synqsquad_user", JSON.stringify(finalProfile));
          } else {
            localStorage.setItem("rivq_user", JSON.stringify(existingProfile));
            localStorage.setItem("synqsquad_user", JSON.stringify(existingProfile));
          }

          notifyAuthChange();
          if (pendingAction) {
            pendingAction();
            setPendingAction(null);
          }
          return;
        }
      } catch (e) {
        console.error("Profile sync error:", e);
      }

      const fallbackMeta = (u.user_metadata || {}) as Record<string, string | undefined>;
      const fallbackName = fallbackMeta.full_name || fallbackMeta.name || "";
      const fallbackAvatar = typeof fallbackMeta.avatar_url === "string" ? fallbackMeta.avatar_url : undefined;

      const defaultProfile: UserProfile = {
        id: u.id,
        name: fallbackName || email.split("@")[0] || "Developer",
        email: email,
        photo: fallbackAvatar,
        role: pendingData.role || "Developer",
        college: pendingData.college || collegeGuess,
        skills: pendingData.skills?.length ? pendingData.skills : ["React", "Python"],
        lookingFor: pendingData.lookingFor || "both",
        bio: pendingData.bio || "",
        consentAt: new Date().toISOString(),
        createdAt: u.created_at || new Date().toISOString(),
      };

      try {
        localStorage.setItem("rivq_user", JSON.stringify(defaultProfile));
        localStorage.setItem("synqsquad_user", JSON.stringify(defaultProfile));
        notifyAuthChange();
        if (pendingAction) {
          pendingAction();
          setPendingAction(null);
        }
      } catch {}
    };

    // 1. Check for Hash fragment tokens (#access_token=... or #error_description=...) from Implicit flow fallback
    if (typeof window !== "undefined" && window.location.hash) {
      const hash = window.location.hash.startsWith("#")
        ? window.location.hash.substring(1)
        : window.location.hash;
      const hashParams = new URLSearchParams(hash);
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const errorDesc = hashParams.get("error_description");

      if (errorDesc) {
        setLoginError(decodeURIComponent(errorDesc.replace(/\+/g, " ")));
        setIsAuthModalOpen(true);
      } else if (accessToken) {
        supabase.auth
          .setSession({
            access_token: accessToken,
            refresh_token: refreshToken || "",
          })
          .then(({ data, error }) => {
            if (error) {
              console.error("setSession error from hash:", error.message);
              setLoginError(error.message);
            } else if (data.session?.user) {
              syncUserProfile(data.session.user, data.session.access_token);
            }
          })
          .finally(() => {
            // Clean up the hash for a clean, professional address bar
            if (window.history && window.history.replaceState) {
              window.history.replaceState(
                null,
                "",
                window.location.pathname + window.location.search
              );
            }
          });
      }
    }

    // 2. Check active session on mount
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("Supabase getSession error:", error.message);
        return;
      }
      if (session?.user && (!user || user.id !== session.user.id)) {
        syncUserProfile(session.user, session.access_token);
      }
    });

    // 3. Listen to auth state transitions (Token refresh, SIGNED_OUT, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        try {
          localStorage.removeItem("rivq_user");
          localStorage.removeItem("synqsquad_user");
          notifyAuthChange();
        } catch {}
      } else if (event === "TOKEN_REFRESHED" && session?.user) {
        // Token refreshed successfully
      } else if (event === "SIGNED_IN" && session?.user) {
        syncUserProfile(session.user, session.access_token);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user, pendingAction]);

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
        if (profileData) {
          localStorage.setItem("rivq_pending_profile", JSON.stringify(profileData));
        }
      } catch {
        setLoginError("Cookies or local storage are blocked in your browser. Please enable storage to sign in.");
        return false;
      }

      setIsLoggingIn(true);
      setLoginError(null);

      // 3. Initiate official Supabase Google OAuth
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

      setLoginError("Authentication service is not configured. Please contact support.");
      setIsLoggingIn(false);
      return false;
    },
    []
  );

  const signOut = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch {}
    }
    try {
      localStorage.removeItem("rivq_user");
      localStorage.removeItem("rivq_token");
      localStorage.removeItem("synqsquad_user");
      localStorage.removeItem("synqsquad_token");
      notifyAuthChange();
    } catch {}
  }, []);

  const updateProfile = useCallback(
    (updated: Partial<UserProfile>) => {
      if (!user) return;
      const nextUser = { ...user, ...updated };
      try {
        localStorage.setItem("rivq_user", JSON.stringify(nextUser));
        localStorage.setItem("synqsquad_user", JSON.stringify(nextUser));
        notifyAuthChange();
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
      const stored = localStorage.getItem("rivq_contacted") || localStorage.getItem("synqsquad_contacted");
      const current: string[] = stored ? JSON.parse(stored) : [];
      if (!current.includes(id)) {
        const next = [id, ...current];
        localStorage.setItem("rivq_contacted", JSON.stringify(next));
        localStorage.setItem("synqsquad_contacted", JSON.stringify(next));
        notifyAuthChange();
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
          localStorage.setItem("rivq_blocked", JSON.stringify(data.blockedUsers));
          localStorage.setItem("synqsquad_blocked", JSON.stringify(data.blockedUsers));
          notifyAuthChange();
        }
      })
      .catch(() => {});
  }, [user?.email]);

  const blockUser = useCallback(
    (emailToBlock: string) => {
      const lower = emailToBlock.toLowerCase();
      try {
        const stored = localStorage.getItem("rivq_blocked") || localStorage.getItem("synqsquad_blocked");
        const current: string[] = stored ? JSON.parse(stored) : [];
        if (!current.includes(lower)) {
          const next = [lower, ...current];
          localStorage.setItem("rivq_blocked", JSON.stringify(next));
          localStorage.setItem("synqsquad_blocked", JSON.stringify(next));
          notifyAuthChange();
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
        const stored = localStorage.getItem("rivq_blocked") || localStorage.getItem("synqsquad_blocked");
        const current: string[] = stored ? JSON.parse(stored) : [];
        const next = current.filter((e) => e !== lower);
        localStorage.setItem("rivq_blocked", JSON.stringify(next));
        localStorage.setItem("synqsquad_blocked", JSON.stringify(next));
        notifyAuthChange();
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
