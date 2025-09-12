import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Address Manager',
  description: 'Manage your address portfolio efficiently',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
