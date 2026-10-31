'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Sparkles, Calendar, Users, Settings } from 'lucide-react';

export function MobileBottomNav() {
  const pathname = usePathname();

  const isHome = pathname === '/home';
  const isChat = pathname.startsWith('/chat');
  const isPlan = pathname.startsWith('/plan');
  const isFamily = pathname.startsWith('/family');
  const isSettings = pathname.startsWith('/settings');

  const navItems = [
    {
      href: '/home',
      label: 'Home',
      icon: Home,
      isActive: isHome,
    },
    {
      href: '/chat',
      label: 'Maya',
      icon: Sparkles,
      isActive: isChat,
    },
    {
      href: '/plan',
      label: 'Plan',
      icon: Calendar,
      isActive: isPlan,
    },
    {
      href: '/family',
      label: 'Family',
      icon: Users,
      isActive: isFamily,
    },
    {
      href: '/settings',
      label: 'Settings',
      icon: Settings,
      isActive: isSettings,
    },
  ];

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="fixed bottom-0 inset-x-0 z-40 bg-[#FCFBF8] border-t border-[#E4DED6] px-1 py-0 rounded-none md:hidden"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-none transition-colors min-w-[56px] min-h-[50px] focus-visible:outline-2 focus-visible:outline-[#A8603E] ${
                item.isActive
                  ? 'text-[#2A2521] border-t-2 border-[#2A2521] -mt-[1px]'
                  : 'text-[#6B645E] hover:text-[#2A2521] border-t-2 border-transparent'
              }`}
            >
              <IconComponent
                className={`w-4 h-4 transition-transform ${item.isActive ? 'text-[#2A2521]' : 'text-[#6B645E]'}`}
                strokeWidth={1.5}
              />
              <span
                className={`font-micro text-[9px] tracking-[0.15em] uppercase mt-1 leading-none ${
                  item.isActive ? 'text-[#2A2521] font-semibold' : 'text-[#6B645E]'
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
