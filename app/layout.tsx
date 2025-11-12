import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Five Flows - Four Pillars of Destiny | Traditional Saju Analysis',
  description: 'Traditional Saju analysis based on the Five Elements for wellness and balance.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Afacad+Flux:wght@100..1000&family=Gloock&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}

