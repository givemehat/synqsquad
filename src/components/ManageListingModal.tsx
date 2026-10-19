"use client";

import React, { useState } from "react";
import { Listing, TeamStatus } from "@/types";
import { X, Key, Trash2, CheckCircle2, AlertCircle } from "lucide-react";

interface ManageListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: Listing | null;
  onListingUpdated: (updated: Listing) => void;
  onListingDeleted: (id: string) => void;
}

export function ManageListingModal({
  isOpen,
  onClose,
  listing,
  onListingUpdated,
  onListingDeleted,
}: ManageListingModalProps) {
  const [pin, setPin] = useState("");
  const [status, setStatus] = useState<TeamStatus>(listing?.status || "open");
  const [membersCount, setMembersCount] = useState(listing?.currentMembersCount || 1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen || !listing) return null;

  const handleUpdate = async () => {
    if (!pin.trim()) {
      setErrorMsg("Please enter your 6-digit Manage PIN.");
      return;
    }
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await fetch(`/api/listings/${listing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          managePin: pin.trim(),
          updates: {
            status,
            currentMembersCount: Number(membersCount),
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update listing");
      }

      setSuccessMsg("Listing updated successfully!");
      onListingUpdated(data.data);
      setTimeout(() => {
        onClose();
        setSuccessMsg("");
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update. Check your PIN.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!pin.trim()) {
      setErrorMsg("Please enter your 6-digit Manage PIN to delete.");
      return;
    }
    if (!confirm("Are you sure you want to permanently delete this listing?")) return;

    setErrorMsg("");
    setLoading(true);

    try {
      const res = await fetch(`/api/listings/${listing.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          managePin: pin.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete listing");
      }

      onListingDeleted(listing.id);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to delete. Check your PIN.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 bg-gradient-to-r from-slate-900 to-indigo-950/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">Manage Your Listing</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Enter 6-Digit Manage PIN
            </label>
            <input
              type="password"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••••"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-center font-mono text-xl tracking-widest focus:outline-none focus:border-indigo-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Generated when the listing was created.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Team Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "open", label: "🟢 Open" },
                { id: "closing_soon", label: "🟡 Closing Soon" },
                { id: "filled", label: "🔴 Team Full" },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStatus(s.id as TeamStatus)}
                  className={`py-2 px-2 text-xs font-semibold rounded-xl border transition-all ${
                    status === s.id
                      ? "bg-indigo-600 text-white border-indigo-500"
                      : "bg-slate-950 text-slate-400 border-slate-800"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Current Members Count
            </label>
            <input
              type="number"
              min={1}
              max={listing.maxMembersCount}
              value={membersCount}
              onChange={(e) => setMembersCount(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={handleUpdate}
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800 text-rose-300 font-semibold text-xs transition-all flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete This Listing Permanently</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
