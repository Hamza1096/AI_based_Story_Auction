"use client";

import { signOut, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Story {
  _id: string;
  title: string;
  genre: string;
  description: string;
  rules: string[];
  status: "active" | "completed" | "paused";
  chapterCount: number;
  participantCount: number;
  createdAt: string;
}

// ─── Genre accent colours ─────────────────────────────────────────────────────

const GENRE_COLOURS: Record<string, { bg: string; text: string; border: string }> = {
  Fantasy:              { bg: "bg-violet-500/10", text: "text-violet-300", border: "border-violet-500/20" },
  "Science Fiction":    { bg: "bg-cyan-500/10",   text: "text-cyan-300",   border: "border-cyan-500/20" },
  Mystery:              { bg: "bg-yellow-500/10", text: "text-yellow-300", border: "border-yellow-500/20" },
  Romance:              { bg: "bg-pink-500/10",   text: "text-pink-300",   border: "border-pink-500/20" },
  Horror:               { bg: "bg-red-500/10",    text: "text-red-300",    border: "border-red-500/20" },
  Thriller:             { bg: "bg-orange-500/10", text: "text-orange-300", border: "border-orange-500/20" },
  Adventure:            { bg: "bg-green-500/10",  text: "text-green-300",  border: "border-green-500/20" },
  "Historical Fiction": { bg: "bg-amber-500/10",  text: "text-amber-300",  border: "border-amber-500/20" },
  Comedy:               { bg: "bg-lime-500/10",   text: "text-lime-300",   border: "border-lime-500/20" },
  Drama:                { bg: "bg-indigo-500/10", text: "text-indigo-300", border: "border-indigo-500/20" },
  Other:                { bg: "bg-stone-500/10",  text: "text-stone-300",  border: "border-stone-500/20" },
};

const STATUS_CONFIG = {
  active:    { label: "Active",    dot: "bg-emerald-400", text: "text-emerald-400" },
  paused:    { label: "Paused",    dot: "bg-yellow-400",  text: "text-yellow-400" },
  completed: { label: "Completed", dot: "bg-stone-400",   text: "text-stone-400" },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function getInitials(name?: string | null): string {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

// ─── Story Card ───────────────────────────────────────────────────────────────

function StoryCard({ story }: { story: Story }) {
  const genre    = GENRE_COLOURS[story.genre] ?? GENRE_COLOURS.Other;
  const statusCfg = STATUS_CONFIG[story.status];

  return (
    <article className="group relative flex flex-col bg-white/[0.03] hover:bg-white/[0.055] border border-white/8 hover:border-white/15 rounded-xl p-5 transition-all duration-200 cursor-pointer overflow-hidden">
      {/* Subtle hover glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gradient-to-br from-amber-600/3 to-transparent rounded-xl" />

      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${genre.bg} ${genre.text} ${genre.border}`}>
            {story.genre}
          </span>
          <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${statusCfg.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
            {statusCfg.label}
          </span>
        </div>
        <span className="text-[11px] text-stone-600 shrink-0 mt-0.5">{timeAgo(story.createdAt)}</span>
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold text-stone-100 group-hover:text-amber-100 transition-colors mb-1.5 leading-snug line-clamp-2">
        {story.title}
      </h3>

      {/* Description */}
      <p className="text-xs text-stone-500 leading-relaxed line-clamp-3 mb-4 flex-1">
        {story.description}
      </p>

      {/* Rules preview */}
      {story.rules.length > 0 && (
        <div className="mb-4 flex items-center gap-2">
          <svg className="w-3 h-3 text-stone-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span className="text-[11px] text-stone-600">{story.rules.length} rule{story.rules.length !== 1 ? "s" : ""}</span>
        </div>
      )}

      {/* Footer stats */}
      <div className="flex items-center gap-4 pt-3 border-t border-white/5">
        <span className="flex items-center gap-1.5 text-[11px] text-stone-600">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          {story.chapterCount} chapter{story.chapterCount !== 1 ? "s" : ""}
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-stone-600">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
          </svg>
          {story.participantCount} participant{story.participantCount !== 1 ? "s" : ""}
        </span>
      </div>
    </article>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyStories() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-5">
        <svg className="w-7 h-7 text-amber-500/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      </div>
      <h3 className="text-base font-medium text-stone-300 mb-1.5">No stories yet</h3>
      <p className="text-sm text-stone-500 mb-6 max-w-xs">
        Your world-building journey starts here. Create your first story and invite others to shape its destiny.
      </p>
      <Link
        href="/dashboard/create-story"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-amber-50 text-sm font-medium transition-all active:scale-[0.98] shadow-lg shadow-amber-900/20"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Create your first story
      </Link>
    </div>
  );
}

// ─── Dashboard inner (uses useSearchParams) ───────────────────────────────────

function DashboardInner() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [stories, setStories]       = useState<Story[]>([]);
  const [loadingStories, setLoadingStories] = useState(true);
  const [successBanner, setSuccessBanner]   = useState(false);

  // Auth guard
  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
    if (status === "authenticated" && session?.user?.role === "ADMIN") router.replace("/admin");
  }, [status, session, router]);

  // Show banner after successful story creation
  useEffect(() => {
    if (searchParams.get("created") === "true") {
      setSuccessBanner(true);
      const t = setTimeout(() => setSuccessBanner(false), 5000);
      return () => clearTimeout(t);
    }
  }, [searchParams]);

  // Fetch stories
  useEffect(() => {
    if (status !== "authenticated") return;

    (async () => {
      try {
        const res = await fetch("/api/stories?mine=true");
        if (res.ok) {
          const data = await res.json();
          setStories(data.stories ?? []);
        }
      } catch {
        // silently fail — empty state will show
      } finally {
        setLoadingStories(false);
      }
    })();
  }, [status]);

  // ─── Loading skeleton ─────────────────────────────────────────────────────
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) return null;

  const activeCount    = stories.filter((s) => s.status === "active").length;
  const completedCount = stories.filter((s) => s.status === "completed").length;

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-stone-200">
      {/* Ambient glows */}
      <div className="fixed top-0 left-[15%] w-[600px] h-[400px] bg-amber-700/4 blur-[140px] rounded-full pointer-events-none z-0" />
      <div className="fixed bottom-0 right-[10%] w-[400px] h-[400px] bg-teal-700/4 blur-[120px] rounded-full pointer-events-none z-0" />

      {/* ── Top navigation bar ── */}
      <header className="relative z-20 border-b border-white/5 bg-[#0c1220]/80 backdrop-blur-sm sticky top-0">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-lg bg-amber-600/20 border border-amber-500/30 flex items-center justify-center group-hover:border-amber-500/50 transition-colors">
              <svg className="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span className="text-sm font-serif text-amber-100/80 group-hover:text-amber-100 transition-colors hidden sm:block">
              The Astral Loom
            </span>
          </Link>

          {/* Nav links */}
          <nav className="flex items-center gap-1 text-sm">
            <span className="px-3 py-1.5 rounded-lg text-amber-300 bg-amber-500/10 font-medium text-xs">
              Dashboard
            </span>
            <Link href="/stories" className="px-3 py-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-white/5 text-xs transition-all">
              Browse Stories
            </Link>
          </nav>

          {/* Right: user + wallet + signout */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/8">
              <svg className="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <span className="text-xs font-medium text-amber-200">0 coins</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-[11px] font-bold text-white shadow-md">
                {getInitials(session.user?.name)}
              </div>
              <span className="hidden md:block text-xs text-stone-400 max-w-[100px] truncate">
                {session.user?.name}
              </span>
            </div>

            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-stone-500 hover:text-red-400 hover:bg-red-400/8 transition-all text-xs"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:block">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-10">

        {/* Success banner */}
        {successBanner && (
          <div className="mb-8 flex items-center gap-3 px-5 py-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm animate-[fadeIn_0.3s_ease]">
            <svg className="w-5 h-5 shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              <strong className="font-semibold">Story created!</strong> It&apos;s now live and visible to all users.
            </span>
            <button onClick={() => setSuccessBanner(false)} className="ml-auto text-emerald-500 hover:text-emerald-300 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* ── Welcome header ── */}
        <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <p className="text-xs text-amber-500/70 uppercase tracking-widest font-medium mb-1">
              Author Workspace
            </p>
            <h1 className="text-2xl md:text-3xl font-serif text-amber-50">
              Welcome back, {session.user?.name?.split(" ")[0] ?? "Author"}.
            </h1>
            <p className="text-stone-500 text-sm mt-1">
              Continue weaving your worlds or start a new chapter.
            </p>
          </div>

          <Link
            href="/dashboard/create-story"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-amber-50 font-medium text-sm transition-all active:scale-[0.97] shadow-lg shadow-amber-900/25 shrink-0 self-start sm:self-auto"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Create Story
          </Link>
        </div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {[
            {
              label: "My Stories",
              value: stories.length,
              icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              ),
              accent: "text-amber-400",
              hint: "total stories authored",
            },
            {
              label: "Active",
              value: activeCount,
              icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              ),
              accent: "text-emerald-400",
              hint: "in progress",
            },
            {
              label: "Completed",
              value: completedCount,
              icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
              accent: "text-stone-400",
              hint: "finished tales",
            },
            {
              label: "Wallet",
              value: "0",
              icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              ),
              accent: "text-teal-400",
              hint: "bid coins",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="relative overflow-hidden bg-white/[0.03] border border-white/8 rounded-xl p-4"
            >
              <div className={`flex items-center gap-2 mb-3 ${stat.accent}`}>
                {stat.icon}
                <span className="text-xs font-medium text-stone-400">{stat.label}</span>
              </div>
              <div className={`text-2xl font-bold ${stat.accent}`}>{stat.value}</div>
              <div className="text-[11px] text-stone-600 mt-0.5">{stat.hint}</div>
            </div>
          ))}
        </div>

        {/* ── My Stories section ── */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-stone-200 flex items-center gap-2">
              <span>My Stories</span>
              {stories.length > 0 && (
                <span className="text-xs font-normal text-stone-600 bg-white/5 border border-white/8 px-2 py-0.5 rounded-full">
                  {stories.length}
                </span>
              )}
            </h2>
          </div>

          {loadingStories ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="bg-white/[0.03] border border-white/8 rounded-xl p-5 animate-pulse"
                >
                  <div className="h-3 bg-white/5 rounded-full w-1/3 mb-4" />
                  <div className="h-4 bg-white/5 rounded-full w-3/4 mb-2" />
                  <div className="h-3 bg-white/5 rounded-full w-full mb-1.5" />
                  <div className="h-3 bg-white/5 rounded-full w-5/6 mb-6" />
                  <div className="h-3 bg-white/5 rounded-full w-1/2" />
                </div>
              ))}
            </div>
          ) : stories.length === 0 ? (
            <EmptyStories />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {stories.map((story) => (
                <StoryCard key={story._id} story={story} />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Inline keyframe for banner */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ─── Page (Suspense boundary for useSearchParams) ─────────────────────────────

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-400 rounded-full animate-spin" />
        </div>
      }
    >
      <DashboardInner />
    </Suspense>
  );
}