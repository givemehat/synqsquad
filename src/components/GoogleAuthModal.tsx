"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { X, Shield, ArrowRight, RefreshCw, AlertCircle } from "lucide-react";

const SUGGESTED_SKILLS = [
  "Python",
  "PyTorch",
  "Next.js",
  "React",
  "FastAPI",
  "TypeScript",
  "C++",
  "ROS2",
  "Solidity",
  "Figma",
  "Docker",
  "Three.js",
];

export function GoogleAuthModal() {
  const {
    isAuthModalOpen,
    closeAuthModal,
    signInWithGoogle,
    isLoggingIn,
    loginError,
    retryLogin,
  } = useAuth();

  const [step, setStep] = useState<"signin" | "profile">("signin");
  const [role, setRole] = useState("Full-Stack Developer");
  const [college, setCollege] = useState("IIT Delhi");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([
    "Next.js",
    "TypeScript",
    "Python",
  ]);
  const [lookingFor, setLookingFor] = useState<"hackathon" | "research" | "both">("both");
  const [bio, setBio] = useState("Interested in building fast prototypes and ML systems.");

  if (!isAuthModalOpen) return null;

  const handleGoogleClick = async () => {
    // Proceed to profile configuration step
    setStep("profile");
  };

  const handleFinishProfile = async () => {
    const success = await signInWithGoogle({
      role,
      college,
      skills: selectedSkills,
      lookingFor,
      bio,
    });
    if (success) {
      setStep("signin");
    }
  };

  const handleSkip = async () => {
    const success = await signInWithGoogle();
    if (success) {
      setStep("signin");
    }
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={closeAuthModal}
    >
      <div
        className="w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl shadow-2xl overflow-hidden p-6 text-left animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)] mb-5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[var(--accent-muted)] border border-[var(--border-default)] flex items-center justify-center text-[var(--accent-primary)]">
              <Shield className="w-3.5 h-3.5" />
            </div>
            <span id="auth-modal-title" className="text-xs font-semibold text-[var(--text-secondary)]">
              {step === "signin" ? "Google Authentication" : "Quick Profile Setup (Optional)"}
            </span>
          </div>
          <button
            type="button"
            onClick={closeAuthModal}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error notification with retry */}
        {loginError && (
          <div
            role="alert"
            className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
            <button
              type="button"
              onClick={retryLogin}
              className="text-xs font-semibold underline flex items-center gap-1 shrink-0"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {step === "signin" ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)] mb-1">
                Sign in with Google to contact people. You will talk on Gmail.
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                SynqSquad uses verified Google accounts so collaborators can reach you directly on Gmail with zero spam. Your raw email address is never exposed publicly.
              </p>
            </div>

            {/* Google Action Button */}
            <button
              type="button"
              onClick={handleGoogleClick}
              disabled={isLoggingIn}
              className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 font-semibold text-xs flex items-center justify-center gap-2.5 shadow-sm transition-all min-h-[44px]"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
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

            <div className="pt-2 text-[11px] text-[var(--text-tertiary)] text-center leading-relaxed">
              <span>By signing in, you agree to our Terms, Privacy Policy, and store consent timestamp. Minimum profile & email scopes only.</span>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)] mb-1">
                Complete your collaborator profile
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                This helps creators understand your background when you message them on Gmail.
              </p>
            </div>

            {/* Role */}
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                Your Primary Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] text-xs focus:outline-none min-h-[40px]"
              >
                <option value="Full-Stack Developer">Full-Stack Developer</option>
                <option value="Frontend Engineer">Frontend Engineer</option>
                <option value="Backend Engineer">Backend Engineer</option>
                <option value="Machine Learning Researcher">Machine Learning Researcher</option>
                <option value="Product Designer (UI/UX)">Product Designer (UI/UX)</option>
                <option value="Systems & Embedded Engineer">Systems & Embedded Engineer</option>
                <option value="Smart Contract Developer">Smart Contract Developer</option>
              </select>
            </div>

            {/* College */}
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                College or Organization
              </label>
              <input
                type="text"
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                placeholder="e.g. IIT Delhi, BITS Pilani, Stanford"
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] text-xs focus:outline-none min-h-[40px]"
              />
            </div>

            {/* Looking for */}
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                Looking For
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "hackathon", label: "Hackathons" },
                  { id: "research", label: "Research" },
                  { id: "both", label: "Both" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setLookingFor(opt.id as "hackathon" | "research" | "both")}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition-colors ${
                      lookingFor === opt.id
                        ? "bg-[var(--accent-primary)] text-white border-[var(--accent-primary)]"
                        : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border-default)]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Skills */}
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                Top Skills (Select 3-5)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_SKILLS.map((sk) => {
                  const active = selectedSkills.includes(sk);
                  return (
                    <button
                      key={sk}
                      type="button"
                      onClick={() => toggleSkill(sk)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors ${
                        active
                          ? "bg-[var(--accent-primary)] text-white"
                          : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-default)]"
                      }`}
                    >
                      {active ? `✓ ${sk}` : sk}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                Brief Bio
              </label>
              <input
                type="text"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="A sentence about what you like building..."
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] text-xs focus:outline-none min-h-[40px]"
              />
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleSkip}
                className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors min-h-[40px] px-2"
              >
                Skip for now
              </button>
              <button
                type="button"
                onClick={handleFinishProfile}
                disabled={isLoggingIn}
                className="px-4 py-2 rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors min-h-[40px]"
              >
                <span>{isLoggingIn ? "Saving..." : "Save & Continue"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
