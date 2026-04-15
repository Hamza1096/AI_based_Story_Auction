"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Story {
  _id: string;
  title: string;
  genre: string;
  description: string;
  rules: string[];
  authorName: string;
  status: "active" | "completed" | "paused";
  chapterCount: number;
  participantCount: number;
  createdAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const GENRES = [
  "All",
  "Fantasy",
  "Science Fiction",
  "Mystery",
  "Romance",
  "Horror",
  "Thriller",
  "Adventure",
  "Historical Fiction",
  "Comedy",
  "Drama",
  "Other",
];

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

// ─── Story Card ───────────────────────────────────────────────────────────────

function StoryCard({ story }: { story: Story }) {
  const genre     = GENRE_COLOURS[story.genre] ?? GENRE_COLOURS.Other;
  const statusCfg = STATUS_CONFIG[story.status];

  return (
    <Link href={`/stories/${story._id}`} className="block h-full cursor-pointer">
      <article className="group h-full relative flex flex-col bg-white/[0.03] hover:bg-white/[0.055] border border-white/8 hover:border-white/15 rounded-xl p-5 transition-all duration-200 overflow-hidden">
        {/* Hover glow */}
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
        <h2 className="text-base font-semibold text-stone-100 group-hover:text-amber-100 transition-colors mb-1.5 leading-snug line-clamp-2">
          {story.title}
        </h2>

        {/* Description */}
        <p className="text-xs text-stone-500 leading-relaxed line-clamp-3 mb-4 flex-1">
          {story.description}
        </p>

        {/* Rules */}
        {story.rules.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {story.rules.slice(0, 2).map((rule, i) => (
              <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] bg-white/[0.04] border border-white/8 text-stone-500">
                {rule.length > 32 ? rule.slice(0, 32) + "…" : rule}
              </span>
            ))}
            {story.rules.length > 2 && (
              <span className="text-[10px] text-stone-600">+{story.rules.length - 2} more</span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          {/* Author */}
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-[9px] font-bold text-white shrink-0">
              {getInitials(story.authorName)}
            </div>
            <span className="text-[11px] text-stone-500 max-w-[100px] truncate">{story.authorName}</span>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-[11px] text-stone-600">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              {story.chapterCount}
            </span>
            <span className="flex items-center gap-1 text-[11px] text-stone-600">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
              </svg>
              {story.participantCount}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-5">
        <svg className="w-7 h-7 text-amber-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      </div>
      <h3 className="text-base font-medium text-stone-300 mb-1.5">
        {filtered ? "No stories in this genre yet" : "No stories yet"}
      </h3>
      <p className="text-sm text-stone-500 mb-6 max-w-xs">
        {filtered
          ? "Try a different genre filter, or be the first to write one!"
          : "The library is empty. Be the first author to start a story."}
      </p>
      <Link
        href="/dashboard/create-story"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-amber-50 text-sm font-medium transition-all active:scale-[0.98] shadow-lg shadow-amber-900/20"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Write a Story
      </Link>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BrowseStoriesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [stories, setStories]           = useState<Story[]>([]);
  const [loading, setLoading]           = useState(true);
  const [activeGenre, setActiveGenre]   = useState("All");
  const [search, setSearch]             = useState("");

  // Auth guard
  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  // Fetch ALL stories (no ?mine filter)
  useEffect(() => {
    if (status !== "authenticated") return;
    (async () => {
      try {
        const res = await fetch("/api/stories");
        if (res.ok) {
          const data = await res.json();
          setStories(data.stories ?? []);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [status]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) return null;

  // ── Client-side filtering ─────────────────────────────────────────────────
  const filtered = stories.filter((s) => {
    const matchesGenre = activeGenre === "All" || s.genre === activeGenre;
    const matchesSearch =
      search.trim() === "" ||
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.authorName.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase());
    return matchesGenre && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-stone-200">
      {/* Ambient glows */}
      <div className="fixed top-0 left-[15%] w-[600px] h-[400px] bg-amber-700/4 blur-[140px] rounded-full pointer-events-none z-0" />
      <div className="fixed bottom-0 right-[10%] w-[400px] h-[400px] bg-teal-700/4 blur-[120px] rounded-full pointer-events-none z-0" />

      {/* ── Navbar ── */}
      <Navbar />

      {/* ── Main ── */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-10">

        {/* Page heading */}
        <div className="mb-8">
          <p className="text-xs text-amber-500/70 uppercase tracking-widest font-medium mb-1">Community Library</p>
          <h1 className="text-2xl md:text-3xl font-serif text-amber-50 mb-1">Browse Stories</h1>
          <p className="text-stone-500 text-sm">
            Explore {stories.length} tale{stories.length !== 1 ? "s" : ""} crafted by the community.
          </p>
        </div>

        {/* ── Search + Genre filters ── */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-600 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by title, author…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/10 rounded-lg pl-9 pr-4 py-2.5 text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/15 text-sm transition-all"
            />
          </div>
        </div>

        {/* Genre pills */}
        <div className="flex flex-wrap gap-2 mb-8">
          {GENRES.map((g) => (
            <button
              key={g}
              onClick={() => setActiveGenre(g)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                activeGenre === g
                  ? "bg-amber-500/15 border-amber-500/40 text-amber-300"
                  : "bg-white/[0.03] border-white/8 text-stone-500 hover:text-stone-200 hover:border-white/20"
              }`}
            >
              {g}
              {g !== "All" && (
                <span className="ml-1.5 text-[10px] opacity-60">
                  {stories.filter((s) => s.genre === g).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Stories grid ── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="bg-white/[0.03] border border-white/8 rounded-xl p-5 animate-pulse">
                <div className="h-3 bg-white/5 rounded-full w-1/3 mb-4" />
                <div className="h-4 bg-white/5 rounded-full w-3/4 mb-2" />
                <div className="h-3 bg-white/5 rounded-full w-full mb-1.5" />
                <div className="h-3 bg-white/5 rounded-full w-5/6 mb-6" />
                <div className="h-3 bg-white/5 rounded-full w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.length === 0 ? (
              <EmptyState filtered={activeGenre !== "All" || search.trim() !== ""} />
            ) : (
              filtered.map((story) => <StoryCard key={story._id} story={story} />)
            )}
          </div>
        )}

        {/* Result count */}
        {!loading && filtered.length > 0 && (
          <p className="mt-8 text-center text-xs text-stone-600">
            Showing {filtered.length} of {stories.length} {stories.length === 1 ? "story" : "stories"}
          </p>
        )}
      </main>
    </div>
  );
}
