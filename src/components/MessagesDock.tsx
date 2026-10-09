"use client";

import { useState } from "react";
import { Send, Maximize2, Minimize2, X, SquarePen } from "lucide-react";

const GLASS =
  "bg-white/60 dark:bg-neutral-900/60 backdrop-blur-2xl backdrop-saturate-150 border border-black/10 dark:border-white/10 shadow-2xl";

const PLACEHOLDERS = [
  "from-pink-400 to-orange-400",
  "from-violet-500 to-fuchsia-500",
  "from-sky-400 to-emerald-400",
];

export default function MessagesDock() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="hidden md:block fixed bottom-5 right-5 z-40">
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center justify-between gap-2 h-15 pl-5 pr-3 text-white transition-[filter] hover:brightness-125"
          style={{
            width: 250,
            background: "rgba(58,61,68,0.55)",
            backdropFilter: "blur(24px) saturate(1.5)",
            WebkitBackdropFilter: "blur(24px) saturate(1.5)",
            borderRadius: 9999,
            border: "1px solid rgba(255,255,255,0.15)",
            boxShadow: "0 8px 30px rgba(0,0,0,0.45)",
          }}
        >
          <span className="flex items-center gap-2 text-base font-semibold px-4">
            <Send size={24} />
            Messages
          </span>
          <span className="flex items-center -space-x-2 px-4">
            {PLACEHOLDERS.map((g) => (
              <span
                key={g}
                className={`w-8 h-8 rounded-full bg-linear-to-br ${g}`}
                style={{ border: "2px solid rgba(58,61,68,0.9)" }}
              />
            ))}
          </span>
        </button>
      )}

      {open && (
        <div
          className={`relative flex flex-col overflow-hidden rounded-2xl transition-all duration-300 ${GLASS} ${
            expanded ? "w-120 h-[80vh]" : "w-90 h-130"
          }`}
        >
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-black/10 dark:border-white/10 shrink-0">
            <span className="text-neutral-900 dark:text-white text-sm font-semibold">
              Messages
            </span>
            <div className="flex items-center gap-3 text-neutral-600 dark:text-neutral-300">
              <button
                onClick={() => setExpanded((v) => !v)}
                className="hover:text-neutral-900 dark:hover:text-white transition-colors"
              >
                {expanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
              <button
                onClick={() => {
                  setOpen(false);
                  setExpanded(false);
                }}
                className="hover:text-neutral-900 dark:hover:text-white transition-colors"
              >
                <X size={22} />
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center gap-2 px-6 text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center border border-black/10 dark:border-white/15 mb-1">
              <Send size={24} className="text-neutral-500" />
            </div>
            <p className="text-neutral-900 dark:text-white text-sm font-semibold">
              Under development
            </p>
            <p className="text-neutral-500 text-xs">Messaging is coming soon</p>
          </div>

          <button
            disabled
            className="absolute bottom-4 right-4 w-12 h-12 rounded-full flex items-center justify-center bg-black/10 dark:bg-white/10 border border-black/10 dark:border-white/15 text-neutral-900 dark:text-white opacity-60 cursor-not-allowed"
          >
            <SquarePen size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
