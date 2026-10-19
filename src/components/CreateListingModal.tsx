"use client";

import React, { useState } from "react";
import { Listing, ListingType } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { X, Plus, Calendar, Users, ShieldCheck, Check } from "lucide-react";

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
    if (!formData.customSkill.trim()) return;
    if (!formData.skillsSelected.includes(formData.customSkill.trim())) {
      setFormData((prev) => ({
        ...prev,
        skillsSelected: [...prev.skillsSelected, prev.customSkill.trim()],
        customSkill: "",
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!formData.title.trim() || !formData.event.trim() || !formData.description.trim()) {
      setErrorMsg("Please fill in project title, event name, and description.");
      return;
    }

    setSubmitting(true);
    try {
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

      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create listing");
      }

      onListingCreated(data.data);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to publish listing");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
      <div
        className="w-full max-w-2xl bg-[#0f1217] border border-white/10 rounded-2xl shadow-2xl overflow-hidden my-8 p-6 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-5">
          <div>
            <h3 className="text-base font-bold text-white">
              Post Collaborator Requirement
            </h3>
            <p className="text-xs text-slate-400">
              Inquiries will be sent directly to your verified Gmail ({user.email}).
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs mb-4">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Type */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "hackathon", label: "Hackathon Team" },
                { id: "research", label: "Research Paper / Lab" },
                { id: "solo", label: "Solo Developer Looking" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: t.id as ListingType })}
                  className={`py-2 px-3 rounded-lg font-medium border text-center transition-colors ${
                    formData.type === t.id
                      ? "bg-blue-600 text-white border-blue-500 font-semibold"
                      : "bg-[#12151b] text-slate-400 border-white/5 hover:border-white/10"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Event & Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Event / Competition Name
              </label>
              <input
                type="text"
                required
                value={formData.event}
                onChange={(e) => setFormData({ ...formData, event: e.target.value })}
                placeholder="e.g. Smart India Hackathon 2026, NeurIPS"
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-xs focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Deadline (Optional)
              </label>
              <input
                type="text"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                placeholder="e.g. Nov 30, 2026"
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-xs focus:outline-none"
              />
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Project Title / One-Line Need
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Edge Vision Model for Railway Track Fault Detection"
              className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-xs focus:outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Detailed Scope & Progress So Far
            </label>
            <textarea
              required
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what you have built, what dataset or idea you have, and what exact contributions you expect from teammates..."
              className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-xs focus:outline-none resize-none"
            />
          </div>

          {/* Skills Needed */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
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
                    className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                      active
                        ? "bg-blue-600 text-white"
                        : "bg-[#12151b] text-slate-400 hover:text-white border border-white/5"
                    }`}
                  >
                    {active ? `✓ ${sk}` : sk}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.customSkill}
                onChange={(e) => setFormData({ ...formData, customSkill: e.target.value })}
                placeholder="Add other skill (e.g. PyTorch, OpenCV)..."
                className="flex-1 px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white text-xs focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddCustom}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-semibold"
              >
                Add
              </button>
            </div>
          </div>

          {/* Slots */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Open Vacant Slots
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={formData.slots}
                onChange={(e) => setFormData({ ...formData, slots: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Total Team Size
              </label>
              <input
                type="number"
                min={1}
                max={12}
                value={formData.totalSlots}
                onChange={(e) => setFormData({ ...formData, totalSlots: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-xs"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-3">
            <span className="text-[11px] text-slate-500">
              Listings auto-expire in 30 days. You can mark filled anytime.
            </span>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors disabled:opacity-50"
            >
              {submitting ? "Publishing..." : "Publish Requirement"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
