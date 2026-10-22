"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  X,
  Check,
  ChevronDown,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  Loader2,
} from "lucide-react";

const ROLES = [
  "Full-Stack Developer",
  "Frontend Engineer",
  "Backend Engineer",
  "Machine Learning Researcher",
  "Product Designer (UI/UX)",
  "Systems & Embedded Engineer",
  "Smart Contract Developer",
] as const;

interface SkillGroup {
  name: string;
  skills: string[];
}

const SKILL_GROUPS: SkillGroup[] = [
  {
    name: "AI & Machine Learning",
    skills: ["Python", "PyTorch", "FastAPI"],
  },
  {
    name: "Web & Full-Stack",
    skills: ["Next.js", "React", "TypeScript"],
  },
  {
    name: "Systems & Infra",
    skills: ["C++", "ROS2", "Docker"],
  },
  {
    name: "Design & Web3",
    skills: ["Figma", "Three.js", "Solidity"],
  },
];

export function GoogleAuthModal() {
  const {
    user,
    isAuthModalOpen,
    closeAuthModal,
    signInWithGoogle,
    updateProfile,
    isLoggingIn,
    loginError,
    retryLogin,
  } = useAuth();

  const [step, setStep] = useState<"signin" | "profile">("signin");
  const [role, setRole] = useState("Full-Stack Developer");
  const [college, setCollege] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([
    "Next.js",
    "TypeScript",
    "Python",
  ]);
  const [lookingFor, setLookingFor] = useState<"hackathon" | "research" | "both">("both");
  const [bio, setBio] = useState("");

  // Custom Role Dropdown state
  const [isRoleOpen, setIsRoleOpen] = useState(false);
  const [focusedRoleIndex, setFocusedRoleIndex] = useState(-1);

  // Refs for keyboard traps and click-outside
  const modalRef = useRef<HTMLDivElement>(null);
  const roleDropdownRef = useRef<HTMLDivElement>(null);
  const roleButtonRef = useRef<HTMLButtonElement>(null);
  const collegeInputRef = useRef<HTMLInputElement>(null);

  // Sync state when modal opens or user profile loads
  useEffect(() => {
    if (!isAuthModalOpen) {
      setIsRoleOpen(false);
      return;
    }

    if (user) {
      if (user.role) setRole(user.role);
      if (user.college && user.college !== "Independent") setCollege(user.college);
      if (user.skills?.length) setSelectedSkills(user.skills);
      if (user.lookingFor) setLookingFor(user.lookingFor as "hackathon" | "research" | "both");
      if (user.bio) setBio(user.bio);
      setStep("profile");
    } else {
      // Default initial step for unauthenticated visitors
      setStep("signin");
    }
  }, [isAuthModalOpen, user]);

  // Click-outside listener for Role Dropdown
  useEffect(() => {
    if (!isRoleOpen) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(e.target as Node)) {
        setIsRoleOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isRoleOpen]);

  // Keyboard navigation & Focus Trap
  useEffect(() => {
    if (!isAuthModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isRoleOpen) {
          setIsRoleOpen(false);
          roleButtonRef.current?.focus();
          return;
        }
        closeAuthModal();
        return;
      }

      if (e.key === "Tab") {
        if (!modalRef.current) return;
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAuthModalOpen, isRoleOpen, closeAuthModal]);

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) => {
      if (prev.includes(skill)) {
        return prev.filter((s) => s !== skill);
      }
      if (prev.length >= 5) {
        return prev;
      }
      return [...prev, skill];
    });
  };

  const handleRoleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!isRoleOpen) {
        setIsRoleOpen(true);
        const currIdx = ROLES.indexOf(role as typeof ROLES[number]);
        setFocusedRoleIndex(currIdx !== -1 ? currIdx : 0);
      } else {
        const delta = e.key === "ArrowDown" ? 1 : -1;
        setFocusedRoleIndex((prev) => (prev + delta + ROLES.length) % ROLES.length);
      }
    } else if (e.key === "Enter" || e.key === " ") {
      if (isRoleOpen) {
        e.preventDefault();
        if (focusedRoleIndex >= 0 && focusedRoleIndex < ROLES.length) {
          setRole(ROLES[focusedRoleIndex]);
        }
        setIsRoleOpen(false);
      }
    } else if (e.key === "Escape" && isRoleOpen) {
      e.preventDefault();
      setIsRoleOpen(false);
    }
  };

  const handleGoogleClick = () => {
    setStep("profile");
  };

  const isSaveDisabled =
    !role.trim() || !college.trim() || selectedSkills.length < 3 || isLoggingIn;

  const handleFinishProfile = async () => {
    if (isSaveDisabled) return;

    if (user) {
      // User is already authenticated: update their profile in Supabase directly
      updateProfile({
        role,
        college,
        skills: selectedSkills,
        lookingFor,
        bio,
      });
      closeAuthModal();
      return;
    }

    // Preserve profile data and proceed to Google OAuth flow
    const success = await signInWithGoogle({
      role,
      college,
      skills: selectedSkills,
      lookingFor,
      bio,
    });
    if (success) {
      closeAuthModal();
    }
  };

  const handleSkip = async () => {
    if (user) {
      closeAuthModal();
      return;
    }
    const success = await signInWithGoogle();
    if (success) {
      closeAuthModal();
    }
  };

  if (!isAuthModalOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm sm:backdrop-blur-md animate-in fade-in duration-150"
      onClick={closeAuthModal}
    >
      <div
        ref={modalRef}
        className="w-full max-sm:rounded-b-none max-sm:rounded-t-[20px] sm:rounded-[20px] max-w-[520px] bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[85vh] overflow-hidden text-left animate-in sm:zoom-in-95 max-sm:slide-in-from-bottom duration-200 motion-reduce:animate-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile bottom sheet drag indicator */}
        <div className="w-10 h-1 rounded-full bg-[var(--border-highlight)] mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

        {/* Modal Header */}
        <div className="px-5 py-4 sm:px-6 sm:py-4.5 border-b border-[var(--border-subtle)] flex items-start justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              {step === "profile" && !user && (
                <button
                  type="button"
                  onClick={() => setStep("signin")}
                  aria-label="Back to sign-in"
                  className="p-1 -ml-1 rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <h2
                id="auth-modal-title"
                className="text-base sm:text-lg font-bold text-[var(--text-primary)] tracking-tight"
              >
                {step === "signin" ? "Sign in to RIVQ" : "Complete your profile"}
              </h2>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              {step === "signin"
                ? "Verified Google accounts only. Collaborators connect directly on Gmail."
                : "Help teammates understand your background when connecting on Gmail."}
            </p>
          </div>

          <button
            type="button"
            onClick={closeAuthModal}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center shrink-0 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error notification with retry */}
        {loginError && (
          <div
            role="alert"
            className="mx-5 sm:mx-6 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
            <button
              type="button"
              onClick={retryLogin}
              className="text-xs font-semibold underline flex items-center gap-1 shrink-0 hover:opacity-80"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Step: Sign In View */}
        {step === "signin" ? (
          <div className="p-5 sm:p-6 space-y-5 flex-1 overflow-y-auto">
            <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-2">
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                RIVQ is designed for genuine students, developers, and researchers. Direct peer-to-peer contact on Gmail with zero chat spam.
              </p>
              <p className="text-[11px] text-[var(--text-tertiary)]">
                Your email is strictly protected behind masked privacy cards until mutual contact.
              </p>
            </div>

            <button
              type="button"
              onClick={handleGoogleClick}
              disabled={isLoggingIn}
              className="w-full h-[44px] px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 font-semibold text-xs flex items-center justify-center gap-2.5 shadow-sm transition-all active:scale-[0.99]"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isLoggingIn ? "Verifying Google Account..." : "Continue with Google"}</span>
            </button>

            <p className="text-[11px] text-[var(--text-tertiary)] text-center leading-relaxed">
              By continuing, you agree to RIVQ&apos;s Terms of Service and Privacy Policy.
            </p>
          </div>
        ) : (
          /* Step: Quick Profile Setup View */
          <>
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 overscroll-contain">
              {/* Section 1: Role Dropdown */}
              <div className="space-y-1.5" ref={roleDropdownRef}>
                <label className="text-xs font-medium text-[var(--text-secondary)] block">
                  Primary Role
                </label>
                <div className="relative">
                  <button
                    ref={roleButtonRef}
                    type="button"
                    onClick={() => {
                      setIsRoleOpen((prev) => !prev);
                      const currIdx = ROLES.indexOf(role as typeof ROLES[number]);
                      setFocusedRoleIndex(currIdx !== -1 ? currIdx : 0);
                    }}
                    onKeyDown={handleRoleKeyDown}
                    aria-haspopup="listbox"
                    aria-expanded={isRoleOpen}
                    aria-label="Select your primary role"
                    className="w-full h-[44px] px-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] text-xs flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 hover:border-[var(--border-highlight)] transition-colors cursor-pointer"
                  >
                    <span className="truncate font-medium">{role}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-[var(--text-secondary)] transition-transform duration-200 shrink-0 ${
                        isRoleOpen ? "rotate-180 text-blue-500" : ""
                      }`}
                    />
                  </button>

                  {isRoleOpen && (
                    <ul
                      role="listbox"
                      aria-label="Primary roles"
                      className="absolute left-0 right-0 top-full mt-1.5 z-50 max-h-56 overflow-y-auto rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-100"
                    >
                      {ROLES.map((r, idx) => {
                        const isSelected = r === role;
                        const isFocused = idx === focusedRoleIndex;
                        return (
                          <li
                            key={r}
                            role="option"
                            aria-selected={isSelected}
                            onClick={() => {
                              setRole(r);
                              setIsRoleOpen(false);
                              roleButtonRef.current?.focus();
                            }}
                            onMouseEnter={() => setFocusedRoleIndex(idx)}
                            className={`px-3 py-2 rounded-lg text-xs cursor-pointer flex items-center justify-between transition-colors ${
                              isSelected
                                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold"
                                : isFocused
                                ? "bg-[var(--bg-elevated)] text-[var(--text-primary)]"
                                : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                            }`}
                          >
                            <span>{r}</span>
                            {isSelected && (
                              <Check className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>

              {/* Section 2: College or Organization */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--text-secondary)] block">
                  College or Organization
                </label>
                <input
                  ref={collegeInputRef}
                  type="text"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  placeholder="e.g. IIT Delhi, Gautam Buddha University, BITS Pilani"
                  className="w-full h-[44px] px-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]/70 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 hover:border-[var(--border-highlight)] transition-all"
                />
              </div>

              {/* Section 3: Looking For Segmented Control */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--text-secondary)] block">
                  Looking For
                </label>
                <div className="p-1 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] grid grid-cols-3 gap-1">
                  {[
                    { id: "hackathon", label: "Hackathons" },
                    { id: "research", label: "Research" },
                    { id: "both", label: "Both" },
                  ].map((opt) => {
                    const isActive = lookingFor === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setLookingFor(opt.id as "hackathon" | "research" | "both")}
                        className={`h-[36px] px-2 rounded-lg text-xs transition-all duration-150 flex items-center justify-center cursor-pointer ${
                          isActive
                            ? "bg-blue-500/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 font-medium shadow-2xs"
                            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]/50 border border-transparent font-normal"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section 4: Skill Chips with live counter & categories */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">
                    Top Skills
                  </label>
                  <div className="flex items-center gap-2">
                    {selectedSkills.length < 3 && (
                      <span className="text-[11px] text-amber-500 dark:text-amber-400">
                        Select at least 3
                      </span>
                    )}
                    <span className="text-[11px] text-[var(--text-tertiary)] tabular-nums font-normal">
                      {selectedSkills.length}/5 selected
                    </span>
                  </div>
                </div>

                <div className="space-y-3 pt-1">
                  {SKILL_GROUPS.map((group) => (
                    <div key={group.name} className="space-y-1.5">
                      <span className="text-[10px] font-medium text-[var(--text-tertiary)] block">
                        {group.name}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {group.skills.map((skill) => {
                          const isSelected = selectedSkills.includes(skill);
                          const isMaxReached = selectedSkills.length >= 5;
                          const isDisabled = isMaxReached && !isSelected;

                          return (
                            <button
                              key={skill}
                              type="button"
                              disabled={isDisabled}
                              onClick={() => toggleSkill(skill)}
                              className={`h-[36px] px-3.5 rounded-full text-xs font-sans border transition-all duration-150 flex items-center justify-center gap-1.5 select-none ${
                                isSelected
                                  ? "bg-blue-500/10 dark:bg-blue-500/15 border-blue-500/40 dark:border-blue-500/50 text-blue-600 dark:text-blue-400 font-medium shadow-2xs cursor-pointer"
                                  : isDisabled
                                  ? "bg-[var(--bg-elevated)]/40 text-[var(--text-tertiary)]/50 border-[var(--border-subtle)] opacity-50 cursor-not-allowed"
                                  : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border-default)] hover:text-[var(--text-primary)] hover:border-[var(--border-highlight)] cursor-pointer"
                              }`}
                            >
                              {isSelected && (
                                <Check className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                              )}
                              <span>{skill}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 5: Brief Bio Textarea with counter */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--text-secondary)] block">
                  Brief Bio
                </label>
                <div className="relative">
                  <textarea
                    rows={2}
                    value={bio}
                    maxLength={140}
                    onChange={(e) => setBio(e.target.value.slice(0, 140))}
                    placeholder="A sentence about what you like building..."
                    className="w-full px-3.5 py-2.5 pb-6 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]/70 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 hover:border-[var(--border-highlight)] transition-all resize-none"
                  />
                  <span className="absolute right-3 bottom-2 text-[10px] text-[var(--text-tertiary)] tabular-nums pointer-events-none">
                    {bio.length}/140
                  </span>
                </div>
              </div>
            </div>

            {/* Sticky Mobile/Desktop Footer */}
            <div className="sticky bottom-0 bg-[var(--bg-surface)]/95 backdrop-blur-md border-t border-[var(--border-subtle)] px-5 py-3.5 sm:px-6 flex items-center justify-between gap-3 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] shrink-0 z-10">
              <button
                type="button"
                onClick={handleSkip}
                className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors h-[44px] px-3 rounded-xl flex items-center justify-center cursor-pointer"
              >
                Skip for now
              </button>

              <button
                type="button"
                onClick={handleFinishProfile}
                disabled={isSaveDisabled}
                className={`h-[44px] px-5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  isSaveDisabled
                    ? "bg-blue-600/40 text-white/50 cursor-not-allowed border border-blue-500/20"
                    : "bg-blue-600 hover:bg-blue-500 text-white shadow-sm hover:shadow cursor-pointer active:scale-[0.98]"
                }`}
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span>Save & Continue</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
