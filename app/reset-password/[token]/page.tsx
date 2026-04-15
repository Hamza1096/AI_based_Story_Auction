"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Your forged phrases do not match.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/auth/reset-password/${token}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(data.message + " Redirecting...");
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } else {
        setError(data.message);
      }
    } catch (error) {
      console.error(error);
      setError("The weave is currently unstable. Try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex bg-[#0c1222] text-stone-800 font-sans selection:bg-amber-800/20 items-center justify-center p-6 relative">
      
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a101d] via-[#101b2f] to-[#0f192b] z-0"></div>
      <div className="absolute inset-0 z-0 opacity-20 mix-blend-overlay pointer-events-none" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")'}}></div>
      
      <div className="w-full max-w-md relative z-10 p-8 sm:p-12 rounded-sm bg-[#181615] shadow-2xl border border-stone-800/40">
        
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-multiply" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")'}}></div>

        <div className="relative z-10">
          <div className="mb-10 text-center">
            <h1 className="font-serif text-3xl text-stone-200 mb-3">Forge a New Phrase</h1>
            <p className="text-stone-400 font-serif italic text-sm">Seal your new destiny below.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-sm bg-[#3d1810] border border-[#522b22] text-[#f2afa1] text-sm">
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 rounded-sm bg-[#eefaf4]  border border-[#c3eed8] dark:border-[#1d523b] text-[#76ce9f] text-sm">
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="relative group">
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="peer w-full bg-transparent border-b border-stone-700 px-2 pt-6 pb-2 text-stone-200 placeholder-transparent focus:outline-none focus:border-amber-700 transition-colors duration-300 rounded-none shadow-none"
                placeholder="••••••••"
              />
              <label 
                htmlFor="password" 
                className="absolute left-2 top-4 text-stone-500 font-serif transition-all duration-300 pointer-events-none peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-0 peer-focus:text-xs peer-focus:text-amber-700 peer-valid:top-0 peer-valid:text-xs peer-valid:text-stone-500"
              >
                New Secret Phrase
              </label>
            </div>

            <div className="relative group">
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="peer w-full bg-transparent border-b border-stone-700 px-2 pt-6 pb-2 text-stone-200 placeholder-transparent focus:outline-none focus:border-amber-700 transition-colors duration-300 rounded-none shadow-none"
                placeholder="••••••••"
              />
              <label 
                htmlFor="confirmPassword" 
                className="absolute left-2 top-4 text-stone-500 font-serif transition-all duration-300 pointer-events-none peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-0 peer-focus:text-xs peer-focus:text-amber-700 peer-valid:top-0 peer-valid:text-xs peer-valid:text-stone-500"
              >
                Confirm Secret Phrase
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !!success}
              className="w-full relative group overflow-hidden rounded-sm disabled:opacity-70 transition-all duration-300 transform active:scale-95 bg-[#C66743] hover:bg-[#Af5533]  shadow-md border border-white/10"
            >
              <div className="relative flex items-center justify-center py-3.5 px-4">
                {loading ? (
                  <span className="text-amber-50 font-serif opacity-70">Forging...</span>
                ) : (
                  <span className="text-amber-50 font-serif tracking-wide text-lg">Seal the Phrase</span>
                )}
              </div>
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}