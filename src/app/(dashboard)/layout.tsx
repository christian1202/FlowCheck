import LogoutButton from '@/components/auth/LogoutButton';
import SidebarNav from '@/components/layout/SidebarNav';
import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col md:flex-row overflow-x-hidden">
      {/* Mobile TopNav Placeholder (Replaced by TopNavBar on Web) */}
      <div className="md:hidden">
        {/* Minimal mobile header for continuity if needed */}
      </div>

      {/* SideNavBar (Hidden on Mobile, Visible on Desktop) */}
      <nav className="hidden md:flex flex-col h-full w-64 bg-surface-container-lowest py-container-margin space-y-4 fixed left-0 top-0 border-r border-outline-variant z-20">
        <div className="px-gutter mb-6">
          <h1 className="font-headline-md text-headline-md text-primary font-bold">FlowCheck</h1>
          <p className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider">Event Management</p>
        </div>
        
        <div className="px-gutter">
          <Link href="/events/new" className="w-full bg-primary text-on-primary font-label-sm text-label-sm py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-tertiary-container transition-colors shadow-sm hover:shadow-md h-touch-target">
            <span className="material-symbols-outlined">add</span>
            New Event
          </Link>
        </div>
        
        <div className="flex-1 mt-6">
          <SidebarNav />
        </div>
        
        <div className="px-4 mt-auto space-y-2">
          <LogoutButton />
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* TopNavBar (Web version) */}
        <header className="bg-surface shadow-sm docked full-width top-0 z-10 sticky flex justify-between items-center w-full px-gutter h-touch-target">
          <div className="flex items-center flex-1 max-w-md">
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-on-surface-variant">search</span>
              <input type="text" placeholder="Search events, attendees..." className="w-full pl-10 pr-4 py-2 bg-surface-container-highest border-none rounded-full font-body-md text-body-md focus:ring-1 focus:ring-primary focus:bg-surface transition-colors focus:outline-none" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-on-surface-variant hover:bg-surface-container-high p-2 rounded-full transition-colors relative">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full"></span>
            </button>
            <div className="w-8 h-8 rounded-full border border-outline-variant bg-surface-container-highest flex items-center justify-center overflow-hidden ml-2">
               <span className="material-symbols-outlined text-on-surface-variant text-sm">person</span>
            </div>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}
