"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Listing } from "@/types";
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
} from "lucide-react";
import { Avatar } from "@/components/Avatar";

export default function ProfilePage() {
  const router = useRouter();
  const { user, signOut, contactedList, updateProfile } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [activeTab, setActiveTab] = useState<"listings" | "contacted" | "edit">("listings");

  // Edit form state initialized from user
  const [editRole, setEditRole] = useState(user?.role || "Developer");
  const [editCollege, setEditCollege] = useState(user?.college || "");
  const [editBio, setEditBio] = useState(user?.bio || "");
  const [editSkills, setEditSkills] = useState(user?.skills?.join(", ") || "");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Deletion modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync edit form fields when user changes
  useEffect(() => {
    if (user) {
      setEditRole(user.role || "Developer");
      setEditCollege(user.college || "");
      setEditBio(user.bio || "");
      setEditSkills(user.skills?.join(", ") || "");
    }
  }, [user]);

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
    }
  }, [user, fetchListings]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg-canvas)]">
        <div className="surface-card rounded-2xl p-8 max-w-md w-full text-center space-y-4">
          <User className="w-10 h-10 text-[var(--text-tertiary)] mx-auto" />
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            Sign-in Required
          </h2>
          <p className="text-xs text-[var(--text-secondary)]">
            Please sign in with your Google account to access your SynqSquad profile, listings, and privacy controls.
          </p>
          <Link
            href="/"
            className="inline-block px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-white text-xs font-semibold hover:bg-[var(--accent-hover)] transition-colors min-h-[36px]"
          >
            Go to Home & Sign In
          </Link>
        </div>
      </div>
    );
  }

  const myListings = listings.filter(
    (l) => l.ownerEmail.toLowerCase() === user.email.toLowerCase()
  );
  const myContacted = listings.filter((l) => contactedList.includes(l.id));

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const parsedSkills = editSkills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    updateProfile({
      role: editRole,
      college: editCollege,
      bio: editBio,
      skills: parsedSkills,
    });

    try {
      await authFetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: editRole,
          college: editCollege,
          bio: editBio,
          skills: parsedSkills,
        }),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: unknown) {
      console.error(err);
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
        body: JSON.stringify({
          status: newStatus,
        }),
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
        body: JSON.stringify({
          status: "renew",
        }),
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
    if (!confirm("Delete this listing permanently?")) return;
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
        a.download = `synqsquad-data-${Date.now()}.json`;
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
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors min-h-[36px]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Feed</span>
          </Link>
          <span className="text-[11px] font-mono text-[var(--text-tertiary)]">
            Account ID: {user.id.slice(0, 10)}
          </span>
        </div>

        {/* User Card */}
        <div className="surface-card rounded-2xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-default)]">
            <div className="flex items-center gap-3">
              <Avatar src={user.photo} name={user.name} size={48} />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold text-[var(--text-primary)]">
                    {user.name}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 text-[var(--accent-primary)] border border-blue-500/20">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Google Verified</span>
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] font-mono">{user.email}</p>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  {user.role} • {user.college}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportData}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--bg-overlay)] border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-medium transition-colors min-h-[36px]"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Data</span>
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 text-xs font-medium transition-colors min-h-[36px]"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Account</span>
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-[var(--border-default)] gap-4 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("listings")}
              className={`pb-2.5 font-medium border-b-2 transition-colors ${
                activeTab === "listings"
                  ? "border-[var(--accent-primary)] text-[var(--text-primary)]"
                  : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              My Listings ({myListings.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("contacted")}
              className={`pb-2.5 font-medium border-b-2 transition-colors ${
                activeTab === "contacted"
                  ? "border-[var(--accent-primary)] text-[var(--text-primary)]"
                  : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Contacted History ({myContacted.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("edit")}
              className={`pb-2.5 font-medium border-b-2 transition-colors ${
                activeTab === "edit"
                  ? "border-[var(--accent-primary)] text-[var(--text-primary)]"
                  : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Edit Profile
            </button>
          </div>

          {/* Tab 1: My Listings */}
          {activeTab === "listings" && (
            <div className="space-y-3 pt-2">
              {myListings.length === 0 ? (
                <p className="text-xs text-[var(--text-secondary)] text-center py-8">
                  You haven&apos;t posted any requirements yet.
                </p>
              ) : (
                myListings.map((l) => (
                  <div
                    key={l.id}
                    className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-[var(--accent-primary)]">
                          {l.event}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.2 rounded uppercase font-semibold ${
                            l.status === "filled"
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                              : l.status === "expired"
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {l.status}
                        </span>
                      </div>
                      <h3 className="font-bold text-[var(--text-primary)] text-sm mt-0.5">{l.title}</h3>
                      <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                        Expires: {new Date(l.expiresAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRenew(l)}
                        className="px-2.5 py-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-overlay)] border border-[var(--border-default)] text-[var(--text-secondary)] text-xs flex items-center gap-1 transition-colors min-h-[32px]"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Renew 30d</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleFilled(l)}
                        className="px-2.5 py-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-overlay)] border border-[var(--border-default)] text-[var(--text-secondary)] text-xs transition-colors min-h-[32px]"
                      >
                        {l.status === "filled" ? "Mark Open" : "Mark Filled"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteListing(l.id)}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 2: Contacted History */}
          {activeTab === "contacted" && (
            <div className="space-y-3 pt-2">
              {myContacted.length === 0 ? (
                <p className="text-xs text-[var(--text-secondary)] text-center py-8">
                  You haven&apos;t connected with any leads on Gmail yet.
                </p>
              ) : (
                myContacted.map((l) => (
                  <div
                    key={l.id}
                    className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-mono text-[10px] text-[var(--accent-primary)]">
                        {l.event}
                      </span>
                      <h3 className="font-bold text-[var(--text-primary)] text-sm">{l.title}</h3>
                      <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                        Lead: {l.ownerName} ({l.ownerCollege})
                      </p>
                    </div>
                    <Link
                      href="/"
                      className="px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-medium transition-colors"
                    >
                      View Card
                    </Link>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 3: Edit Profile */}
          {activeTab === "edit" && (
            <form onSubmit={handleSaveProfile} className="space-y-4 pt-2 text-xs">
              {saveSuccess && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>Profile updated successfully.</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                  Primary Role
                </label>
                <input
                  type="text"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] text-xs focus:outline-none min-h-[40px]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                  College or Affiliation
                </label>
                <input
                  type="text"
                  value={editCollege}
                  onChange={(e) => setEditCollege(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] text-xs focus:outline-none min-h-[40px]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                  Skills (comma separated)
                </label>
                <input
                  type="text"
                  value={editSkills}
                  onChange={(e) => setEditSkills(e.target.value)}
                  placeholder="e.g. Next.js, Python, PyTorch, C++"
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] text-xs focus:outline-none min-h-[40px]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                  Bio
                </label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] text-xs focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white font-semibold transition-colors min-h-[40px]"
              >
                {isSaving ? "Saving..." : "Save Profile"}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Account Deletion Modal */}
      {showDeleteModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <div className="surface-card rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Permanently Delete Account?
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Under the DPDP Act 2023 and GDPR, this will permanently remove your profile, all posted requisitions, and audit records. This action cannot be undone.
              </p>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] text-[var(--text-secondary)]">
                Type <strong className="text-[var(--text-primary)]">DELETE</strong> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] text-xs focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText("");
                }}
                className="px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== "DELETE" || isDeleting}
                className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold disabled:opacity-50 transition-colors"
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
