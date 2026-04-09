import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import '@/styles/globals.css';
import { Toaster } from 'react-hot-toast';

const geistSans = Geist({ subsets: ['latin'] });
const geistMono = Geist_Mono({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Controle Rural SaaS',
  description: 'Sistema moderno de controle de produção rural para produtores e agricultores',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    title: 'Controle Rural SaaS',
    description: 'Sistema moderno de controle de produção rural',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-br">
      <body className={`${geistSans.className} ${geistMono.className}`}>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
