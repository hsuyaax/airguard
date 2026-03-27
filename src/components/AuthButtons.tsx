"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";

export function NavAuthButton() {
  const { isSignedIn } = useAuth();
  return isSignedIn ? (
    <Link href="/dashboard" className="text-white px-6 py-2.5 rounded-xl font-medium text-sm hover:opacity-90 transition-all active:scale-95" style={{ background: "linear-gradient(135deg, #3525cd 0%, #4f46e5 100%)" }}>
      Open Dashboard
    </Link>
  ) : (
    <Link href="/sign-in" className="text-white px-6 py-2.5 rounded-xl font-medium text-sm hover:opacity-90 transition-all active:scale-95" style={{ background: "linear-gradient(135deg, #3525cd 0%, #4f46e5 100%)" }}>
      Get Started
    </Link>
  );
}

export function HeroAuthButtons() {
  const { isSignedIn } = useAuth();
  return (
    <div className="flex gap-4">
      <Link
        href={isSignedIn ? "/dashboard" : "/sign-up"}
        className="text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all active:scale-95"
        style={{ background: "linear-gradient(135deg, #3525cd 0%, #4f46e5 100%)" }}
      >
        Launch Monitoring Deck
      </Link>
      <Link href="#sensors" className="bg-surface-low text-primary px-8 py-4 rounded-xl font-semibold hover:bg-surface-high transition-colors">
        View Station Network
      </Link>
    </div>
  );
}

export function CtaAuthButtons() {
  const { isSignedIn } = useAuth();
  return (
    <div className="flex flex-col md:flex-row justify-center gap-6">
      <Link
        href={isSignedIn ? "/dashboard" : "/sign-up"}
        className="bg-primary text-white px-10 py-5 rounded-xl font-bold text-lg hover:shadow-xl hover:shadow-primary/20 transition-all active:scale-95"
      >
        Open Citizen Dashboard
      </Link>
      {!isSignedIn && (
        <Link
          href="/sign-in"
          className="bg-transparent text-on-surface px-10 py-5 rounded-xl font-bold text-lg hover:bg-white transition-all active:scale-95"
          style={{ border: "1px solid #777587" }}
        >
          MCD Admin Login
        </Link>
      )}
    </div>
  );
}
