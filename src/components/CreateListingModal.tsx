"use client";

import React, { useState } from "react";
import { Listing, ListingType, ProjectDomain } from "@/types";
import { X, Sparkles, Key, CheckCircle, Plus, Send, MessageSquare, AlertCircle } from "lucide-react";
import confetti from "canvas-confetti";

interface CreateListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onListingCreated: (newListing: Listing) => void;
}

const PRESET_DOMAINS: ProjectDomain[] = [
  "AI & Machine Learning",
  "Web3 & Blockchain",
  "Full-Stack Web/Mobile",
  "Healthcare & BioTech",
  "Cybersecurity",
  "Robotics & IoT",
  "Climate & CleanTech",
  "Fintech & Quant",
];

const PRESET_SKILLS = [
  "PyTorch",
  "Next.js",
  "FastAPI",
  "Solidity",
  "React Native",
  "TailwindCSS",
  "TypeScript",
  "ROS2",
  "OpenCV",
  "Docker",
  "LangChain",
  "Figma",
];

export function CreateListingModal({
  isOpen,
  onClose,
  onListingCreated,
}: CreateListingModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    targetName: "Smart India Hackathon 2026",
    type: "hackathon" as ListingType,
    domain: "AI & Machine Learning" as ProjectDomain,
    creatorName: "",
    creatorRole: "",
    location: "Remote / Hybrid",
    description: "",
    rolesNeededStr: "Frontend Dev, AI/ML Researcher",
    skillsSelected: ["Next.js", "PyTorch"] as string[],
    customSkill: "",
    currentMembersCount: 2,
    maxMembersCount: 4,
    prizeOrGrantPool: "",
    isVerifiedWinner: false,
    telegram: "",
    discord: "",
    whatsapp: "",
    github: "",
    linkedin: "",
    email: "",
  });

  const [generatedPin] = useState(() => Math.floor(100000 + Math.random() * 900000).toString());
  const [submitting, setSubmitting] = useState(false);
  const [createdSuccess, setCreatedSuccess] = useState<Listing | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const toggleSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skillsSelected: prev.skillsSelected.includes(skill)
        ? prev.skillsSelected.filter((s) => s !== skill)
        : [...prev.skillsSelected, skill],
    }));
  };

  const handleAddCustomSkill = () => {
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

    if (!formData.title || !formData.creatorName || !formData.description) {
      setErrorMsg("Please fill in project title, your name, and description.");
      return;
    }

    if (
      !formData.telegram &&
      !formData.discord &&
      !formData.whatsapp &&
      !formData.email &&
      !formData.github
    ) {
      setErrorMsg("Please provide at least one contact channel (Discord, Telegram, or Email).");
      return;
    }

    setSubmitting(true);
    try {
      const rolesNeeded = formData.rolesNeededStr
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean);

      const payload = {
        title: formData.title,
        targetName: formData.targetName,
        type: formData.type,
        domain: formData.domain,
        creatorName: formData.creatorName,
        creatorRole: formData.creatorRole || "Team Lead",
        location: formData.location,
        description: formData.description,
        rolesNeeded: rolesNeeded.length > 0 ? rolesNeeded : ["Collaborator"],
        skills: formData.skillsSelected,
        currentMembersCount: formData.currentMembersCount,
        maxMembersCount: formData.maxMembersCount,
        prizeOrGrantPool: formData.prizeOrGrantPool,
        isVerifiedWinner: formData.isVerifiedWinner,
        managePin: generatedPin,
        contact: {
          telegram: formData.telegram,
          discord: formData.discord,
          whatsapp: formData.whatsapp,
          github: formData.github,
          linkedin: formData.linkedin,
          email: formData.email,
        },
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

      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });

      setCreatedSuccess(data.data);
      onListingCreated(data.data);
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 bg-gradient-to-r from-indigo-950/50 to-slate-900 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <span>Post Team or Collaborator Requirement</span>
            </h2>
            <p className="text-xs text-slate-400">
              Zero friction. Matches directly on your personal contact channels.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {createdSuccess ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-white">Your Listing is Live!</h3>
              <p className="text-sm text-slate-300 max-w-md mx-auto">
                Hackers and researchers can now discover your post and reach out directly to your channels.
              </p>

              {/* Secret PIN Box */}
              <div className="p-4 rounded-2xl bg-indigo-950/60 border border-indigo-500/40 max-w-md mx-auto text-left">
                <div className="flex items-center gap-2 text-indigo-300 font-semibold text-xs mb-1">
                  <Key className="w-4 h-4 text-amber-400" />
                  <span>YOUR ZERO-SUPPORT MANAGE PIN</span>
                </div>
                <div className="text-3xl font-mono font-extrabold text-white tracking-widest my-2 text-center bg-slate-950 py-2 rounded-xl border border-indigo-800">
                  {createdSuccess.managePin}
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Save this 6-digit PIN. Whenever you want to mark your team as filled or delete the post, use this PIN directly on the post card. No customer support ticket needed!
                </p>
              </div>

              <div className="pt-4">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all"
                >
                  View on Board
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Type Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Post Category
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "hackathon", label: "🚀 Hackathon Team" },
                    { id: "research", label: "🔬 Research Paper / Lab" },
                    { id: "solo_hacker", label: "⚡ Solo Hacker Looking" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: t.id as ListingType })}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-center ${
                        formData.type === t.id
                          ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30"
                          : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target & Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Target Event / Journal
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.targetName}
                    onChange={(e) => setFormData({ ...formData, targetName: e.target.value })}
                    placeholder="e.g. Smart India Hackathon, ETHGlobal, NeurIPS"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Primary Domain
                  </label>
                  <select
                    value={formData.domain}
                    onChange={(e) =>
                      setFormData({ ...formData, domain: e.target.value as ProjectDomain })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
                  >
                    {PRESET_DOMAINS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pitch Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Project Title / One-line Hook
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. AI-Powered Rail Track Defect Vision Model for SIH 2026"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Detailed Pitch & What You Have Built So Far
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your idea, current progress, dataset or prototype status, and what you expect from collaborators..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              {/* Roles Needed */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Roles You Need (Comma separated)
                </label>
                <input
                  type="text"
                  required
                  value={formData.rolesNeededStr}
                  onChange={(e) => setFormData({ ...formData, rolesNeededStr: e.target.value })}
                  placeholder="e.g. Full-Stack Next.js Dev, Computer Vision Engineer, UI/UX Designer"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Clickable Tech Stack Tags */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Tech Stack & Skills Needed
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {PRESET_SKILLS.map((s) => {
                    const isSelected = formData.skillsSelected.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleSkill(s)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                          isSelected
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        {isSelected ? `✓ ${s}` : s}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.customSkill}
                    onChange={(e) => setFormData({ ...formData, customSkill: e.target.value })}
                    placeholder="Add custom skill (e.g. CUDA, Three.js)..."
                    className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSkill}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>

              {/* Team Size & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Current Members
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={formData.currentMembersCount}
                    onChange={(e) =>
                      setFormData({ ...formData, currentMembersCount: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Max Team Size
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={formData.maxMembersCount}
                    onChange={(e) =>
                      setFormData({ ...formData, maxMembersCount: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Location / Work Mode
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Remote / India / Hybrid"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm"
                  />
                </div>
              </div>

              {/* Creator details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.creatorName}
                    onChange={(e) => setFormData({ ...formData, creatorName: e.target.value })}
                    placeholder="e.g. Aarav Sharma"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Your Role / Title
                  </label>
                  <input
                    type="text"
                    value={formData.creatorRole}
                    onChange={(e) => setFormData({ ...formData, creatorRole: e.target.value })}
                    placeholder="e.g. Computer Vision Lead"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm"
                  />
                </div>
              </div>

              {/* Direct Contact Channels */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                    Direct Contact Channels (At least one)
                  </span>
                  <span className="text-[10px] text-slate-400">Zero waitlist outreach</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1">Telegram Username</span>
                    <input
                      type="text"
                      value={formData.telegram}
                      onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                      placeholder="e.g. aarav_ml (without @)"
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1">Discord Tag</span>
                    <input
                      type="text"
                      value={formData.discord}
                      onChange={(e) => setFormData({ ...formData, discord: e.target.value })}
                      placeholder="e.g. aarav#1234 or aarav_dev"
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1">WhatsApp / Phone</span>
                    <input
                      type="text"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                      placeholder="+919876543210"
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1">GitHub Username</span>
                    <input
                      type="text"
                      value={formData.github}
                      onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                      placeholder="e.g. torvalds"
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-[11px] text-slate-400 block mb-1">Email Address</span>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="you@example.com"
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Winner Checkbox */}
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={formData.isVerifiedWinner}
                  onChange={(e) => setFormData({ ...formData, isVerifiedWinner: e.target.checked })}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                />
                <span>I am a past Hackathon Winner or Published Researcher (displays 🏆 Winner badge)</span>
              </label>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 hover:from-indigo-500 hover:to-sky-400 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{submitting ? "Publishing to Board..." : "Publish Requirement Instantly"}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
