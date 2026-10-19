"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Listing } from "@/types";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { ListingCard } from "@/components/ListingCard";
import { ListingDetailDrawer } from "@/components/ListingDetailDrawer";
import { GoogleAuthModal } from "@/components/GoogleAuthModal";
import { UserProfileDrawer } from "@/components/UserProfileDrawer";
import { CreateListingModal } from "@/components/CreateListingModal";
import { SuggestMatchesModal } from "@/components/SuggestMatchesModal";
import { Footer } from "@/components/Footer";
import { Search, LayoutGrid, ListFilter, Plus } from "lucide-react";

function FeedContent() {
  const { user, openAuthModal } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
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

  const fetchListings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/listings?auth=${user ? "true" : "false"}`);
      const data = await res.json();
      if (data.success) {
        setListings(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [user]);

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

      return true;
    });
  }, [listings, selectedType, selectedSkill, searchQuery]);

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

  return (
    <div className="min-h-screen flex flex-col bg-[#090b0e] text-slate-100">
      {/* Slim Top Bar */}
      <Navbar
        onOpenCreate={() => setIsCreateOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        activeTab={activeTab}
        setActiveTab={handleTabChange}
      />

      <main className="flex-1">
        {/* Compact Hero (<= 30% viewport) */}
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
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/5">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-200">
                Active Listings
              </h2>
              {/* Count matches real filtered list */}
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/5 text-slate-400">
                {filteredListings.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setDensity((d) => (d === "comfortable" ? "compact" : "comfortable"))
                }
                className="text-[11px] font-mono text-slate-400 hover:text-white px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 transition-colors"
                title="Toggle density"
              >
                {density === "comfortable" ? "Compact" : "Comfortable"}
              </button>

              <button
                onClick={() => {
                  if (!user) {
                    openAuthModal(() => setIsCreateOpen(true));
                  } else {
                    setIsCreateOpen(true);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Post Requirement</span>
              </button>
            </div>
          </div>

          {/* Feed Content */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-56 rounded-xl bg-[#0f1217] border border-white/5 animate-pulse"
                />
              ))}
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="text-center py-16 px-4 rounded-xl bg-[#0f1217] border border-white/5 max-w-md mx-auto">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mx-auto text-slate-400 mb-2.5">
                <Search className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-white mb-1">
                No listings match current criteria
              </h3>
              <p className="text-[11px] text-slate-400 mb-4">
                Try selecting &quot;All Skills&quot; or publish your project to recruit the first candidates.
              </p>
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedSkill("all");
                    setSelectedType("all");
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-medium transition-colors"
                >
                  Reset filters
                </button>
                <button
                  onClick={() => setIsCreateOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
                >
                  Post what you need
                </button>
              </div>
            </div>
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

      {/* Clean Footer */}
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

      {/* Create Requirement Modal (6 fields) */}
      <CreateListingModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onListingCreated={handleListingCreated}
      />

      {/* Suggest Matches Modal (Honest, skill overlap) */}
      <SuggestMatchesModal
        isOpen={isSuggestOpen}
        onClose={() => setIsSuggestOpen(false)}
        listings={listings}
        onSelectListing={(item) => setSelectedListing(item)}
      />
    </div>
  );
}

export default function HomePage() {
  return (
    <AuthProvider>
      <FeedContent />
    </AuthProvider>
  );
}
