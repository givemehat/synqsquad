"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Listing } from "@/types";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { MetricsBar } from "@/components/MetricsBar";
import { ListingCard } from "@/components/ListingCard";
import { ListingTableView } from "@/components/ListingTableView";
import { ListingDetailDrawer } from "@/components/ListingDetailDrawer";
import { CommandPalette } from "@/components/CommandPalette";
import { CreateListingModal } from "@/components/CreateListingModal";
import { SmartMatcherModal } from "@/components/SmartMatcherModal";
import { BoostModal } from "@/components/BoostModal";
import { ManageListingModal } from "@/components/ManageListingModal";
import { HackathonRadar } from "@/components/HackathonRadar";
import { Footer } from "@/components/Footer";
import {
  Sparkles,
  Plus,
  RefreshCw,
  LayoutGrid,
  Table as TableIcon,
  Flame,
  Search,
} from "lucide-react";

export default function HomePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Modals & Panels state
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isMatcherOpen, setIsMatcherOpen] = useState(false);
  const [selectedListingForDetail, setSelectedListingForDetail] = useState<Listing | null>(null);
  const [selectedListingForBoost, setSelectedListingForBoost] = useState<Listing | null>(null);
  const [selectedListingForManage, setSelectedListingForManage] = useState<Listing | null>(null);

  // Fetch listings
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

  // Filter listings
  const filteredListings = useMemo(() => {
    return listings.filter((l) => {
      const targetType =
        activeTab === "hackathon" || activeTab === "research" ? activeTab : selectedType;
      if (targetType !== "all" && l.type !== targetType) {
        return false;
      }

      if (selectedDomain !== "all" && l.domain !== selectedDomain) {
        return false;
      }

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

  // Actions from Command Palette
  const handleCommandAction = (actionId: string) => {
    switch (actionId) {
      case "toggle_palette":
        setIsCommandPaletteOpen((prev) => !prev);
        break;
      case "post_requirement":
        setIsCreateOpen(true);
        break;
      case "open_matcher":
        setIsMatcherOpen(true);
        break;
      case "filter_all":
        setActiveTab("all");
        setSelectedType("all");
        break;
      case "filter_hackathon":
        setActiveTab("hackathon");
        setSelectedType("hackathon");
        break;
      case "filter_research":
        setActiveTab("research");
        setSelectedType("research");
        break;
      case "view_radar":
        setActiveTab("radar");
        break;
      case "filter_boosted":
        setSearchQuery("urgent");
        break;
      default:
        break;
    }
  };

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
    <div className="min-h-screen flex flex-col bg-[#090b0e] text-slate-100">
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

      {/* Main Content */}
      <main className="flex-1">
        {activeTab === "radar" ? (
          <HackathonRadar onFindTeamForEvent={handleFindTeamForEvent} />
        ) : (
          <>
            {/* Hero Section */}
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

            {/* Workbench Feed Container */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {/* Metrics Strip */}
              <MetricsBar listings={listings} />

              {/* Toolbar & View Controls */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/5">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Active Team Requisitions</span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/5 text-slate-300">
                      {filteredListings.length}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Click any squad to inspect full technical scope and open channels
                  </p>
                </div>

                <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between">
                  {/* View Switcher */}
                  <div className="flex items-center bg-[#11141a] p-1 rounded-lg border border-white/10">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-1.5 rounded-md text-xs transition-colors ${
                        viewMode === "grid"
                          ? "bg-white/10 text-white"
                          : "text-slate-400 hover:text-white"
                      }`}
                      title="Grid View"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setViewMode("table")}
                      className={`p-1.5 rounded-md text-xs transition-colors ${
                        viewMode === "table"
                          ? "bg-white/10 text-white"
                          : "text-slate-400 hover:text-white"
                      }`}
                      title="Table View (Power Users)"
                    >
                      <TableIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Refresh Button */}
                  <button
                    onClick={fetchListings}
                    className="p-2 rounded-lg bg-[#11141a] border border-white/10 text-slate-400 hover:text-white transition-colors"
                    title="Refresh feed"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                  </button>

                  {/* Post CTA */}
                  <button
                    onClick={() => setIsCreateOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Post Requirement</span>
                  </button>
                </div>
              </div>

              {/* Feed Content */}
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="h-64 rounded-2xl bg-[#0e1117] border border-white/5 animate-pulse"
                    />
                  ))}
                </div>
              ) : filteredListings.length === 0 ? (
                <div className="text-center py-20 px-4 rounded-2xl bg-[#0e1117] border border-white/5 max-w-md mx-auto">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-slate-400 mb-3">
                    <Search className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1">
                    No postings matched current filters
                  </h3>
                  <p className="text-xs text-slate-400 mb-5">
                    Clear your filters or publish your project to recruit the first candidates.
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedDomain("all");
                        setSelectedType("all");
                      }}
                      className="px-3.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold transition-all"
                    >
                      Reset Filters
                    </button>
                    <button
                      onClick={() => setIsCreateOpen(true)}
                      className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all"
                    >
                      Post Requirement
                    </button>
                  </div>
                </div>
              ) : viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredListings.map((listing) => (
                    <div
                      key={listing.id}
                      onClick={() => setSelectedListingForDetail(listing)}
                      className="cursor-pointer"
                    >
                      <ListingCard
                        listing={listing}
                        onOpenBoost={(item) => setSelectedListingForBoost(item)}
                        onOpenManage={(item) => setSelectedListingForManage(item)}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <ListingTableView
                  listings={filteredListings}
                  onSelectListing={(item) => setSelectedListingForDetail(item)}
                  onOpenBoost={(item) => setSelectedListingForBoost(item)}
                  onOpenManage={(item) => setSelectedListingForManage(item)}
                />
              )}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* Slide-over Detail Drawer */}
      <ListingDetailDrawer
        listing={selectedListingForDetail}
        onClose={() => setSelectedListingForDetail(null)}
        onOpenBoost={(item) => setSelectedListingForBoost(item)}
        onOpenManage={(item) => setSelectedListingForManage(item)}
      />

      {/* Command Palette (Cmd/Ctrl + K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectAction={handleCommandAction}
      />

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
