"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message);
      } else {
        setError(data.message || "Failed to locate inscription.");
      }
    } catch (error) {
      console.error(error);
      setError("The weave is currently unstable.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex bg-[#0c1222] text-stone-800 font-sans selection:bg-amber-800/20 items-center justify-center p-6 relative">
      
      {/* Background World Elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a101d] via-[#101b2f] to-[#0f192b] z-0"></div>
      <div className="absolute inset-0 z-0 opacity-20 mix-blend-overlay pointer-events-none" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")'}}></div>
      
      <div className="w-full max-w-md relative z-10 p-8 sm:p-12 rounded-sm bg-[#Fdfbf7] dark:bg-[#181615] shadow-2xl border border-stone-200/60 dark:border-stone-800/40">
        
        {/* Parchment effect */}
        <div className="absolute inset-0 opacity-[0.25] dark:opacity-[0.05] pointer-events-none mix-blend-multiply" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")'}}></div>

        <div className="relative z-10">
          <div className="mb-10 text-center">
            <h1 className="font-serif text-3xl text-stone-800 dark:text-stone-200 mb-3">Lost Your Place?</h1>
            <p className="text-stone-500 dark:text-stone-400 font-serif italic text-sm">Provide the parchment containing your inscribed email.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-sm bg-[#fff0ed] dark:bg-[#3d1810] border border-[#f5d6cc] dark:border-[#522b22] text-[#803120] dark:text-[#f2afa1] text-sm">
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="mb-6 p-4 rounded-sm bg-[#eefaf4] dark:bg-[#113123] border border-[#c3eed8] dark:border-[#1d523b] text-[#216d47] dark:text-[#76ce9f] text-sm">
              <span>{message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="relative group">
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="peer w-full bg-transparent border-b border-stone-300 dark:border-stone-700 px-2 pt-6 pb-2 text-stone-800 dark:text-stone-200 placeholder-transparent focus:outline-none focus:border-amber-700 transition-colors duration-300 rounded-none shadow-none"
                placeholder="you@example.com"
              />
              <label 
                htmlFor="email" 
                className="absolute left-2 top-4 text-stone-400 dark:text-stone-500 font-serif transition-all duration-300 pointer-events-none peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-0 peer-focus:text-xs peer-focus:text-amber-700 peer-valid:top-0 peer-valid:text-xs peer-valid:text-stone-500"
              >
                Inscribed Email Address
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !!message}
              className="w-full relative group overflow-hidden rounded-sm disabled:opacity-70 transition-all duration-300 transform active:scale-95 bg-[#C66743] hover:bg-[#Af5533] dark:bg-[#974d2f] shadow-md border border-white/10"
            >
              <div className="relative flex items-center justify-center py-3.5 px-4">
                {loading ? (
                  <span className="text-amber-50 font-serif opacity-70">Seeking the raven...</span>
                ) : (
                  <span className="text-amber-50 font-serif tracking-wide text-lg">Dispatch Request</span>
                )}
              </div>
            </button>
          </form>

          <div className="mt-8 text-center">
            <Link
              href="/login"
              className="text-sm text-amber-700 dark:text-amber-500 hover:text-amber-800 dark:hover:text-amber-400 font-serif border-b border-transparent hover:border-amber-700 pb-0.5 italic transition-colors"
            >
              Wait, I remember my path
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}