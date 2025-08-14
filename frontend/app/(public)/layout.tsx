import { authClient } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if user is already authenticated
  const session = await authClient.getSession();
  
  if (session?.user) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}
