"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Listing, AvailabilityStatus, ExperienceLevel, LookingForType } from "@/types";
import { authFetch } from "@/lib/api-client";
import {
  ArrowLeft,
  ShieldCheck,
  Download,
  Trash2,
  Check,
  User,
  AlertTriangle,
  RefreshCw,
  Mail,
  Plus,
  X,
  ExternalLink,
  Code2,
  Globe,
  Loader2,
  Users,
  LogOut,
} from "lucide-react";
import { Avatar } from "@/components/Avatar";

const SUGGESTED_SKILLS = [
  "Next.js",
  "React",
  "TypeScript",
  "Python",
  "PyTorch",
  "FastAPI",
  "C++",
  "ROS2",
  "Docker",
  "Solidity",
  "Figma",
  "Tailwind CSS",
];

const ROLES = [
  "Full-Stack Developer",
  "Frontend Engineer",
  "Backend Engineer",
  "Machine Learning Researcher",
  "Product Designer (UI/UX)",
  "Systems & Embedded Engineer",
  "Smart Contract Developer",
  "Data Scientist",
] as const;

export default function ProfilePage() {
  const router = useRouter();
  const { user, signOut, contactedList, updateProfile, openAuthModal } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [activeTab, setActiveTab] = useState<"edit" | "listings" | "contacted">("edit");

  // Edit form state
  const [editRole, setEditRole] = useState(user?.role || "Full-Stack Developer");
  const [editCollege, setEditCollege] = useState(user?.college || "");
  const [editBio, setEditBio] = useState(user?.bio || "");
  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    user?.skills && user.skills.length > 0 ? user.skills : ["Next.js", "Python"]
  );
  const [customSkillInput, setCustomSkillInput] = useState("");
  const [lookingFor, setLookingFor] = useState<"hackathon" | "research" | "both">(
    (user?.lookingFor as "hackathon" | "research" | "both") || "both"
  );
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>("student");
  const [availability, setAvailability] = useState<AvailabilityStatus>("open");
  const [isVisibleOnPeople, setIsVisibleOnPeople] = useState(true);
  const [github, setGithub] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [portfolio, setPortfolio] = useState("");

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Deletion modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync edit form fields when user loads
  useEffect(() => {
    if (user) {
      if (user.role) setEditRole(user.role);
      if (user.college && user.college !== "Independent") setEditCollege(user.college);
      if (user.bio) setEditBio(user.bio);
      if (user.skills?.length) setSelectedSkills(user.skills);
      if (user.lookingFor) setLookingFor(user.lookingFor as "hackathon" | "research" | "both");
    }
  }, [user]);

  // Fetch existing talent profile from /api/people to sync social links and visibility
  const fetchTalentProfile = useCallback(async () => {
    if (!user) return;
    try {
      const res = await authFetch("/api/people");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const myTalent = data.data.find(
          (p: { email?: string; userId?: string }) =>
            p.email?.toLowerCase() === user.email.toLowerCase() || p.userId === user.id
        );
        if (myTalent) {
          if (myTalent.github) setGithub(myTalent.github);
          if (myTalent.linkedin) setLinkedin(myTalent.linkedin);
          if (myTalent.portfolio) setPortfolio(myTalent.portfolio);
          if (myTalent.experienceLevel) setExperienceLevel(myTalent.experienceLevel);
          if (myTalent.availability) setAvailability(myTalent.availability);
          if (typeof myTalent.visible === "boolean") setIsVisibleOnPeople(myTalent.visible);
        }
      }
    } catch (err) {
      console.error("Failed to load talent profile:", err);
    }
  }, [user]);

  // Fetch listings
  const fetchListings = useCallback(async () => {
    try {
      const res = await authFetch("/api/listings");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setListings(data.data);
      }
    } catch (err: unknown) {
      console.error("Failed to load profile listings:", err);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchListings();
      fetchTalentProfile();
    }
  }, [user, fetchListings, fetchTalentProfile]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg-canvas)]">
        <div className="surface-card rounded-2xl p-8 max-w-md w-full text-center space-y-5 border border-[var(--border-default)] shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              Sign-in Required
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed">
              Please sign in with your verified Google account to view and customize your RIVQ profile, team postings, and privacy preferences.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => openAuthModal()}
              className="w-full h-11 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Sign in with Google</span>
            </button>
            <Link
              href="/"
              className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors py-1"
            >
              Back to Home Feed
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const myListings = listings.filter(
    (l) => l.ownerEmail.toLowerCase() === user.email.toLowerCase()
  );
  const myContacted = listings.filter((l) => contactedList.includes(l.id));

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) => {
      if (prev.includes(skill)) {
        return prev.filter((s) => s !== skill);
      }
      if (prev.length >= 10) return prev;
      return [...prev, skill];
    });
  };

  const handleAddCustomSkill = (e: React.KeyboardEvent<HTMLInputElement> | React.MouseEvent) => {
    if ("key" in e && e.key !== "Enter") return;
    e.preventDefault();
    const trimmed = customSkillInput.trim();
    if (!trimmed || selectedSkills.includes(trimmed) || selectedSkills.length >= 10) return;
    setSelectedSkills((prev) => [...prev, trimmed]);
    setCustomSkillInput("");
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);

    const updatedUser = {
      role: editRole,
      college: editCollege.trim() || "Independent",
      bio: editBio.trim(),
      skills: selectedSkills,
      lookingFor,
    };

    updateProfile(updatedUser);

    try {
      // 1. Save to UserProfile table
      const userRes = await authFetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedUser),
      });

      if (!userRes.ok) {
        const d = await userRes.json();
        throw new Error(d.error || "Failed to update user profile");
      }

      // 2. Sync to TalentProfile table so user appears on /people
      const lookingForArr: LookingForType[] =
        lookingFor === "both"
          ? ["hackathon", "research"]
          : lookingFor === "hackathon"
          ? ["hackathon"]
          : ["research"];

      await authFetch("/api/people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: user.name,
          headline: `${editRole} • ${editCollege.trim() || "Independent"}`,
          skills: selectedSkills.length > 0 ? selectedSkills : ["Developer"],
          lookingFor: lookingForArr,
          experienceLevel,
          bio: editBio.trim() || "Passionate about building fast prototypes and high-impact systems.",
          github: github.trim() || undefined,
          linkedin: linkedin.trim() || undefined,
          portfolio: portfolio.trim() || undefined,
          availability,
          visible: isVisibleOnPeople,
        }),
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save profile changes";
      setSaveError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleFilled = async (listing: Listing) => {
    const newStatus = listing.status === "filled" ? "open" : "filled";
    try {
      const res = await authFetch(`/api/listings/${listing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setListings((prev) =>
          prev.map((l) => (l.id === listing.id ? { ...l, status: newStatus } : l))
        );
      }
    } catch (err: unknown) {
      console.error(err);
    }
  };

  const handleRenew = async (listing: Listing) => {
    try {
      const res = await authFetch(`/api/listings/${listing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "renew" }),
      });
      const data = await res.json();
      if (data.success) {
        setListings((prev) =>
          prev.map((l) => (l.id === listing.id ? data.data : l))
        );
      }
    } catch (err: unknown) {
      console.error(err);
    }
  };

  const handleDeleteListing = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this requisition?")) return;
    try {
      const res = await authFetch(`/api/listings/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setListings((prev) => prev.filter((l) => l.id !== id));
      }
    } catch (err: unknown) {
      console.error(err);
    }
  };

  const handleExportData = async () => {
    try {
      const res = await authFetch("/api/user/export");
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `rivq-account-export-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Export error:", err);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") return;
    setIsDeleting(true);
    try {
      const res = await authFetch("/api/user", {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        signOut();
        router.push("/");
      }
    } catch (err: unknown) {
      console.error(err);
      alert("Failed to delete account. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] px-4 py-8 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors min-h-[36px]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Discovery Feed</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-[var(--text-tertiary)] hidden sm:inline">
              UID: {user.id.slice(0, 8)}...
            </span>
            <button
              type="button"
              onClick={() => {
                signOut();
                router.push("/");
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-[var(--text-secondary)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut className="w-3 h-3" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Hero User Banner */}
        <div className="surface-card rounded-2xl p-6 sm:p-7 border border-[var(--border-default)] shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <Avatar src={user.photo} name={user.name} size={60} />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">
                    {user.name}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Verified Google Account</span>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] mt-1 font-mono">
                  <Mail className="w-3 h-3 text-blue-500" />
                  <span>{user.email}</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  <span className="font-medium text-[var(--text-primary)]">{editRole}</span>
                  {" • "}
                  <span>{editCollege || "Independent"}</span>
                </p>
              </div>
            </div>

            {/* Quick Status Stats */}
            <div className="flex items-center gap-3 self-start sm:self-auto">
              <div className="px-3.5 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-center">
                <span className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold block">
                  My Posts
                </span>
                <span className="text-base font-bold text-[var(--text-primary)]">
                  {myListings.length}
                </span>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-center">
                <span className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold block">
                  Contacted
                </span>
                <span className="text-base font-bold text-[var(--text-primary)]">
                  {myContacted.length}
                </span>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-center">
                <span className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold block">
                  Squad Status
                </span>
                <span className="text-xs font-semibold text-emerald-500 flex items-center justify-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{isVisibleOnPeople ? "Live" : "Private"}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Compliance & Export Quick Row */}
          <div className="pt-4 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-[11px] text-[var(--text-tertiary)]">
              Direct peer-to-peer collaborator contact on Gmail. Never spammed or sold.
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportData}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--bg-surface)] border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-medium transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Data</span>
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-medium transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Account</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-[var(--border-default)] gap-6 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab("edit")}
            className={`pb-3 border-b-2 transition-all cursor-pointer ${
              activeTab === "edit"
                ? "border-blue-500 text-blue-600 dark:text-blue-400 font-semibold"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Profile & Squadmate Card
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("listings")}
            className={`pb-3 border-b-2 transition-all cursor-pointer ${
              activeTab === "listings"
                ? "border-blue-500 text-blue-600 dark:text-blue-400 font-semibold"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            My Requisitions ({myListings.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("contacted")}
            className={`pb-3 border-b-2 transition-all cursor-pointer ${
              activeTab === "contacted"
                ? "border-blue-500 text-blue-600 dark:text-blue-400 font-semibold"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Contacted History ({myContacted.length})
          </button>
        </div>

        {/* TAB 1: Edit Profile & Talent Card */}
        {activeTab === "edit" && (
          <form onSubmit={handleSaveProfile} className="space-y-6">
            {saveSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
                <Check className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>Your profile and squadmate card have been saved successfully to Supabase!</span>
              </div>
            )}

            {saveError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{saveError}</span>
              </div>
            )}

            {/* Section 1: Basic Identity */}
            <div className="surface-card rounded-2xl p-6 border border-[var(--border-default)] space-y-4">
              <h3 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                Identity & Affiliation
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--text-secondary)] block">
                    Primary Role
                  </label>
                  <div className="relative">
                    <select
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--text-secondary)] block">
                    College or Organization
                  </label>
                  <input
                    type="text"
                    value={editCollege}
                    onChange={(e) => setEditCollege(e.target.value)}
                    placeholder="e.g. IIT Delhi, Gautam Buddha University, BITS Pilani"
                    className="w-full h-11 px-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Looking for & Experience Level Segmented Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--text-secondary)] block">
                    Looking For
                  </label>
                  <div className="p-1 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] grid grid-cols-3 gap-1">
                    {[
                      { id: "hackathon", label: "Hackathons" },
                      { id: "research", label: "Research" },
                      { id: "both", label: "Both" },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setLookingFor(opt.id as "hackathon" | "research" | "both")}
                        className={`h-9 rounded-lg text-xs transition-colors flex items-center justify-center cursor-pointer ${
                          lookingFor === opt.id
                            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold border border-blue-500/30"
                            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--text-secondary)] block">
                    Experience Level
                  </label>
                  <div className="p-1 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] grid grid-cols-3 gap-1">
                    {[
                      { id: "student", label: "Student" },
                      { id: "early-career", label: "Early-Career" },
                      { id: "experienced", label: "Experienced" },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setExperienceLevel(opt.id as ExperienceLevel)}
                        className={`h-9 rounded-lg text-xs transition-colors flex items-center justify-center cursor-pointer ${
                          experienceLevel === opt.id
                            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold border border-blue-500/30"
                            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Skills & Bio */}
            <div className="surface-card rounded-2xl p-6 border border-[var(--border-default)] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                  Top Skills & Expertise
                </h3>
                <span className="text-[11px] text-[var(--text-tertiary)] tabular-nums">
                  {selectedSkills.length}/10 selected
                </span>
              </div>

              {/* Selected skills pill list */}
              <div className="flex flex-wrap gap-2 pt-1">
                {selectedSkills.map((sk) => (
                  <span
                    key={sk}
                    className="h-8 px-3 rounded-full text-xs font-sans bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1.5"
                  >
                    <span>{sk}</span>
                    <button
                      type="button"
                      onClick={() => toggleSkill(sk)}
                      className="p-0.5 hover:bg-blue-500/20 rounded-full"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              {/* Suggested quick chips */}
              <div className="space-y-1.5 pt-2">
                <span className="text-[11px] text-[var(--text-tertiary)] block">
                  Quick Add Suggestions:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTED_SKILLS.filter((s) => !selectedSkills.includes(s)).map((sk) => (
                    <button
                      key={sk}
                      type="button"
                      onClick={() => toggleSkill(sk)}
                      className="h-7 px-2.5 rounded-full text-[11px] bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-default)] hover:text-[var(--text-primary)] hover:border-[var(--border-highlight)] transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-2.5 h-2.5" />
                      <span>{sk}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom skill text input */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="text"
                  value={customSkillInput}
                  onChange={(e) => setCustomSkillInput(e.target.value)}
                  onKeyDown={handleAddCustomSkill}
                  placeholder="Or type custom skill and press Enter..."
                  className="flex-1 h-10 px-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={handleAddCustomSkill}
                  disabled={!customSkillInput.trim() || selectedSkills.length >= 10}
                  className="h-10 px-4 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-surface)] border border-[var(--border-default)] text-[var(--text-primary)] text-xs font-medium disabled:opacity-50 transition-colors cursor-pointer"
                >
                  Add Skill
                </button>
              </div>

              {/* Bio textarea */}
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-[var(--text-secondary)] block">
                    Bio & Technical Interests
                  </label>
                  <span className="text-[11px] text-[var(--text-tertiary)] tabular-nums">
                    {editBio.length}/500
                  </span>
                </div>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Tell potential collaborators what projects you like building, your hackathon ambitions, or research interests..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 resize-none leading-relaxed"
                />
              </div>
            </div>

            {/* Section 3: Public Links & Squadmate Discoverability */}
            <div className="surface-card rounded-2xl p-6 border border-[var(--border-default)] space-y-4">
              <h3 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                Public Portfolios & Links
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-[var(--text-secondary)] flex items-center gap-1">
                    <Code2 className="w-3.5 h-3.5" />
                    <span>GitHub Username</span>
                  </label>
                  <input
                    type="text"
                    value={github}
                    onChange={(e) => setGithub(e.target.value)}
                    placeholder="e.g. torvalds"
                    className="w-full h-10 px-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-[var(--text-secondary)] flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5" />
                    <span>LinkedIn URL</span>
                  </label>
                  <input
                    type="text"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    placeholder="https://linkedin.com/in/..."
                    className="w-full h-10 px-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-[var(--text-secondary)] flex items-center gap-1">
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Portfolio Website</span>
                  </label>
                  <input
                    type="text"
                    value={portfolio}
                    onChange={(e) => setPortfolio(e.target.value)}
                    placeholder="https://..."
                    className="w-full h-10 px-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Discoverability Switch */}
              <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-between gap-4 mt-4">
                <div>
                  <span className="text-xs font-semibold text-[var(--text-primary)] block">
                    Show My Profile on /people
                  </span>
                  <span className="text-[11px] text-[var(--text-secondary)] mt-0.5 block leading-normal">
                    Allow project leads and researchers to find and invite you directly on verified Gmail.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsVisibleOnPeople((prev) => !prev)}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                    isVisibleOnPeople ? "bg-blue-600" : "bg-[var(--border-default)]"
                  }`}
                >
                  <span
                    className={`block w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                      isVisibleOnPeople ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving to Supabase...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Save Profile Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: My Requisitions */}
        {activeTab === "listings" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  My Team Posts
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Manage your open hackathon and research requisitions.
                </p>
              </div>
              <Link
                href="/post"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Post Requirement</span>
              </Link>
            </div>

            {myListings.length === 0 ? (
              <div className="surface-card rounded-2xl p-10 text-center border border-[var(--border-default)] space-y-3">
                <Users className="w-8 h-8 text-[var(--text-tertiary)] mx-auto" />
                <h4 className="text-sm font-bold text-[var(--text-primary)]">
                  No active team requisitions posted yet
                </h4>
                <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
                  Looking for teammates for SIH, NeurIPS, or a hackathon? Publish a requisition to let developers reach you on Gmail.
                </p>
                <Link
                  href="/post"
                  className="inline-block mt-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
                >
                  Create Your First Post
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {myListings.map((l) => (
                  <div
                    key={l.id}
                    className="surface-card rounded-2xl p-5 border border-[var(--border-default)] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-semibold text-blue-500">
                          {l.event}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                            l.status === "filled"
                              ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                              : l.status === "expired"
                              ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                              : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                          }`}
                        >
                          {l.status}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-[var(--text-primary)]">
                        {l.title}
                      </h4>
                      <p className="text-[11px] text-[var(--text-secondary)]">
                        Vacant Slots: {l.slots}/{l.totalSlots} • Expires: {new Date(l.expiresAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleRenew(l)}
                        className="px-3 py-1.5 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-surface)] border border-[var(--border-default)] text-xs text-[var(--text-secondary)] flex items-center gap-1 transition-colors cursor-pointer"
                        title="Renew listing for 30 more days"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Renew 30d</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleFilled(l)}
                        className="px-3 py-1.5 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-surface)] border border-[var(--border-default)] text-xs text-[var(--text-secondary)] transition-colors cursor-pointer"
                      >
                        {l.status === "filled" ? "Mark Open" : "Mark Filled"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteListing(l.id)}
                        className="p-2 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Delete listing"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Contacted History */}
        {activeTab === "contacted" && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Teams You Contacted on Gmail
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                History of requisitions and squad leads you reached out to.
              </p>
            </div>

            {myContacted.length === 0 ? (
              <div className="surface-card rounded-2xl p-10 text-center border border-[var(--border-default)] space-y-3">
                <Mail className="w-8 h-8 text-[var(--text-tertiary)] mx-auto" />
                <h4 className="text-sm font-bold text-[var(--text-primary)]">
                  No outreach history yet
                </h4>
                <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
                  When you connect with teams on the discovery feed, your sent inquiries will be organized here.
                </p>
                <Link
                  href="/"
                  className="inline-block mt-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
                >
                  Browse Open Teams
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {myContacted.map((l) => (
                  <div
                    key={l.id}
                    className="surface-card rounded-2xl p-4 sm:p-5 border border-[var(--border-default)] flex items-center justify-between gap-4"
                  >
                    <div>
                      <span className="text-[10px] font-mono font-semibold text-blue-500 block">
                        {l.event}
                      </span>
                      <h4 className="text-sm font-bold text-[var(--text-primary)]">
                        {l.title}
                      </h4>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                        Lead: {l.ownerName} • {l.ownerCollege} ({l.ownerEmail})
                      </p>
                    </div>
                    <Link
                      href="/"
                      className="px-3.5 py-1.5 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-surface)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] font-medium transition-colors shrink-0"
                    >
                      View Card
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Account Deletion Modal */}
      {showDeleteModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <div className="surface-card rounded-2xl max-w-md w-full p-6 space-y-4 border border-[var(--border-default)] shadow-2xl">
            <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Permanently Delete Account?
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Under the DPDP Act 2023 and GDPR, this will permanently remove your profile, talent card, all posted requisitions, and audit records. This cannot be undone.
              </p>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="block text-[11px] text-[var(--text-secondary)]">
                Type <strong className="text-[var(--text-primary)]">DELETE</strong> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full h-10 px-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText("");
                }}
                className="px-3.5 py-2 rounded-xl bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== "DELETE" || isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold disabled:opacity-50 transition-colors cursor-pointer"
              >
                {isDeleting ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
