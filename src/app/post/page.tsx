"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ListingType } from "@/types";
import { ArrowLeft, Plus, AlertCircle, Check, Shield } from "lucide-react";
import { validateListingInput } from "@/lib/validations";
import { authFetch } from "@/lib/api-client";

const PRESET_SKILLS = [
  "Next.js",
  "Python",
  "PyTorch",
  "FastAPI",
  "React Native",
  "Solidity",
  "C++",
  "ROS2",
  "Docker",
  "Figma",
  "Three.js",
];

export default function PostPage() {
  const router = useRouter();
  const { user, openAuthModal } = useAuth();
  const [formData, setFormData] = useState({
    title: "",
    type: "hackathon" as ListingType,
    event: "Smart India Hackathon 2026",
    deadline: "Nov 30, 2026",
    skillsSelected: ["Next.js", "Python"] as string[],
    customSkill: "",
    slots: 2,
    totalSlots: 4,
    description: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState(false);

  const toggleSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skillsSelected: prev.skillsSelected.includes(skill)
        ? prev.skillsSelected.filter((s) => s !== skill)
        : [...prev.skillsSelected, skill],
    }));
  };

  const handleAddCustom = () => {
    const trimmed = formData.customSkill.trim();
    if (!trimmed) return;
    if (!formData.skillsSelected.includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        skillsSelected: [...prev.skillsSelected, trimmed],
        customSkill: "",
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal();
      return;
    }

    setErrorMsg("");

    const payload = {
      title: formData.title,
      type: formData.type,
      event: formData.event,
      deadline: formData.deadline,
      skillsNeeded: formData.skillsSelected,
      slots: formData.slots,
      totalSlots: formData.totalSlots,
      description: formData.description,
      ownerId: user.id,
      ownerName: user.name,
      ownerEmail: user.email,
      ownerCollege: user.college,
      ownerRole: user.role,
      ownerPhoto: user.photo,
    };

    const validation = validateListingInput(payload);
    if (!validation.success) {
      setErrorMsg(validation.error || "Please review your inputs.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await authFetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to publish requisition");
      }

      setSuccess(true);
      setTimeout(() => router.push("/"), 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to publish";
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] px-4 py-12 sm:px-6 lg:px-8 transition-colors flex items-center justify-center">
        <div className="max-w-md w-full surface-card p-8 text-center space-y-4">
          <div className="w-10 h-10 rounded-full bg-[var(--accent-muted)] text-[var(--accent-primary)] flex items-center justify-center mx-auto">
            <Shield className="w-5 h-5" />
          </div>
          <h1 className="text-lg font-bold text-[var(--text-primary)]">
            Google Sign-In Required
          </h1>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            All requisitions on RIVQ are tied to verified Google accounts so collaborators can reach you on Gmail with zero spam.
          </p>
          <button
            type="button"
            onClick={() => openAuthModal()}
            className="w-full py-2.5 px-4 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold shadow-xs transition-colors min-h-[44px]"
          >
            Sign in with Google to Post
          </button>
          <div className="pt-2">
            <Link
              href="/"
              className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              ← Back to Listings Feed
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] px-4 py-8 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-2xl mx-auto space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors min-h-[36px]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Feed</span>
        </Link>

        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
            Post Collaborator Requirement
          </h1>
          <p className="text-xs text-[var(--text-secondary)]">
            Publish an open requirement for a hackathon, research paper, or solo dev request.
          </p>
        </div>

        {success ? (
          <div className="surface-card p-8 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
              <Check className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-bold text-[var(--text-primary)]">Requirement Published!</h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Your requirement is live. Collaborators will connect with you directly on Gmail. Redirecting to feed...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="surface-card p-6 space-y-5 text-xs">
            {errorMsg && (
              <div
                role="alert"
                className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Category */}
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                Category
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "hackathon", label: "Hackathon Team" },
                  { id: "research", label: "Research Paper" },
                  { id: "solo", label: "Solo Dev Available" },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, type: t.id as ListingType }))}
                    className={`py-2 px-3 rounded-lg font-medium border text-center transition-colors min-h-[40px] ${
                      formData.type === t.id
                        ? "bg-[var(--accent-primary)] text-white border-[var(--accent-primary)] font-semibold"
                        : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border-default)]"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                Project Title or Need
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                placeholder="e.g. Edge ML Engineer for Railway Fault Detection"
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] text-xs focus:outline-none min-h-[40px]"
              />
            </div>

            {/* Event & Deadline */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                  Event / Competition / Workshop
                </label>
                <input
                  type="text"
                  required
                  value={formData.event}
                  onChange={(e) => setFormData((p) => ({ ...p, event: e.target.value }))}
                  placeholder="e.g. Smart India Hackathon 2026"
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] text-xs focus:outline-none min-h-[40px]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                  Deadline or Target Date
                </label>
                <input
                  type="text"
                  value={formData.deadline}
                  onChange={(e) => setFormData((p) => ({ ...p, deadline: e.target.value }))}
                  placeholder="e.g. Nov 30, 2026"
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] text-xs focus:outline-none min-h-[40px]"
                />
              </div>
            </div>

            {/* Slots */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                  Open Vacant Slots
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.slots}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, slots: parseInt(e.target.value) || 1 }))
                  }
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] text-xs focus:outline-none min-h-[40px]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                  Total Team Target Size
                </label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={formData.totalSlots}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, totalSlots: parseInt(e.target.value) || 4 }))
                  }
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] text-xs focus:outline-none min-h-[40px]"
                />
              </div>
            </div>

            {/* Skills */}
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                Skills Needed
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {PRESET_SKILLS.map((sk) => {
                  const active = formData.skillsSelected.includes(sk);
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

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={formData.customSkill}
                  onChange={(e) => setFormData((p) => ({ ...p, customSkill: e.target.value }))}
                  placeholder="Or enter custom skill..."
                  className="flex-1 px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] text-xs focus:outline-none min-h-[36px]"
                />
                <button
                  type="button"
                  onClick={handleAddCustom}
                  className="px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--bg-overlay)] border border-[var(--border-default)] text-[var(--text-primary)] text-xs font-medium transition-colors min-h-[36px]"
                >
                  Add Skill
                </button>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                Project Abstract & Requirements
              </label>
              <textarea
                required
                rows={5}
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                placeholder="Explain the problem, current architecture, and what you need from the teammate. All communication occurs directly on verified Gmail."
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] text-xs focus:outline-none"
              />
              <span className="text-[10px] text-[var(--text-tertiary)] block mt-1">
                Requisitions auto-expire after 30 days. You can mark them filled or renew them anytime.
              </span>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-between">
              <Link
                href="/"
                className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors min-h-[44px] flex items-center"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white font-semibold text-xs transition-colors flex items-center gap-1.5 min-h-[44px]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{submitting ? "Publishing..." : "Publish Requirement"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
