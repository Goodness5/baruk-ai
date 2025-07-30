"use client";

import './globals.css';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import BalanceWatcher from './components/BalanceWatcher';
import TokenPriceWatcher from './components/TokenPriceWatcher';
import AIOrb from './components/AIOrb';
import { AIProvider } from './components/AIContext';
import { Toaster } from 'react-hot-toast';
import { Providers } from './providers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-[#2d193c] via-[#1e2e2e] to-[#3a1c4a] min-h-screen text-white">
        <Providers>
          <AIProvider>
            <Toaster position="top-right" toastOptions={{
              style: { background: '#2d193c', color: '#fff', border: '1px solid #a855f7' },
              success: { style: { background: '#1e2e2e', color: '#22d3ee' } },
              error: { style: { background: '#3a1c4a', color: '#f87171' } },
            }} />
            <div className="flex min-h-screen">
              <Sidebar />
              <div className="flex-1 flex flex-col min-w-0">
                <Topbar />
                <BalanceWatcher />
                <TokenPriceWatcher />
                <main className="flex-1 p-3 sm:p-4 lg:p-6 overflow-x-hidden">{children}</main>
                <AIOrb />
              </div>
            </div>
          </AIProvider>
        </Providers>
      </body>
    </html>
  );
}
