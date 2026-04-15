"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Transaction {
  _id: string;
  type: "credit" | "debit";
  amount: number;
  status: "pending" | "completed" | "failed";
  description: string;
  createdAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TOP_UP_AMOUNTS = [5, 10, 20, 50];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatGBP(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Transaction Row ──────────────────────────────────────────────────────────

function TransactionRow({ tx }: { tx: Transaction }) {
  const isCredit = tx.type === "credit";
  const statusColour =
    tx.status === "completed"
      ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20"
      : tx.status === "pending"
      ? "text-yellow-400 bg-yellow-400/10 border-yellow-400/20"
      : "text-red-400 bg-red-400/10 border-red-400/20";

  return (
    <div className="flex items-center gap-4 px-5 py-4 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
      {/* Icon */}
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
          isCredit ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
        }`}
      >
        {isCredit ? (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
          </svg>
        )}
      </div>

      {/* Description + date */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-stone-200 truncate">{tx.description || (isCredit ? "Wallet credit" : "Wallet debit")}</p>
        <p className="text-xs text-stone-600 mt-0.5">{formatDate(tx.createdAt)}</p>
      </div>

      {/* Status badge */}
      <span className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${statusColour}`}>
        {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
      </span>

      {/* Amount */}
      <span className={`text-sm font-semibold tabular-nums shrink-0 ${isCredit ? "text-emerald-400" : "text-red-400"}`}>
        {isCredit ? "+" : "-"}{formatGBP(tx.amount)}
      </span>
    </div>
  );
}

// ─── Wallet Inner (needs useSearchParams) ─────────────────────────────────────

function WalletInner() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [balance, setBalance]               = useState<number | null>(null);
  const [transactions, setTransactions]     = useState<Transaction[]>([]);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [loadingTxns, setLoadingTxns]       = useState(true);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [isRedirecting, setIsRedirecting]   = useState(false);
  const [checkoutError, setCheckoutError]   = useState("");

  const paymentStatus = searchParams.get("status"); // "success" | "cancelled" | null

  // Auth guard
  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
    if (status === "authenticated" && session?.user?.role === "ADMIN") router.replace("/admin");
  }, [status, session, router]);

  // Fetch balance and transactions
  useEffect(() => {
    if (status !== "authenticated") return;

    const fetchBalance = async () => {
      try {
        const res = await fetch("/api/wallet/balance");
        if (res.ok) {
          const data = await res.json();
          setBalance(data.balance ?? 0);
        }
      } finally {
        setLoadingBalance(false);
      }
    };

    const fetchTxns = async () => {
      try {
        const res = await fetch("/api/wallet/transactions");
        if (res.ok) {
          const data = await res.json();
          setTransactions(data.transactions ?? []);
        }
      } finally {
        setLoadingTxns(false);
      }
    };

    fetchBalance();
    fetchTxns();
  }, [status]);

  // ─── Checkout handler ──────────────────────────────────────────────────────
  const handleTopUp = async () => {
    if (!selectedAmount) return;
    setCheckoutError("");
    setIsRedirecting(true);
    try {
      const res = await fetch("/api/wallet/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: selectedAmount }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCheckoutError(data.error || "Failed to start payment.");
        setIsRedirecting(false);
        return;
      }
      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch {
      setCheckoutError("Network error. Please try again.");
      setIsRedirecting(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) return null;

  const completedCredits = transactions
    .filter((t) => t.type === "credit" && t.status === "completed")
    .reduce((s, t) => s + t.amount, 0);

  const completedDebits = transactions
    .filter((t) => t.type === "debit" && t.status === "completed")
    .reduce((s, t) => s + t.amount, 0);

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-stone-200">
      {/* Glows */}
      <div className="fixed top-0 left-[15%] w-[600px] h-[400px] bg-amber-700/4 blur-[140px] rounded-full pointer-events-none z-0" />
      <div className="fixed bottom-0 right-[10%] w-[400px] h-[400px] bg-teal-700/4 blur-[120px] rounded-full pointer-events-none z-0" />

      {/* ── Navbar ── */}
      <Navbar />

      {/* ── Main ── */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 py-10">

        {/* Page heading */}
        <div className="mb-8">
          <p className="text-xs text-amber-500/70 uppercase tracking-widest font-medium mb-1">Bidding Funds</p>
          <h1 className="text-2xl md:text-3xl font-serif text-amber-50">My Wallet</h1>
        </div>

        {/* ── Success / Cancelled banners ── */}
        {paymentStatus === "success" && (
          <div className="mb-8 flex items-center gap-3 px-5 py-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm">
            <svg className="w-5 h-5 shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-semibold text-emerald-200">Payment successful!</p>
              <p className="text-emerald-400/80 text-xs mt-0.5">
                Your funds are being credited. Balance updates may take a few seconds while our system confirms the payment.
              </p>
            </div>
          </div>
        )}

        {paymentStatus === "cancelled" && (
          <div className="mb-8 flex items-center gap-3 px-5 py-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-sm">
            <svg className="w-5 h-5 shrink-0 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>Payment was cancelled. Your wallet was not charged.</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ── LEFT: Balance + Top-Up ── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Balance card */}
            <div className="relative overflow-hidden bg-gradient-to-br from-amber-600/10 to-amber-800/5 border border-amber-500/15 rounded-2xl p-6">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-2xl rounded-full pointer-events-none" />
              <p className="text-xs text-amber-400/70 uppercase tracking-widest font-medium mb-3">Available Balance</p>
              {loadingBalance ? (
                <div className="h-10 w-32 bg-white/5 rounded-xl animate-pulse" />
              ) : (
                <p className="text-4xl font-bold text-amber-100 tabular-nums">
                  {formatGBP(balance ?? 0)}
                </p>
              )}
              <p className="text-xs text-stone-600 mt-2">Ready to use in story auctions</p>

              {/* Mini stats */}
              <div className="flex gap-4 mt-5 pt-4 border-t border-white/5">
                <div>
                  <p className="text-[10px] text-stone-600 uppercase tracking-wide">Total Added</p>
                  <p className="text-sm font-semibold text-emerald-400">{formatGBP(completedCredits)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-stone-600 uppercase tracking-wide">Total Spent</p>
                  <p className="text-sm font-semibold text-red-400">{formatGBP(completedDebits)}</p>
                </div>
              </div>
            </div>

            {/* Top-up card */}
            <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-5">
              <p className="text-sm font-medium text-stone-300 mb-4">Add Funds</p>

              {/* Amount presets */}
              <div className="grid grid-cols-2 gap-2.5 mb-4">
                {TOP_UP_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setSelectedAmount(amt)}
                    className={`py-3 rounded-xl border text-sm font-semibold transition-all ${
                      selectedAmount === amt
                        ? "bg-amber-500/15 border-amber-500/50 text-amber-200"
                        : "bg-white/[0.03] border-white/8 text-stone-400 hover:border-white/20 hover:text-stone-200"
                    }`}
                  >
                    £{amt}
                  </button>
                ))}
              </div>

              {checkoutError && (
                <p className="text-xs text-red-400 mb-3">{checkoutError}</p>
              )}

              <button
                onClick={handleTopUp}
                disabled={!selectedAmount || isRedirecting}
                className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:bg-stone-800 disabled:text-stone-600 text-amber-50 font-medium text-sm transition-all active:scale-[0.98] disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-amber-900/20"
              >
                {isRedirecting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-amber-300/30 border-t-amber-200 rounded-full animate-spin" />
                    Redirecting to Stripe…
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    {selectedAmount ? `Pay ${formatGBP(selectedAmount)} via Stripe` : "Select an amount"}
                  </>
                )}
              </button>

              <p className="text-[11px] text-stone-600 text-center mt-3 flex items-center justify-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Secured by Stripe. We never store card details.
              </p>
            </div>
          </div>

          {/* ── RIGHT: Transaction History ── */}
          <div className="lg:col-span-3">
            <div className="bg-white/[0.03] border border-white/8 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-stone-200">Transaction History</h2>
                {transactions.length > 0 && (
                  <span className="text-xs text-stone-600 bg-white/5 px-2 py-0.5 rounded-full border border-white/8">
                    {transactions.length} record{transactions.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {loadingTxns ? (
                <div className="p-5 space-y-3">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="flex items-center gap-4 animate-pulse">
                      <div className="w-9 h-9 rounded-xl bg-white/5 shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-white/5 rounded-full w-2/3" />
                        <div className="h-2.5 bg-white/5 rounded-full w-1/3" />
                      </div>
                      <div className="h-4 bg-white/5 rounded-full w-16" />
                    </div>
                  ))}
                </div>
              ) : transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                  <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/8 flex items-center justify-center mb-4">
                    <svg className="w-5 h-5 text-stone-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <p className="text-sm text-stone-500 mb-1">No transactions yet</p>
                  <p className="text-xs text-stone-600">Add funds to see your transaction history here.</p>
                </div>
              ) : (
                <div className="divide-y divide-white/0">
                  {transactions.map((tx) => (
                    <TransactionRow key={tx._id} tx={tx} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ─── Page export with Suspense ────────────────────────────────────────────────

export default function WalletPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-400 rounded-full animate-spin" />
        </div>
      }
    >
      <WalletInner />
    </Suspense>
  );
}
