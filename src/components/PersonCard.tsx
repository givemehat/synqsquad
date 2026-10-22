"use client";

import React from "react";
import { TalentProfile } from "@/types";
import { ArrowRight, Globe, Code2, Mail } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { useAuth } from "@/context/AuthContext";

interface PersonCardProps {
  profile: TalentProfile;
  onSelect: (profile: TalentProfile) => void;
}

export function PersonCard({ profile, onSelect }: PersonCardProps) {
  const { user, openAuthModal } = useAuth();
  const isAvailable = profile.availability === "open";

  return (
    <article
      onClick={() => onSelect(profile)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(profile);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`View profile for ${profile.displayName}`}
      className="surface-card group relative p-4 sm:p-5 cursor-pointer flex flex-col justify-between select-none focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] hover:border-[var(--border-highlight)] transition-all"
    >
      <div>
        {/* Top Header: Member details & Availability */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <Avatar name={profile.displayName} size={36} />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-primary)]">
                  {profile.displayName}
                </span>
                <span className="text-[10px] text-[var(--text-tertiary)] font-mono capitalize">
                  • {profile.experienceLevel}
                </span>
              </div>
              {user ? (
                <div className="flex items-center gap-1 text-[11px] text-[var(--text-secondary)] font-mono">
                  <Mail className="w-3 h-3 text-blue-500 shrink-0" />
                  <span className="truncate max-w-[150px]">{profile.email}</span>
                </div>
              ) : (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    openAuthModal();
                  }}
                  className="flex items-center gap-1 cursor-pointer group/mail"
                  title="Sign in with Google to reveal Gmail ID"
                >
                  <Mail className="w-3 h-3 text-blue-500 shrink-0" />
                  <span className="text-[11px] font-mono text-[var(--text-tertiary)] filter blur-[4px] select-none">
                    user@gmail.com
                  </span>
                  <span className="text-[9px] font-semibold text-blue-500 bg-blue-500/10 px-1 py-0.2 rounded border border-blue-500/20 group-hover/mail:bg-blue-500/20">
                    Reveal
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Availability Status Tag */}
          <span
            className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium flex items-center gap-1 ${
              isAvailable
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
            }`}
          >
            {isAvailable ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Open
              </>
            ) : (
              "Busy"
            )}
          </span>
        </div>

        {/* Headline */}
        <h3 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors mb-2 leading-snug">
          {profile.headline}
        </h3>

        {/* Bio preview */}
        {profile.bio && (
          <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mb-3 leading-relaxed">
            {profile.bio}
          </p>
        )}

        {/* Looking For Badges */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {profile.lookingFor.map((target) => (
            <span
              key={target}
              className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-[var(--accent-subtle)] text-[var(--accent-primary)] border border-[var(--accent-primary)]/20"
            >
              {target}
            </span>
          ))}
        </div>

        {/* Skill tags */}
        <div className="flex flex-wrap gap-1 mb-4">
          {profile.skills.slice(0, 5).map((skill) => (
            <span
              key={skill}
              className="px-2 py-0.5 rounded text-[10px] bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-default)]"
            >
              {skill}
            </span>
          ))}
          {profile.skills.length > 5 && (
            <span className="px-1.5 py-0.5 text-[10px] text-[var(--text-tertiary)] font-mono">
              +{profile.skills.length - 5}
            </span>
          )}
        </div>
      </div>

      {/* Footer / Connect Action */}
      <div className="pt-3 border-t border-[var(--border-default)] flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-[var(--text-tertiary)]">
          {profile.github && <Code2 size={13} className="hover:text-[var(--text-primary)]" />}
          {profile.linkedin && <Globe size={13} className="hover:text-[var(--text-primary)]" />}
          {profile.portfolio && <Globe size={13} className="hover:text-[var(--text-primary)]" />}
        </div>
        <span className="font-semibold text-[var(--accent-primary)] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
          Connect on Gmail
          <ArrowRight size={13} />
        </span>
      </div>
    </article>
  );
}
