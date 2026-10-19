"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Listing } from "@/types";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { ListingCard } from "@/components/ListingCard";
import { CreateListingModal } from "@/components/CreateListingModal";
import { SmartMatcherModal } from "@/components/SmartMatcherModal";
import { BoostModal } from "@/components/BoostModal";
import { ManageListingModal } from "@/components/ManageListingModal";
import { HackathonRadar } from "@/components/HackathonRadar";
import { Footer } from "@/components/Footer";
import { Sparkles, PlusCircle, Filter, AlertCircle, RefreshCw } from "lucide-react";

export default function HomePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [activeTab, setActiveTab] = useState("all");

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isMatcherOpen, setIsMatcherOpen] = useState(false);
  const [selectedListingForBoost, setSelectedListingForBoost] = useState<Listing | null>(null);
  const [selectedListingForManage, setSelectedListingForManage] = useState<Listing | null>(null);

  // Fetch listings from API
  const fetchListings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/listings");
      const data = await res.json();
      if (data.success) {
        setListings(data.data);
      }
    } catch (err) {
      console.error("Failed to load listings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  // Filter listings based on current search and pills
  const filteredListings = useMemo(() => {
    return listings.filter((l) => {
      // Type filter (from navbar tab or hero filter)
      const targetType = activeTab === "hackathon" || activeTab === "research" ? activeTab : selectedType;
      if (targetType !== "all" && l.type !== targetType) {
        return false;
      }

      // Domain filter
      if (selectedDomain !== "all" && l.domain !== selectedDomain) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = l.title.toLowerCase().includes(q);
        const matchesTarget = l.targetName.toLowerCase().includes(q);
        const matchesDesc = l.description.toLowerCase().includes(q);
        const matchesSkills = l.skills.some((s) => s.toLowerCase().includes(q));
        const matchesRoles = l.rolesNeeded.some((r) => r.toLowerCase().includes(q));
        const matchesCreator = l.creatorName.toLowerCase().includes(q);

        if (!matchesTitle && !matchesTarget && !matchesDesc && !matchesSkills && !matchesRoles && !matchesCreator) {
          return false;
        }
      }

      return true;
    });
  }, [listings, activeTab, selectedType, selectedDomain, searchQuery]);

  const handleListingCreated = (newListing: Listing) => {
    setListings((prev) => [newListing, ...prev]);
  };

  const handleBoostActivated = (updatedListing: Listing) => {
    setListings((prev) =>
      prev.map((l) => (l.id === updatedListing.id ? updatedListing : l))
    );
  };

  const handleListingUpdated = (updatedListing: Listing) => {
    setListings((prev) =>
      prev.map((l) => (l.id === updatedListing.id ? updatedListing : l))
    );
  };

  const handleListingDeleted = (deletedId: string) => {
    setListings((prev) => prev.filter((l) => l.id !== deletedId));
  };

  const handleFindTeamForEvent = (eventName: string) => {
    setActiveTab("all");
    setSearchQuery(eventName.split(" ")[0]);
    window.scrollTo({ top: 350, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Top Navigation */}
      <Navbar
        onOpenCreate={() => setIsCreateOpen(true)}
        onOpenMatcher={() => setIsMatcherOpen(true)}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab === "hackathon" || tab === "research") {
            setSelectedType(tab);
          } else if (tab === "all") {
            setSelectedType("all");
          }
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === "radar" ? (
          <HackathonRadar onFindTeamForEvent={handleFindTeamForEvent} />
        ) : (
          <>
            {/* Hero & Search Header */}
            <Hero
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedDomain={selectedDomain}
              setSelectedDomain={setSelectedDomain}
              selectedType={selectedType}
              setSelectedType={setSelectedType}
              onOpenCreate={() => setIsCreateOpen(true)}
              onOpenMatcher={() => setIsMatcherOpen(true)}
              totalCount={listings.length}
            />

            {/* Listings Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span>Active Postings</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold">
                      {filteredListings.length}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Showing teams currently accepting collaborators and co-authors
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchListings}
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
                    title="Refresh postings"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                  </button>
                  <button
                    onClick={() => setIsCreateOpen(true)}
                    className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 border border-indigo-500/30 text-xs font-semibold transition-all"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Post Listing</span>
                  </button>
                </div>
              </div>

              {/* Feed Content */}
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="h-72 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse"
                    />
                  ))}
                </div>
              ) : filteredListings.length === 0 ? (
                <div className="text-center py-16 px-4 rounded-3xl bg-slate-900/40 border border-slate-800/80 max-w-md mx-auto">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400 mb-3">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">No postings match your criteria</h3>
                  <p className="text-xs text-slate-400 mb-5">
                    Be the pioneer: Post your project requirement or clear your search filters.
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedDomain("all");
                        setSelectedType("all");
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-all"
                    >
                      Reset Filters
                    </button>
                    <button
                      onClick={() => setIsCreateOpen(true)}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all"
                    >
                      Post Requirement
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredListings.map((listing) => (
                    <ListingCard
                      key={listing.id}
                      listing={listing}
                      onOpenBoost={(item) => setSelectedListingForBoost(item)}
                      onOpenManage={(item) => setSelectedListingForManage(item)}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* Modals */}
      <CreateListingModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onListingCreated={handleListingCreated}
      />

      <SmartMatcherModal
        isOpen={isMatcherOpen}
        onClose={() => setIsMatcherOpen(false)}
        listings={listings}
      />

      <BoostModal
        isOpen={Boolean(selectedListingForBoost)}
        onClose={() => setSelectedListingForBoost(null)}
        listing={selectedListingForBoost}
        onBoostActivated={handleBoostActivated}
      />

      <ManageListingModal
        isOpen={Boolean(selectedListingForManage)}
        onClose={() => setSelectedListingForManage(null)}
        listing={selectedListingForManage}
        onListingUpdated={handleListingUpdated}
        onListingDeleted={handleListingDeleted}
      />
    </div>
  );
}
