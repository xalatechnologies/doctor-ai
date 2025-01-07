import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/providers/theme-provider';
import { ChatFeature } from '@/components/ChatFeature';
import { RoleBasedLayout } from '@/layouts/RoleBasedLayout';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Doctor AI Dashboard',
  description: 'A modern dashboard for managing AI-powered medical services',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider>
          <RoleBasedLayout role="patient">
            {children}
          </RoleBasedLayout>
          <ChatFeature />
        </ThemeProvider>
      </body>
    </html>
  );
} 