import { Metadata } from 'next';
import { THEMED_LANDING_CONFIGS } from '@/config/content';
import { ThemedLandingView } from '@/components/landing/ThemedLandingView';

export const metadata: Metadata = {
  title: 'Community Events & Society Garba | Made in Heaven',
  description: 'Organize Navratri Garba, Ganesh Utsav, Diwali Mela and society fests with Maya. Footfall planning, pandal layouts, permits, and volunteers.',
};

export default function CommunityPage() {
  return <ThemedLandingView config={THEMED_LANDING_CONFIGS.community} />;
}

