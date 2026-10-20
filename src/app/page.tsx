"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Listing, ScreenState } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { ListingCard } from "@/components/ListingCard";
import { ListingDetailDrawer } from "@/components/ListingDetailDrawer";
import { GoogleAuthModal } from "@/components/GoogleAuthModal";
import { UserProfileDrawer } from "@/components/UserProfileDrawer";
import { CreateListingModal } from "@/components/CreateListingModal";
import { SuggestMatchesModal } from "@/components/SuggestMatchesModal";
import { Footer } from "@/components/Footer";
import { StateView } from "@/components/StateView";
import { Plus } from "lucide-react";

export default function HomePage() {
  const { user, openAuthModal, blockedUsers } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [screenState, setScreenState] = useState<ScreenState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSkill, setSelectedSkill] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");

  // Drawers & Modals
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSuggestOpen, setIsSuggestOpen] = useState(false);

  const fetchListings = useCallback(async () => {
    setScreenState("loading");
    setErrorMessage("");

    try {
      const isAuthParam = user ? "true" : "false";
      const res = await fetch(`/api/listings?auth=${isAuthParam}`);
      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setListings(data.data);
        setScreenState("idle");
      } else {
        throw new Error(data.error || "Malformed listings response");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load listings";
      setErrorMessage(msg);
      setScreenState("error");
    }
  }, [user]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (isMounted) {
        await fetchListings();
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [fetchListings]);

  // Deep-linking support: auto-open listing drawer if ?id= or ?listing= present
  useEffect(() => {
    if (listings.length > 0 && typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const targetId = params.get("id") || params.get("listing");
      if (targetId) {
        const found = listings.find((l) => l.id === targetId);
        if (found) {
          setSelectedListing(found);
        }
      }
    }
  }, [listings]);

  // Synchronize activeTab with selectedType
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === "hackathon" || tab === "research") {
      setSelectedType(tab);
    } else {
      setSelectedType("all");
    }
  };

  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    if (type === "hackathon" || type === "research") {
      setActiveTab(type);
    } else {
      setActiveTab("all");
    }
  };

  // Filter listings
  const filteredListings = useMemo(() => {
    return listings.filter((l) => {
      // Type filter
      if (selectedType !== "all" && l.type !== selectedType) {
        return false;
      }

      // Skill filter
      if (selectedSkill !== "all") {
        const hasSkill = l.skillsNeeded.some(
          (s) => s.toLowerCase() === selectedSkill.toLowerCase()
        );
        if (!hasSkill) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = l.title.toLowerCase().includes(q);
        const matchesEvent = l.event.toLowerCase().includes(q);
        const matchesDesc = l.description.toLowerCase().includes(q);
        const matchesCollege = l.ownerCollege.toLowerCase().includes(q);
        const matchesName = l.ownerName.toLowerCase().includes(q);
        const matchesSkills = l.skillsNeeded.some((s) => s.toLowerCase().includes(q));

        if (
          !matchesTitle &&
          !matchesEvent &&
          !matchesDesc &&
          !matchesCollege &&
          !matchesName &&
          !matchesSkills
        ) {
          return false;
        }
      }

      // UGC Community Safety: Filter out blocked creators
      if (blockedUsers && blockedUsers.length > 0) {
        if (blockedUsers.includes(l.ownerEmail.toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  }, [listings, selectedType, selectedSkill, searchQuery, blockedUsers]);

  const handleListingCreated = (newListing: Listing) => {
    setListings((prev) => [newListing, ...prev]);
  };

  const handleListingUpdated = (updatedListing: Listing) => {
    setListings((prev) =>
      prev.map((l) => (l.id === updatedListing.id ? updatedListing : l))
    );
    if (selectedListing?.id === updatedListing.id) {
      setSelectedListing(updatedListing);
    }
  };

  const handleListingDeleted = (deletedId: string) => {
    setListings((prev) => prev.filter((l) => l.id !== deletedId));
    if (selectedListing?.id === deletedId) {
      setSelectedListing(null);
    }
  };

  // Compute current display state
  const computedState: ScreenState =
    screenState === "loading"
      ? "loading"
      : screenState === "error"
      ? "error"
      : listings.length === 0
      ? "empty"
      : filteredListings.length === 0
      ? "no_results"
      : "idle";

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-canvas)] text-[var(--text-primary)] transition-colors">
      {/* Slim Top Bar */}
      <Navbar
        onOpenCreate={() => setIsCreateOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        activeTab={activeTab}
        setActiveTab={handleTabChange}
      />

      <main className="flex-1">
        {/* Compact Editorial Hero */}
        <Hero
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedSkill={selectedSkill}
          setSelectedSkill={setSelectedSkill}
          selectedType={selectedType}
          setSelectedType={handleTypeChange}
          onOpenSuggestMatches={() => setIsSuggestOpen(true)}
          resultCount={filteredListings.length}
        />

        {/* Listings Feed Header & View */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-[var(--border-default)]">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                Active Listings
              </h2>
              {/* Count matches real filtered list */}
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-default)] tabular-nums">
                {filteredListings.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setDensity((d) => (d === "comfortable" ? "compact" : "comfortable"))
                }
                className="text-[11px] font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-2.5 py-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] border border-[var(--border-default)] transition-colors min-h-[32px]"
                title="Toggle density"
              >
                {density === "comfortable" ? "Compact View" : "Comfortable View"}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!user) {
                    openAuthModal(() => setIsCreateOpen(true));
                  } else {
                    setIsCreateOpen(true);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold shadow-xs transition-colors min-h-[32px]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Post Requirement</span>
              </button>
            </div>
          </div>

          {/* Feed Content or State View */}
          {computedState !== "idle" ? (
            <StateView
              state={computedState}
              onRetry={fetchListings}
              onResetFilters={() => {
                setSearchQuery("");
                setSelectedSkill("all");
                setSelectedType("all");
              }}
              customMessage={errorMessage}
            />
          ) : (
            <div
              className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 ${
                density === "comfortable" ? "gap-4" : "gap-2.5"
              }`}
            >
              {filteredListings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  onSelect={(item) => setSelectedListing(item)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Clean Footer with comprehensive navigation */}
      <Footer />

      {/* Detail Drawer (Connect on Gmail Flow) */}
      <ListingDetailDrawer
        listing={selectedListing}
        onClose={() => setSelectedListing(null)}
      />

      {/* Google Auth Modal */}
      <GoogleAuthModal />

      {/* Profile & My Listings Drawer */}
      <UserProfileDrawer
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        listings={listings}
        onListingUpdated={handleListingUpdated}
        onListingDeleted={handleListingDeleted}
        onSelectListing={(item) => setSelectedListing(item)}
      />

      {/* Create Requirement Modal */}
      <CreateListingModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onListingCreated={handleListingCreated}
      />

      {/* Suggest Matches Modal */}
      <SuggestMatchesModal
        isOpen={isSuggestOpen}
        onClose={() => setIsSuggestOpen(false)}
        listings={listings}
        onSelectListing={(item) => setSelectedListing(item)}
      />
    </div>
  );
}
