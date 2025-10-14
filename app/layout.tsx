import './globals.css';
import type { Metadata } from 'next';
import { Providers } from './providers';
import { HeaderWrapper } from '@/components/header-wrapper';
import { Footer } from '@/components/footer';

export const metadata: Metadata = {
  title: 'Sample',
  description: 'チームでの効率的なプロジェクト管理を実現するサブスクリプション型SaaSサービス',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="scroll-smooth">
      <body className="flex min-h-screen flex-col bg-gray-50 text-gray-900 antialiased">
        <Providers>
          <HeaderWrapper />
          <main className="relative flex-grow pt-16">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
