import type { Metadata } from 'next';
import { Space_Grotesk } from 'next/font/google';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  variable: '--font-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Lucky7',
  description: 'Jeu de dés multijoueur en temps réel',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${spaceGrotesk.variable} h-full antialiased dark`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
