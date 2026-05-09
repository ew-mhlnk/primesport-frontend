// app/layout.tsx
import type { Metadata } from 'next';
import { Raleway } from 'next/font/google';
import './globals.css';

const raleway = Raleway({
  variable: '--font-raleway',
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://primesport.tv';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default:  'PrimeSport — Теннис, трансляции, новости',
    template: '%s | PrimeSport',
  },
  description:
    'Смотрите теннисные матчи онлайн, следите за расписанием ATP и WTA, читайте свежие новости на PrimeSport.',
  keywords: ['теннис', 'трансляции', 'ATP', 'WTA', 'новости тенниса', 'расписание матчей'],
  robots: {
    index:           true,
    follow:          true,
    googleBot: {
      index:          true,
      follow:         true,
      'max-image-preview': 'large',
      'max-snippet':  -1,
    },
  },
  openGraph: {
    type:      'website',
    locale:    'ru_RU',
    siteName:  'PrimeSport',
    url:       SITE_URL,
    title:     'PrimeSport — Теннис онлайн',
    description:
      'Смотрите теннисные матчи онлайн, следите за расписанием ATP и WTA на PrimeSport.',
    images: [
      {
        url:    '/og-default.jpg',
        width:  1200,
        height: 630,
        alt:    'PrimeSport',
      },
    ],
  },
  twitter: {
    card:        'summary_large_image',
    site:        '@primesport',
    title:       'PrimeSport — Теннис онлайн',
    description: 'Смотрите теннисные матчи онлайн, следите за расписанием ATP и WTA.',
    images:      ['/og-default.jpg'],
  },
  icons: {
    icon:       '/favicon.ico',
    apple:      '/apple-touch-icon.png',
    shortcut:   '/favicon-32x32.png',
  },
  alternates: {
    canonical: '/',
    languages: { 'ru-RU': '/' },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${raleway.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-950">{children}</body>
    </html>
  );
}