import { authClient } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if user is authenticated
  const session = await authClient.getSession();
  
  if (!session?.user) {
    redirect('/login');
  }

  // Check if user is active
  if (!session.user.isActive) {
    redirect('/account-suspended');
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={session.user} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
