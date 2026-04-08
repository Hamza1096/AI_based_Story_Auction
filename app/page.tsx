import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]/route';

export default async function Home() {
  const session = await getServerSession(authOptions);

  return (
    <main className='min-h-screen relative overflow-hidden flex flex-col items-center justify-center bg-[#0c1222] p-6 text-center text-stone-200 selection:bg-amber-800/20'>
      
      {/* Background Elements - Living Storybook Narrative Theme */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a101d] via-[#101b2f] to-[#0f192b] z-0"></div>
      
      {/* Soft Starry Texture / Grain overlay */}
      <div className="absolute inset-0 z-0 opacity-20 mix-blend-overlay pointer-events-none" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")'}}></div>
      
      {/* Ambient Teal & Amber soft glows */}
      <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-[#0d3b45]/30 blur-[150px] rounded-full pointer-events-none z-0"></div>
      <div className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] bg-[#5a3014]/30 blur-[120px] rounded-full pointer-events-none z-0"></div>

      {/* Decorative Forest SVG at Bottom */}
      <svg className="absolute bottom-0 left-0 w-full h-[35%] text-[#070a13] opacity-90 pointer-events-none z-0" preserveAspectRatio="none" viewBox="0 0 1440 320" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path fillOpacity="1" d="M0,288L48,272C96,256,192,224,288,213.3C384,203,480,213,576,234.7C672,256,768,288,864,282.7C960,277,1056,240,1152,224C1248,208,1344,213,1392,218.7L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
      </svg>

      {/* Floating particles */}
      <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/4 w-1 h-1 bg-amber-200/60 rounded-full animate-[fadeFloat_16s_ease-in-out_infinite_1s]"></div>
        <div className="absolute top-2/3 left-2/3 w-1.5 h-1.5 bg-amber-100/40 rounded-full animate-[fadeFloat_20s_ease-in-out_infinite_6s]"></div>
        <div className="absolute top-1/2 left-4/5 w-2 h-2 bg-amber-300/30 blur-[1px] rounded-full animate-[fadeFloat_18s_ease-in-out_infinite_11s]"></div>
      </div>

      <div className='z-10 flex flex-col items-center max-w-5xl w-full relative'>
        {/* Top badge */}
        <div className='inline-flex items-center gap-3 px-4 py-1.5 border-b border-amber-700/50 text-teal-100/80 text-xs font-serif font-medium mb-12 uppercase tracking-widest'>
          <span className='tracking-[0.2em]'>AI-Auction</span>
        </div>

        {/* Hero Type (Serif Literary Style) */}
        <h1 className='font-serif text-5xl md:text-7xl lg:text-[6rem] flex flex-col gap-4 leading-[1.1] tracking-tight mb-8 text-amber-50 drop-shadow-sm'>
          <span>Weave Together</span>
          <span className='text-amber-200/90 italic'>
            The Community Tale.
          </span>
        </h1>
        
        {/* Subtitle */}
        <p className='text-lg md:text-xl text-teal-50/70 max-w-2xl mb-14 font-serif italic leading-relaxed tracking-wide shadow-sm'>
          A collaborative storytelling platform where your choices guide the narrative. Direct the course of evolving worlds, written page by page.
        </p>

        {/* Buttons (Matte Artistic / Storybook Style) */}
        <div className='flex flex-col sm:flex-row gap-6 w-full sm:w-auto items-center mt-4'>
          {session ? (
            <Link
              href={session?.user?.role === 'ADMIN' ? '/admin' : '/dashboard'}
              className='relative group w-full sm:w-auto overflow-hidden rounded-sm transition-all duration-300 transform active:scale-95 bg-[#C66743] hover:bg-[#Af5533] shadow-md border border-white/10'
            >
              <div className='relative px-10 py-4 flex items-center justify-center'>
                <span className='text-amber-50 font-serif tracking-wide text-lg'>
                  Open the Book
                </span>
              </div>
            </Link>
          ) : (
            <>
              <Link
                href='/register'
                className='relative group w-full sm:w-auto overflow-hidden rounded-sm transition-all duration-300 transform active:scale-95 bg-[#C66743] hover:bg-[#Af5533] shadow-lg border border-white/10'
              >
                <div className='relative px-10 py-4 flex items-center justify-center'>
                  <span className='text-amber-50 font-serif tracking-wide text-lg'>
                    Begin Your Story
                  </span>
                </div>
              </Link>
              <Link
                href='/login'
                className='relative group w-full sm:w-auto px-10 py-4 rounded-sm bg-transparent border-b border-stone-400 hover:border-amber-400 hover:bg-white/[0.02] transition-all text-stone-300 hover:text-amber-100 font-serif text-lg tracking-wide flex items-center justify-center backdrop-blur-sm'
              >
                Return to the Pages
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Fading 1px light streak */}
      <div className='absolute bottom-10 left-1/2 -translate-x-1/2 w-[80vw] max-w-3xl h-px bg-gradient-to-r from-transparent via-amber-700/30 to-transparent z-10' />

      {/* Define animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeFloat {
          0% { opacity: 0; transform: translateY(10px); }
          20% { opacity: 0.6; transform: translateY(0); }
          80% { opacity: 0.6; transform: translateY(-10px); }
          100% { opacity: 0; transform: translateY(-20px); }
        }
      `}} />
    </main>
  );
}
