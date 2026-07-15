'use client';

import { useState } from 'react';
import Link from 'next/link';
import LogoutButton from '@/components/auth/LogoutButton';
import SidebarNav from '@/components/layout/SidebarNav';

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col md:flex-row overflow-x-hidden">
      
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* SideNavBar */}
      <nav 
        className={`
          flex flex-col h-full bg-surface-container-lowest py-container-margin space-y-4 
          fixed left-0 top-0 border-r border-outline-variant z-30 transition-all duration-300
          ${isCollapsed ? 'md:w-20' : 'md:w-64'} 
          ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className={`px-gutter mb-6 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isCollapsed && (
            <div>
              <h1 className="font-headline-md text-headline-md text-primary font-bold">FlowCheck</h1>
              <p className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider">Event Management</p>
            </div>
          )}
          
          {/* Collapse Toggle (Desktop) */}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex text-on-surface-variant hover:bg-surface-container-high p-1.5 rounded-full transition-colors"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <span className="material-symbols-outlined text-lg">
              {isCollapsed ? 'menu_open' : 'menu'}
            </span>
          </button>

          {/* Close Mobile Menu */}
          <button 
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden text-on-surface-variant hover:bg-surface-container-high p-1.5 rounded-full transition-colors ml-auto"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
        
        <div className="px-gutter">
          <Link href="/events/new" className={`w-full bg-primary text-on-primary font-label-sm text-label-sm py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-tertiary-container transition-colors shadow-sm hover:shadow-md h-touch-target ${isCollapsed ? 'px-0' : 'px-4'}`}>
            <span className="material-symbols-outlined">add</span>
            {!isCollapsed && <span>New Event</span>}
          </Link>
        </div>
        
        <div className="flex-1 mt-6">
          <div data-collapsed={isCollapsed ? "true" : undefined} className="sidebar-nav-wrapper">
             <SidebarNav isCollapsed={isCollapsed} />
          </div>
        </div>
        
        <div className="px-4 mt-auto space-y-2">
          <div className={isCollapsed ? '[&_span:not(.material-symbols-outlined)]:hidden [&_button]:justify-center' : ''}>
             <LogoutButton />
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${isCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
        {/* TopNavBar */}
        <header className="bg-surface shadow-sm docked full-width top-0 z-10 sticky flex justify-between items-center w-full px-gutter h-touch-target">
          
          <div className="flex items-center gap-4 flex-1">
            {/* Mobile Hamburger */}
            <button 
              onClick={() => setIsMobileOpen(true)}
              className="md:hidden text-on-surface-variant hover:bg-surface-container-high p-2 rounded-full transition-colors flex items-center justify-center"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>

            <div className="flex items-center max-w-md w-full">
              <div className="relative w-full">
                <span className="material-symbols-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-on-surface-variant">search</span>
                <input type="text" placeholder="Search events..." className="w-full pl-10 pr-4 py-2 bg-surface-container-highest border-none rounded-full font-body-md text-body-md focus:ring-1 focus:ring-primary focus:bg-surface transition-colors focus:outline-none" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 ml-4">
            <button className="text-on-surface-variant hover:bg-surface-container-high p-2 rounded-full transition-colors relative hidden sm:block">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full"></span>
            </button>
            <div className="w-8 h-8 rounded-full border border-outline-variant bg-surface-container-highest flex items-center justify-center overflow-hidden">
               <span className="material-symbols-outlined text-on-surface-variant text-sm">person</span>
            </div>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}
