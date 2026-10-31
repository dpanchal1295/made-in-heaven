'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth, DEMO_MEMBERS } from '@/lib/auth/AuthContext';
import { SUPPORTED_LANGUAGES } from '@/lib/utils/i18n';
import { getRoleLabel } from '@/lib/utils/roles';
import { Logo } from '@/components/common/Logo';
import { User, Globe, Menu, X, ArrowRight, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function GlobalHeader() {
  const pathname = usePathname();
  const { user, isDemoMode, updateUserLanguage, switchMember } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [demoSwitcherOpen, setDemoSwitcherOpen] = useState(false);

  const isWelcomePage =
    pathname === '/welcome' ||
    pathname === '/weddings' ||
    pathname === '/birthdays' ||
    pathname === '/community';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setLangDropdownOpen(false);
  }, [pathname]);

  const isTransparent = isWelcomePage && !isScrolled;

  const signedInLinks = [
    { label: 'Home', href: '/home' },
    { label: 'Maya', href: '/chat' },
    { label: 'Plan', href: '/plan' },
    { label: 'Family', href: '/family' },
    { label: 'Settings', href: '/settings' },
  ];

  const signedOutLinks = [
    { label: 'Weddings', href: '/weddings' },
    { label: 'Birthdays', href: '/birthdays' },
    { label: 'Community', href: '/community' },
    { label: 'Ideas', href: '/ideas' },
    { label: 'About', href: '/about' },
  ];

  const navLinks = user ? signedInLinks : signedOutLinks;

  const currentLang = user?.preferredLanguage || 'en';

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 h-16 transition-colors duration-300 ${
          isTransparent
            ? 'bg-transparent text-white border-b border-white/10'
            : 'bg-[#FCFBF8] text-[#2A2521] border-b border-[#E4DED6] shadow-[0_1px_2px_rgba(0,0,0,0.03)]'
        }`}
      >
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-8 flex items-center justify-between">
          {/* Brand Logo (Left) */}
          <div className="flex items-center gap-3">
            <Logo
              href={user ? '/home' : '/welcome'}
              variant={isTransparent ? 'light' : 'dark'}
              size="md"
            />

            {isDemoMode && (
              <span
                className={`hidden lg:inline-block font-micro px-2 py-0.5 border text-[10px] tracking-[0.2em] uppercase ${
                  isTransparent
                    ? 'border-white/40 text-white/90'
                    : 'border-[#94512F]/40 text-[#94512F]'
                }`}
              >
                Demo mode
              </span>
            )}
          </div>

          {/* Centered Small Uppercase Nav Links (Desktop) */}
          <nav
            aria-label="Main Navigation"
            className="hidden md:flex items-center gap-8 lg:gap-10 absolute left-1/2 -translate-x-1/2"
          >
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`font-nav text-[12px] tracking-[0.15em] uppercase transition-colors duration-200 relative py-1 focus-visible:outline-2 focus-visible:outline-[#A8603E] ${
                    isTransparent
                      ? isActive
                        ? 'text-white font-medium after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1px] after:bg-white'
                        : 'text-white/80 hover:text-white'
                      : isActive
                      ? 'text-[#2A2521] font-medium after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1px] after:bg-[#2A2521]'
                      : 'text-[#6B645E] hover:text-[#2A2521]'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Icons & Actions (Right) */}
          <div className="flex items-center gap-3 sm:gap-5">
            {/* Demo Member Switcher (Demo Mode Only) */}
            {isDemoMode && user && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDemoSwitcherOpen(!demoSwitcherOpen)}
                  aria-label="Demo Member Switcher"
                  aria-expanded={demoSwitcherOpen}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-xs border transition-colors cursor-pointer ${
                    isTransparent
                      ? 'border-white/30 bg-black/20 text-white hover:bg-black/40'
                      : 'border-[#E4DED6] bg-white text-[#2A2521] hover:bg-[#F1EDE8]'
                  }`}
                >
                  <span className="font-micro text-[10px] uppercase text-[#94512F] tracking-wider font-semibold">
                    Viewing as:
                  </span>
                  <span className="font-medium text-xs truncate max-w-[90px] sm:max-w-[120px]">
                    {user.name.split(' ')[0]}
                  </span>
                  <span className="font-micro text-[9px] uppercase px-1 py-0.2 bg-[#F1EDE8] text-[#2A2521] border border-[#E4DED6] hidden sm:inline">
                    {user.permission}
                  </span>
                  <ChevronDown className="w-3 h-3 text-[#6B645E]" />
                </button>

                {demoSwitcherOpen && (
                  <div
                    className="absolute right-0 mt-2 w-64 bg-[#FCFBF8] border border-[#E4DED6] shadow-lg py-1.5 z-50 text-[#2A2521]"
                    role="menu"
                  >
                    <div className="px-3 py-1 font-micro text-[10px] text-[#94512F] uppercase tracking-[0.15em] border-b border-[#E4DED6] mb-1 flex items-center justify-between">
                      <span>Demo Mode Switcher</span>
                      <span className="text-[9px] text-[#6B645E]">Refreshes App</span>
                    </div>
                    {DEMO_MEMBERS.map((m) => {
                      const isCurrent = user.uid === m.uid;
                      const roleDisplay = getRoleLabel(m.permission, m.eventType);

                      return (
                        <button
                          key={m.uid}
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setDemoSwitcherOpen(false);
                            switchMember(m.uid);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#F1EDE8] transition-colors cursor-pointer ${
                            isCurrent ? 'bg-[#F1EDE8] font-semibold text-[#94512F]' : 'text-[#2A2521]'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span>{m.name}</span>
                              {isCurrent && (
                                <span className="font-micro text-[9px] uppercase text-[#94512F] font-bold">
                                  (Active)
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-[#6B645E] mt-0.5">
                              {m.homeName} • {m.preferredLanguage.toUpperCase()}
                            </div>
                          </div>
                          <span
                            className={`font-micro text-[9px] uppercase px-1.5 py-0.5 border ${
                              m.permission === 'couple'
                                ? 'bg-[#F1EDE8] border-[#94512F]/40 text-[#94512F]'
                                : 'bg-white border-[#E4DED6] text-[#6B645E]'
                            }`}
                          >
                            {roleDisplay}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Language Selector Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                aria-label="Select Language"
                aria-expanded={langDropdownOpen}
                className={`flex items-center gap-1.5 p-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-[#A8603E] cursor-pointer ${
                  isTransparent ? 'text-white hover:text-white/80' : 'text-[#2A2521] hover:text-[#A8603E]'
                }`}
              >
                <Globe className="w-4 h-4" strokeWidth={1.5} />
                <span className="font-micro text-[11px] font-medium tracking-[0.15em] uppercase">
                  {currentLang.toUpperCase()}
                </span>
              </button>

              {langDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-48 bg-[#FCFBF8] border border-[#E4DED6] shadow-md py-2 z-50 rounded-none text-[#2A2521]"
                  role="menu"
                >
                  <div className="px-3 py-1 font-micro text-[10px] text-[#6B645E] border-b border-[#E4DED6] mb-1">
                    Select Language
                  </div>
                  {SUPPORTED_LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        updateUserLanguage(l.code);
                        setLangDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-[#F1EDE8] transition-colors cursor-pointer ${
                        currentLang === l.code ? 'font-bold text-[#A8603E]' : 'text-[#2A2521]'
                      }`}
                    >
                      <span>{l.nativeLabel}</span>
                      <span className="text-[10px] text-[#6B645E] uppercase">{l.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Profile or Sign-in (Line icon) */}
            {user ? (
              <Link
                href="/settings"
                aria-label="User Settings"
                className={`flex items-center gap-2 p-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-[#A8603E] ${
                  isTransparent ? 'text-white hover:text-white/80' : 'text-[#2A2521] hover:text-[#A8603E]'
                }`}
              >
                <User className="w-4 h-4" strokeWidth={1.5} />
                <span className="hidden xl:inline font-nav text-[12px] tracking-[0.15em] uppercase max-w-[120px] truncate">
                  {user.name.split(' ')[0]}
                </span>
              </Link>
            ) : (
              <Link
                href="/signin"
                className={`hidden sm:flex items-center gap-1.5 font-nav text-[12px] tracking-[0.15em] uppercase transition-colors focus-visible:outline-2 focus-visible:outline-[#A8603E] ${
                  isTransparent
                    ? 'text-white hover:text-white/80'
                    : 'text-[#2A2521] hover:text-[#A8603E]'
                }`}
              >
                <User className="w-4 h-4" strokeWidth={1.5} />
                <span>Sign in</span>
              </Link>
            )}

            {/* Mobile Animated Hamburger Toggle (Hamburger to X) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
              aria-expanded={mobileMenuOpen}
              className={`md:hidden relative w-8 h-8 flex flex-col justify-center items-center gap-1.5 p-1 transition-colors focus-visible:outline-2 focus-visible:outline-[#A8603E] cursor-pointer ${
                isTransparent ? 'text-white' : 'text-[#2A2521]'
              }`}
            >
              <span
                className={`w-5 h-[1.5px] bg-current transition-all duration-300 transform origin-center ${
                  mobileMenuOpen ? 'rotate-45 translate-y-[3.75px]' : ''
                }`}
              />
              <span
                className={`w-5 h-[1.5px] bg-current transition-all duration-300 transform origin-center ${
                  mobileMenuOpen ? '-rotate-45 -translate-y-[3.75px]' : ''
                }`}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Animated Full-Screen Cream Overlay Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 top-16 bg-[#FCFBF8] z-30 flex flex-col justify-between p-6 sm:p-10 overflow-y-auto border-t border-[#E4DED6] md:hidden"
          >
            <div className="space-y-6 pt-4">
              {isDemoMode && (
                <div className="pb-3 border-b border-[#E4DED6]">
                  <span className="font-micro px-2 py-0.5 border border-[#94512F]/40 text-[#94512F] text-[10px] tracking-[0.2em] uppercase">
                    Demo mode active
                  </span>
                </div>
              )}

              {/* Large Serif Links with 60ms Stagger */}
              <nav className="flex flex-col space-y-3">
                {navLinks.map((link, idx) => (
                  <motion.div
                    key={link.label}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.06, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="font-serif text-3xl font-normal text-[#2A2521] hover:text-[#A8603E] flex items-center justify-between py-3 border-b border-[#E4DED6]/60 transition-colors"
                    >
                      <span>{link.label}</span>
                      <ArrowRight className="w-5 h-5 text-[#6B645E]" strokeWidth={1.5} />
                    </Link>
                  </motion.div>
                ))}
              </nav>

              {!user && (
                <div className="pt-4">
                  <Link
                    href="/signin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full inline-flex items-center justify-center font-nav text-[12px] tracking-[0.15em] uppercase py-3.5 bg-[#A8603E] text-white hover:bg-[#94512F] transition-colors"
                  >
                    Sign in to your account
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Drawer Language Footer */}
            <div className="pt-6 border-t border-[#E4DED6] space-y-3">
              <span className="font-micro text-[11px] text-[#6B645E] block">
                Preferred Language
              </span>
              <div className="flex flex-wrap gap-2">
                {SUPPORTED_LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => {
                      updateUserLanguage(l.code);
                      setMobileMenuOpen(false);
                    }}
                    className={`px-3 py-1.5 text-xs font-nav uppercase border transition-colors cursor-pointer ${
                      currentLang === l.code
                        ? 'bg-[#2A2521] text-white border-[#2A2521]'
                        : 'bg-transparent text-[#2A2521] border-[#E4DED6] hover:bg-[#F1EDE8]'
                    }`}
                  >
                    {l.nativeLabel}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
