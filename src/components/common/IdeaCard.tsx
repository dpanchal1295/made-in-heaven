'use client';

import React from 'react';
import { ExampleIdea } from '@/data/exampleIdeas';
import { Photo } from '@/components/common/Photo';

export interface IdeaCardProps {
  idea: ExampleIdea;
  index?: number;
  onSelect: (idea: ExampleIdea) => void;
  badgeTone?: 'terracotta' | 'charcoal';
}

export function IdeaCard({ idea, index = 0, onSelect, badgeTone }: IdeaCardProps) {
  // Alternating badge tone if not explicitly passed
  const tone = badgeTone || (index % 2 === 0 ? 'terracotta' : 'charcoal');

  return (
    <article
      onClick={() => onSelect(idea)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(idea);
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`View details for ${idea.name}`}
      className="group relative flex flex-col bg-white border border-[#E4DED6] overflow-hidden text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-[#A8603E] focus-visible:outline-offset-2 transition-shadow hover:shadow-sm"
    >
      {/* 4:5 Tall Photo Container with badges and hover overlay */}
      <div className="relative overflow-hidden w-full aspect-[4/5] bg-[#E9E3DB]">
        <Photo
          imageKey={idea.imageKey}
          aspectRatio="tall"
          hoverZoom
          className="w-full h-full"
        />

        {/* Small square celebration badge on the image */}
        <div className="absolute top-3 left-3 z-10">
          <span
            className={`font-micro text-[10px] tracking-[0.15em] uppercase px-2 py-1 font-medium shadow-xs ${
              tone === 'terracotta'
                ? 'bg-[#A8603E] text-white'
                : 'bg-[#2A2521] text-white'
            }`}
          >
            {idea.celebration}
          </span>
        </div>

        {/* Translucent "VIEW DETAILS" bar across bottom of image on hover */}
        <div className="absolute bottom-0 inset-x-0 z-10 bg-[#2A2521]/80 backdrop-blur-xs py-2.5 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="font-nav text-[10px] text-white tracking-[0.2em] uppercase font-medium">
            VIEW DETAILS
          </span>
        </div>
      </div>

      {/* Card Content Block */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1.5">
          <span className="font-micro text-[10px] text-[#94512F] tracking-[0.2em] uppercase block font-semibold">
            {idea.category}
          </span>
          <h3 className="font-serif text-lg font-medium text-[#2A2521] leading-snug group-hover:text-[#A8603E] transition-colors line-clamp-2">
            {idea.name}
          </h3>
          <p className="text-xs text-[#6B645E] line-clamp-1">
            {idea.oneLine}
          </p>
        </div>

        {/* Meta row: cost tier | hairline divider | celebration name */}
        <div className="pt-3 border-t border-[#E4DED6] flex items-center text-xs text-[#6B645E]">
          <span className="font-medium text-[#2A2521] tracking-wide">{idea.costTier}</span>
          <span className="w-px h-3 bg-[#E4DED6] mx-2 inline-block" />
          <span className="truncate">{idea.celebration} Ceremony</span>
        </div>
      </div>
    </article>
  );
}
