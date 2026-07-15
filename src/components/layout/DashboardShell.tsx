'use client';

import { useState } from 'react';
import Link from 'next/link';
import LogoutButton from '@/components/auth/LogoutButton';
import SidebarNav from '@/components/layout/SidebarNav';
import SystemInfoModal from '@/components/layout/SystemInfoModal';

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="bg-background text-on-background min-h-screen flex overflow-x-hidden">
      
      {/* Desktop/Tablet Sidebar */}
      <nav 
        className={`
          hidden md:flex flex-col h-full bg-surface-container-lowest py-container-margin space-y-4 
          fixed left-0 top-0 border-r border-outline-variant z-30 transition-all duration-300 glass-sidebar
          ${isCollapsed ? 'w-20' : 'w-64'} 
        `}
      >
        <div className={`px-gutter mb-6 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isCollapsed && (
            <div className="flex flex-col">
              <h1 className="font-display-lg-mobile text-2xl text-primary font-bold tracking-tight">FlowCheck</h1>
              <p className="font-label-xs text-[10px] text-on-surface-variant uppercase tracking-wider">Event Management</p>
            </div>
          )}
          
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-on-surface-variant hover:bg-surface-container-high p-2 rounded-full transition-colors active-scale"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <span className="material-symbols-outlined text-xl">
              {isCollapsed ? 'menu_open' : 'menu_open'}
            </span>
          </button>
        </div>
        
        <div className="px-gutter">
          <Link href="/events/new" className={`w-full bg-primary text-on-primary font-label-sm py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-on-surface transition-all shadow-sm hover-lift ${isCollapsed ? 'px-0' : 'px-4'}`}>
            <span className="material-symbols-outlined">add</span>
            {!isCollapsed && <span className="font-semibold">New Event</span>}
          </Link>
        </div>
        
        <div className="flex-1 mt-6 overflow-y-auto hide-scrollbar">
          <div data-collapsed={isCollapsed ? "true" : undefined} className="sidebar-nav-wrapper">
             <SidebarNav isCollapsed={isCollapsed} />
          </div>
        </div>
        
        <div className="px-4 mt-auto mb-4 space-y-2">
          <div className={isCollapsed ? '[&_span:not(.material-symbols-outlined)]:hidden [&_button]:justify-center [&_svg]:mx-auto' : ''}>
             <SystemInfoModal isCollapsed={isCollapsed} />
             <LogoutButton />
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col min-h-screen transition-all duration-300 pb-20 md:pb-0 ${isCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
        
        {/* Mobile Top Header (hidden on desktop) */}
        <header className="md:hidden glass-nav sticky top-0 z-20 flex justify-between items-center w-full px-4 h-14">
          <h1 className="font-display-lg-mobile text-xl text-primary font-bold tracking-tight">FlowCheck</h1>
          <div className="flex items-center gap-1">
            <SystemInfoModal isCollapsed={true} />
            <Link href="/events/new" className="text-primary hover:bg-surface-container-high p-2 rounded-full transition-colors active-scale flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">add_circle</span>
            </Link>
            <LogoutButton iconOnly={true} className="text-error hover:bg-error/10 p-2 rounded-full transition-colors active-scale flex items-center justify-center" />
          </div>
        </header>

        {children}
      </main>

      {/* Mobile Bottom Navigation (hidden on desktop) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 glass-nav h-touch-target pb-safe flex items-center">
        <SidebarNav isHorizontal={true} />
      </nav>

    </div>
  );
}
