"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { TalentProfile, ScreenState, LookingForType } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";
import { PersonCard } from "@/components/PersonCard";
import { PersonDetailModal } from "@/components/PersonDetailModal";
import { GoogleAuthModal } from "@/components/GoogleAuthModal";
import { UserProfileDrawer } from "@/components/UserProfileDrawer";
import { CreateListingModal } from "@/components/CreateListingModal";
import { Footer } from "@/components/Footer";
import { StateView } from "@/components/StateView";
import { Search, Users } from "lucide-react";

export default function PeoplePage() {
  const { user, openAuthModal } = useAuth();
  const [profiles, setProfiles] = useState<TalentProfile[]>([]);
  const [screenState, setScreenState] = useState<ScreenState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLookingFor, setSelectedLookingFor] = useState<string>("all");
  const [selectedExperience, setSelectedExperience] = useState<string>("all");
  const [onlyOpen, setOnlyOpen] = useState(false);

  // Modals & Drawers
  const [selectedProfile, setSelectedProfile] = useState<TalentProfile | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("people");

  const fetchProfiles = useCallback(async () => {
    setScreenState("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/people");
      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setProfiles(data.data);
        setScreenState("idle");
      } else {
        throw new Error(data.error || "Malformed profiles response");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load talent profiles";
      setErrorMessage(msg);
      setScreenState("error");
    }
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      // Visibility check
      if (p.visible === false || p.availability === "hidden") return false;
      if (onlyOpen && p.availability !== "open") return false;

      // Looking for filter
      if (selectedLookingFor !== "all") {
        if (!p.lookingFor.includes(selectedLookingFor as LookingForType)) return false;
      }

      // Experience filter
      if (selectedExperience !== "all") {
        if (p.experienceLevel !== selectedExperience) return false;
      }

      // Search query (name, headline, bio, skills)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = p.displayName.toLowerCase().includes(q);
        const matchesHeadline = p.headline.toLowerCase().includes(q);
        const matchesBio = p.bio.toLowerCase().includes(q);
        const matchesSkills = p.skills.some((s) => s.toLowerCase().includes(q));
        if (!matchesName && !matchesHeadline && !matchesBio && !matchesSkills) {
          return false;
        }
      }

      return true;
    });
  }, [profiles, onlyOpen, selectedLookingFor, selectedExperience, searchQuery]);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      <Navbar
        onOpenCreate={() => setIsCreateOpen(true)}
        onOpenProfile={() => {
          if (!user) openAuthModal();
          else setIsProfileOpen(true);
        }}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header Hero Section */}
        <section className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border-default)]">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--accent-subtle)] text-[var(--accent-primary)] mb-2">
                <Users size={13} />
                <span>Talent Directory</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Squadmates & Researchers Open to Collaborate
              </h1>
              <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-2xl">
                Browse verified developers and researchers looking for hackathon teams, paper co-authors, and early projects. Connect directly on verified Gmail.
              </p>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="mt-6 flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search skills (e.g. Next.js, PyTorch, Rust), names or headlines..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
              />
            </div>

            {/* Looking For Dropdown */}
            <div className="flex items-center gap-2">
              <select
                value={selectedLookingFor}
                onChange={(e) => setSelectedLookingFor(e.target.value)}
                className="py-2.5 px-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] text-xs font-medium text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] cursor-pointer"
              >
                <option value="all">All Goals</option>
                <option value="hackathon">Hackathons</option>
                <option value="research">Research Papers</option>
                <option value="startup">Startups</option>
                <option value="project">Side Projects</option>
              </select>

              {/* Experience Level */}
              <select
                value={selectedExperience}
                onChange={(e) => setSelectedExperience(e.target.value)}
                className="py-2.5 px-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] text-xs font-medium text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] cursor-pointer"
              >
                <option value="all">All Levels</option>
                <option value="student">Student</option>
                <option value="early-career">Early-Career</option>
                <option value="experienced">Experienced</option>
              </select>

              {/* Open to squads checkbox */}
              <label className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={onlyOpen}
                  onChange={(e) => setOnlyOpen(e.target.checked)}
                  className="rounded border-[var(--border-default)] text-[var(--accent-primary)] focus:ring-0"
                />
                <span>Open Now</span>
              </label>
            </div>
          </div>
        </section>

        {/* Content States */}
        {screenState === "loading" && <StateView state="loading" />}

        {screenState === "error" && (
          <StateView
            state="error"
            customMessage={errorMessage}
            onRetry={fetchProfiles}
          />
        )}

        {screenState === "idle" && profiles.length === 0 && (
          <StateView
            state="empty"
            customMessage="Be the first to create your talent profile and let project leads find and invite you directly on verified Gmail."
          />
        )}

        {screenState === "idle" && profiles.length > 0 && filteredProfiles.length === 0 && (
          <StateView
            state="no_results"
            customMessage="No squadmates match your search. Try adjusting filters or searching for another skill."
            onResetFilters={() => {
              setSearchQuery("");
              setSelectedLookingFor("all");
              setSelectedExperience("all");
              setOnlyOpen(false);
            }}
          />
        )}

        {screenState === "idle" && filteredProfiles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProfiles.map((profile) => (
              <PersonCard
                key={profile.id}
                profile={profile}
                onSelect={(p) => setSelectedProfile(p)}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />

      {/* Detail Modal */}
      <PersonDetailModal
        profile={selectedProfile}
        isOpen={Boolean(selectedProfile)}
        onClose={() => setSelectedProfile(null)}
        onBlock={(email) => {
          setProfiles((prev) => prev.filter((p) => p.email !== email));
        }}
      />

      {/* Global Auth & Profile Drawers */}
      <GoogleAuthModal />
      <UserProfileDrawer
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        listings={[]}
        onListingUpdated={() => {}}
        onListingDeleted={() => {}}
        onSelectListing={() => {}}
      />
      <CreateListingModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onListingCreated={() => setIsCreateOpen(false)}
      />
    </div>
  );
}
