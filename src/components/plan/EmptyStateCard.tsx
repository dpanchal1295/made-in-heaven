'use client';

import { EmptyState } from '@/components/ui/EmptyState';

interface EmptyStateCardProps {
  icon: string;
  title: string;
  description: string;
  buttonLabel?: string;
  onGenerate: () => void;
  isLoading?: boolean;
}

export function EmptyStateCard({
  icon,
  title,
  description,
  buttonLabel = 'Generate with Maya',
  onGenerate,
  isLoading = false,
}: EmptyStateCardProps) {
  return (
    <EmptyState
      icon={icon}
      title={title}
      description={description}
      buttonLabel={buttonLabel}
      onAction={onGenerate}
      isLoading={isLoading}
    />
  );
}
