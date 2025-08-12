"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function EmailAuthPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the main login page
    router.replace('/login');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
}
