/**
 * Layout Component
 *
 * Main layout wrapper with Header and Footer.
 * Provides consistent structure across all pages.
 */

import { Footer } from './Footer';
import { Header } from './Header';

export interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
