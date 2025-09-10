// app/layout.tsx
import './globals.css';

export const metadata = {
  title: 'Address Manager Pro',
  description: 'Excel-powered address portfolio management',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
        {children}
      </body>
    </html>
  );
}
