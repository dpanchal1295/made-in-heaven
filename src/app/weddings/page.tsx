import { Metadata } from 'next';
import { THEMED_LANDING_CONFIGS } from '@/config/content';
import { ThemedLandingView } from '@/components/landing/ThemedLandingView';

export const metadata: Metadata = {
  title: 'Indian Weddings Planned with Maya | Made in Heaven',
  description: 'Plan Indian weddings together with Maya. Itemized budget by function in rupees, countdown timeline, vendor checklist, and family voting rooms.',
};

export default function WeddingsPage() {
  return <ThemedLandingView config={THEMED_LANDING_CONFIGS.wedding} />;
}

