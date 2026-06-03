import Link from 'next/link';
import { Space_Mono, DM_Sans } from 'next/font/google';

const spaceMono = Space_Mono({ subsets: ['latin'], weight: ['400', '700'] });
const dmSans = DM_Sans({ subsets: ['latin'], weight: ['300', '400'] });

export default function NotFound() {
  return (
    <main
      className={`${dmSans.className} relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-black`}
    >

      {/* Scanlines */}
      <div className="pointer-events-none absolute inset-0 animate-[scanMove_8s_linear_infinite] opacity-30 [background:repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.1)_2px,rgba(0,0,0,0.1)_4px)]" />

      <div className="relative z-10 text-center">
        <p
          className={`${spaceMono.className} mb-4 animate-[fadeIn_1s_ease_0.3s_both] text-[11px] tracking-[4px] text-white/30 uppercase`}
        >
          Error · Page not found · Working on it
        </p>

        {/* Glitching 404 */}
        <div className={`${spaceMono.className} glitch animate-[glitch_4s_infinite]`} data-text="404">
          404
        </div>

        <p className="mt-3 animate-[fadeIn_1s_ease_0.6s_both] text-base font-light text-white/50">
          Looks like this frame got lost in the feed.
        </p>

        <Link
          href="/"
          className="mt-8 inline-flex animate-[fadeIn_1s_ease_0.9s_both] items-center gap-2 rounded-md border border-white/15 px-6 py-2.5 text-sm text-white/70 transition-all hover:border-white/40 hover:bg-white/5 hover:text-white"
        >
          ← Back to home
        </Link>
      </div>
    </main>
  );
}