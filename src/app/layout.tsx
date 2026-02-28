import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { Providers } from '@/components/providers';

const heading = localFont({
  src: [
    {
      path: './fonts/space-grotesk-latin-400-normal.woff2',
      weight: '400',
      style: 'normal'
    },
    {
      path: './fonts/space-grotesk-latin-700-normal.woff2',
      weight: '700',
      style: 'normal'
    }
  ],
  variable: '--font-heading'
});

const mono = localFont({
  src: [
    {
      path: './fonts/ibm-plex-mono-latin-400-normal.woff2',
      weight: '400',
      style: 'normal'
    },
    {
      path: './fonts/ibm-plex-mono-latin-500-normal.woff2',
      weight: '500',
      style: 'normal'
    }
  ],
  variable: '--font-mono'
});

export const metadata: Metadata = {
  metadataBase: new URL('https://stochstack.com'),
  title: {
    default: 'StochStack',
    template: '%s | StochStack'
  },
  description: 'StochStack / 随机栈 - AI-native prototype and editorial signal lab.',
  openGraph: {
    title: 'StochStack',
    description: 'Build prototypes like sampling signals from noise.',
    url: 'https://stochstack.com',
    siteName: 'StochStack',
    type: 'website'
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${heading.variable} ${mono.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
