"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, use, useRef } from "react";
import Link from "next/link";

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

const GENRE_COLOURS: Record<string, { bg: string; text: string; border: string }> = {
  Fantasy: { bg: "bg-violet-500/10", text: "text-violet-300", border: "border-violet-500/20" },
  "Science Fiction": { bg: "bg-cyan-500/10", text: "text-cyan-300", border: "border-cyan-500/20" },
  Mystery: { bg: "bg-yellow-500/10", text: "text-yellow-300", border: "border-yellow-500/20" },
  Romance: { bg: "bg-pink-500/10", text: "text-pink-300", border: "border-pink-500/20" },
  Horror: { bg: "bg-red-500/10", text: "text-red-300", border: "border-red-500/20" },
  Thriller: { bg: "bg-orange-500/10", text: "text-orange-300", border: "border-orange-500/20" },
  Adventure: { bg: "bg-green-500/10", text: "text-green-300", border: "border-green-500/20" },
  "Historical Fiction": { bg: "bg-amber-500/10", text: "text-amber-300", border: "border-amber-500/20" },
  Comedy: { bg: "bg-lime-500/10", text: "text-lime-300", border: "border-lime-500/20" },
  Drama: { bg: "bg-indigo-500/10", text: "text-indigo-300", border: "border-indigo-500/20" },
  Other: { bg: "bg-stone-500/10", text: "text-stone-300", border: "border-stone-500/20" },
};

const STATUS_CONFIG = {
  active: { label: "Active", dot: "bg-emerald-400", text: "text-emerald-400" },
  paused: { label: "Paused", dot: "bg-yellow-400", text: "text-yellow-400" },
  completed: { label: "Completed", dot: "bg-stone-400", text: "text-stone-400" },
};

export default function StoryDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams() as { id: string };

  const [story, setStory] = useState<Story | null>(null);
  const [loadingStory, setLoadingStory] = useState(true);

  // Proposal State
  const [proposalContent, setProposalContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [isAiExpanding, setIsAiExpanding] = useState(false);
  const [aiExpandedContent, setAiExpandedContent] = useState("");
  const [showAiPreview, setShowAiPreview] = useState(false);

  const [proposals, setProposals] = useState<any[]>([]);
  const [loadingProposals, setLoadingProposals] = useState(true);
  const [bidAmount, setBidAmount] = useState<Record<string, string>>({});
  const [biddingStatus, setBiddingStatus] = useState<Record<string, boolean>>({});
  const [bidMessage, setBidMessage] = useState<Record<string, { text: string; success: boolean }>>({});
  const [votingStatus, setVotingStatus] = useState<Record<string, boolean>>({});

  const [activeTab, setActiveTab] = useState<"proposals" | "episodes">("proposals");
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(true);
  
  const [showCurrentStory, setShowCurrentStory] = useState(false);

  // Countdown State
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
  const isClosingRef = useRef(false);

  const MAX_PROPOSAL_LENGTH = 500;

  // Fetch Story
  useEffect(() => {
    if (!params.id) return;

    (async () => {
      try {
        const res = await fetch(`/api/stories/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setStory(data.story);
        } else {
          setStory(null);
        }
      } catch (err) {
        setStory(null);
      } finally {
        setLoadingStory(false);
      }
    })();
  }, [params.id]);

  const fetchProposals = async () => {
    if (!params.id) return;
    try {
      const res = await fetch(`/api/stories/${params.id}/proposals`);
      if (res.ok) {
        const data = await res.json();
        setProposals(data.proposals || []);
      }
    } catch (err) {
      console.error("Failed to fetch proposals", err);
    } finally {
      setLoadingProposals(false);
    }
  };

  const fetchEpisodes = async () => {
    if (!params.id) return;
    try {
      const res = await fetch(`/api/stories/${params.id}/episodes`);
      if (res.ok) {
        const data = await res.json();
        setEpisodes(data.episodes || []);
      }
    } catch (err) {
      console.error("Failed to fetch episodes", err);
    } finally {
      setLoadingEpisodes(false);
    }
  };

  useEffect(() => {
    fetchProposals();
    fetchEpisodes();
  }, [params.id]);

  // Handle countdown timer based on PKT midnight
  useEffect(() => {
    const calculateTimeLeft = async () => {
      if (!story || story.status !== "active") {
        setTimeLeft(null);
        return;
      }

      // Convert current time to PKT string to handle timezone correctly
      const nowStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" });
      const nowPkt = new Date(nowStr);

      // Set target to Midnight (12:00 AM) PKT
      const midnightPkt = new Date(nowPkt);
      midnightPkt.setHours(24, 0, 0, 0);

      let diff = midnightPkt.getTime() - nowPkt.getTime();

      // If Target time has already passed today, set for tomorrow
      if (diff < 0) {
        midnightPkt.setDate(midnightPkt.getDate() + 1);
        diff = midnightPkt.getTime() - nowPkt.getTime();
      }

      // Auto-close trigger: we delay it by 2-5 seconds PAST midnight 
      // (When the new diff jumps up to 24 hours, meaning it just refreshed tomorrow's timer).
      // A new day diff is approx 86,400,000 ms. 2-5 seconds past midnight is diff between 86395000 and 86398000.
      const msInDay = 24 * 60 * 60 * 1000;
      if (
        diff <= msInDay - 2000 && 
        diff >= msInDay - 5000 && 
        !isClosingRef.current
      ) {
        isClosingRef.current = true;
        try {
          // Trigger the closure background job automatically
          await fetch('/api/cron/auction-close');
          // Wait briefly, then re-fetch proposals to show the updated (winner/loser) states
          setTimeout(() => fetchProposals(), 2000);
        } catch (err) {
          console.error("Failed to auto-close auction", err);
        }
        setTimeout(() => { isClosingRef.current = false; }, 60000); // Backoff for 1 minute
      }

      if (diff > 0) {
        setTimeLeft({
          hours: Math.floor(diff / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000),
        });
      } else {
        setTimeLeft(null); 
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [story]);

  // Auth Guard
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status === "loading" || loadingStory) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f1a]">
        <div className="w-8 h-8 border-2 border-amber-500/40 border-t-amber-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!session || !story) {
    return (
      <div className="min-h-screen bg-[#0a0f1a] flex flex-col items-center justify-center text-stone-200">
        <h2 className="text-xl font-semibold mb-2">Story Not Found</h2>
        <p className="text-stone-500 mb-6">The story you are looking for does not exist or has been removed.</p>
        <Link href="/stories" className="px-5 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-amber-50 text-sm font-medium transition-all shadow-lg shadow-amber-900/20">
          Back to Browse
        </Link>
      </div>
    );
  }

  const genre = GENRE_COLOURS[story.genre] ?? GENRE_COLOURS.Other;
  const statusCfg = STATUS_CONFIG[story.status];
  const proposalLength = proposalContent.length;

  const executeSubmission = async (contentToSubmit: string) => {
    setSubmitError("");
    setSubmitSuccess("");

    if (contentToSubmit.length === 0) {
      setSubmitError("The void speaks nothing. Pen a spark for the loom to weave.");
      return;
    }

    if (contentToSubmit.length > MAX_PROPOSAL_LENGTH) {
      setSubmitError(`The tapestry tears! Keep your whispers under ${MAX_PROPOSAL_LENGTH} runes.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/stories/${story._id}/proposals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: contentToSubmit }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || "The auctioneers rejected the whisper. Try again.");
      } else {
        setSubmitSuccess("Your thread has joined the great tapestry!");
        setProposalContent(""); // clear the input on success
        setAiExpandedContent(""); 
        setShowAiPreview(false);
        fetchProposals(); // refresh proposals list
      }
    } catch (err) {
      setSubmitError("The ethereal connection faded. Focus and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAiExpand = async () => {
    if (proposalContent.length === 0) {
      setSubmitError("The loom needs a thread to weave. Breathe life into your idea first.");
      return;
    }
    setSubmitError("");
    setIsAiExpanding(true);
    try {
      const res = await fetch(`/api/ai/expand`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposal: proposalContent,
          storyContext: {
            title: story.title,
            genre: story.genre,
            description: story.description,
            rules: story.rules,
          }
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || "The ancient scribe lost its focus. Kindle the flame again.");
      } else {
        setAiExpandedContent(data.expandedText);
        setShowAiPreview(true);
      }
    } catch (err) {
      setSubmitError("A tremor in the void disrupted the weaving. Try again shortly.");
    } finally {
      setIsAiExpanding(false);
    }
  };

  const handleBid = async (proposalId: string) => {
    const amountStr = bidAmount[proposalId];
    const amount = Number(amountStr);
    if (!amount || amount < 1) {
      setBidMessage(prev => ({ ...prev, [proposalId]: { text: "Minimum bid is £1.", success: false } }));
      setTimeout(() => setBidMessage(prev => { const n = {...prev}; delete n[proposalId]; return n; }), 5000);
      return;
    }

    setBiddingStatus(prev => ({ ...prev, [proposalId]: true }));
    try {
      const res = await fetch(`/api/proposals/${proposalId}/bid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBidMessage(prev => ({ ...prev, [proposalId]: { text: data.error || "Failed to place bid.", success: false } }));
      } else {
        setBidMessage(prev => ({ ...prev, [proposalId]: { text: "Bid placed successfully!", success: true } }));
        setBidAmount(prev => ({ ...prev, [proposalId]: "" }));
        fetchProposals();
      }
      setTimeout(() => setBidMessage(prev => { const n = {...prev}; delete n[proposalId]; return n; }), 5000);
    } catch (err) {
      setBidMessage(prev => ({ ...prev, [proposalId]: { text: "A network error occurred.", success: false } }));
      setTimeout(() => setBidMessage(prev => { const n = {...prev}; delete n[proposalId]; return n; }), 5000);
    } finally {
      setBiddingStatus(prev => ({ ...prev, [proposalId]: false }));
    }
  };

  const handleVote = async (proposalId: string) => {
    if (status !== "authenticated") {
      router.push("/login");
      return;
    }

    setVotingStatus(prev => ({ ...prev, [proposalId]: true }));
    try {
      const res = await fetch(`/api/proposals/${proposalId}/vote`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to vote");

      // Refetch proposals to reflect selected vote (hasVoted status)
      setTimeout(() => fetchProposals(), 500);
    } catch (err: any) {
      console.error(err.message);
    } finally {
      setVotingStatus(prev => ({ ...prev, [proposalId]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-stone-200">
      {/* Ambient glows */}
      <div className="fixed top-0 left-[15%] w-[600px] h-[400px] bg-amber-700/4 blur-[140px] rounded-full pointer-events-none z-0" />
      <div className="fixed bottom-0 right-[10%] w-[400px] h-[400px] bg-teal-700/4 blur-[120px] rounded-full pointer-events-none z-0" />

      {/* Top bar */}
      <header className="relative z-10 border-b border-white/5 bg-[#0c1220]/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link
            href="/stories"
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
            Browse Stories
          </Link>
          <span className="text-white/10">/</span>
          <span className="text-stone-300 text-sm font-medium">{story.title.length > 30 ? story.title.slice(0, 30) + '...' : story.title}</span>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 max-w-4xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-10">

        {/* Left Column: Story Details */}
        <div className="md:col-span-2 space-y-8">

          {/* Header Info */}
          <div>
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[12px] font-medium border ${genre.bg} ${genre.text} ${genre.border}`}>
                {story.genre}
              </span>
              <span className={`inline-flex items-center gap-1.5 text-[12px] font-medium ${statusCfg.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                {statusCfg.label}
              </span>
              
              {/* Countdown Timer */}
              {story.status === "active" && timeLeft && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[12px] font-medium bg-red-500/10 text-red-300 border border-red-500/20 ml-auto">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Closes in {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')} (PKT)
                </span>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl font-serif text-amber-50 mb-3 leading-snug">
              {story.title}
            </h1>

            <div className="flex items-center gap-2 text-stone-400 text-sm">
              <span>By <span className="text-amber-200/80 font-medium">{story.authorName}</span></span>
              <span className="text-white/10">•</span>
              <span>{new Date(story.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span>
            </div>
          </div>

          <div className="h-px bg-white/5" />

          {/* Description */}
          <section>
            <h2 className="text-lg font-medium text-stone-200 mb-3">The Premise</h2>
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-6 text-stone-400 text-sm leading-relaxed whitespace-pre-wrap">
              {story.description}
            </div>
          </section>

          {/* Rules */}
          {story.rules && story.rules.length > 0 && (
            <section>
              <h2 className="text-lg font-medium text-stone-200 mb-3">Story Constraints</h2>
              <ul className="space-y-3 bg-red-950/10 border border-red-900/20 rounded-xl p-6 text-sm text-stone-300">
                {story.rules.map((rule, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="text-red-400/80 font-mono text-xs mt-0.5">{index + 1}.</span>
                    <span className="leading-relaxed">{rule}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Tabs for Current Proposals / Episodes */}
          <section className="pt-8 border-t border-white/5">
            <div className="flex items-center gap-6 mb-8 border-b border-white/5 pb-0">
              <button 
                onClick={() => setActiveTab("proposals")}
                className={`text-lg font-medium transition-colors border-b-2 pb-3 mb-[-2px] ${activeTab === 'proposals' ? 'text-amber-400 border-amber-400' : 'text-stone-500 border-transparent hover:text-stone-300'}`}
              >
                Current Proposals
              </button>
              <button 
                onClick={() => setActiveTab("episodes")}
                className={`text-lg font-medium transition-colors border-b-2 pb-3 mb-[-2px] ${activeTab === 'episodes' ? 'text-amber-400 border-amber-400' : 'text-stone-500 border-transparent hover:text-stone-300'}`}
              >
                The Story So Far
              </button>
            </div>

            {activeTab === "proposals" && (
              <>
                {loadingProposals ? (
                  <div className="text-stone-500 text-sm">Loading proposals...</div>
                ) : proposals.length === 0 ? (
              <div className="text-stone-500 text-sm italic bg-white/[0.02] border border-white/5 rounded-xl p-6 text-center">
                No proposals yet. Submit the first one!
              </div>
            ) : (
              <div className="space-y-4">
                {proposals.map(p => (
                  <div key={p._id} className={`p-5 rounded-xl border ${p.status === 'winner' ? 'bg-emerald-950/20 border-emerald-500/30' : p.status === 'loser' ? 'bg-[#060a12] border-white/5 opacity-50' : 'bg-white/[0.02] border-white/10'}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-amber-100/90 text-sm">{p.userName}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold ${p.status === 'winner' ? 'bg-emerald-500/20 text-emerald-400' :
                            p.status === 'loser' ? 'bg-stone-500/20 text-stone-400' :
                              'bg-amber-500/20 text-amber-400'
                          }`}>{p.status}</span>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="text-sm font-medium text-amber-500">
                          Total Bids: £{p.totalBidAmount || 0}
                        </div>
                        <div className="text-xs font-medium text-indigo-400">
                          Votes: {p.voteCount || 0}
                        </div>
                      </div>
                    </div>
                    <p className="text-stone-300 text-sm leading-relaxed mb-4">{p.content}</p>

                    {p.status === 'pending' && (
                      <div className="pt-3 border-t border-white/5 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="1"
                              placeholder="Amount (£)"
                              className="w-28 bg-[#0a0f1a] border border-white/10 rounded-lg px-3 py-1.5 text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 text-sm"
                              value={bidAmount[p._id] || ''}
                              onChange={(e) => setBidAmount(prev => ({ ...prev, [p._id]: e.target.value }))}
                            />
                            <button
                              onClick={() => handleBid(p._id)}
                              disabled={biddingStatus[p._id]}
                              className="px-4 py-1.5 text-sm bg-amber-600/20 hover:bg-amber-600/40 text-amber-400 border border-amber-600/30 rounded-lg transition-colors disabled:opacity-50 font-medium"
                            >
                              {biddingStatus[p._id] ? 'Placing...' : 'Place Bid'}
                            </button>
                          </div>

                          <div className="flex items-center">
                            <button
                              onClick={() => handleVote(p._id)}
                              disabled={votingStatus[p._id]}
                              className={`px-4 py-1.5 text-sm rounded-lg transition-colors disabled:opacity-50 font-medium flex items-center gap-2 ${
                                p.hasVoted
                                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                                  : 'bg-white/5 hover:bg-white/10 text-stone-300 border border-white/10'
                                }`}
                            >
                              {votingStatus[p._id] ? 'Voting...' : p.hasVoted ? '★ Voted' : '☆ Vote'}
                            </button>
                          </div>
                        </div>
                        {bidMessage[p._id] && (
                          <p className={`text-xs px-1 transition-all ${bidMessage[p._id].success ? 'text-emerald-400' : 'text-red-400'}`}>
                            {bidMessage[p._id].success ? '✓' : '✕'} {bidMessage[p._id].text}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
              </>
            )}

            {activeTab === "episodes" && (
               <div className="space-y-8">
                 {/* Temporary Demo Button to Show Joined Winners */}
                 <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5 mb-8">
                   <div className="flex justify-between items-center">
                     <h3 className="text-amber-200 font-medium text-sm">Demo: Current Compiled Story</h3>
                     <button
                       onClick={() => setShowCurrentStory(!showCurrentStory)}
                       className="px-4 py-2 text-xs bg-amber-600/10 hover:bg-amber-600/20 border border-amber-500/20 text-amber-300 rounded-md transition-colors font-medium"
                     >
                       {showCurrentStory ? "Hide" : "Show shorter version of episode"}
                     </button>
                   </div>
                   
                   {showCurrentStory && (
                     <div className="mt-4 p-4 bg-[#060a12] border border-white/5 rounded-lg text-stone-300 text-sm leading-relaxed whitespace-pre-wrap">
                       {proposals.filter(p => p.status === 'winner').length > 0 
                         ? proposals.filter(p => p.status === 'winner').map(p => p.content).join('\n\n')
                         : "No winning lines have been chosen yet."}
                     </div>
                   )}
                 </div>

                 {loadingEpisodes ? (
                   <div className="text-stone-500 text-sm">Translating ancient scrolls...</div>
                 ) : episodes.length === 0 ? (
                   <div className="text-stone-500 text-sm italic bg-white/[0.02] border border-white/5 rounded-xl p-6 text-center">
                     No episodes have been compiled yet. The story is just beginning...
                   </div>
                 ) : (
                   episodes.map(ep => (
                     <div key={ep._id} className={`p-6 rounded-xl border ${ep.status === 'published' ? 'bg-indigo-950/20 border-indigo-500/20 shadow-lg shadow-indigo-900/5' : 'bg-amber-950/10 border-amber-500/20 border-dashed bg-white/[0.01]'}`}>
                       <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/5">
                         <h3 className={`font-serif text-xl ${ep.status === 'published' ? 'text-indigo-200' : 'text-amber-200'}`}>
                           Episode {ep.episodeNumber}
                         </h3>
                         <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold ${ep.status === 'published' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-amber-500/20 text-amber-300'}`}>
                           {ep.status === 'published' ? 'Published' : 'Current (Demo)'}
                         </span>
                       </div>
                       
                       <div className="space-y-4 text-stone-300 text-sm leading-relaxed">
                         {ep.parts && ep.parts.length > 0 ? (
                           <div className="space-y-3">
                             {ep.parts.map((part: any, i: number) => (
                               <p key={i} className={`${part.type === 'gap' ? 'text-stone-500 italic' : ''}`}>
                                 {part.text}
                               </p>
                             ))}
                           </div>
                         ) : (
                           <p className="text-stone-500 italic">This episode is forming...</p>
                         )}
                       </div>
                     </div>
                   ))
                 )}
               </div>
            )}
          </section>
        </div>

        {/* Right Column: Interaction panel */}
        <div className="space-y-6">
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6 sticky top-24">
            <h3 className="text-lg font-medium text-amber-50 mb-2">Submit a Proposal</h3>
            <p className="text-xs text-stone-400 mb-6 leading-relaxed">
              Have an idea on how this story should progress? Pitch your line or twist below! Keep it within limits so it can be passed to our AI modules.
              <br /><br />
              <span className="text-amber-500/80 font-medium">Note: Only one proposal per story per day.</span>
            </p>

            <div className="space-y-4">
              <div className="space-y-2 relative">
                <textarea
                  value={proposalContent}
                  onChange={(e) => setProposalContent(e.target.value)}
                  disabled={isSubmitting || story.status !== "active" || isAiExpanding}
                  rows={4}
                  placeholder="The rogue automaton slowly pointed its rusted finger towards the northern door..."
                  className="w-full bg-[#0a0f1a] border border-white/10 rounded-lg px-4 py-3.5 text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all text-sm resize-none disabled:opacity-50"
                  required
                />
                <span
                  className={`absolute right-3 bottom-3 text-[10px] ${proposalLength > MAX_PROPOSAL_LENGTH ? "text-red-400" : "text-stone-600"
                    }`}
                >
                  {proposalLength}/{MAX_PROPOSAL_LENGTH}
                </span>
              </div>

              {submitError && (
                <div className="px-3 py-2 rounded-md bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
                  {submitError}
                </div>
              )}

              {submitSuccess && (
                <div className="px-3 py-2 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
                  {submitSuccess}
                </div>
              )}

              {!showAiPreview ? (
                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => executeSubmission(proposalContent)}
                    disabled={isSubmitting || proposalLength > MAX_PROPOSAL_LENGTH || proposalLength === 0 || story.status !== "active" || isAiExpanding}
                    className="w-full relative overflow-hidden px-5 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:bg-stone-800 disabled:text-stone-500 text-amber-50 font-medium text-sm transition-all active:scale-[0.98] disabled:cursor-not-allowed shadow-lg shadow-amber-900/20 flex justify-center items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-stone-400/40 border-t-stone-200 rounded-full animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Submit Proposal
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleAiExpand}
                    disabled={isAiExpanding || proposalLength === 0 || story.status !== "active" || isSubmitting}
                    className="w-full relative px-5 py-2.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 text-indigo-300 font-medium text-sm transition-all shadow-lg flex justify-center items-center gap-2"
                  >
                    {isAiExpanding ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-indigo-400/40 border-t-indigo-200 rounded-full animate-spin" />
                        Expanding...
                      </>
                    ) : (
                      <>
                        ✨ Expand with AI
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="bg-indigo-950/20 p-4 border border-indigo-500/30 rounded-xl space-y-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-indigo-300 flex items-center gap-1.5"><span className="text-base">✨</span> AI Expanded Version</span>
                    <button onClick={() => setShowAiPreview(false)} className="text-xs text-stone-500 hover:text-stone-300">Cancel</button>
                  </div>
                  <textarea
                    value={aiExpandedContent}
                    onChange={(e) => setAiExpandedContent(e.target.value)}
                    className="w-full bg-[#0a0f1a] border border-indigo-500/30 rounded-lg px-4 py-3.5 text-indigo-100/90 focus:outline-none focus:border-indigo-500/50 transition-all text-sm resize-none"
                    rows={6}
                  />
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => executeSubmission(proposalContent)}
                      disabled={isSubmitting}
                      className="w-1/2 px-4 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 font-medium text-sm transition-all"
                    >
                      Submit Original
                    </button>
                    <button
                      type="button"
                      onClick={() => executeSubmission(aiExpandedContent)}
                      disabled={isSubmitting || aiExpandedContent.length > MAX_PROPOSAL_LENGTH || aiExpandedContent.length === 0}
                      className="w-1/2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-indigo-50 font-medium text-sm transition-all shadow-lg shadow-indigo-900/20"
                    >
                      {isSubmitting ? "Submitting..." : "Submit AI Version"}
                    </button>
                  </div>
                  <div className="text-[10px] text-stone-500 flex justify-between">
                    <span>You can freely edit the generated text before submitting.</span>
                    <span className={aiExpandedContent.length > MAX_PROPOSAL_LENGTH ? "text-red-400 font-medium" : "text-stone-500"}>
                      {aiExpandedContent.length}/{MAX_PROPOSAL_LENGTH}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
