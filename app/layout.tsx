import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pathfolio — Apply smarter. Track everything.',
  description: 'A private assistant for job and school applications. Find opportunities, tailor documents truthfully, apply by the best route, and track everything.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className="min-h-screen bg-background font-sans antialiased"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}