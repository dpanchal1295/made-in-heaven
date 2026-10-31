'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { LandingContentConfig } from '@/config/content';
import { Photo } from '@/components/common/Photo';
import { HeroVideo } from '@/components/common/HeroVideo';
import { CurtainHero } from '@/components/landing/CurtainHero';
import { Eyebrow } from '@/components/common/Eyebrow';
import { Logo } from '@/components/common/Logo';
import { Button } from '@/components/ui';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';

// Words scroll-driven opacity component for Statement section
function ScrollStatement({ text }: { text: string }) {
  const containerRef = useRef<HTMLParagraphElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 0.85', 'end 0.35'],
  });

  const words = text.split(' ');

  return (
    <p
      ref={containerRef}
      className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-[44px] font-normal leading-[1.28] text-center max-w-[880px] mx-auto text-[#2A2521]"
    >
      {words.map((word, index) => {
        if (prefersReducedMotion) {
          return (
            <span key={index} className="text-[#2A2521] inline-block mr-2 sm:mr-3">
              {word}
            </span>
          );
        }
        return (
          <WordSpan
            key={index}
            word={word}
            progress={scrollYProgress}
            range={[index / words.length, Math.min(1, (index + 1.5) / words.length)]}
          />
        );
      })}
    </p>
  );
}

function WordSpan({
  word,
  progress,
  range,
}: {
  word: string;
  progress: any;
  range: [number, number];
}) {
  const opacity = useTransform(progress, range, [0.25, 1]);
  const color = useTransform(progress, range, ['#6B645E', '#2A2521']);

  return (
    <motion.span
      style={{ opacity, color }}
      className="inline-block mr-2 sm:mr-3 transition-colors duration-150"
    >
      {word}
    </motion.span>
  );
}

export interface ThemedLandingViewProps {
  config: LandingContentConfig;
}

export function ThemedLandingView({ config }: ThemedLandingViewProps) {
  const router = useRouter();
  const { loginAsDemo, isLoading } = useAuth();
  const [isDemoSigningIn, setIsDemoSigningIn] = useState(false);

  const handleTryDemo = async () => {
    setIsDemoSigningIn(true);
    try {
      let uid = 'demo-aarav-1';
      if (config.eventType === 'birthday') uid = 'demo-ananya-host';
      if (config.eventType === 'community') uid = 'demo-vikram-org';

      const success = await loginAsDemo(uid, config.demoHomeId);
      if (success) {
        router.push('/home');
      } else {
        router.push('/signin');
      }
    } catch {
      router.push('/signin');
    } finally {
      setIsDemoSigningIn(false);
    }
  };

  const handleStartPlanning = () => {
    router.push(`/start?type=${config.eventType}`);
  };

  return (
    <div className={`min-h-screen bg-[#FCFBF8] text-[#2A2521] selection:bg-[#F1EDE8]`} data-event-type={config.eventType}>
      {/* 1. Pinned Curtain Hero */}
      <CurtainHero
        media={
          config.hero.videoSrc && config.hero.posterSrc ? (
            <HeroVideo
              videoSrc={config.hero.videoSrc}
              posterSrc={config.hero.posterSrc}
              alt={config.hero.badge}
            />
          ) : (
            <Photo
              imageKey={config.hero.heroImageKey as any}
              aspectRatio="hero"
              priority
              quality={85}
              className="w-full h-full object-cover"
            >
              <div
                className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20"
                aria-hidden="true"
              />
            </Photo>
          )
        }
      >
        <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl lg:text-[76px] font-normal leading-[1.05] tracking-tight mb-6">
          {config.hero.headlineLine1}{' '}
          {config.hero.italicWord && config.hero.headlineLine2.includes(config.hero.italicWord) ? (
            <>
              {config.hero.headlineLine2.split(config.hero.italicWord)[0]}
              <span className="italic">{config.hero.italicWord}</span>
              {config.hero.headlineLine2.split(config.hero.italicWord)[1]}
            </>
          ) : (
            config.hero.headlineLine2
          )}
        </h1>

        <p className="font-sans text-base sm:text-lg md:text-xl text-white/90 font-light max-w-2xl leading-relaxed mb-8 sm:mb-10">
          {config.hero.subline}
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <Button
            size="lg"
            onClick={handleStartPlanning}
            className="bg-[var(--accent-primary)] hover:bg-[var(--accent-dark)] text-white border-0 px-8 py-4 font-sans tracking-widest text-xs font-medium uppercase shadow-lg transition-all"
          >
            {config.hero.ctaPrimary}
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={handleTryDemo}
            disabled={isDemoSigningIn}
            className="border-white/50 text-white hover:bg-white hover:text-[#2A2521] px-8 py-4 font-sans tracking-widest text-xs font-medium uppercase backdrop-blur-sm transition-all"
          >
            {isDemoSigningIn ? 'OPENING DEMO...' : config.hero.ctaSecondary}
          </Button>
        </div>
      </CurtainHero>

      {/* 2. Rising Sheet: Meet Maya Split Section */}
      <section className="relative z-10 py-20 sm:py-28 px-6 sm:px-12 md:px-20 lg:px-24 bg-[#FCFBF8] rounded-t-[28px] sm:rounded-t-[36px] shadow-[0_-16px_40px_rgba(42,37,33,0.18)]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="order-2 lg:order-1">
            <Eyebrow align="left" className="mb-4">
              {config.featured.badge}
            </Eyebrow>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal leading-tight text-[#2A2521] mb-6">
              {config.featured.title}
            </h2>
            <p className="font-sans text-base sm:text-lg text-[#6B645E] leading-relaxed mb-8">
              {config.featured.paragraph}
            </p>
            <Button
              size="lg"
              onClick={handleStartPlanning}
              className="bg-[var(--accent-primary)] hover:bg-[var(--accent-dark)] text-white px-8 font-sans tracking-widest text-xs uppercase"
            >
              {config.featured.cta}
            </Button>
          </div>
          <div className="order-1 lg:order-2">
            <Photo
              imageKey={config.featured.imageKey as any}
              aspectRatio="tall"
              hoverZoom
              className="shadow-md"
            />
          </div>
        </div>
      </section>

      {/* 3. How it Works Section */}
      <section className="py-20 sm:py-28 px-6 sm:px-12 md:px-20 lg:px-24 bg-[#F1EDE8] border-y border-[#E4DED6]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Eyebrow className="mb-4">
              WORKFLOW
            </Eyebrow>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal text-[#2A2521]">
              How it works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {config.howItWorks.map((step) => (
              <div key={step.num} className="bg-[#FCFBF8] p-8 border border-[#E4DED6] flex flex-col justify-between">
                <div>
                  <span className="font-serif text-2xl text-[var(--accent-dark)] font-medium mb-4 block">
                    {step.num}
                  </span>
                  <h3 className="font-serif text-xl sm:text-2xl font-normal text-[#2A2521] mb-3">
                    {step.title}
                  </h3>
                  <p className="font-sans text-sm text-[#6B645E] leading-relaxed">
                    {step.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Ideas Maya Suggests (Ideas Band) */}
      <section className="py-20 sm:py-28 px-6 sm:px-12 md:px-20 lg:px-24 bg-[#FCFBF8]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <Eyebrow align="left" className="mb-4">
                {config.suggestions.badge}
              </Eyebrow>
              <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal text-[#2A2521]">
                {config.suggestions.sectionTitle}
              </h2>
            </div>
            <p className="font-sans text-xs text-[#6B645E] max-w-sm mt-4 md:mt-0">
              {config.suggestions.disclaimer}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {config.suggestions.ideas.map((idea, idx) => (
              <div key={idx} className="group border border-[#E4DED6] bg-[#FCFBF8] flex flex-col overflow-hidden">
                <Photo
                  imageKey={idea.imageKey as any}
                  aspectRatio="portrait"
                  hoverZoom
                  className="w-full"
                />
                <div className="p-6 flex flex-col flex-1 justify-between bg-[#FCFBF8]">
                  <div>
                    <span className="font-sans text-[10px] uppercase tracking-widest text-[var(--accent-dark)] font-semibold mb-2 block">
                      {idea.category}
                    </span>
                    <h3 className="font-serif text-xl font-normal text-[#2A2521] mb-2">
                      {idea.title}
                    </h3>
                    <p className="font-sans text-xs text-[#6B645E] leading-relaxed">
                      {idea.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Browse Celebrations Grid */}
      <section className="py-20 sm:py-28 px-6 sm:px-12 md:px-20 lg:px-24 bg-[#F1EDE8] border-t border-[#E4DED6]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Eyebrow className="mb-4">
              {config.celebrations.badge}
            </Eyebrow>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal text-[#2A2521] mb-4">
              {config.celebrations.sectionTitle}
            </h2>
            <p className="font-sans text-sm text-[#6B645E]">
              {config.celebrations.description}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {config.celebrations.items.map((item, idx) => (
              <div key={idx} className="bg-[#FCFBF8] border border-[#E4DED6] flex flex-col overflow-hidden group">
                <Photo
                  imageKey={item.imageKey as any}
                  aspectRatio="tall"
                  hoverZoom
                  className="w-full"
                />
                <div className="p-6">
                  <div className="flex items-baseline justify-between mb-2">
                    <h3 className="font-serif text-2xl font-normal text-[#2A2521]">
                      {item.title}
                    </h3>
                    <span className="font-sans text-[11px] text-[var(--accent-dark)] uppercase tracking-wider">
                      {item.subtitle}
                    </span>
                  </div>
                  <p className="font-sans text-xs text-[#6B645E] leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Plan Together Split Band */}
      <section className="py-20 sm:py-28 px-6 sm:px-12 md:px-20 lg:px-24 bg-[#FCFBF8]">
        <div className="max-w-4xl mx-auto text-center">
          <Eyebrow className="mb-4">
            {config.planTogether.badge}
          </Eyebrow>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal text-[#2A2521] mb-6">
            {config.planTogether.title}
          </h2>
          <p className="font-sans text-base sm:text-lg text-[#6B645E] leading-relaxed mb-8 max-w-2xl mx-auto">
            {config.planTogether.paragraph}
          </p>
          <Button
            size="lg"
            onClick={handleStartPlanning}
            className="bg-[var(--accent-primary)] hover:bg-[var(--accent-dark)] text-white px-8 font-sans tracking-widest text-xs uppercase"
          >
            {config.planTogether.linkText}
          </Button>
        </div>
      </section>

      {/* 7. Editorial Statement */}
      <section className="py-24 sm:py-32 px-6 sm:px-12 md:px-20 lg:px-24 bg-[#F1EDE8] border-t border-[#E4DED6]">
        <div className="max-w-4xl mx-auto text-center">
          <Eyebrow className="mb-8">
            {config.statement.badge}
          </Eyebrow>
          <ScrollStatement text={config.statement.text} />
        </div>
      </section>

      {/* 8. Dark Footer */}
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
