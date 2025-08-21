import React from 'react';

export function FieldAgentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center space-x-2">
            <img src="/logo.png" alt="Company Logo" className="h-8 w-auto" />
            <span className="text-lg font-semibold text-gray-900">Field Agent Dashboard</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span>System Online</span>
            </div>
            {/* Add logout/profile here if needed */}
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
