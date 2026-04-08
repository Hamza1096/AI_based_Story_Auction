"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const GENRES = [
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

const GENRE_ICONS: Record<string, string> = {
  Fantasy: "🧙",
  "Science Fiction": "🚀",
  Mystery: "🔍",
  Romance: "💫",
  Horror: "🕯️",
  Thriller: "⚡",
  Adventure: "🗺️",
  "Historical Fiction": "📜",
  Comedy: "🎭",
  Drama: "🎬",
  Other: "✨",
};

export default function CreateStoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [description, setDescription] = useState("");
  const [rules, setRules] = useState<string[]>([""]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // --- Redirect if not authenticated ---
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f1a]">
        <div className="w-8 h-8 border-2 border-amber-500/40 border-t-amber-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.replace("/login");
    return null;
  }

  // --- Rule helpers ---
  const addRule = () => {
    if (rules.length < 10) setRules([...rules, ""]);
  };

  const updateRule = (index: number, value: string) => {
    const updated = [...rules];
    updated[index] = value;
    setRules(updated);
  };

  const removeRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  // --- Submit ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleanedRules = rules.map((r) => r.trim()).filter(Boolean);

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          genre,
          description: description.trim(),
          rules: cleanedRules,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      router.push("/dashboard?created=true");
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const titleLength = title.length;
  const descLength = description.length;

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-stone-200">
      {/* Ambient glows */}
      <div className="fixed top-[-10%] left-[-5%] w-[500px] h-[500px] bg-amber-600/5 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-5%] w-[400px] h-[400px] bg-teal-600/5 blur-[100px] rounded-full pointer-events-none z-0" />

      {/* Top bar */}
      <header className="relative z-10 border-b border-white/5 bg-[#0c1220]/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-stone-400 hover:text-amber-300 transition-colors text-sm group"
          >
            <svg
              className="w-4 h-4 transition-transform group-hover:-translate-x-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Dashboard
          </Link>
          <span className="text-white/10">/</span>
          <span className="text-stone-300 text-sm font-medium">Create Story</span>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 max-w-3xl mx-auto px-6 py-12">
        {/* Page heading */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium mb-4 uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            New Story
          </div>
          <h1 className="text-3xl md:text-4xl font-serif text-amber-50 mb-2 leading-snug">
            Begin a New Tale
          </h1>
          <p className="text-stone-400 text-sm leading-relaxed max-w-lg">
            Set the stage for your collaborative story. Once created, readers will see your story and can weave the narrative forward with you.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Title */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-stone-300" htmlFor="story-title">
              Title <span className="text-amber-500">*</span>
            </label>
            <div className="relative">
              <input
                id="story-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
                placeholder="Give your story a compelling name…"
                required
                className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-4 py-3.5 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all text-sm"
              />
              <span
                className={`absolute right-3 bottom-3 text-xs ${
                  titleLength > 100 ? "text-amber-400" : "text-stone-600"
                }`}
              >
                {titleLength}/120
              </span>
            </div>
          </div>

          {/* Genre */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-stone-300">
              Genre <span className="text-amber-500">*</span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
              {GENRES.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGenre(g)}
                  className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-lg border text-xs font-medium transition-all ${
                    genre === g
                      ? "bg-amber-500/15 border-amber-500/50 text-amber-300"
                      : "bg-white/[0.03] border-white/8 text-stone-400 hover:border-white/20 hover:text-stone-200 hover:bg-white/[0.05]"
                  }`}
                >
                  <span className="text-lg">{GENRE_ICONS[g]}</span>
                  <span className="leading-tight text-center">{g}</span>
                </button>
              ))}
            </div>
            {/* Hidden required input to trigger native validation */}
            <input
              type="text"
              value={genre}
              required
              readOnly
              className="sr-only"
              aria-hidden="true"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="flex items-start justify-between">
              <label className="block text-sm font-medium text-stone-300" htmlFor="story-description">
                Description <span className="text-amber-500">*</span>
              </label>
              <span className="text-xs text-amber-600/80 flex items-center gap-1 mt-0.5">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Cannot be edited after creation
              </span>
            </div>
            <div className="relative">
              <textarea
                id="story-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                minLength={20}
                placeholder="Describe the world, the setting, and the premise of your story. Be compelling — this is what draws readers in…"
                required
                className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-4 py-3.5 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all text-sm resize-none leading-relaxed"
              />
              <span
                className={`absolute right-3 bottom-3 text-xs ${
                  descLength < 20 && descLength > 0 ? "text-red-400" : "text-stone-600"
                }`}
              >
                {descLength} chars{descLength < 20 && descLength > 0 ? ` (${20 - descLength} more)` : ""}
              </span>
            </div>
          </div>

          {/* Rules */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-stone-300">
                  Story Rules
                  <span className="ml-2 text-xs text-stone-500 font-normal">(optional, up to 10)</span>
                </label>
                <p className="text-xs text-stone-500 mt-0.5">
                  Define constraints for participants — e.g., "No time travel" or "Stay in the Victorian era."
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              {rules.map((rule, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-amber-600/60 text-xs font-mono w-5 text-right shrink-0">
                    {index + 1}.
                  </span>
                  <input
                    type="text"
                    value={rule}
                    onChange={(e) => updateRule(index, e.target.value)}
                    placeholder={`Rule ${index + 1}…`}
                    maxLength={200}
                    className="flex-1 bg-white/[0.04] border border-white/10 rounded-lg px-4 py-2.5 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all text-sm"
                  />
                  {rules.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRule(index)}
                      className="shrink-0 p-2 rounded-lg text-stone-500 hover:text-red-400 hover:bg-red-400/10 transition-all"
                      aria-label="Remove rule"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>

            {rules.length < 10 && (
              <button
                type="button"
                onClick={addRule}
                className="inline-flex items-center gap-2 text-sm text-stone-400 hover:text-amber-300 transition-colors mt-1 group"
              >
                <span className="w-5 h-5 rounded-md border border-dashed border-stone-600 group-hover:border-amber-500/50 flex items-center justify-center transition-colors">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </span>
                Add another rule
              </button>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {/* Divider */}
          <div className="h-px bg-white/5" />

          {/* Actions */}
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/dashboard"
              className="px-5 py-2.5 rounded-lg border border-white/10 text-stone-400 hover:text-stone-200 hover:border-white/20 text-sm transition-all"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={isSubmitting || !genre}
              className="relative overflow-hidden px-8 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:bg-stone-700 disabled:text-stone-500 text-amber-50 font-medium text-sm transition-all active:scale-[0.98] disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-amber-900/20"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-amber-300/40 border-t-amber-200 rounded-full animate-spin" />
                  Creating…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Create Story
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
