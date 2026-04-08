'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const validatePassword = (pass: string) => {
    const minLen = pass.length >= 8;
    const hasUpper = /[A-Z]/.test(pass);
    const hasLower = /[a-z]/.test(pass);
    const hasNum = /\d/.test(pass);
    return minLen && hasUpper && hasLower && hasNum;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!name || !email || !password || !dateOfBirth) {
      setError('All fields are required, including Date of Birth.');
      setLoading(false);
      return;
    }

    if (!validatePassword(password)) {
      setError('Password must be at least 8 characters, with 1 uppercase, 1 lowercase letter, and 1 numeric digit.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, dateOfBirth }),
      });

      if (res.ok) {
        setSuccess('Account created. Bridging connection...');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        const errorData = await res.json();
        setError(errorData.message || 'Registration failed.');
      }
    } catch (err) {
      setError('Connection to The Loom failed.');
    }
    setLoading(false);
  };

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/dashboard' });
  };

  return (
    <div className="min-h-[100vh] flex items-center justify-center bg-[#030305] p-4 py-12 relative overflow-hidden">
      {/* Background Elements - Nebula Aurora */}
      <div className="fixed inset-0 z-0 opacity-50 mix-blend-screen pointer-events-none">
        <div className="absolute top-[10%] right-[10%] w-[60vw] h-[60vw] bg-[#9b5de5] blur-[150px] rounded-full opacity-30 animate-pulse" style={{ animationDuration: '9s' }} />
        <div className="absolute bottom-[10%] left-[10%] w-[50vw] h-[50vw] bg-[#e01a4f] blur-[150px] rounded-full opacity-20" />
        <div className="absolute top-[50%] left-[50%] w-[40vw] h-[40vw] bg-[#00f5d4] blur-[180px] rounded-full opacity-20" />
      </div>
      
      {/* Extreme Glassmorphism Register Card */}
      <div className="w-full max-w-md bg-white/[0.02] backdrop-blur-[40px] rounded-2xl p-10 relative z-10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        <div className="absolute inset-0 rounded-2xl border border-white/10 pointer-events-none" style={{ maskImage: 'linear-gradient(to bottom, white, transparent)' }} />
        <div className="absolute inset-0 rounded-2xl border border-white/5 pointer-events-none" />

        <div className="mb-10 text-center relative z-20">
          <h1 className="font-serif text-3xl text-white mb-2 tracking-tight">
            Start Your Journey
          </h1>
          <p className="font-sans text-[#b0b0c0] text-sm font-light">
            Join the community. Shape the Loom.
          </p>
        </div>

        <div className="relative z-20 mb-6">
          <button
            onClick={handleGoogleSignIn}
            className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 flex items-center justify-center transition-all duration-300 gap-3 backdrop-blur-sm"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" aria-hidden="true">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span className="text-white font-sans text-sm font-medium">Sign up with Google</span>
          </button>
        </div>

        <div className="mb-6 flex items-center justify-center space-x-4 relative z-20">
           <div className="flex-1 h-px bg-gradient-to-r from-transparent to-white/20"></div>
           <p className="text-xs text-[#b0b0c0] font-sans">or create direct link</p>
           <div className="flex-1 h-px bg-gradient-to-l from-transparent to-white/20"></div>
        </div>

        {error && (
          <div className="text-xs tracking-wider bg-white/5 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-6 text-center backdrop-blur-md">
            {error}
          </div>
        )}

        {success && (
          <div className="text-xs tracking-wider bg-white/5 border border-cyan-500/30 text-cyan-400 px-4 py-3 rounded-lg mb-6 text-center backdrop-blur-md">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 relative z-20">
          <div className="relative">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="peer w-full px-4 py-3 rounded-lg bg-transparent text-white placeholder-transparent focus:outline-none focus:ring-0 transition-all text-sm font-sans z-10 relative"
              placeholder="John Doe"
            />
            <div className="absolute inset-0 bg-white/[0.03] rounded-lg -z-10 peer-focus:bg-white/[0.06] transition-colors"></div>
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#9b5de5]/50 to-transparent scale-x-0 peer-focus:scale-x-100 transition-transform duration-500"></div>
            <label className="absolute left-4 top-3 text-[#b0b0c0] text-sm font-sans pointer-events-none transition-all peer-focus:-top-6 peer-focus:text-xs peer-focus:text-purple-400 peer-valid:-top-6 peer-valid:text-xs peer-valid:text-[#b0b0c0]">
              Full Name
            </label>
          </div>

          <div className="relative mt-10">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="peer w-full px-4 py-3 rounded-lg bg-transparent text-white placeholder-transparent focus:outline-none focus:ring-0 transition-all text-sm font-sans z-10 relative"
              placeholder="you@example.com"
            />
            <div className="absolute inset-0 bg-white/[0.03] rounded-lg -z-10 peer-focus:bg-white/[0.06] transition-colors"></div>
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent scale-x-0 peer-focus:scale-x-100 transition-transform duration-500"></div>
            <label className="absolute left-4 top-3 text-[#b0b0c0] text-sm font-sans pointer-events-none transition-all peer-focus:-top-6 peer-focus:text-xs peer-focus:text-cyan-400 peer-valid:-top-6 peer-valid:text-xs peer-valid:text-[#b0b0c0]">
              Email Address
            </label>
          </div>

          {/* Date of Birth field */}
          <div className="relative mt-10">
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              required
              title="Date of Birth"
              className="peer w-full px-4 py-3 rounded-lg bg-transparent text-white focus:outline-none focus:ring-0 transition-all text-sm font-sans z-10 relative block [color-scheme:dark] opacity-60 peer-valid:opacity-100 peer-focus:opacity-100"
            />
            <div className="absolute inset-0 bg-white/[0.03] rounded-lg -z-10 peer-focus:bg-white/[0.06] transition-colors"></div>
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#e01a4f]/50 to-transparent scale-x-0 peer-focus:scale-x-100 transition-transform duration-500"></div>
            <label className="absolute left-4 -top-6 text-xs text-[#e01a4f] text-sm font-sans pointer-events-none transition-all peer-valid:text-[#b0b0c0] peer-focus:text-[#e01a4f]">
              Date of Birth
            </label>
          </div>

          <div className="relative mt-10">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="peer w-full px-4 py-3 rounded-lg bg-transparent text-white placeholder-transparent focus:outline-none focus:ring-0 transition-all text-sm font-sans z-10 relative"
              placeholder="••••••••"
            />
            <div className="absolute inset-0 bg-white/[0.03] rounded-lg -z-10 peer-focus:bg-white/[0.06] transition-colors"></div>
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-fuchsia-500/50 to-transparent scale-x-0 peer-focus:scale-x-100 transition-transform duration-500"></div>
            <label className="absolute left-4 top-3 text-[#b0b0c0] text-sm font-sans pointer-events-none transition-all peer-focus:-top-6 peer-focus:text-xs peer-focus:text-fuchsia-400 peer-valid:-top-6 peer-valid:text-xs peer-valid:text-[#b0b0c0]">
              Password (Min 8 chars, 1 uppercase, 1 number)
            </label>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="relative group w-full"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-400 via-[#9b5de5] to-fuchsia-500 rounded-lg blur opacity-50 group-hover:opacity-100 transition duration-500"></div>
              <div className="relative w-full py-4 bg-[#030305]/80 backdrop-blur-xl rounded-lg border border-white/20 flex items-center justify-center transition-all duration-300 shadow-[inset_0_0_15px_rgba(255,255,255,0.1)] disabled:opacity-70 disabled:cursor-not-allowed">
                {loading ? (
                  <span className="tracking-widest flex items-center gap-3">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span className="text-white font-serif text-sm tracking-wider uppercase">INITIALIZING</span>
                  </span>
                ) : (
                  <span className="text-white font-serif tracking-wider text-sm font-medium uppercase">
                    Create Account
                  </span>
                )}
              </div>
            </button>
          </div>
        </form>

        <div className="mt-8 pt-6 relative text-center z-20">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4/5 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <p className="text-sm font-sans font-light text-[#b0b0c0]">
            Already registered?{' '}
            <Link
              href="/login"
              className="text-white hover:text-cyan-300 transition-colors font-medium border-b border-cyan-500/30 hover:border-cyan-400 pb-0.5"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}