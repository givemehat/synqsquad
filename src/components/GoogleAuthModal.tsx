"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { X, Shield, ArrowRight, Check } from "lucide-react";

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
  const { isAuthModalOpen, closeAuthModal, signInWithGoogle } = useAuth();
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

  const handleGoogleClick = () => {
    // Proceed to profile configuration
    setStep("profile");
  };

  const handleFinishProfile = () => {
    signInWithGoogle({
      role,
      college,
      skills: selectedSkills,
      lookingFor,
      bio,
    });
    setStep("signin");
  };

  const handleSkip = () => {
    signInWithGoogle();
    setStep("signin");
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-[#0f1217] border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-6 text-left animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Shield className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-semibold text-slate-300">
              {step === "signin" ? "Google Authentication" : "30-Second Profile Setup"}
            </span>
          </div>
          <button
            onClick={closeAuthModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {step === "signin" ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-white mb-1">
                Connect on Gmail
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                SynqSquad uses verified Google accounts so collaborators can reach you on Gmail with zero spam. Your email is never exposed publicly.
              </p>
            </div>

            {/* Google Action Button */}
            <button
              onClick={handleGoogleClick}
              className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs flex items-center justify-center gap-2.5 shadow-sm transition-all"
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
              <span>Continue with Google</span>
            </button>

            <div className="pt-2">
              <span className="text-[11px] text-slate-500 block text-center">
                One-click login • Verified Gmail • Zero passwords
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-white mb-1">
                Complete your collaborator profile
              </h3>
              <p className="text-xs text-slate-400">
                This helps creators understand your background when you message them.
              </p>
            </div>

            {/* Role */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Your Primary Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-xs focus:outline-none"
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
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                College or Organization
              </label>
              <input
                type="text"
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                placeholder="e.g. IIT Delhi, BITS Pilani, Stanford"
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-xs focus:outline-none"
              />
            </div>

            {/* Skills */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
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
                          ? "bg-blue-600 text-white"
                          : "bg-white/5 text-slate-400 hover:text-white"
                      }`}
                    >
                      {active ? `✓ ${sk}` : sk}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleSkip}
                className="text-xs text-slate-400 hover:text-white transition-colors"
              >
                Skip for now
              </button>
              <button
                type="button"
                onClick={handleFinishProfile}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <span>Save & Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
