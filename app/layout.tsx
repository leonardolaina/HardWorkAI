import type { Metadata, Viewport } from 'next';
import { Fraunces, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import { FirebaseAuthProvider } from '@/components/FirebaseAuthProvider';
import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-fraunces',
  display: 'swap',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jakarta',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FAF9F5' },
    { media: '(prefers-color-scheme: dark)', color: '#1B1A18' },
  ],
};

export const metadata: Metadata = {
  title: 'HardWorkAI — Assistente de IA',
  description:
    'HardWorkAI: inteligência artificial com interface editorial simples, limpa e funcional inspirada na Claude, com streaming em tempo real, anexos multimodais, busca na web e painel de artefatos.',
  appleWebApp: {
    capable: true,
    title: 'HardWorkAI',
    statusBarStyle: 'default',
  },
  openGraph: {
    title: 'HardWorkAI — Assistente de IA',
    description:
      'HardWorkAI: inteligência artificial com interface editorial simples, limpa e funcional inspirada na Claude.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HardWorkAI — Assistente de IA',
    description:
      'HardWorkAI: inteligência artificial com interface editorial simples, limpa e funcional inspirada na Claude.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`${fraunces.variable} ${plusJakarta.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body
        className="font-sans antialiased bg-[#FAF9F5] text-[#1F1E1C] dark:bg-[#1B1A18] dark:text-[#F2EFE9] selection:bg-[#C96442]/20 dark:selection:bg-[#D97757]/25 overflow-hidden"
        suppressHydrationWarning
      >
        <FirebaseAuthProvider>{children}</FirebaseAuthProvider>
      </body>
    </html>
  );
}
