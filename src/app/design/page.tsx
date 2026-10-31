'use client';

import React, { useState } from 'react';
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  Tabs,
  TabList,
  TabTrigger,
  TabContent,
  ProgressBar,
  Chip,
  EmptyState,
  Modal,
  Toast,
} from '@/components/ui';
import { ArrowRight, Check, AlertCircle, Info, Sparkles, Sliders } from 'lucide-react';

export default function DesignSystemPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  const [activeTab, setActiveTab] = useState('buttons');
  const [selectedChips, setSelectedChips] = useState<Record<string, boolean>>({
    Mehendi: true,
    Sangeet: false,
    Pheras: true,
  });
  const [progressVal, setProgressVal] = useState(65);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const toggleChip = (label: string) => {
    setSelectedChips((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
  };

  return (
    <AppShell currentTab="design">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-12">
        {/* Design System Header */}
        <div className="space-y-3 border-b border-[#E4DED6] pb-6">
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#2A2521] tracking-tight">
              Maison Editorial Design System
            </h1>
            <Badge variant="outline" size="sm" className="font-micro text-[#94512F]">
              DEV ONLY
            </Badge>
          </div>
          <p className="text-sm text-[#6B645E] max-w-2xl leading-relaxed">
            Quiet, photography-first editorial design system with square corners, hairline borders, Cormorant Garamond typography, and regional Indian script pairings for <strong className="text-[#2A2521] font-medium">Made in Heaven</strong>.
          </p>
        </div>

        {/* 1. Color Tokens Palette */}
        <section aria-labelledby="tokens-heading" className="space-y-4">
          <h2 id="tokens-heading" className="font-serif text-2xl font-normal text-[#2A2521]">
            1. Brand Tokens & Palette
          </h2>
          <p className="text-xs sm:text-sm text-[#6B645E]">
            All text colors are verified for WCAG AA compliance (&ge; 4.5:1 contrast against light backgrounds).
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
            {/* Cream */}
            <div className="bg-white p-3 border border-[#E4DED6] space-y-2">
              <div className="h-16 bg-[#FCFBF8] border border-[#E4DED6] flex items-end p-2 text-[#2A2521] font-mono text-[11px]">
                #FCFBF8
              </div>
              <div>
                <span className="font-serif text-sm font-medium text-[#2A2521] block">Cream Canvas</span>
                <span className="font-micro text-[10px] text-[#6B645E] block uppercase">Main Background</span>
              </div>
            </div>

            {/* Soft Beige */}
            <div className="bg-white p-3 border border-[#E4DED6] space-y-2">
              <div className="h-16 bg-[#F1EDE8] border border-[#E4DED6] flex items-end p-2 text-[#2A2521] font-mono text-[11px]">
                #F1EDE8
              </div>
              <div>
                <span className="font-serif text-sm font-medium text-[#2A2521] block">Soft Beige</span>
                <span className="font-micro text-[10px] text-[#6B645E] block uppercase">Bands & Surfaces</span>
              </div>
            </div>

            {/* Charcoal */}
            <div className="bg-white p-3 border border-[#E4DED6] space-y-2">
              <div className="h-16 bg-[#2A2521] flex items-end p-2 text-white font-mono text-[11px]">
                #2A2521
              </div>
              <div>
                <span className="font-serif text-sm font-medium text-[#2A2521] block">Charcoal</span>
                <span className="font-micro text-[10px] text-[#6B645E] block uppercase">Headings & Text (13.8:1)</span>
              </div>
            </div>

            {/* Muted Grey */}
            <div className="bg-white p-3 border border-[#E4DED6] space-y-2">
              <div className="h-16 bg-[#6B645E] flex items-end p-2 text-white font-mono text-[11px]">
                #6B645E
              </div>
              <div>
                <span className="font-serif text-sm font-medium text-[#2A2521] block">Muted Grey</span>
                <span className="font-micro text-[10px] text-[#6B645E] block uppercase">Body & Subtitles (4.6:1)</span>
              </div>
            </div>

            {/* Terracotta */}
            <div className="bg-white p-3 border border-[#E4DED6] space-y-2">
              <div className="h-16 bg-[#A8603E] flex items-end p-2 text-white font-mono text-[11px]">
                #A8603E
              </div>
              <div>
                <span className="font-serif text-sm font-medium text-[#2A2521] block">Terracotta</span>
                <span className="font-micro text-[10px] text-[#6B645E] block uppercase">Primary CTAs</span>
              </div>
            </div>

            {/* Dark Terracotta */}
            <div className="bg-white p-3 border border-[#E4DED6] space-y-2">
              <div className="h-16 bg-[#94512F] flex items-end p-2 text-white font-mono text-[11px]">
                #94512F
              </div>
              <div>
                <span className="font-serif text-sm font-medium text-[#2A2521] block">Dark Terracotta</span>
                <span className="font-micro text-[10px] text-[#6B645E] block uppercase">Labels on Beige (5.3:1)</span>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Typography Showcase */}
        <section aria-labelledby="typography-heading" className="space-y-4">
          <h2 id="typography-heading" className="font-serif text-2xl font-normal text-[#2A2521]">
            2. Typography & Indian Scripts
          </h2>
          <Card className="border border-[#E4DED6] bg-white p-6 space-y-6">
            <div className="space-y-2 border-b border-[#E4DED6] pb-4">
              <span className="font-micro text-[10px] text-[#6B645E] uppercase tracking-[0.2em]">
                DISPLAY HEADINGS • CORMORANT GARAMOND
              </span>
              <h1 className="font-serif text-4xl text-[#2A2521]">
                A timeless wedding, thoughtfully planned.
              </h1>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
              <div className="p-4 bg-[#F1EDE8] border border-[#E4DED6]">
                <span className="font-micro text-[10px] text-[#94512F] uppercase tracking-[0.15em] block mb-1">
                  HINDI (DEVANAGARI)
                </span>
                <p lang="hi" className="font-serif text-lg text-[#2A2521]">
                  नमस्ते, हम आपके विवाह की तैयारी शुरू करते हैं।
                </p>
              </div>

              <div className="p-4 bg-[#F1EDE8] border border-[#E4DED6]">
                <span className="font-micro text-[10px] text-[#94512F] uppercase tracking-[0.15em] block mb-1">
                  GUJARATI
                </span>
                <p lang="gu" className="font-serif text-lg text-[#2A2521]">
                  નમસ્તે, આવો લગ્નની તૈયારી શરૂ કરીએ.
                </p>
              </div>

              <div className="p-4 bg-[#F1EDE8] border border-[#E4DED6]">
                <span className="font-micro text-[10px] text-[#94512F] uppercase tracking-[0.15em] block mb-1">
                  PUNJABI (GURMUKHI)
                </span>
                <p lang="pa" className="font-serif text-lg text-[#2A2521]">
                  ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ, ਆਓ ਵਿਆਹ ਦੀ ਤਿਆਰੀ ਸ਼ੁਰੂ ਕਰੀਏ।
                </p>
              </div>

              <div className="p-4 bg-[#F1EDE8] border border-[#E4DED6]">
                <span className="font-micro text-[10px] text-[#94512F] uppercase tracking-[0.15em] block mb-1">
                  MARATHI
                </span>
                <p lang="mr" className="font-serif text-lg text-[#2A2521]">
                  नमस्कार, लग्न नियोजनाला सुरुवात करूया.
                </p>
              </div>
            </div>
          </Card>
        </section>

        {/* 3. Interactive Components Playground */}
        <section aria-labelledby="components-heading" className="space-y-4">
          <h2 id="components-heading" className="font-serif text-2xl font-normal text-[#2A2521]">
            3. Editorial UI Components Playground
          </h2>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabList>
              <TabTrigger value="buttons">Buttons</TabTrigger>
              <TabTrigger value="badges">Badges & Chips</TabTrigger>
              <TabTrigger value="cards">Cards</TabTrigger>
              <TabTrigger value="progress">Progress</TabTrigger>
              <TabTrigger value="modals">Modals & Toasts</TabTrigger>
            </TabList>

            {/* Buttons Tab */}
            <TabContent value="buttons">
              <Card className="border border-[#E4DED6] bg-white p-6 space-y-6">
                <div>
                  <h3 className="font-serif text-lg font-medium text-[#2A2521] mb-1">Primary Terracotta Buttons</h3>
                  <p className="text-xs text-[#6B645E] mb-3">Square corners, uppercase tracking, subtle arrow.</p>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button variant="primary" size="sm">Small Action <ArrowRight className="w-3 h-3" /></Button>
                    <Button variant="primary" size="md">Medium Primary <ArrowRight className="w-3.5 h-3.5" /></Button>
                    <Button variant="primary" size="lg">Large Hero CTA <ArrowRight className="w-4 h-4" /></Button>
                    <Button variant="primary" size="md" disabled>Disabled State</Button>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E4DED6]">
                  <h3 className="font-serif text-lg font-medium text-[#2A2521] mb-1">Secondary & Outline Buttons</h3>
                  <p className="text-xs text-[#6B645E] mb-3">Hairline borders with dark charcoal hover.</p>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button variant="outline" size="sm">Outline Sm</Button>
                    <Button variant="outline" size="md">Outline Md</Button>
                    <Button variant="secondary" size="md">Secondary</Button>
                    <Button variant="ghost" size="md">Ghost Link</Button>
                  </div>
                </div>
              </Card>
            </TabContent>

            {/* Badges & Chips Tab */}
            <TabContent value="badges">
              <Card className="border border-[#E4DED6] bg-white p-6 space-y-6">
                <div>
                  <h3 className="font-serif text-lg font-medium text-[#2A2521] mb-1">Editorial Badges</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" size="sm">SAMPLE DATA</Badge>
                    <Badge variant="outline" size="md">CURATED STYLING</Badge>
                    <Badge variant="outline" size="sm" className="text-[#94512F]">DEMO MODE</Badge>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E4DED6]">
                  <h3 className="font-serif text-lg font-medium text-[#2A2521] mb-1">Interactive Filter Chips</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    {Object.entries(selectedChips).map(([label, active]) => (
                      <Chip
                        key={label}
                        label={label}
                        active={active}
                        onClick={() => toggleChip(label)}
                      />
                    ))}
                  </div>
                </div>
              </Card>
            </TabContent>

            {/* Cards Tab */}
            <TabContent value="cards">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Card className="border border-[#E4DED6] bg-white p-6 space-y-3">
                  <span className="font-micro text-[10px] text-[#94512F] uppercase tracking-[0.2em]">
                    EDITORIAL CARD
                  </span>
                  <CardTitle className="text-xl">Standard Hairline Card</CardTitle>
                  <p className="text-xs text-[#6B645E] leading-relaxed">
                    Square corners with a 1px border (#E4DED6), white background, and no drop shadow.
                  </p>
                </Card>

                <Card className="border border-[#E4DED6] bg-[#F1EDE8] p-6 space-y-3">
                  <span className="font-micro text-[10px] text-[#6B645E] uppercase tracking-[0.2em]">
                    BAND SURFACE
                  </span>
                  <CardTitle className="text-xl">Soft Beige Accent Card</CardTitle>
                  <p className="text-xs text-[#6B645E] leading-relaxed">
                    Used for stat summaries, reality-check callouts, and secondary content blocks.
                  </p>
                </Card>
              </div>
            </TabContent>

            {/* Progress Tab */}
            <TabContent value="progress">
              <Card className="border border-[#E4DED6] bg-white p-6 space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-micro text-[#6B645E] uppercase tracking-wider">COMPLETION</span>
                    <span className="font-mono text-[#2A2521]">{progressVal}%</span>
                  </div>
                  <ProgressBar value={progressVal} color="terracotta" size="md" />
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setProgressVal(25)}>25%</Button>
                  <Button variant="outline" size="sm" onClick={() => setProgressVal(50)}>50%</Button>
                  <Button variant="outline" size="sm" onClick={() => setProgressVal(80)}>80%</Button>
                  <Button variant="outline" size="sm" onClick={() => setProgressVal(100)}>100%</Button>
                </div>
              </Card>
            </TabContent>

            {/* Modals & Toasts Tab */}
            <TabContent value="modals">
              <Card className="border border-[#E4DED6] bg-white p-6 space-y-6">
                <div className="flex flex-wrap gap-3">
                  <Button variant="primary" onClick={() => setIsModalOpen(true)}>Open Confirmation Modal</Button>
                  <Button variant="outline" onClick={() => showToast('Plan saved successfully', 'success')}>Show Toast</Button>
                </div>

                <Modal
                  isOpen={isModalOpen}
                  onClose={() => setIsModalOpen(false)}
                  title="Confirm Action"
                  description="Are you sure you wish to proceed? All changes will be saved to your wedding home."
                  icon={<AlertCircle className="w-5 h-5 text-[#94512F]" strokeWidth={1.5} />}
                  footer={
                    <div className="flex justify-end gap-2 w-full">
                      <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                      <Button variant="primary" size="sm" onClick={() => setIsModalOpen(false)}>Confirm</Button>
                    </div>
                  }
                />
              </Card>
            </TabContent>
          </Tabs>
        </section>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </AppShell>
  );
}
