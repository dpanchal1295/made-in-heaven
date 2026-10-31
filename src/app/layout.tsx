import type { Metadata } from 'next';
import {
  Cormorant_Garamond,
  Inter,
  Noto_Serif_Devanagari,
  Noto_Serif_Gujarati,
  Noto_Serif_Gurmukhi,
  Noto_Sans_Devanagari,
  Noto_Sans_Gujarati,
  Noto_Sans_Gurmukhi,
} from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth/AuthContext';

// 1. Editorial Headings font: Cormorant Garamond (400, 500, 600, italic 400, 500)
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-cormorant',
});

// 2. Editorial Body, Labels, & Buttons font: Inter (400, 500, 600)
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-inter',
});

// 3. Indian Regional Script Headings (Devanagari, Gujarati, Gurmukhi)
const notoSerifDevanagari = Noto_Serif_Devanagari({
  subsets: ['devanagari'],
  weight: ['400', '600'],
  display: 'swap',
  variable: '--font-serif-devanagari',
});

const notoSerifGujarati = Noto_Serif_Gujarati({
  subsets: ['gujarati'],
  weight: ['400', '600'],
  display: 'swap',
  variable: '--font-serif-gujarati',
});

const notoSerifGurmukhi = Noto_Serif_Gurmukhi({
  subsets: ['gurmukhi'],
  weight: ['400', '600'],
  display: 'swap',
  variable: '--font-serif-gurmukhi',
});

// 4. Indian Regional Script Body (Devanagari, Gujarati, Gurmukhi)
const notoSansDevanagari = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-sans-devanagari',
});

const notoSansGujarati = Noto_Sans_Gujarati({
  subsets: ['gujarati'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-sans-gujarati',
});

const notoSansGurmukhi = Noto_Sans_Gurmukhi({
  subsets: ['gurmukhi'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-sans-gurmukhi',
});

export const metadata: Metadata = {
  title: 'Made in Heaven • Editorial AI Wedding Planning for Indian Families',
  description:
    'Plan your Indian wedding with Maya. Itemized budget by function in INR, countdown timelines, vendor checklists, decor concepts, and attire styling.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${inter.variable} ${notoSerifDevanagari.variable} ${notoSerifGujarati.variable} ${notoSerifGurmukhi.variable} ${notoSansDevanagari.variable} ${notoSansGujarati.variable} ${notoSansGurmukhi.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-[#FCFBF8] text-[#2A2521] selection:bg-[#F1EDE8] selection:text-[#A8603E]">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
