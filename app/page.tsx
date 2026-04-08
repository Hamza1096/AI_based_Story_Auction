import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]/route';

export default async function Home() {
  const session = await getServerSession(authOptions);

  return (
    <main className='min-h-screen relative overflow-hidden flex flex-col items-center justify-center bg-[#030305] p-6 text-center text-white selection:bg-cyan-500/30'>
      {/* Background Elements - Nebula Aurora Glassmorphism */}
      <div className='absolute inset-0 z-0 opacity-60 mix-blend-screen'>
        {/* Deep Amethyst */}
        <div className='absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-[#9b5de5] blur-[150px] rounded-full opacity-30 animate-pulse' style={{ animationDuration: '8s' }} />
        {/* Magenta */}
        <div className='absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-[#e01a4f] blur-[150px] rounded-full opacity-20' />
        {/* Bioluminescent Cyan */}
        <div className='absolute top-[30%] left-[30%] w-[40vw] h-[40vw] bg-[#00f5d4] blur-[180px] rounded-full opacity-20' />
      </div>

      <div className='z-10 flex flex-col items-center max-w-5xl w-full'>
        {/* Top badge */}
        <div className='inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/[0.03] backdrop-blur-md border border-white/10 text-cyan-200 text-xs font-mono font-medium mb-12 shadow-[0_0_20px_rgba(0,245,212,0.15)]'>
          <span className='relative flex h-2 w-2'>
            <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75'></span>
            <span className='relative inline-flex rounded-full h-2 w-2 bg-[#00f5d4]'></span>
          </span>
          <span className='tracking-[0.15em] uppercase text-white/90'>The Astral Loom Core</span>
        </div>

        {/* Hero Type (Space Grotesk via Tailwind serif mapping) */}
        <h1 className='font-serif text-5xl md:text-7xl lg:text-[5.5rem] flex flex-col gap-2 leading-[1.05] tracking-tight mb-8 text-white'>
          <span>Bid to Shape</span>
          <span className='text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-fuchsia-300'>
            The Community Story.
          </span>
        </h1>
        
        {/* Subtitle */}
        <p className='text-lg md:text-xl text-[#b0b0c0] max-w-2xl mb-14 font-light leading-relaxed tracking-wide font-sans'>
          A premium storytelling platform where your bids weave the narrative. Direct the course of evolving, community-driven worlds in real-time.
        </p>

        {/* Buttons (Fintech/Web3 Futuristic Style) */}
        <div className='flex flex-col sm:flex-row gap-6 w-full sm:w-auto items-center'>
          {session ? (
            <Link
              href={session?.user?.role === 'ADMIN' ? '/admin' : '/dashboard'}
              className='relative group w-full sm:w-auto'
            >
              {/* Outer Glow */}
              <div className='absolute -inset-0.5 bg-gradient-to-r from-[#00f5d4] to-[#9b5de5] rounded-lg blur opacity-40 group-hover:opacity-75 transition duration-500'></div>
              <div className='relative px-8 py-4 bg-[#030305] rounded-lg border border-white/10 flex items-center justify-center transition-all duration-300 group-hover:bg-[#0a0a0f]'>
                <span className='text-white font-serif tracking-wider text-sm font-medium'>
                  Enter {session?.user?.role === 'ADMIN' ? 'Control Panel' : 'The Loom'}
                </span>
              </div>
            </Link>
          ) : (
            <>
              <Link
                href='/register'
                className='relative group w-full sm:w-auto'
              >
                {/* Ethereal Glow Border */}
                <div className='absolute -inset-0.5 bg-gradient-to-r from-cyan-400 via-[#9b5de5] to-fuchsia-500 rounded-lg blur opacity-50 group-hover:opacity-100 transition duration-500'></div>
                <div className='relative px-8 py-4 bg-[#030305]/80 backdrop-blur-xl rounded-lg border border-white/20 flex items-center justify-center transition-all duration-300 shadow-[inset_0_0_15px_rgba(255,255,255,0.1)]'>
                  <span className='text-white font-serif tracking-wider text-sm font-medium'>
                    Start Your Journey
                  </span>
                </div>
              </Link>
              <Link
                href='/login'
                className='relative group w-full sm:w-auto px-8 py-4 rounded-lg bg-transparent border border-white/10 hover:border-white/30 hover:bg-white/[0.03] transition-all text-white font-serif text-sm tracking-wider flex items-center justify-center backdrop-blur-sm'
              >
                Sign In
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Fading 1px light streak instead of a solid line */}
      <div className='absolute bottom-10 left-1/2 -translate-x-1/2 w-[80vw] max-w-3xl h-px bg-gradient-to-r from-transparent via-white/20 to-transparent' />
    </main>
  );
}
