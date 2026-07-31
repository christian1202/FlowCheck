'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { Info, X, Code2, Database, Layout, Server, Sparkles } from 'lucide-react';

interface SystemInfoModalProps {
  isCollapsed?: boolean;
  className?: string;
  iconOnly?: boolean;
}

export default function SystemInfoModal({ isCollapsed, className, iconOnly }: SystemInfoModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const defaultClassName = "flex items-center gap-3.5 w-full px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:bg-white/[0.04] hover:text-slate-200 transition-all active-scale";
  const buttonClass = className || defaultClassName;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl transition-opacity"
        onClick={() => setIsOpen(false)}
      />
      
      {/* Modal Content Box */}
      <div className="relative w-full max-w-lg bg-slate-900/95 border border-white/15 rounded-3xl shadow-2xl overflow-hidden glass-panel flex flex-col max-h-[85vh] text-slate-100 my-auto z-10 animate-[fadeIn_0.2s_ease-out]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 sm:px-6 sm:py-4 border-b border-white/10 bg-slate-950/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Info className="w-4 h-4 text-amber-400" />
            </div>
            <h2 className="text-base font-bold text-white tracking-tight">System Info</h2>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-xl hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto hide-scrollbar space-y-4 flex-1">
          
          {/* About */}
          <section>
            <h3 className="text-xs font-mono uppercase tracking-widest text-amber-400 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> About FlowCheck
            </h3>
            <div className="bg-white/[0.03] p-3.5 rounded-2xl border border-white/10">
              <div className="flex items-center gap-2 mb-1.5">
                <Image src="/images/flowchecklogo-final-bg-white-big.png" alt="FlowCheck" width={24} height={24} className="h-5 w-5 object-contain" />
                <span className="font-display-lg-mobile text-sm text-white font-bold tracking-tight">FlowCheck</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                FlowCheck is an open-source, high-performance event management and QR scanning ecosystem engineered with real-time sync and rapid attendee check-ins.
              </p>
            </div>
          </section>

          {/* Tech Stack */}
          <section>
            <h3 className="text-xs font-mono uppercase tracking-widest text-amber-400 mb-2 flex items-center gap-1.5">
              <Layout className="w-3.5 h-3.5" /> Architecture & Technology
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-amber-500/30 transition-colors">
                <Server className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="text-xs font-semibold text-slate-200">Next.js 15</span>
              </div>
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-amber-500/30 transition-colors">
                <Code2 className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="text-xs font-semibold text-slate-200">React 19</span>
              </div>
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-amber-500/30 transition-colors">
                <Layout className="w-4 h-4 text-teal-400 shrink-0" />
                <span className="text-xs font-semibold text-slate-200">Tailwind v4</span>
              </div>
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-amber-500/30 transition-colors">
                <Database className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs font-semibold text-slate-200">Supabase</span>
              </div>
            </div>
          </section>

          {/* Developer Info */}
          <section className="bg-amber-500/10 p-3.5 sm:p-4 rounded-2xl border border-amber-500/20">
            <h3 className="text-xs font-mono uppercase tracking-widest text-amber-400 mb-2 flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5" /> Developer
            </h3>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-white">Christian Jay Basinillo</p>
                <p className="text-[11px] text-slate-400 font-mono">Creator & Lead Developer</p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <a
                  href="https://github.com/christian1202"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-950/80 text-white border border-white/10 rounded-xl hover:border-amber-500/30 transition-all text-xs font-mono active-scale"
                >
                  <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                  </svg>
                  <span>GitHub</span>
                </a>
                <a
                  href="https://github.com/christian1202/FlowCheck.git"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-950/80 text-white border border-white/10 rounded-xl hover:border-amber-500/30 transition-all text-xs font-mono active-scale"
                >
                  <Code2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Source Code</span>
                </a>
              </div>
            </div>
          </section>

        </div>

        {/* Footer Support Message */}
        <div className="px-4 py-3 bg-slate-950/90 border-t border-white/10 text-center shrink-0">
          <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1 flex-wrap">
            <span>Found a bug or issue? Reach out on</span>
            <a
              href="https://www.facebook.com/xristianx.basinillo/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 font-semibold transition-colors"
            >
              <svg className="w-3 h-3 fill-current shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span>Facebook</span>
            </a>
          </p>
        </div>

      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={buttonClass}
        title={isCollapsed || iconOnly ? "System Info" : undefined}
      >
        <Info className="w-4 h-4 shrink-0 text-slate-400" />
        {!(isCollapsed || iconOnly) && <span>System Info</span>}
      </button>

      {isOpen && mounted && createPortal(modalContent, document.body)}
    </>
  );
}
