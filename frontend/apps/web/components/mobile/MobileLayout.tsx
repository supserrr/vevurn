'use client';

import { MobileNavigation } from './MobileNavigation';

interface MobileLayoutProps {
  children: React.ReactNode;
  overdueInvoices?: number;
  lowStockItems?: number;
}

export function MobileLayout({ 
  children, 
  overdueInvoices = 0, 
  lowStockItems = 0 
}: MobileLayoutProps) {
  return (
    <div className="lg:hidden min-h-screen bg-gray-50">
      <MobileNavigation 
        overdueInvoices={overdueInvoices}
        lowStockItems={lowStockItems}
      />
      
      {/* Main Content with proper spacing for mobile navigation */}
      <main className="pt-16 pb-20 px-4 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
