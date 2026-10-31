'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { Photo } from '@/components/common/Photo';
import { HeroVideo } from '@/components/common/HeroVideo';
import { CurtainHero } from '@/components/landing/CurtainHero';
import { Eyebrow } from '@/components/common/Eyebrow';
import { Logo } from '@/components/common/Logo';
import { Button } from '@/components/ui';
import { ArrowRight } from 'lucide-react';

export default function WelcomePage() {
  const router = useRouter();
  const { loginAsDemo } = useAuth();
  const [loadingDemo, setLoadingDemo] = useState<string | null>(null);

  const handleDemoSignIn = async (uid: string, homeId: string) => {
    setLoadingDemo(homeId);
    try {
      const ok = await loginAsDemo(uid, homeId);
      if (ok) router.push('/home');
      else router.push('/signin');
    } catch {
      router.push('/signin');
    } finally {
      setLoadingDemo(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#FCFBF8] text-[#2A2521] selection:bg-[#F1EDE8]">
      {/* 1. Pinned Curtain Hero */}
      <CurtainHero
        media={
          <HeroVideo
            videoSrc="/images/main-hero.mp4"
            posterSrc="/images/main-hero.jpg"
            alt="Celebration moments"
          />
        }
      >
        <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl lg:text-[76px] font-normal leading-[1.05] tracking-tight mb-6">
          Every celebration, <span className="italic">planned together</span>
        </h1>

        <p className="font-sans text-base sm:text-lg md:text-xl text-white/90 font-light max-w-2xl leading-relaxed mb-8 sm:mb-10">
          Maya helps Indian families coordinate budgets by function, countdown timelines, and family votes, with voice support across Indian languages.
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <Button
            size="lg"
            onClick={() => router.push('/start')}
            className="bg-[#A8603E] hover:bg-[#94512F] text-white border-0 px-8 py-4 font-sans tracking-widest text-xs font-medium uppercase shadow-lg transition-all"
          >
            START PLANNING
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => router.push('/weddings')}
            className="border-white/50 text-white hover:bg-white hover:text-[#2A2521] px-8 py-4 font-sans tracking-widest text-xs font-medium uppercase backdrop-blur-sm transition-all"
          >
            EXPLORE WEDDINGS
          </Button>
        </div>
      </CurtainHero>

      {/* 2. Rising Sheet: Three Large Photo Tiles (Weddings, Birthdays, Community) */}
      <section
        className="relative z-10 py-20 sm:py-28 px-6 sm:px-12 md:px-20 lg:px-24 bg-[#FCFBF8] rounded-t-[28px] sm:rounded-t-[36px] shadow-[0_-16px_40px_rgba(42,37,33,0.18)]"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Eyebrow className="mb-4">
              BROWSE BY CELEBRATION
            </Eyebrow>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal text-[#2A2521]">
              Three ways to celebrate
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Weddings */}
            <div className="group border border-[#E4DED6] bg-[#FCFBF8] flex flex-col overflow-hidden">
              <div className="relative aspect-[4/5] overflow-hidden">
                <Photo
                  imageKey="wedding"
                  aspectRatio="tall"
                  hoverZoom
                  className="w-full h-full"
                />
              </div>
              <div className="p-8 flex flex-col justify-between flex-1">
                <div>
                  <span className="font-sans text-[11px] uppercase tracking-widest text-[#94512F] font-semibold mb-2 block">
                    SACRED UNION
                  </span>
                  <h3 className="font-serif text-2xl sm:text-3xl font-normal text-[#2A2521] mb-3">
                    Indian Weddings
                  </h3>
                  <p className="font-sans text-sm text-[#6B645E] leading-relaxed mb-6">
                    Multi-day ceremonies from Mehendi to Reception, itemized rupee budgets, and shared family voting.
                  </p>
                </div>
                <Link
                  href="/weddings"
                  className="inline-flex items-center gap-2 text-xs font-sans uppercase tracking-widest text-[#94512F] font-medium group-hover:translate-x-1 transition-transform"
                >
                  Explore Weddings <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Birthdays */}
            <div className="group border border-[#E4DED6] bg-[#FCFBF8] flex flex-col overflow-hidden" data-event-type="birthday">
              <div className="relative aspect-[4/5] overflow-hidden">
                <Photo
                  imageKey="birthdayHero"
                  aspectRatio="tall"
                  hoverZoom
                  className="w-full h-full"
                />
              </div>
              <div className="p-8 flex flex-col justify-between flex-1">
                <div>
                  <span className="font-sans text-[11px] uppercase tracking-widest text-[#863A57] font-semibold mb-2 block">
                    YEARS OF JOY
                  </span>
                  <h3 className="font-serif text-2xl sm:text-3xl font-normal text-[#2A2521] mb-3">
                    Milestone Birthdays
                  </h3>
                  <p className="font-sans text-sm text-[#6B645E] leading-relaxed mb-6">
                    1st, 18th, 50th, and 60th celebrations with morning puja, evening dinner, tiered cakes, and return gifts.
                  </p>
                </div>
                <Link
                  href="/birthdays"
                  className="inline-flex items-center gap-2 text-xs font-sans uppercase tracking-widest text-[#863A57] font-medium group-hover:translate-x-1 transition-transform"
                >
                  Explore Birthdays <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Community Events */}
            <div className="group border border-[#E4DED6] bg-[#FCFBF8] flex flex-col overflow-hidden" data-event-type="community">
              <div className="relative aspect-[4/5] overflow-hidden">
                <Photo
                  imageKey="communityHero"
                  aspectRatio="tall"
                  hoverZoom
                  className="w-full h-full"
                />
              </div>
              <div className="p-8 flex flex-col justify-between flex-1">
                <div>
                  <span className="font-sans text-[11px] uppercase tracking-widest text-[#8E4A00] font-semibold mb-2 block">
                    FESTIVALS & SOCIETIES
                  </span>
                  <h3 className="font-serif text-2xl sm:text-3xl font-normal text-[#2A2521] mb-3">
                    Community Events
                  </h3>
                  <p className="font-sans text-sm text-[#6B645E] leading-relaxed mb-6">
                    Navratri Garba, Ganesh Utsav, and society festivals with pandal layouts, footfall plans, and committee voting.
                  </p>
                </div>
                <Link
                  href="/community"
                  className="inline-flex items-center gap-2 text-xs font-sans uppercase tracking-widest text-[#8E4A00] font-medium group-hover:translate-x-1 transition-transform"
                >
                  Explore Community <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. How Maya Helps */}
      <section className="py-20 sm:py-28 px-6 sm:px-12 md:px-20 lg:px-24 bg-[#F1EDE8] border-y border-[#E4DED6]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Eyebrow className="mb-4">
              EXPERIENCE MAYA
            </Eyebrow>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal text-[#2A2521] mb-4">
              How Maya helps
            </h2>
            <p className="font-sans text-sm text-[#6B645E]">
              From first conversation to final celebration, Maya keeps every member aligned.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#FCFBF8] p-8 border border-[#E4DED6]">
              <span className="font-serif text-3xl text-[#94512F] font-normal mb-3 block">01</span>
              <h3 className="font-serif text-2xl font-normal text-[#2A2521] mb-3">One question at a time</h3>
              <p className="font-sans text-sm text-[#6B645E] leading-relaxed">
                Maya listens gently in Hindi, Gujarati, Punjabi, Marathi, or English, asking focused questions to build your plan realistically.
              </p>
            </div>
            <div className="bg-[#FCFBF8] p-8 border border-[#E4DED6]">
              <span className="font-serif text-3xl text-[#94512F] font-normal mb-3 block">02</span>
              <h3 className="font-serif text-2xl font-normal text-[#2A2521] mb-3">Private budgets & schedules</h3>
              <p className="font-sans text-sm text-[#6B645E] leading-relaxed">
                Budget details stay strictly private to the hosts, while advisors and family share creative ideas in organized rooms.
              </p>
            </div>
            <div className="bg-[#FCFBF8] p-8 border border-[#E4DED6]">
              <span className="font-serif text-3xl text-[#94512F] font-normal mb-3 block">03</span>
              <h3 className="font-serif text-2xl font-normal text-[#2A2521] mb-3">Family voting & runoff</h3>
              <p className="font-sans text-sm text-[#6B645E] leading-relaxed">
                Maya synthesizes conflicting ideas into balanced options. Voters decide by clear majority without group chat friction.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Try a Demo Row (Three Buttons) */}
      <section className="py-20 sm:py-28 px-6 sm:px-12 md:px-20 lg:px-24 bg-[#FCFBF8]">
        <div className="max-w-4xl mx-auto text-center">
          <Eyebrow className="mb-4">
            INSTANT ACCESS
          </Eyebrow>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal text-[#2A2521] mb-6">
            Try a demo celebration
          </h2>
          <p className="font-sans text-base sm:text-lg text-[#6B645E] leading-relaxed mb-10 max-w-xl mx-auto">
            Experience Made in Heaven with pre-loaded demo homes, sample family members, and interactive decision rooms.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Button
              size="lg"
              disabled={loadingDemo !== null}
              onClick={() => handleDemoSignIn('demo-aarav-1', 'demo-home-1')}
              className="bg-[#A8603E] hover:bg-[#94512F] text-white py-4 font-sans tracking-widest text-xs uppercase"
            >
              {loadingDemo === 'demo-home-1' ? 'Loading...' : 'Try Wedding Demo'}
            </Button>
            <Button
              size="lg"
              disabled={loadingDemo !== null}
              onClick={() => handleDemoSignIn('demo-ananya-host', 'demo-home-2')}
              className="bg-[#9B4A6A] hover:bg-[#863A57] text-white py-4 font-sans tracking-widest text-xs uppercase"
            >
              {loadingDemo === 'demo-home-2' ? 'Loading...' : 'Try Birthday Demo'}
            </Button>
            <Button
              size="lg"
              disabled={loadingDemo !== null}
              onClick={() => handleDemoSignIn('demo-vikram-org', 'demo-home-3')}
              className="bg-[#A35700] hover:bg-[#8E4A00] text-white py-4 font-sans tracking-widest text-xs uppercase"
            >
              {loadingDemo === 'demo-home-3' ? 'Loading...' : 'Try Community Demo'}
            </Button>
          </div>
        </div>
      </section>

      {/* 5. Dark Footer */}
      <footer className="bg-[#2B2621] text-white py-16 px-6 sm:px-12 md:px-20 lg:px-24 border-t border-[#3A332C]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-2">
            <div className="mb-4">
              <Logo variant="light" size="lg" />
            </div>
            <p className="font-sans text-xs text-white/60 max-w-sm leading-relaxed mb-6">
              Quietly brilliant celebration planning with Maya for Indian weddings, milestone birthdays, and community festivals.
            </p>
            <div className="flex gap-4">
              <Link href="/weddings" className="text-xs uppercase tracking-widest text-white/70 hover:text-white transition-colors">
                Weddings
              </Link>
              <span className="text-white/30">•</span>
              <Link href="/birthdays" className="text-xs uppercase tracking-widest text-white/70 hover:text-white transition-colors">
                Birthdays
              </Link>
              <span className="text-white/30">•</span>
              <Link href="/community" className="text-xs uppercase tracking-widest text-white/70 hover:text-white transition-colors">
                Community
              </Link>
            </div>
          </div>
          <div>
            <span className="font-sans text-[11px] uppercase tracking-widest text-white/40 block mb-4">
              Celebrations
            </span>
            <ul className="space-y-2 text-xs text-white/70">
              <li><Link href="/weddings" className="hover:text-white transition-colors">Indian Weddings</Link></li>
              <li><Link href="/birthdays" className="hover:text-white transition-colors">Milestone Birthdays</Link></li>
              <li><Link href="/community" className="hover:text-white transition-colors">Festivals & Society Garba</Link></li>
              <li><Link href="/start" className="hover:text-white transition-colors">Create Celebration</Link></li>
            </ul>
          </div>
          <div>
            <span className="font-sans text-[11px] uppercase tracking-widest text-white/40 block mb-4">
              Explore
            </span>
            <ul className="space-y-2 text-xs text-white/70">
              <li><Link href="/welcome" className="hover:text-white transition-colors">All Celebrations</Link></li>
              <li><Link href="/about" className="hover:text-white transition-colors">About Maya</Link></li>
              <li><Link href="/signin" className="hover:text-white transition-colors">Sign In</Link></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-white/40">
          <span>© 2026 Made in Heaven. Built for the Hack2Skills AI Prompt War.</span>
          <span className="mt-2 sm:mt-0">WCAG AA Accessible • Editorial Design</span>
        </div>
      </footer>
    </div>
  );
}
