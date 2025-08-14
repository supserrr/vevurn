import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { QueryProvider } from '@/lib/query-provider';
import { ThemeProvider } from '@/components/theme-provider';
import './globals.css';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Vevurn POS - Phone Accessories Point of Sale',
  description: 'Complete point of sale system for phone accessories retail business in Rwanda',
  keywords: 'POS, point of sale, phone accessories, Rwanda, retail, inventory',
  authors: [{ name: 'Vevurn Team' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'noindex, nofollow', // Private business application
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'hsl(var(--background))',
                  color: 'hsl(var(--foreground))',
                  border: '1px solid hsl(var(--border))',
                },
                success: {
                  style: {
                    background: 'hsl(var(--background))',
                    color: 'hsl(var(--foreground))',
                    border: '1px solid hsl(var(--border))',
                  },
                },
                error: {
                  style: {
                    background: 'hsl(var(--destructive))',
                    color: 'hsl(var(--destructive-foreground))',
                  },
                },
              }}
            />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
