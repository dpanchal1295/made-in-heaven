'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Photo } from '@/components/common/Photo';
import { IdeaCard } from '@/components/common/IdeaCard';
import { IdeaDetailModal } from '@/components/common/IdeaDetailModal';
import { EXAMPLE_IDEAS, ExampleIdea, IdeaCategory, IdeaCelebration } from '@/data/exampleIdeas';
import { Button } from '@/components/ui';
import { ChevronDown, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';

type SelectedCategory = 'ALL' | IdeaCategory;

const CATEGORIES: { label: string; value: SelectedCategory }[] = [
  { label: 'ALL', value: 'ALL' },
  { label: 'DECOR', value: 'DECOR' },
  { label: 'ATTIRE', value: 'ATTIRE' },
  { label: 'MENU', value: 'MENU' },
  { label: 'MUSIC', value: 'MUSIC' },
];

const CELEBRATIONS: { label: string; value: 'ALL' | IdeaCelebration }[] = [
  { label: 'All Celebrations', value: 'ALL' },
  { label: 'Mehendi', value: 'Mehendi' },
  { label: 'Haldi', value: 'Haldi' },
  { label: 'Sangeet', value: 'Sangeet' },
  { label: 'Wedding', value: 'Wedding' },
  { label: 'Reception', value: 'Reception' },
];

const SORT_OPTIONS = [
  { label: 'Featured', value: 'featured' },
  { label: 'Cost low to high', value: 'cost-asc' },
  { label: 'Cost high to low', value: 'cost-desc' },
  { label: 'A to Z', value: 'name-asc' },
];

function IdeasContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefersReducedMotion = useReducedMotion();

  const [selectedIdea, setSelectedIdea] = useState<ExampleIdea | null>(null);

  // Read URL query params
  const currentCategory = (searchParams.get('category')?.toUpperCase() as SelectedCategory) || 'ALL';
  const currentCelebration = searchParams.get('celebration') || 'ALL';
  const currentSort = searchParams.get('sort') || 'featured';

  // Parallax scroll effect for banner
  const { scrollY } = useScroll();
  const bannerY = useTransform(scrollY, [0, 500], [0, 120]);

  // Update query params helper
  const updateQuery = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'ALL' || value === 'featured') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/ideas?${params.toString()}`, { scroll: false });
  };

  const handleClearFilters = () => {
    router.push('/ideas', { scroll: false });
  };

  // Filter & sort ideas
  const filteredIdeas = useMemo(() => {
    let result = [...EXAMPLE_IDEAS];

    // Filter by category
    if (currentCategory && currentCategory !== 'ALL') {
      result = result.filter(
        (item) => item.category.toUpperCase() === currentCategory.toUpperCase()
      );
    }

    // Filter by celebration
    if (currentCelebration && currentCelebration !== 'ALL') {
      result = result.filter(
        (item) => item.celebration.toLowerCase() === currentCelebration.toLowerCase()
      );
    }

    // Sort
    const costMap: Record<string, number> = { '₹': 1, '₹₹': 2, '₹₹₹': 3 };

    if (currentSort === 'cost-asc') {
      result.sort((a, b) => (costMap[a.costTier] || 1) - (costMap[b.costTier] || 1));
    } else if (currentSort === 'cost-desc') {
      result.sort((a, b) => (costMap[b.costTier] || 1) - (costMap[a.costTier] || 1));
    } else if (currentSort === 'name-asc') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [currentCategory, currentCelebration, currentSort]);

  return (
    <div className="w-full bg-[#FCFBF8] text-[#2A2521] min-h-screen">
      {/* ============================================================ */}
      {/* 1. HERO BANNER (~40vh with parallax photo and white serif)   */}
      {/* ============================================================ */}
      <section className="relative w-full h-[38vh] sm:h-[42vh] min-h-[280px] sm:min-h-[320px] overflow-hidden flex items-end pb-10 sm:pb-14 px-6 sm:px-12 lg:px-16">
        <motion.div
          style={{ y: prefersReducedMotion ? 0 : bannerY }}
          className="absolute inset-0 z-0 scale-105"
        >
          <Photo
            imageKey="hero"
            aspectRatio="hero"
            priority
            className="w-full h-full"
          />
          {/* Editorial overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#2A2521]/80 via-[#2A2521]/45 to-[#2A2521]/25" />
        </motion.div>

        <div className="relative z-10 max-w-7xl mx-auto w-full space-y-2">
          <span className="font-micro text-[11px] text-[#E4DED6] tracking-[0.2em] uppercase block">
            CURATED INSPIRATION ARCHIVE
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal text-white tracking-tight">
            All Ideas
          </h1>
          <p className="text-xs sm:text-sm text-white/80 max-w-md font-light">
            Explore authentic design themes, ritual attire, catering spreads, and acoustic performances.
          </p>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 2. STICKY FILTER BAR (Sits directly under 64px header: top-16) */}
      {/* ============================================================ */}
      <div className="sticky top-16 z-30 bg-[#FCFBF8] border-b border-[#E4DED6] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
          {/* Category Tabs: ALL, DECOR, ATTIRE, MENU, MUSIC */}
          <div
            role="tablist"
            aria-label="Filter by category"
            className="flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-none py-0.5"
          >
            {CATEGORIES.map((cat) => {
              const isActive =
                cat.value === currentCategory ||
                (cat.value === 'ALL' && (!currentCategory || currentCategory === 'ALL'));
              return (
                <button
                  key={cat.value}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => updateQuery('category', cat.value)}
                  className={`font-nav text-[11px] sm:text-[12px] tracking-[0.15em] uppercase px-3 sm:px-4 py-2 border transition-all cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-[#A8603E] ${
                    isActive
                      ? 'bg-[#2A2521] text-white border-[#2A2521] font-medium'
                      : 'bg-transparent text-[#6B645E] hover:text-[#2A2521] border-[#E4DED6] hover:bg-[#F1EDE8]'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Celebration Dropdown & Sort Dropdown */}
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            {/* Celebration Select */}
            <div className="relative flex items-center">
              <label htmlFor="celebration-select" className="sr-only">
                Filter by Celebration
              </label>
              <select
                id="celebration-select"
                value={currentCelebration}
                onChange={(e) => updateQuery('celebration', e.target.value)}
                className="font-nav text-[11px] sm:text-[12px] tracking-[0.1em] uppercase bg-transparent border border-[#E4DED6] px-3 py-2 pr-7 text-[#2A2521] hover:bg-[#F1EDE8] focus-visible:outline-2 focus-visible:outline-[#A8603E] cursor-pointer appearance-none rounded-none"
              >
                {CELEBRATIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#6B645E] absolute right-2 pointer-events-none" />
            </div>

            {/* Sort Dropdown */}
            <div className="relative flex items-center">
              <label htmlFor="sort-select" className="sr-only">
                Sort by
              </label>
              <span className="hidden sm:inline font-micro text-[10px] text-[#6B645E] tracking-[0.15em] uppercase mr-2">
                SORT BY:
              </span>
              <select
                id="sort-select"
                value={currentSort}
                onChange={(e) => updateQuery('sort', e.target.value)}
                className="font-nav text-[11px] sm:text-[12px] tracking-[0.1em] uppercase bg-transparent border border-[#E4DED6] px-3 py-2 pr-7 text-[#2A2521] hover:bg-[#F1EDE8] focus-visible:outline-2 focus-visible:outline-[#A8603E] cursor-pointer appearance-none rounded-none"
              >
                {SORT_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#6B645E] absolute right-2 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. IDEAS GRID (4-col desktop, 2-col mobile)                  */}
      {/* ============================================================ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-12 sm:py-16 space-y-8">
        {/* Results Counter & Estimate Disclaimer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E4DED6] pb-4">
          <div className="flex items-center gap-2 text-xs text-[#6B645E]">
            <span className="font-micro tracking-[0.15em] uppercase font-semibold text-[#2A2521]">
              {filteredIdeas.length} {filteredIdeas.length === 1 ? 'Concept' : 'Concepts'}
            </span>
            <span>•</span>
            <span className="italic">Example ideas, estimates only</span>
          </div>

          {(currentCategory !== 'ALL' || currentCelebration !== 'ALL' || currentSort !== 'featured') && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1.5 font-nav text-[11px] tracking-[0.15em] uppercase text-[#94512F] hover:text-[#2A2521] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear filters</span>
            </button>
          )}
        </div>

        {/* Ideas Grid or Empty State */}
        {filteredIdeas.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {filteredIdeas.map((idea, index) => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                index={index}
                onSelect={(selected) => setSelectedIdea(selected)}
              />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center space-y-4 border border-[#E4DED6] bg-[#F1EDE8]/50 p-8">
            <SlidersHorizontal className="w-8 h-8 text-[#6B645E] mx-auto stroke-1" />
            <h3 className="font-serif text-2xl font-medium text-[#2A2521]">
              No concepts match your filters
            </h3>
            <p className="text-xs sm:text-sm text-[#6B645E] max-w-md mx-auto">
              Try adjusting the category or celebration selection to explore more ideas from the archive.
            </p>
            <div className="pt-2">
              <Button variant="secondary" size="sm" onClick={handleClearFilters}>
                Reset all filters
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Idea Detail Modal */}
      <IdeaDetailModal
        idea={selectedIdea}
        isOpen={Boolean(selectedIdea)}
        onClose={() => setSelectedIdea(null)}
      />
    </div>
  );
}

export default function IdeasPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FCFBF8] flex items-center justify-center">
          <div className="w-8 h-8 border border-[#E4DED6] border-t-[#A8603E] animate-spin" />
        </div>
      }
    >
      <IdeasContent />
    </Suspense>
  );
}
