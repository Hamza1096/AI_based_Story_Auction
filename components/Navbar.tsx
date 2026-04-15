'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';

function getInitials(name?: string | null): string {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  useEffect(() => {
    if (session) {
      fetch("/api/wallet/balance")
        .then(res => res.ok ? res.json() : { balance: 0 })
        .then(data => setWalletBalance(data.balance ?? 0))
        .catch(() => setWalletBalance(0));
    }
  }, [session]);

  if (!session) return null;

  const navLinks = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Browse Stories', href: '/stories' },
    { label: 'Wallet', href: '/dashboard/wallet' }
  ];

  const getIsActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/dashboard/create-story';
    }
    if (href === '/stories') {
      return pathname.startsWith('/stories');
    }
    if (href === '/dashboard/wallet') {
      return pathname === '/dashboard/wallet';
    }
    return false;
  };

  return (
    <header className="relative z-40 border-b border-white/5 bg-[#0c1220]/80 backdrop-blur-sm sticky top-0">
      <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="w-7 h-7 rounded-lg bg-amber-600/20 border border-amber-500/30 flex items-center justify-center group-hover:border-amber-500/50 transition-colors">
            <svg className="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <span className="text-sm font-serif text-amber-100/80 group-hover:text-amber-100 transition-colors hidden md:block">
            The Astral Loom
          </span>
        </Link>
        
        {/* Nav Links */}
        <nav className="flex items-center gap-1 text-sm overflow-x-auto no-scrollbar mask-edges">
          {navLinks.map(link => {
            const isActive = getIsActive(link.href);
            return isActive ? (
              <span key={link.href} className="px-3 py-1.5 rounded-lg text-amber-300 bg-amber-500/10 font-medium text-xs whitespace-nowrap">
                {link.label}
              </span>
            ) : (
              <Link key={link.href} href={link.href} className="px-3 py-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-white/5 text-xs transition-all whitespace-nowrap">
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* Right Section */}
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/dashboard/create-story" className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600/10 hover:bg-amber-600/20 text-amber-400 border border-amber-500/30 font-medium text-xs transition-all">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Create
          </Link>

          <Link href="/dashboard/wallet" className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/8 hover:border-amber-500/30 transition-colors group">
            <svg className="w-3.5 h-3.5 text-amber-400 group-hover:text-amber-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <span className="text-xs font-medium text-amber-200 group-hover:text-amber-100 transition-colors">
              {walletBalance === null ? "…" : `£${walletBalance.toFixed(2)}`}
            </span>
          </Link>

          <div className="flex items-center gap-2 border-l border-white/10 pl-3 ml-1">
            <div className="hidden sm:block text-xs text-stone-400 max-w-[100px] truncate mr-1">
              {session.user?.name}
            </div>
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-[11px] font-bold text-white shadow-md">
               {getInitials(session.user?.name)}
            </div>
            <button onClick={() => signOut({ callbackUrl: "/" })} className="text-stone-500 hover:text-red-400 transition-colors" title="Sign out">
              <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
