'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import LogoutButton from '@/components/auth/LogoutButton';
import SidebarNav from '@/components/layout/SidebarNav';
import SystemInfoModal from '@/components/layout/SystemInfoModal';

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="bg-ambient-mesh text-slate-100 min-h-screen flex overflow-x-hidden font-sans">
      
      {/* Desktop/Tablet Sidebar */}
      <nav 
        className={`
          hidden md:flex flex-col h-full bg-slate-950/80 py-6 space-y-4 
          fixed left-0 top-0 border-r border-white/10 z-30 transition-transform duration-200 transform-gpu glass-sidebar
          ${isCollapsed ? 'w-20' : 'w-64'} 
        `}
      >
        <div className={`mb-4 flex items-center ${isCollapsed ? 'flex-col gap-3 justify-center px-2' : 'justify-between px-4'}`}>
          <div className="flex items-center gap-3">
            <div className="relative p-1.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/5 border border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.15)] shrink-0">
              <Image src="/images/flowchecklogo-final-bg-white-big.png" alt="FlowCheck" width={28} height={28} className="h-6 w-6 object-contain" priority />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <h1 className="font-display-lg-mobile text-lg text-white font-bold tracking-tight leading-none gradient-text">
                  FlowCheck
                </h1>
                <p className="font-mono text-[9px] text-amber-400 uppercase tracking-widest mt-1">System v2.4</p>
              </div>
            )}
          </div>
          
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-slate-400 hover:text-white hover:bg-white/10 p-2 rounded-xl transition-all active-scale"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <span className="material-symbols-outlined text-lg">
              {isCollapsed ? 'menu_open' : 'side_navigation'}
            </span>
          </button>
        </div>
        
        <div className="px-3">
          <Link 
            href="/events/new" 
            className={`bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_25px_rgba(245,158,11,0.4)] active-scale ${isCollapsed ? 'w-10 h-10 mx-auto px-0' : 'w-full px-4'}`}
            title={isCollapsed ? "New Event" : undefined}
          >
            <span className="material-symbols-outlined text-lg">add_circle</span>
            {!isCollapsed && <span className="tracking-wide">New Event</span>}
          </Link>
        </div>
        
        <div className="flex-1 mt-4 overflow-y-auto hide-scrollbar">
          <div data-collapsed={isCollapsed ? "true" : undefined} className="sidebar-nav-wrapper">
             <Suspense fallback={<div className="space-y-3 px-3">
               {[...Array(5)].map((_, i) => <div key={i} className={`h-10 bg-slate-800 rounded-xl animate-pulse ${isCollapsed ? 'w-10 mx-auto' : 'w-full'}`} />)}
             </div>}>
               <SidebarNav isCollapsed={isCollapsed} />
             </Suspense>
          </div>
        </div>
        
        <div className="px-3 mt-auto pt-4 border-t border-white/5 space-y-1.5">
          <div className={isCollapsed ? '[&_span:not(.material-symbols-outlined)]:hidden [&_button]:justify-center [&_svg]:mx-auto [&_button]:w-10 [&_button]:h-10 [&_button]:mx-auto [&_button]:px-0' : ''}>
             <SystemInfoModal isCollapsed={isCollapsed} />
             <LogoutButton />
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col min-h-screen transition-all duration-200 transform-gpu pb-24 md:pb-0 ${isCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
        
        {/* Mobile Top Header (hidden on desktop) */}
        <header className="md:hidden glass-nav sticky top-0 z-20 flex justify-between items-center w-full px-4 h-14 border-b border-white/10 bg-slate-950/95">
          <div className="flex items-center gap-2.5">
            <div className="p-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <Image src="/images/flowchecklogo-final-bg-white-big.png" alt="FlowCheck" width={26} height={26} className="h-6 w-6" priority />
            </div>
            <h1 className="font-display-lg-mobile text-base text-white font-bold tracking-tight">FlowCheck</h1>
          </div>
          <div className="flex items-center gap-1.5">
            <SystemInfoModal isCollapsed={true} />
            <Link href="/events/new" className="text-amber-400 hover:bg-amber-500/10 p-2 rounded-xl transition-all active-scale flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">add_circle</span>
            </Link>
            <LogoutButton iconOnly={true} className="text-red-400 hover:bg-red-500/10 p-2 rounded-xl transition-all active-scale flex items-center justify-center" />
          </div>
        </header>

        {children}
      </main>

      {/* Mobile Bottom Navigation (hidden on desktop) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 glass-nav border-t border-white/10 bg-slate-950/95 py-2 px-2 pb-safe flex items-center">
        <Suspense fallback={<div className="flex justify-around items-center w-full px-3 animate-pulse">
           {[...Array(5)].map((_, i) => <div key={i} className="h-8 w-8 bg-slate-800 rounded-lg" />)}
        </div>}>
          <SidebarNav isHorizontal={true} />
        </Suspense>
      </nav>

    </div>
  );
}
