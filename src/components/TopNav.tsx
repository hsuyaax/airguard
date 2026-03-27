"use client";

import { UserButton } from "@clerk/nextjs";
import { NotificationBell } from "@/components/NotificationBell";

export function TopNav() {
  return (
    <header
      className="fixed top-0 right-0 h-16 z-30 flex justify-between items-center px-8 ml-64 w-[calc(100%-16rem)]"
      style={{
        background: "rgba(255,255,255,0.7)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(226,232,240,0.8)",
        boxShadow: "0 20px 40px rgba(25,28,30,0.04)",
      }}
    >
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-full max-w-md">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-lg">
            search
          </span>
          <input
            type="text"
            placeholder="Search ward or station..."
            className="w-full bg-surface-low rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            style={{ border: "none" }}
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4 text-slate-400">
          <NotificationBell />
          <button className="hover:text-indigo-500 transition-all">
            <span className="material-symbols-outlined">settings</span>
          </button>
          <button className="hover:text-indigo-500 transition-all">
            <span className="material-symbols-outlined">help_outline</span>
          </button>
        </div>
        <div className="h-8 w-px bg-slate-200" />
        <UserButton
          appearance={{
            elements: {
              avatarBox: "w-9 h-9",
            },
          }}
        />
      </div>
    </header>
  );
}
