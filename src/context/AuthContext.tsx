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

interface AuthContextType {
  user: UserProfile | null;
  isAuthModalOpen: boolean;
  isLoggingIn: boolean;
  loginError: string | null;
  openAuthModal: (returnAction?: () => void) => void;
  closeAuthModal: () => void;
  signInWithGoogle: (profileData?: Partial<UserProfile>) => Promise<boolean>;
  signOut: () => void;
  updateProfile: (updated: Partial<UserProfile>) => void;
  contactedList: string[];
  addContactedId: (id: string) => void;
  retryLogin: () => void;
  isSessionExpired: boolean;
  acknowledgeExpiredSession: () => void;
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
    return localStorage.getItem("synqsquad_contacted") || "[]";
  } catch {
    return "[]";
  }
}

function getContactsServerSnapshot(): string {
  return "[]";
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string }) => void;
            error_callback?: (error: { type: string; message: string }) => void;
          }) => {
            requestAccessToken: () => void;
          };
        };
      };
    };
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const userJson = useSyncExternalStore(subscribeAuth, getUserSnapshot, getUserServerSnapshot);
  const contactsJson = useSyncExternalStore(
    subscribeAuth,
    getContactsSnapshot,
    getContactsServerSnapshot
  );

  const user: UserProfile | null = userJson ? JSON.parse(userJson) : null;
  const contactedList: string[] = contactsJson ? JSON.parse(contactsJson) : [];

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [isSessionExpired, setIsSessionExpired] = useState(false);

  // Load Google Identity Services script if Client ID is configured
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (clientId && clientId !== "your-google-client-id.apps.googleusercontent.com") {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
      return () => {
        document.body.removeChild(script);
      };
    }
  }, []);

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

      // 2. Check cookies / localStorage capability
      try {
        localStorage.setItem("__test_storage__", "1");
        localStorage.removeItem("__test_storage__");
      } catch {
        setLoginError("Cookies or local storage are blocked in your browser. Please enable storage to sign in.");
        return false;
      }

      setIsLoggingIn(true);
      setLoginError(null);

      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      const isRealClientConfigured =
        clientId && clientId !== "your-google-client-id.apps.googleusercontent.com";

      try {
        // Enforce 30s timeout per requirement
        let timeoutId: NodeJS.Timeout;
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error("Login timed out after 30 seconds. Please check your connection and retry."));
          }, 30000);
        });

        const authExecutionPromise = new Promise<UserProfile>((resolve, reject) => {
          if (isRealClientConfigured && typeof window !== "undefined" && window.google?.accounts?.oauth2) {
            // Real Google Identity Services OAuth (Strict basic email & profile scopes only)
            const tokenClient = window.google.accounts.oauth2.initTokenClient({
              client_id: clientId,
              scope: "email profile",
              callback: async (resp) => {
                if (resp.error) {
                  if (resp.error === "popup_closed_by_user") {
                    reject(new Error("Google sign-in popup was closed before completing."));
                  } else if (resp.error === "access_denied") {
                    reject(new Error("Google sign-in was cancelled or consent was denied."));
                  } else {
                    reject(new Error(`Google authentication failed: ${resp.error}`));
                  }
                  return;
                }

                if (!resp.access_token) {
                  reject(new Error("No access token returned from Google."));
                  return;
                }

                try {
                  // Fetch verified profile from Google's userinfo endpoint
                  const infoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                    headers: { Authorization: `Bearer ${resp.access_token}` },
                  });
                  if (!infoRes.ok) {
                    throw new Error("Failed to retrieve profile from Google");
                  }
                  const info = await infoRes.json();
                  const consentTimestamp = new Date().toISOString();

                  const authenticatedUser: UserProfile = {
                    id: `usr-${info.sub || Date.now().toString(36)}`,
                    name: info.name || "Collaborator",
                    email: info.email.toLowerCase(),
                    photo: info.picture || "",
                    role: profileData?.role || "Developer",
                    college: profileData?.college || "Independent",
                    skills: profileData?.skills || ["Next.js", "Python"],
                    lookingFor: profileData?.lookingFor || "both",
                    bio: profileData?.bio || "",
                    consentAt: consentTimestamp,
                    createdAt: consentTimestamp,
                  };

                  resolve(authenticatedUser);
                } catch (err: unknown) {
                  reject(err);
                }
              },
              error_callback: (err) => {
                if (err.type === "popup_blocked") {
                  reject(new Error("Popup was blocked by your browser. Please allow popups for Google sign-in."));
                } else {
                  reject(new Error(err.message || "Failed to launch Google authentication window."));
                }
              },
            });

            tokenClient.requestAccessToken();
          } else {
            // Development & Sandbox verified Google account with consent timestamp
            setTimeout(() => {
              const consentTimestamp = new Date().toISOString();
              const authenticatedUser: UserProfile = {
                ...DEMO_GOOGLE_USER,
                ...profileData,
                consentAt: consentTimestamp,
              };
              resolve(authenticatedUser);
            }, 600);
          }
        });

        const authenticatedUser = await Promise.race([authExecutionPromise, timeoutPromise]);
        clearTimeout(timeoutId!);

        localStorage.setItem("synqsquad_user", JSON.stringify(authenticatedUser));
        window.dispatchEvent(new Event("synqsquad_auth_change"));

        setIsLoggingIn(false);
        setIsAuthModalOpen(false);

        // Return user to their exact previous place & execute pending action
        if (pendingAction) {
          const action = pendingAction;
          setPendingAction(null);
          setTimeout(() => action(), 50);
        }

        return true;
      } catch (err: unknown) {
        setIsLoggingIn(false);
        const msg = err instanceof Error ? err.message : "Failed to sign in with Google";
        setLoginError(msg);
        return false;
      }
    },
    [pendingAction]
  );

  const retryLogin = useCallback(() => {
    signInWithGoogle();
  }, [signInWithGoogle]);

  const signOut = useCallback(() => {
    try {
      localStorage.removeItem("synqsquad_user");
      window.dispatchEvent(new Event("synqsquad_auth_change"));
    } catch {
      // ignore
    }
  }, []);

  const updateProfile = useCallback(
    (updated: Partial<UserProfile>) => {
      if (!user) return;
      const nextUser = { ...user, ...updated };
      try {
        localStorage.setItem("synqsquad_user", JSON.stringify(nextUser));
        window.dispatchEvent(new Event("synqsquad_auth_change"));
      } catch {
        // ignore
      }
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
    } catch {
      // ignore
    }
  }, []);

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
