import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'E-Consult — Téléconsultation Médicale',
  description: 'Plateforme de téléconsultation médicale sécurisée. Consultez un médecin en ligne depuis chez vous.',
  keywords: ['télémédecine', 'consultation en ligne', 'médecin', 'santé', 'ordonnance'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
