'use client';

import React, { createContext, useContext } from 'react';

interface TabsContextValue {
  activeTab: string;
  onChange: (tab: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

export interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  children: React.ReactNode;
}

export function Tabs({ value, onValueChange, className = '', children }: TabsProps) {
  return (
    <TabsContext.Provider value={{ activeTab: value, onChange: onValueChange }}>
      <div className={`space-y-4 ${className}`}>{children}</div>
    </TabsContext.Provider>
  );
}

export type TabListProps = React.HTMLAttributes<HTMLDivElement>;

export function TabList({ className = '', children, ...props }: TabListProps) {
  return (
    <div
      role="tablist"
      className={`flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-[#E4DED6] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export interface TabTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
}

export function TabTrigger({
  value,
  icon,
  badge,
  className = '',
  children,
  ...props
}: TabTriggerProps) {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('TabTrigger must be used inside Tabs');

  const isActive = ctx.activeTab === value;

  return (
    <button
      role="tab"
      type="button"
      aria-selected={isActive}
      onClick={() => ctx.onChange(value)}
      className={`flex items-center gap-2 px-4 py-2 text-[11px] sm:text-[12px] font-nav transition-colors duration-200 cursor-pointer whitespace-nowrap rounded-none select-none tracking-[0.15em] uppercase focus-visible:outline-2 focus-visible:outline-[#A8603E] focus-visible:outline-offset-2 ${
        isActive
          ? 'bg-[#2A2521] text-white border border-[#2A2521]'
          : 'bg-transparent text-[#6B645E] hover:text-[#2A2521] border border-[#E4DED6] hover:border-[#2A2521]'
      } ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
      {badge && <span className="shrink-0">{badge}</span>}
    </button>
  );
}

export interface TabContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export function TabContent({ value, className = '', children, ...props }: TabContentProps) {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('TabContent must be used inside Tabs');

  if (ctx.activeTab !== value) return null;

  return (
    <div
      role="tabpanel"
      className={`focus-visible:outline-none ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
