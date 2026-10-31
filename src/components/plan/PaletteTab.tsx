'use client';

import { useState } from 'react';
import { PlanPartSource } from '@/types/firestore';
import { Card, Badge, EmptyState } from '@/components/ui';
import { Palette, Copy, Check } from 'lucide-react';

interface PaletteColor {
  color_name: string;
  hex: string;
  used_for: string;
  mood: string;
}

interface PaletteData {
  colors: PaletteColor[];
  why_it_fits: string;
}

interface PaletteTabProps {
  paletteData: PaletteData | null;
  source?: PlanPartSource;
  onGenerate: () => void;
  isLoading?: boolean;
}

export function PaletteTab({
  paletteData,
  source,
  onGenerate,
  isLoading = false,
}: PaletteTabProps) {
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  if (!paletteData || !paletteData.colors || paletteData.colors.length === 0) {
    return (
      <EmptyState
        icon={<Palette className="w-5 h-5 text-[#A8603E]" strokeWidth={1.5} />}
        title="No Color Palette Generated Yet"
        description="Maya will curate a harmonized 4-color palette reflecting your celebration heritage, aesthetic mood, and venue lighting."
        buttonLabel="Generate Palette with Maya"
        onAction={onGenerate}
        isLoading={isLoading}
      />
    );
  }

  const handleCopyHex = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <Card className="border border-[#E4DED6] bg-white p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-serif text-xl sm:text-2xl font-medium text-[#2A2521]">
                Celebration Color Palette
              </h3>
              {source === 'mock' && (
                <span className="px-2 py-0.5 bg-[#F2EDE4] border border-[#D5C7B5] text-[#94512F] text-[10px] font-mono tracking-wider uppercase font-bold">
                  Sample
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-[#6B645E]">
              4 coordinated hues curated for decor fabrics, stage floral arrangements, and attire coordination.
            </p>
          </div>

          <Badge variant="outline" size="md" className="self-start sm:self-auto font-micro">
            Click hex to copy
          </Badge>
        </div>
      </Card>

      {/* Large Square Color Swatches Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {paletteData.colors.map((color, idx) => (
          <div
            key={idx}
            className="bg-white border border-[#E4DED6] flex flex-col justify-between"
          >
            <div>
              {/* Large Square Color Swatch Block */}
              <div
                style={{ backgroundColor: color.hex }}
                className="w-full h-44 sm:h-52 relative group flex items-end p-4 border-b border-[#E4DED6]"
              >
                <button
                  onClick={() => handleCopyHex(color.hex)}
                  aria-label={`Copy hex code ${color.hex}`}
                  className="px-3 py-1.5 bg-[#2A2521]/80 hover:bg-[#2A2521] text-white text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-white"
                >
                  {copiedHex === color.hex ? (
                    <>
                      <Check className="w-3 h-3 text-[#A8603E]" strokeWidth={2} />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-white/80" strokeWidth={1.5} />
                      <span>{color.hex}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Swatch Details */}
              <div className="p-5 space-y-4">
                <div>
                  <h4 className="font-serif text-lg font-medium text-[#2A2521]">
                    {color.color_name}
                  </h4>
                  <span className="font-micro text-[11px] text-[#6B645E] tracking-[0.15em] uppercase block mt-0.5">
                    {color.hex}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="font-micro text-[10px] text-[#94512F] tracking-[0.2em] uppercase block">
                    APPLICATION
                  </span>
                  <p className="text-xs text-[#2A2521] leading-relaxed">
                    {color.used_for}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="font-micro text-[10px] text-[#6B645E] tracking-[0.2em] uppercase block">
                    ATMOSPHERE
                  </span>
                  <p className="text-xs text-[#6B645E] leading-relaxed italic">
                    {color.mood}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#FCFBF8] border-t border-[#E4DED6] flex items-center justify-between font-micro text-[10px] text-[#6B645E]">
              <span>SWATCH 0{idx + 1}</span>
              <span className="text-[#A8603E]">HARMONY</span>
            </div>
          </div>
        ))}
      </div>

      {/* Why it Fits Explanation Card */}
      {paletteData.why_it_fits && (
        <Card className="border border-[#E4DED6] bg-[#F1EDE8] p-6 space-y-2">
          <span className="font-micro text-[10px] text-[#94512F] tracking-[0.2em] uppercase block">
            MAYA'S PALETTE RATIONALE
          </span>
          <p className="text-xs sm:text-sm text-[#2A2521] leading-relaxed">
            {paletteData.why_it_fits}
          </p>
        </Card>
      )}
    </div>
  );
}
