"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Listing } from "@/types";
import { X, Trash2, Mail, ShieldCheck, LogOut, RefreshCw, Edit3, ExternalLink } from "lucide-react";
import { Avatar } from "@/components/Avatar";

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
  const [activeTab, setActiveTab] = useState<"my_listings" | "contacted">("my_listings");
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
    } catch (e: unknown) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRenew = async (listing: Listing) => {
    setActionLoading(listing.id);
    try {
      const res = await fetch(`/api/listings/${listing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerEmail: user.email,
          status: "renew",
        }),
      });
      const data = await res.json();
      if (data.success) {
        onListingUpdated(data.data);
      }
    } catch (e: unknown) {
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
    } catch (e: unknown) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[var(--bg-surface)] border-l border-[var(--border-default)] h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--border-default)] flex items-center justify-between bg-[var(--bg-elevated)]">
          <div className="flex items-center gap-2.5">
            <Avatar src={user.photo} name={user.name} size={36} />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[var(--text-primary)]">{user.name}</span>
                <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
              </div>
              <span className="text-[11px] text-[var(--text-secondary)] font-mono block">{user.email}</span>
              <span className="text-[11px] text-[var(--accent-primary)] font-medium block">
                {user.role} • {user.college}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Link
              href="/profile"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center gap-1 text-xs"
              title="Edit Profile"
            >
              <Edit3 className="w-4 h-4" />
            </Link>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close drawer"
              className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Profile Card Summary */}
        <div className="px-5 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] flex items-center justify-between text-xs">
          <div className="flex flex-wrap gap-1 max-w-[260px]">
            {user.skills?.slice(0, 4).map((sk) => (
              <span key={sk} className="px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[10px] text-[var(--text-secondary)] font-mono">
                {sk}
              </span>
            ))}
            {(user.skills?.length || 0) > 4 && (
              <span className="text-[10px] text-[var(--text-tertiary)] self-center">
                +{(user.skills?.length || 0) - 4} more
              </span>
            )}
          </div>
          <Link
            href="/profile"
            onClick={onClose}
            className="text-[11px] font-semibold text-[var(--accent-primary)] hover:underline flex items-center gap-0.5"
          >
            Full Profile <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-[var(--border-default)] px-4 bg-[var(--bg-surface)]">
          <button
            type="button"
            onClick={() => setActiveTab("my_listings")}
            className={`py-3 px-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === "my_listings"
                ? "border-[var(--accent-primary)] text-[var(--text-primary)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            My Listings ({myListings.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("contacted")}
            className={`py-3 px-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === "contacted"
                ? "border-[var(--accent-primary)] text-[var(--text-primary)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Contacted ({contactedListings.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {activeTab === "my_listings" && (
            <>
              {myListings.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)]">
                  <p className="text-xs text-[var(--text-secondary)] mb-2">
                    You haven&apos;t posted any collaborator requirements yet.
                  </p>
                </div>
              ) : (
                myListings.map((l) => (
                  <div
                    key={l.id}
                    className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono text-[var(--accent-primary)] block">
                          {l.event}
                        </span>
                        <h4
                          onClick={() => {
                            onClose();
                            onSelectListing(l);
                          }}
                          className="text-xs font-bold text-[var(--text-primary)] hover:underline cursor-pointer leading-tight"
                        >
                          {l.title}
                        </h4>
                      </div>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold shrink-0 ${
                          l.status === "filled"
                            ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                            : l.status === "expired"
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                            : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                        }`}
                      >
                        {l.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[var(--border-subtle)]">
                      <span className="text-[var(--text-tertiary)] font-mono">
                        Expires: {new Date(l.expiresAt).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {/* 1-click renew */}
                        <button
                          type="button"
                          onClick={() => handleRenew(l)}
                          disabled={actionLoading === l.id}
                          className="px-2 py-1 rounded bg-[var(--bg-surface)] hover:bg-[var(--bg-overlay)] border border-[var(--border-default)] text-[var(--text-secondary)] text-[10px] flex items-center gap-1 transition-colors"
                          title="Renew listing for 30 more days"
                        >
                          <RefreshCw className="w-2.5 h-2.5" />
                          <span>Renew</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleFilled(l)}
                          disabled={actionLoading === l.id}
                          className="px-2 py-1 rounded bg-[var(--bg-surface)] hover:bg-[var(--bg-overlay)] border border-[var(--border-default)] text-[var(--text-secondary)] text-[10px] transition-colors"
                        >
                          {l.status === "filled" ? "Reopen" : "Mark Filled"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(l.id)}
                          disabled={actionLoading === l.id}
                          aria-label="Delete listing"
                          className="p-1 rounded text-red-500 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {activeTab === "contacted" && (
            <>
              {contactedListings.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)]">
                  <Mail className="w-6 h-6 text-[var(--text-tertiary)] mx-auto mb-2" />
                  <p className="text-xs text-[var(--text-secondary)]">
                    You haven&apos;t connected with any leads on Gmail yet.
                  </p>
                </div>
              ) : (
                contactedListings.map((l) => (
                  <div
                    key={l.id}
                    onClick={() => {
                      onClose();
                      onSelectListing(l);
                    }}
                    className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] hover:border-[var(--border-highlight)] transition-colors cursor-pointer space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-[var(--accent-primary)]">
                        {l.event}
                      </span>
                      <span className="text-[10px] text-[var(--text-tertiary)] font-mono">
                        Contacted
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-[var(--text-primary)]">{l.title}</h4>
                    <p className="text-[11px] text-[var(--text-secondary)]">
                      Lead: {l.ownerName} ({l.ownerCollege})
                    </p>
                  </div>
                ))
              )}
            </>
          )}
        </div>

        {/* Footer with Sign Out */}
        <div className="p-4 border-t border-[var(--border-default)] bg-[var(--bg-elevated)] flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              signOut();
              onClose();
            }}
            className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-red-500 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
          <span className="text-[10px] font-mono text-[var(--text-tertiary)]">
            Verified Google Session
          </span>
        </div>
      </div>
    </div>
  );
}
