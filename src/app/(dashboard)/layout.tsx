import Link from 'next/link';
import { Calendar, Users, Settings, LogOut } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-gray-200 flex-shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">FlowCheck</h1>
        </div>
        <nav className="p-4 space-y-1">
          <Link
            href="/events"
            className="flex items-center px-3 py-2 text-sm font-medium rounded-md bg-blue-50 text-blue-700"
          >
            <Calendar className="mr-3 h-5 w-5 flex-shrink-0 text-blue-700" />
            Events
          </Link>
          {/* Future nav items */}
          <Link
            href="/settings"
            className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          >
            <Settings className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400" />
            Settings
          </Link>
        </nav>
        
        <div className="absolute bottom-0 w-full md:w-64 p-4 border-t border-gray-200 bg-white">
          <button className="flex w-full items-center px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900">
            <LogOut className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
