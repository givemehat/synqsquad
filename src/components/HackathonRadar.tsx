"use client";

import React, { useState, useEffect } from "react";
import { HackathonEvent } from "@/types";
import { Calendar, Trophy, ExternalLink, Users, Sparkles, Filter } from "lucide-react";

interface HackathonRadarProps {
  onFindTeamForEvent: (eventName: string) => void;
}

export function HackathonRadar({ onFindTeamForEvent }: HackathonRadarProps) {
  const [events, setEvents] = useState<HackathonEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/hackathons")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setEvents(data.data);
        }
      })
      .catch((err) => console.error("Error loading hackathons:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Live Tracker
            </span>
            <span className="text-xs text-slate-400">Updated for 2026 Season</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Upcoming Hackathons & Research Grants Radar
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Browse top competitions and form your dream team before the deadlines.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-2xl bg-slate-900/60 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((ev) => (
            <div
              key={ev.id}
              className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 shadow-lg hover:shadow-indigo-500/10 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/60">
                    {ev.mode}
                  </span>
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5" />
                    <span>{ev.prizePool}</span>
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mb-1.5">{ev.name}</h3>
                <p className="text-xs text-slate-400 mb-4">Organized by {ev.organizer}</p>

                <div className="flex flex-wrap gap-1.5 mb-5">
                  {ev.tags.map((t, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-300"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/80 space-y-2.5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>Deadline: {ev.deadline}</span>
                  </div>
                  <a
                    href={ev.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    <span>Official Portal</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <button
                  onClick={() => onFindTeamForEvent(ev.name)}
                  className="w-full py-2 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 hover:text-white border border-indigo-800/60 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Find Teams for {ev.name.split(" ")[0]}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
