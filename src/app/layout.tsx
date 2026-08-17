import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Cadence — The AI Sales Operator for Small Businesses',
  description:
    "Cadence runs your shop's sales 24/7. An AI operator that lives in your shop's chat, answers customer queries, checks inventory, and presents your bank account details for instant direct payment.",
  keywords: ['AI sales', 'chat commerce', 'retail AI', 'Africa retail', 'automated sales', 'small business support'],
  openGraph: {
    title: 'Cadence — The AI Sales Operator for Small Businesses',
    description: 'Never miss a buyer. Automate sizing queries, stock checks, and bank payouts 24/7.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}
