// app/layout.tsx
import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Address Manager Pro',
  description: 'Excel-powered address portfolio management',
};

// iPad-friendly viewport (App Router export)
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body
        className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 text-gray-900"
        // Optional: add safe-area padding so content never sits under edges
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)',
        }}
      >
        <header
          className="sticky top-0 z-40 border-b border-white/60 bg-white/70 backdrop-blur-md"
          // Extra breathing room below the notch
          style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.25rem)' }}
        >
          <div className="mx-auto px-4 py-3 flex items-center justify-between max-w-screen-lg md:max-w-screen-xl">
            <div className="font-black tracking-tight text-lg">
              Address <span className="text-blue-700">Manager</span> Pro
            </div>
            <div className="text-sm text-gray-600">v0.0.2</div>
          </div>
        </header>

        <main className="mx-auto px-4 py-6 md:py-8 max-w-screen-lg md:max-w-screen-xl">
          {children}
        </main>

        <footer className="mt-12 md:mt-16 border-t border-white/60 bg-white/40">
          <div className="mx-auto px-4 py-6 text-sm text-gray-600 max-w-screen-lg md:max-w-screen-xl">
            © {new Date().getFullYear()} Address Manager Pro
          </div>
        </footer>
      </body>
    </html>
  );
}
