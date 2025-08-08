import { redirect } from 'next/navigation'
import { currentUser } from '@clerk/nextjs'

// Check if we have valid Clerk keys
const hasValidClerkKeys = () => {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  return publishableKey && 
         publishableKey !== 'pk_test_xxx' && 
         publishableKey.startsWith('pk_')
}

export default async function Home() {
  // If we don't have valid Clerk keys, go directly to dashboard
  if (!hasValidClerkKeys()) {
    redirect('/dashboard')
  }
  
  // If we have Clerk keys, check authentication
  try {
    const user = await currentUser()
    
    if (!user) {
      redirect('/sign-in')
    }
    
    redirect('/dashboard')
  } catch (error) {
    // If Clerk fails, still redirect to dashboard for development
    redirect('/dashboard')
  }
}
