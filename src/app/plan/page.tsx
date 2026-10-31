'use client';

import { useState, useEffect, useCallback } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PlanSummaryStrip } from '@/components/plan/PlanSummaryStrip';
import { BudgetTab } from '@/components/plan/BudgetTab';
import { TimelineTab } from '@/components/plan/TimelineTab';
import { ChecklistTab } from '@/components/plan/ChecklistTab';
import { PaletteTab } from '@/components/plan/PaletteTab';
import { DecorTab } from '@/components/plan/DecorTab';
import { AttireTab } from '@/components/plan/AttireTab';
import { Tabs, TabList, TabTrigger, TabContent, Toast } from '@/components/ui';
import { WeddingPlan } from '@/types/firestore';
import { CateringFunctionPlateEstimate, MOCK_CATERING_BREAKDOWN } from '@/lib/maya/fixtures';
import { useAuth } from '@/lib/auth/AuthContext';
import { ReplanPanel } from '@/components/plan/ReplanPanel';

import { Wallet, Clock, CheckSquare, Palette, Sparkles, Shirt, RefreshCw } from 'lucide-react';

type PlanTabKey = 'budget' | 'timeline' | 'checklist' | 'palette' | 'decor' | 'attire';

interface TabConfig {
  key: PlanTabKey;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}

const TABS: TabConfig[] = [
  { key: 'budget', label: 'Budget', icon: Wallet },
  { key: 'timeline', label: 'Timeline', icon: Clock },
  { key: 'checklist', label: 'Checklist', icon: CheckSquare },
  { key: 'palette', label: 'Palette', icon: Palette },
  { key: 'decor', label: 'Decor', icon: Sparkles },
  { key: 'attire', label: 'Attire', icon: Shirt },
];

export default function PlanPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<PlanTabKey>('budget');
  const [plan, setPlan] = useState<WeddingPlan | null>(null);
  const [cateringBreakdown, setCateringBreakdown] = useState<CateringFunctionPlateEstimate[]>(MOCK_CATERING_BREAKDOWN);
  const [profile, setProfile] = useState<any>(null);
  const [budget, setBudget] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingTab, setIsGeneratingTab] = useState(false);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [isReplanOpen, setIsReplanOpen] = useState(false);
  const [isApplyingReplan, setIsApplyingReplan] = useState(false);
  const [replanChanges, setReplanChanges] = useState<Array<{ part: string; what_changed: string; why: string }> | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  // Load plan state from /api/maya/plan
  const fetchPlanState = useCallback(async () => {
    try {
      if (!user?.homeId) {
        setIsLoading(false);
        return;
      }
      const homeId = user.homeId;
      const uid = user.uid;
      const res = await fetch(`/api/maya/plan?homeId=${homeId}&uid=${uid}`, {
        headers: {
          'x-member-uid': uid,
          'x-home-id': homeId,
        },
      });
      const data = await res.json();
      if (data.success) {
        setPlan(data.plan);
        setProfile(data.profile);
        setBudget(data.budget);
        if (data.cateringBreakdown) {
          setCateringBreakdown(data.cateringBreakdown);
        }
      }
    } catch (err) {
      console.error('Failed to load plan state:', err);
      showToast('Could not load wedding plan state', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPlanState();
  }, [fetchPlanState]);

  // Generate a single plan part
  const handleGeneratePart = async (part: PlanTabKey) => {
    setIsGeneratingTab(true);
    try {
      if (!user?.homeId) {
        setIsLoading(false);
        return;
      }
      const homeId = user.homeId;
      const uid = user.uid;
      const res = await fetch('/api/maya/plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-member-uid': uid,
          'x-home-id': homeId,
        },
        body: JSON.stringify({ part, homeId, uid }),
      });
      const data = await res.json();
      if (data.success && data.plan) {
        setPlan(data.plan);
        showToast(`Generated ${part.toUpperCase()} plan with Maya!`);
      } else {
        showToast(data.error || 'Failed to generate plan part', 'error');
      }
    } catch (err) {
      console.error(`Error generating ${part}:`, err);
      showToast('Network error while generating plan part', 'error');
    } finally {
      setIsGeneratingTab(false);
    }
  };

  // Generate all 6 parts
  const handleGenerateAll = async () => {
    setIsGeneratingAll(true);
    try {
      if (!user?.homeId) {
        setIsLoading(false);
        return;
      }
      const homeId = user.homeId;
      const uid = user.uid;
      const res = await fetch('/api/maya/plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-member-uid': uid,
          'x-home-id': homeId,
        },
        body: JSON.stringify({ part: 'all', homeId, uid }),
      });
      const data = await res.json();
      if (data.success && data.plan) {
        setPlan(data.plan);
        showToast('Full wedding plan generated across all 6 tabs!');
      } else {
        showToast(data.error || 'Failed to generate full plan', 'error');
      }
    } catch (err) {
      console.error('Error generating all parts:', err);
      showToast('Network error generating full plan', 'error');
    } finally {
      setIsGeneratingAll(false);
    }
  };

  // Toggle checklist vendor item
  const handleToggleChecklist = async (vendorType: string, isBooked: boolean) => {
    try {
      if (!user?.homeId) {
        setIsLoading(false);
        return;
      }
      const homeId = user.homeId;
      const uid = user.uid;
      const res = await fetch('/api/maya/plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-member-uid': uid,
          'x-home-id': homeId,
        },
        body: JSON.stringify({ toggleVendor: vendorType, booked: isBooked, homeId, uid }),
      });
      const data = await res.json();
      if (data.success && data.plan) {
        setPlan(data.plan);
      }
    } catch (err) {
      console.error('Error toggling checklist item:', err);
      showToast('Could not save vendor status', 'error');
    }
  };

  // Re-plan trigger (POST /api/maya/replan)
  const handleApplyReplan = async (change: { path: string; value: any }) => {
    setIsApplyingReplan(true);
    try {
      const res = await fetch('/api/maya/replan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ change }),
      });
      const data = await res.json();
      if (data.success && data.plan) {
        setPlan(data.plan);
        if (data.changes) {
          setReplanChanges(data.changes);
        }
        setIsReplanOpen(false);
        showToast('Wedding plan adapted successfully! See summary of changes below.', 'success');
        // Refresh profile & budget
        await fetchPlanState();
      } else {
        showToast(data.error || 'Failed to apply re-plan changes', 'error');
      }
    } catch (err) {
      console.error('Error applying replan:', err);
      showToast('Network error executing replan', 'error');
    } finally {
      setIsApplyingReplan(false);
    }
  };

  // Clear plan
  const handleClearPlan = async () => {
    try {
      if (!user?.homeId) {
        setIsLoading(false);
        return;
      }
      const homeId = user.homeId;
      const uid = user.uid;
      const res = await fetch('/api/maya/plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-member-uid': uid,
          'x-home-id': homeId,
        },
        body: JSON.stringify({ action: 'clear', homeId, uid }),
      });
      const data = await res.json();
      if (data.success && data.plan) {
        setPlan(data.plan);
        showToast('Plan cleared. You can now generate fresh parts anytime!');
      } else {
        showToast(data.error || 'Could not clear plan', 'error');
      }
    } catch (err) {
      console.error('Error clearing plan:', err);
      showToast('Could not clear plan', 'error');
    }
  };

  const weddingDate = profile?.date || null;
  const totalBudget = budget?.planning_value || budget?.total || null;
  const budgetRange = budget?.range || null;
  const guestCount = profile?.guest_count?.planning_value || profile?.guest_count?.estimate || null;
  const city = profile?.city || null;
  const canSeeBudget = user?.canSeeBudget ?? true;

  const isCouple = user?.permission === 'couple';
  const changedTabKeys = replanChanges ? replanChanges.map((c) => c.part.toLowerCase()) : [];

  return (
    <AppShell
      currentTab="plan"
      headerSlot={
        <PlanSummaryStrip
          weddingDate={weddingDate}
          totalBudget={totalBudget}
          budgetRange={budgetRange}
          guestCount={guestCount}
          city={city}
          canSeeBudget={canSeeBudget}
          plan={plan}
          onClearPlan={handleClearPlan}
          onGenerateAll={handleGenerateAll}
          isGeneratingAll={isGeneratingAll}
          onOpenReplan={() => setIsReplanOpen(true)}
          isCouple={isCouple}
        />
      }
    >
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Main Content & Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full space-y-6">
        {/* Replan Drawer/Panel */}
        {isCouple && (
          <ReplanPanel
            isOpen={isReplanOpen}
            onClose={() => setIsReplanOpen(false)}
            initialGuests={guestCount}
            initialBudget={totalBudget}
            onApplyReplan={handleApplyReplan}
            isApplying={isApplyingReplan}
          />
        )}

        {/* What Changed and Why Summary Banner */}
        {replanChanges && replanChanges.length > 0 && (
          <div className="p-5 bg-[#FCFBF8] border-2 border-[#94512F] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#94512F]" strokeWidth={1.5} />
                <span className="font-micro text-[11px] uppercase tracking-[0.2em] text-[#94512F] font-bold">
                  WHAT CHANGED AND WHY
                </span>
              </div>
              <button
                type="button"
                onClick={() => setReplanChanges(null)}
                className="text-xs text-[#6B645E] hover:text-[#2A2521] underline"
              >
                Dismiss summary
              </button>
            </div>
            <p className="text-xs text-[#6B645E]">
              Maya has adapted your wedding plan. Tabs with updated items are highlighted below:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {replanChanges.map((change, idx) => (
                <div key={idx} className="p-3 bg-white border border-[#E4DED6] text-xs space-y-1">
                  <span className="font-serif font-medium text-[#2A2521] capitalize block">
                    {change.part} Tab Updated
                  </span>
                  <div className="text-[#2A2521] font-medium">
                    {change.what_changed}
                  </div>
                  <div className="text-[#6B645E] italic">
                    Reason: {change.why}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as PlanTabKey)}>
          <TabList>
            {TABS.map((tab) => {
              const partObj = plan ? (plan as any)[tab.key] : null;
              const isGenerated = Boolean(partObj && partObj.data);
              const isMock = partObj?.source === 'mock';
              const isTabChanged = changedTabKeys.includes(tab.key);

              return (
                <TabTrigger
                  key={tab.key}
                  value={tab.key}
                  icon={<tab.icon className={`w-3.5 h-3.5 ${isTabChanged ? 'text-[#94512F]' : ''}`} strokeWidth={1.5} />}
                  badge={
                    isTabChanged ? (
                      <span
                        className="px-1.5 py-0.2 bg-[#94512F] text-white text-[9px] font-mono tracking-wider uppercase font-semibold"
                        title="Updated in recent replan"
                      >
                        Updated
                      </span>
                    ) : isGenerated ? (
                      isMock ? (
                        <span
                          className="px-1.5 py-0.5 bg-[#F2EDE4] border border-[#D5C7B5] text-[#94512F] text-[9px] font-mono tracking-wider uppercase font-bold"
                          title="Sample fixture fallback"
                        >
                          Sample
                        </span>
                      ) : (
                        <span
                          className="w-1.5 h-1.5 bg-[#2A2521]"
                          title="Live Gemini data"
                        />
                      )
                    ) : undefined
                  }
                >
                  <span className={isTabChanged ? 'text-[#94512F] font-semibold' : ''}>
                    {tab.label}
                  </span>
                </TabTrigger>
              );
            })}
          </TabList>

          {/* Tab Content Display */}
          {isLoading ? (
            <div className="py-20 text-center space-y-3">
              <div className="inline-block animate-spin text-[#94512F]">
                <Clock className="w-6 h-6" strokeWidth={1.5} />
              </div>
              <p className="font-micro text-xs uppercase tracking-[0.15em] text-[#6B645E]">
                Loading your wedding plan details...
              </p>
            </div>
          ) : (
            <div className="py-2">
              <TabContent value="budget">
                {!canSeeBudget ? (
                  <div className="py-16 text-center space-y-3 max-w-md mx-auto p-8 bg-white border border-[#E4DED6]">
                    <div className="flex justify-center">
                      <Wallet className="w-8 h-8 text-[#94512F]" strokeWidth={1.5} />
                    </div>
                    <h3 className="font-serif text-lg font-medium text-[#2A2521]">Budget Plan is Private</h3>
                    <p className="text-xs text-[#6B645E] leading-relaxed">
                      You are signed in as {user?.name} ({user?.relationship}). Detailed rupee budgets are accessible only to the couple.
                    </p>
                  </div>
                ) : (
                  <BudgetTab
                    budgetData={plan?.budget?.data || null}
                    cateringBreakdown={cateringBreakdown}
                    source={plan?.budget?.source}
                    totalBudget={totalBudget}
                    budgetRange={budgetRange}
                    onGenerate={() => handleGeneratePart('budget')}
                    isLoading={isGeneratingTab}
                  />
                )}
              </TabContent>

              <TabContent value="timeline">
                <TimelineTab
                  timelineData={plan?.timeline?.data || null}
                  source={plan?.timeline?.source}
                  weddingDate={weddingDate}
                  onGenerate={() => handleGeneratePart('timeline')}
                  isLoading={isGeneratingTab}
                />
              </TabContent>

              <TabContent value="checklist">
                <ChecklistTab
                  checklistData={plan?.checklist?.data || null}
                  bookedVendors={plan?.bookedVendors || {}}
                  source={plan?.checklist?.source}
                  onToggleBooked={handleToggleChecklist}
                  onGenerate={() => handleGeneratePart('checklist')}
                  isLoading={isGeneratingTab}
                />
              </TabContent>

              <TabContent value="palette">
                <PaletteTab
                  paletteData={plan?.palette?.data || null}
                  source={plan?.palette?.source}
                  onGenerate={() => handleGeneratePart('palette')}
                  isLoading={isGeneratingTab}
                />
              </TabContent>

              <TabContent value="decor">
                <DecorTab
                  decorData={plan?.decor?.data || null}
                  source={plan?.decor?.source}
                  onGenerate={() => handleGeneratePart('decor')}
                  isLoading={isGeneratingTab}
                />
              </TabContent>

              <TabContent value="attire">
                <AttireTab
                  attireData={plan?.attire?.data || null}
                  source={plan?.attire?.source}
                  onGenerate={() => handleGeneratePart('attire')}
                  isLoading={isGeneratingTab}
                />
              </TabContent>
            </div>
          )}
        </Tabs>
      </div>
    </AppShell>
  );
}
