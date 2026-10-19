import React from "react";
import { Users, Heart, Shield, Sparkles, Zap, Flame } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-800 bg-slate-950 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Col 1 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <Users className="w-4 h-4" />
              </div>
              <span className="font-bold text-base text-white">SynqSquad</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              The premier self-service matchmaking engine for high-stakes hackathons, open research collaborations, and startup squads.
            </p>
            <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Zero-Ops Architecture • 100% Self-Service</span>
            </div>
          </div>

          {/* Col 2 */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-xs uppercase tracking-wider">
              Popular Competitions
            </h4>
            <ul className="space-y-2 text-xs">
              <li>Smart India Hackathon (SIH 2026)</li>
              <li>ETHGlobal AI & Web3 Tour</li>
              <li>NASA Space Apps Challenge</li>
              <li>NeurIPS Workshop Collaborations</li>
              <li>Solana Hyperdrive</li>
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-xs uppercase tracking-wider">
              Monetization & Promotion
            </h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Priority Feed Spotlight (₹99 - ₹349)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-indigo-400" />
                <span>Instant UPI & Card Auto-Activation</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Verified Winner Badge Guarantee</span>
              </li>
              <li>Discord Channel Auto-Syndication</li>
            </ul>
          </div>

          {/* Col 4: Trust & Self Moderation */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-xs uppercase tracking-wider">
              Zero Customer Service Overhead
            </h4>
            <p className="text-xs text-slate-400 mb-2 leading-relaxed">
              Listings are secured with a self-generated 6-digit Secret PIN. Authors manage, fill, and delete their own posts directly with 0 support dependency.
            </p>
            <p className="text-[11px] text-slate-400">
              Direct connection via Telegram, Discord, and WhatsApp.
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <p>© 2026 SynqSquad. Built for builders, researchers, and hackathon competitors.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-300 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-300 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-300 cursor-pointer">Zero Spam Guarantee</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
