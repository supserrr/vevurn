import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from 'react-hot-toast'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Vevurn POS System',
  description: 'Professional Point of Sale system for mobile accessories',
  icons: {
    icon: '/favicon.ico',
  },
}

// Check if we have valid Clerk keys
const hasValidClerkKeys = () => {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  return publishableKey && 
         publishableKey !== 'pk_test_xxx' && 
         publishableKey.startsWith('pk_')
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const content = (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  )

  // Only wrap with ClerkProvider if we have valid keys
  if (hasValidClerkKeys()) {
    return <ClerkProvider>{content}</ClerkProvider>
  }

  return content
}
