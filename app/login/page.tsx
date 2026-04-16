'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError('Authentication failed. Invalid credentials.');
        setLoading(false);
        return;
      }

      router.replace('/dashboard');
    } catch (error) {
      setError('Connection to The Loom failed.');
    }
    setLoading(false);
  };

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/dashboard' });
  };

  return (
    <div className="min-h-screen flex bg-[#0c1222] text-stone-800 font-sans selection:bg-amber-800/20">
      
      {/* LEFT SIDE - Narrative World */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-center p-16 overflow-hidden bg-gradient-to-b from-[#0a101d] via-[#101b2f] to-[#0f192b]">
        
        {/* Soft Starry Texture / Grain overlay */}
        <div className="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")'}}></div>
        
        {/* Ambient Teal & Amber soft glows */}
        <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-[#0d3b45]/30 blur-[150px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] bg-[#5a3014]/30 blur-[120px] rounded-full pointer-events-none"></div>

        {/* Decorative Forest SVG at Bottom */}
        <svg className="absolute bottom-0 left-0 w-full h-[35%] text-[#070a13] opacity-90 pointer-events-none" preserveAspectRatio="none" viewBox="0 0 1440 320" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path fillOpacity="1" d="M0,288L48,272C96,256,192,224,288,213.3C384,203,480,213,576,234.7C672,256,768,288,864,282.7C960,277,1056,240,1152,224C1248,208,1344,213,1392,218.7L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>

        {/* Floating particles */}
        <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
          <div className="absolute top-1/3 left-1/4 w-1 h-1 bg-amber-200/60 rounded-full animate-[fadeFloat_16s_ease-in-out_infinite_1s]"></div>
          <div className="absolute top-2/3 left-2/3 w-1.5 h-1.5 bg-amber-100/40 rounded-full animate-[fadeFloat_20s_ease-in-out_infinite_6s]"></div>
          <div className="absolute top-1/2 left-4/5 w-2 h-2 bg-amber-300/30 blur-[1px] rounded-full animate-[fadeFloat_18s_ease-in-out_infinite_11s]"></div>
        </div>

        {/* Story Quotes */}
        <div className="relative z-20 max-w-xl mx-auto text-center space-y-10">
          <p className="text-amber-50 font-serif italic text-2xl md:text-3xl leading-relaxed tracking-wide shadow-sm opacity-90">
            &quot;Every story begins with a choice. Which path will you weave?&quot;
          </p>
          <div className="w-16 h-px bg-amber-700/50 mx-auto"></div>
          <div className="text-teal-100/60 font-serif tracking-widest text-sm uppercase">AI-Auction Platform</div>
        </div>
      </div>

      {/* RIGHT SIDE - The Book Page (Auth Form) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative bg-[#f8f9fa] dark:bg-[#181615] transition-colors duration-500">
        
        {/* Subtle inner parchment texture */}
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-multiply" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")'}}></div>

        <div className="w-full max-w-md relative z-10 p-8 sm:p-12 rounded-sm bg-white border border-stone-200 shadow-sm dark:bg-black/20 dark:shadow-none dark:border-stone-800/40">
          
          <div className="mb-10 text-center">
            <h1 className="font-serif text-3xl text-stone-900 dark:text-stone-200 mb-3">Return to Your Story</h1>
            <p className="text-stone-700 dark:text-stone-400 font-serif italic">Turn the page to continue your journey.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-sm bg-[#3d1810] border border-[#522b22] text-[#f2afa1] text-sm flex items-start gap-3">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Minimal Input - Email */}
            <div className="relative group">
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="peer w-full bg-transparent border-b border-stone-400 dark:border-stone-700 px-2 pt-6 pb-2 text-stone-900 dark:text-stone-200 placeholder-transparent focus:outline-none focus:border-amber-700 transition-colors duration-300 rounded-none shadow-none"
                placeholder="you@example.com"
              />
              <label 
                htmlFor="email" 
                className="absolute left-2 top-4 text-stone-700 dark:text-stone-500 font-serif transition-all duration-300 pointer-events-none peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-0 peer-focus:text-xs peer-focus:text-amber-700 peer-valid:top-0 peer-valid:text-xs peer-valid:text-stone-700 dark:peer-valid:text-stone-500"
              >
                Inscribed Email Address
              </label>
            </div>

            {/* Minimal Input - Password */}
            <div className="relative group">
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="peer w-full bg-transparent border-b border-stone-400 dark:border-stone-700 px-2 pt-6 pb-2 text-stone-900 dark:text-stone-200 placeholder-transparent focus:outline-none focus:border-amber-700 transition-colors duration-300 rounded-none shadow-none"
                placeholder="••••••••"
              />
              <label 
                htmlFor="password" 
                className="absolute left-2 top-4 text-stone-700 dark:text-stone-500 font-serif transition-all duration-300 pointer-events-none peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-0 peer-focus:text-xs peer-focus:text-amber-700 peer-valid:top-0 peer-valid:text-xs peer-valid:text-stone-700 dark:peer-valid:text-stone-500"
              >
                Secret Phrase
              </label>
            </div>

            <div className="flex justify-end pt-1 pb-4">
              <Link href="/forgot-password" className="text-xs text-stone-700 dark:text-stone-500 hover:text-amber-500 transition-colors font-serif italic">
                Lost your place?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full relative group overflow-hidden rounded-sm disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300 transform active:scale-95 bg-[#974d2f] hover:bg-[#854024] shadow-md hover:shadow-lg border border-white/10"
            >
              <div className="relative flex items-center justify-center py-3.5 px-4">
                {loading ? (
                  <svg className="animate-spin h-5 w-5 text-white/80" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <span className="text-amber-50 font-serif tracking-wide text-lg">Step Into the Narrative</span>
                )}
              </div>
            </button>
          </form>

          <div className="mt-8 flex items-center justify-center space-x-4">
            <div className="flex-1 h-px bg-stone-300 dark:bg-stone-800"></div>
            <p className="text-xs text-stone-700 dark:text-stone-600 uppercase tracking-widest font-serif">or</p>
            <div className="flex-1 h-px bg-stone-300 dark:bg-stone-800"></div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleGoogleSignIn}
              className="w-full py-3.5 bg-stone-100 hover:bg-stone-200 dark:bg-[#1f1d1c] dark:hover:bg-[#252220] rounded-sm border border-stone-300 dark:border-stone-700 flex items-center justify-center transition-all duration-300 gap-3 shadow-sm hover:shadow active:scale-95"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-stone-800 dark:text-stone-300" aria-hidden="true">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span className="text-stone-900 dark:text-stone-300 font-serif text-md tracking-wide">Continue with Google</span>
            </button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-stone-700 dark:text-stone-500 font-serif">
              Your tale hasn&apos;t begun? <Link
                href="/register"
                className="text-amber-500 hover:text-amber-400 transition-colors border-b border-transparent hover:border-amber-500 pb-0.5 italic"
              >
                Start a new story
              </Link>
            </p>
          </div>

        </div>
      </div>
      
      {/* Define global animations for floating text */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeFloat {
          0% { opacity: 0; transform: translateY(10px); }
          20% { opacity: 0.6; transform: translateY(0); }
          80% { opacity: 0.6; transform: translateY(-10px); }
          100% { opacity: 0; transform: translateY(-20px); }
        }
      `}} />
    </div>
  );
}