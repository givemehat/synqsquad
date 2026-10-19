"use client";

import React, { useState } from "react";
import { Listing, ListingType } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { X, AlertCircle } from "lucide-react";
import { validateListingInput } from "@/lib/validations";

interface CreateListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onListingCreated: (newListing: Listing) => void;
}

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

export function CreateListingModal({
  isOpen,
  onClose,
  onListingCreated,
}: CreateListingModalProps) {
  const { user } = useAuth();
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

  if (!isOpen || !user) return null;

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

    const clientValidation = validateListingInput(payload);
    if (!clientValidation.success) {
      setErrorMsg(clientValidation.error || "Please review your inputs.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to publish requisition");
      }

      onListingCreated(data.data);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to publish";
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl shadow-2xl overflow-hidden p-6 text-left my-8 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)] mb-5">
          <div>
            <h3 id="create-modal-title" className="text-base font-bold text-[var(--text-primary)]">
              Post Collaborator Requirement
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Published under your verified Google account: <span className="font-mono">{user.email}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div
            role="alert"
            className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Field 1: Category / Type */}
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
              Category
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "hackathon", label: "Hackathon Team" },
                { id: "research", label: "Research Paper" },
                { id: "solo", label: "Solo Looking for Team" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, type: t.id as ListingType }))}
                  className={`py-2 px-3 rounded-lg text-xs font-medium border transition-colors min-h-[38px] ${
                    formData.type === t.id
                      ? "bg-[var(--accent-primary)] text-white border-[var(--accent-primary)]"
                      : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border-default)]"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Field 2: Title */}
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
              Project Title or Role Needed
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Edge Vision Engineer for Railway Track Crack Detection"
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] text-xs focus:outline-none min-h-[40px]"
            />
          </div>

          {/* Field 3: Event & Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                Event / Conference / Tournament
              </label>
              <input
                type="text"
                required
                value={formData.event}
                onChange={(e) => setFormData((p) => ({ ...p, event: e.target.value }))}
                placeholder="e.g. Smart India Hackathon 2026, NeurIPS Workshop"
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
                placeholder="e.g. Nov 30, 2026 or Immediate"
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] text-xs focus:outline-none min-h-[40px]"
              />
            </div>
          </div>

          {/* Field 4: Capacity & Slots */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                Open Slots (To Recruit)
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
                Total Team Size Target
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

          {/* Field 5: Skills Needed */}
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
              Required Skills
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {PRESET_SKILLS.map((sk) => {
                const active = formData.skillsSelected.includes(sk);
                return (
                  <button
                    key={sk}
                    type="button"
                    onClick={() => toggleSkill(sk)}
                    className={`px-2 py-1 rounded text-[11px] font-mono transition-colors ${
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
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCustom();
                  }
                }}
                placeholder="Or type a custom skill & hit Add..."
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

          {/* Field 6: Technical Description */}
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
              What are you building & who are you looking for?
            </label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
              placeholder="Describe your current tech stack, prototype progress, and the exact problem statement. Note: All communication occurs directly on verified Gmail."
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] text-xs focus:outline-none"
            />
            <span className="text-[10px] text-[var(--text-tertiary)] block mt-1">
              Post auto-expires in 30 days. You can mark it filled or renew it anytime.
            </span>
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors min-h-[44px] px-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold shadow-sm transition-all min-h-[44px]"
            >
              {submitting ? "Publishing Requirement..." : "Publish Requirement"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
