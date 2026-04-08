"use client";

import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    } else if (session?.user?.role === "ADMIN") {
      router.replace("/admin");
    }
  }, [status, session, router]);

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center bg-black text-white">Loading...</div>;
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400">User Dashboard</h1>
      <p>Welcome, {session.user.name}!</p>
      <p>Role: {session.user.role}</p>
      <button 
        onClick={() => signOut()} 
        className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-white font-medium"
      >
        Sign Out
      </button>
    </div>
  );
}