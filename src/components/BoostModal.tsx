"use client";

import React, { useState } from "react";
import { Listing } from "@/types";
import { X, Flame, Check, QrCode, CreditCard, Sparkles, CheckCircle2 } from "lucide-react";
import confetti from "canvas-confetti";

interface BoostModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: Listing | null;
  onBoostActivated: (updated: Listing) => void;
}

export function BoostModal({ isOpen, onClose, listing, onBoostActivated }: BoostModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<"starter" | "pro" | "mega">("pro");
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "card">("upi");
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen || !listing) return null;

  const handleActivate = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/boost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listing.id,
          plan: selectedPlan,
          paymentMethod: paymentMethod === "upi" ? "UPI QR (Instant)" : "Debit/Credit Card",
          transactionRef: `tx_live_${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to process boost");
      }

      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.5 },
      });

      setSuccess(true);
      onBoostActivated(data.data.listing);
    } catch (err: any) {
      alert(err.message || "Something went wrong activating boost");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-amber-500/40 rounded-3xl shadow-2xl shadow-amber-500/10 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
              <Flame className="w-5 h-5 text-amber-400 fill-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Boost Post to Top</h2>
              <p className="text-xs text-amber-300/80">Get 5x to 10x faster team matches</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {success ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center mx-auto text-amber-400">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h3 className="text-2xl font-bold text-white">Post Boosted to #1!</h3>
              <p className="text-sm text-slate-300 max-w-xs mx-auto">
                Your listing is now pinned with a golden spotlight badge and priority Discord distribution.
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-all"
              >
                Back to Feed
              </button>
            </div>
          ) : (
            <>
              {/* Selected listing preview */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  Boosting Listing:
                </span>
                <p className="text-sm font-semibold text-white truncate">{listing.title}</p>
                <p className="text-xs text-indigo-400">{listing.targetName}</p>
              </div>

              {/* Plans Selection */}
              <div className="space-y-2.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Select Promotion Duration
                </label>

                {/* Plan 1 */}
                <div
                  onClick={() => setSelectedPlan("starter")}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                    selectedPlan === "starter"
                      ? "bg-indigo-950/40 border-indigo-500"
                      : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div>
                    <p className="text-sm font-bold text-white">Starter Spike (3 Days)</p>
                    <p className="text-xs text-slate-400">Top feed ranking for 72 hours</p>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-bold text-white">₹99</span>
                    <span className="text-xs text-slate-400 block">$1.49</span>
                  </div>
                </div>

                {/* Plan 2: Best Value */}
                <div
                  onClick={() => setSelectedPlan("pro")}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between relative ${
                    selectedPlan === "pro"
                      ? "bg-amber-950/30 border-amber-500 ring-1 ring-amber-500"
                      : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <span className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950">
                    MOST POPULAR
                  </span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <p className="text-sm font-bold text-white">Pro Spotlight (7 Days)</p>
                    </div>
                    <p className="text-xs text-slate-400">
                      Golden frame + 5x Discord views + Pinned #1
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-bold text-amber-400">₹199</span>
                    <span className="text-xs text-slate-400 block">$2.99</span>
                  </div>
                </div>

                {/* Plan 3 */}
                <div
                  onClick={() => setSelectedPlan("mega")}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                    selectedPlan === "mega"
                      ? "bg-indigo-950/40 border-indigo-500"
                      : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div>
                    <p className="text-sm font-bold text-white">Grand Slam (14 Days)</p>
                    <p className="text-xs text-slate-400">Full tournament or paper cycle coverage</p>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-bold text-white">₹349</span>
                    <span className="text-xs text-slate-400 block">$4.99</span>
                  </div>
                </div>
              </div>

              {/* Payment selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Payment Method (Instant Automated Activation)
                </label>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("upi")}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 transition-all ${
                      paymentMethod === "upi"
                        ? "bg-slate-800 border-indigo-500 text-white"
                        : "bg-slate-950 border-slate-800 text-slate-400"
                    }`}
                  >
                    <QrCode className="w-4 h-4 text-emerald-400" />
                    <span>UPI / QR / GPay</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 transition-all ${
                      paymentMethod === "card"
                        ? "bg-slate-800 border-indigo-500 text-white"
                        : "bg-slate-950 border-slate-800 text-slate-400"
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-sky-400" />
                    <span>Card / NetBanking</span>
                  </button>
                </div>

                {paymentMethod === "upi" ? (
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-4">
                    <div className="w-16 h-16 bg-white p-1 rounded-xl flex items-center justify-center flex-shrink-0">
                      <QrCode className="w-14 h-14 text-slate-950" />
                    </div>
                    <div className="text-xs">
                      <p className="font-semibold text-white">Instant UPI Auto-Verify</p>
                      <p className="text-[11px] text-slate-400">
                        Scan with GPay, PhonePe, Paytm, or BHIM. Zero manual review needed.
                      </p>
                      <span className="text-[10px] font-mono text-emerald-400">
                        synqsquad.pay@upi
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <input
                      type="text"
                      placeholder="4242 •••• •••• 4242"
                      defaultValue="4242 •••• •••• 4242"
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="MM/YY"
                        defaultValue="12/28"
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono"
                      />
                      <input
                        type="text"
                        placeholder="CVV"
                        defaultValue="999"
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleActivate}
                disabled={isProcessing}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-sm shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 fill-slate-950" />
                <span>
                  {isProcessing
                    ? "Verifying & Activating..."
                    : `Confirm & Pay ₹${
                        selectedPlan === "starter" ? 99 : selectedPlan === "pro" ? 199 : 349
                      }`}
                </span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
