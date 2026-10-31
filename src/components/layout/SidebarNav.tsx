'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { Badge } from '@/components/ui/Badge';

export function SidebarNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const isHome = pathname === '/home';
  const isChat = pathname.startsWith('/chat');
  const isPlan = pathname.startsWith('/plan');
  const isFamily = pathname.startsWith('/family');
  const isSettings = pathname.startsWith('/settings');

  const navItems = [
    {
      href: '/home',
      label: 'Home',
      icon: '🏠',
      isActive: isHome,
    },
    {
      href: '/chat',
      label: 'Maya',
      icon: '💬',
      isActive: isChat,
    },
    {
      href: '/plan',
      label: 'Plan',
      icon: '📋',
      isActive: isPlan,
    },
    {
      href: '/family',
      label: 'Family',
      icon: '👨‍👩‍👧‍👦',
      isActive: isFamily,
    },
    {
      href: '/settings',
      label: 'Settings',
      icon: '⚙️',
      isActive: isSettings,
    },
  ];

  return (
    <aside
      aria-label="Desktop Sidebar Navigation"
      className="hidden md:flex flex-col w-64 shrink-0 bg-white border-r border-[#D4AF37]/30 h-screen sticky top-0 shadow-xs z-30"
    >
      {/* Brand Header */}
      <div className="p-6 border-b border-[#FDE68A]/50">
        <Link
          href="/home"
          className="flex items-center gap-3 hover:opacity-90 transition-opacity focus-visible:ring-2 focus-visible:ring-[#881337] rounded-lg outline-hidden"
        >
          <span className="text-2xl" aria-hidden="true">
            ✨
          </span>
          <div>
            <span className="font-serif text-xl font-bold tracking-tight text-[#881337] block leading-none">
              Made in Heaven
            </span>
            <span className="text-[10px] text-[#B45309] font-sans tracking-wider block uppercase font-semibold mt-1">
              AI Wedding Manager
            </span>
          </div>
        </Link>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all min-h-[48px] focus-visible:ring-2 focus-visible:ring-[#881337] outline-hidden ${
              item.isActive
                ? 'bg-gradient-to-r from-[#881337] to-[#9F1239] text-white shadow-sm font-bold'
                : 'text-[#57534E] hover:text-[#1C1917] hover:bg-[#FFFBEB]'
            }`}
          >
            <span className={`text-xl transition-transform ${item.isActive ? 'scale-110' : ''}`}>
              {item.icon}
            </span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Current Member Profile Footer */}
      {user && (
        <div className="p-4 border-t border-[#FDE68A]/50 bg-[#FDFBF7]">
          <Link
            href="/settings"
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#FFFBEB] transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-[#881337] text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
              {user.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-[#1C1917] truncate">{user.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] text-[#78716C] capitalize">{user.relationship}</span>
                <span className="text-[#D4AF37]">•</span>
                <span className="text-[10px] text-[#B45309] font-medium uppercase tracking-wider">
                  {user.permission}
                </span>
              </div>
            </div>
          </Link>
        </div>
      )}
    </aside>
  );
}
