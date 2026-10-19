"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Listing } from "@/types";
import { X, Check, Trash2, Mail, ExternalLink, ShieldCheck, LogOut } from "lucide-react";

interface UserProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  listings: Listing[];
  onListingUpdated: (listing: Listing) => void;
  onListingDeleted: (id: string) => void;
  onSelectListing: (listing: Listing) => void;
}

export function UserProfileDrawer({
  isOpen,
  onClose,
  listings,
  onListingUpdated,
  onListingDeleted,
  onSelectListing,
}: UserProfileDrawerProps) {
  const { user, signOut, contactedList } = useAuth();
  const [activeTab, setActiveTab] = useState<"profile" | "my_listings" | "contacted">("my_listings");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const myListings = listings.filter(
    (l) => l.ownerEmail.toLowerCase() === user.email.toLowerCase()
  );

  const contactedListings = listings.filter((l) => contactedList.includes(l.id));

  const handleToggleFilled = async (listing: Listing) => {
    setActionLoading(listing.id);
    const newStatus = listing.status === "filled" ? "open" : "filled";
    try {
      const res = await fetch(`/api/listings/${listing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerEmail: user.email,
          status: newStatus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onListingUpdated(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (listingId: string) => {
    if (!confirm("Are you sure you want to permanently delete this listing?")) return;
    setActionLoading(listingId);
    try {
      const res = await fetch(`/api/listings/${listingId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerEmail: user.email,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onListingDeleted(listingId);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-[#0e1117] border-l border-white/10 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-[#12161f]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-xs font-bold text-white overflow-hidden">
              {user.photo ? (
                <img src={user.photo} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user.name.charAt(0)
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white">{user.name}</span>
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <span className="text-[10px] text-slate-400">{user.email}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-white/10 bg-[#0a0c10] px-4 pt-2 gap-4 text-xs font-medium">
          <button
            onClick={() => setActiveTab("my_listings")}
            className={`pb-2.5 border-b-2 transition-colors ${
              activeTab === "my_listings"
                ? "border-blue-500 text-white font-semibold"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            My Listings ({myListings.length})
          </button>
          <button
            onClick={() => setActiveTab("contacted")}
            className={`pb-2.5 border-b-2 transition-colors ${
              activeTab === "contacted"
                ? "border-blue-500 text-white font-semibold"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            Contacted ({contactedListings.length})
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`pb-2.5 border-b-2 transition-colors ${
              activeTab === "profile"
                ? "border-blue-500 text-white font-semibold"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            Profile
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === "my_listings" && (
            <div className="space-y-3">
              {myListings.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  You haven&apos;t posted any requirements yet.
                </div>
              ) : (
                myListings.map((listing) => (
                  <div
                    key={listing.id}
                    className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono text-blue-400 block mb-0.5">
                          {listing.event}
                        </span>
                        <h4 className="text-xs font-bold text-white line-clamp-1">
                          {listing.title}
                        </h4>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          listing.status === "filled"
                            ? "bg-rose-500/10 text-rose-300 border border-rose-500/20"
                            : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                        }`}
                      >
                        {listing.status === "filled" ? "Closed / Filled" : "Open"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                      <button
                        onClick={() => handleToggleFilled(listing)}
                        disabled={actionLoading === listing.id}
                        className="text-slate-400 hover:text-white transition-colors"
                      >
                        {listing.status === "filled" ? "Reopen Listing" : "Mark as Filled"}
                      </button>

                      <button
                        onClick={() => handleDelete(listing.id)}
                        disabled={actionLoading === listing.id}
                        className="text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "contacted" && (
            <div className="space-y-3">
              {contactedListings.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  You haven&apos;t contacted any creators yet. Once you click &quot;Connect on Gmail&quot;, they appear here.
                </div>
              ) : (
                contactedListings.map((listing) => (
                  <div
                    key={listing.id}
                    onClick={() => {
                      onSelectListing(listing);
                      onClose();
                    }}
                    className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 cursor-pointer transition-colors space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>{listing.event}</span>
                      <span className="text-blue-400 flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        <span>Gmail Sent</span>
                      </span>
                    </div>
                    <h4 className="text-xs font-semibold text-white truncate">
                      {listing.title}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Lead: {listing.ownerName} ({listing.ownerCollege})
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "profile" && (
            <div className="space-y-4 text-xs">
              <div>
                <span className="text-[11px] text-slate-500 uppercase tracking-wider block mb-1">
                  Verified Gmail
                </span>
                <span className="text-white font-mono bg-black/40 px-3 py-2 rounded-lg border border-white/5 block">
                  {user.email}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 uppercase tracking-wider block mb-1">
                  College / Affiliation
                </span>
                <span className="text-white bg-black/40 px-3 py-2 rounded-lg border border-white/5 block">
                  {user.college}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 uppercase tracking-wider block mb-1">
                  Role
                </span>
                <span className="text-white bg-black/40 px-3 py-2 rounded-lg border border-white/5 block">
                  {user.role}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 uppercase tracking-wider block mb-1">
                  Bio
                </span>
                <p className="text-slate-300 bg-black/40 p-3 rounded-lg border border-white/5">
                  {user.bio}
                </p>
              </div>

              <div className="pt-4 border-t border-white/10">
                <button
                  onClick={() => {
                    signOut();
                    onClose();
                  }}
                  className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-300 border border-white/5 hover:border-rose-500/20 font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
