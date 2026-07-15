'use client';

import { useState } from 'react';
import { Info, X, Code2, Database, Layout, Server, Sparkles } from 'lucide-react';

interface SystemInfoModalProps {
  isCollapsed?: boolean;
  className?: string;
  iconOnly?: boolean;
}

export default function SystemInfoModal({ isCollapsed, className, iconOnly }: SystemInfoModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const defaultClassName = "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl font-label-sm transition-all duration-200 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface active-scale";
  const buttonClass = className || defaultClassName;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={buttonClass}
        title={isCollapsed || iconOnly ? "System Info" : undefined}
      >
        <Info className="w-5 h-5 shrink-0" />
        {!(isCollapsed || iconOnly) && <span>System Info</span>}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 fade-in-stagger">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Modal Content */}
          <div className="relative w-full max-w-2xl bg-surface-container-lowest border border-outline-variant/50 rounded-3xl shadow-2xl overflow-hidden glass-panel flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/30 bg-surface/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Info className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-display-md font-bold text-primary tracking-tight">System Info</h2>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-full hover:bg-surface-variant transition-colors text-on-surface-variant"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto hide-scrollbar space-y-8">
              
              {/* About */}
              <section>
                <h3 className="text-sm font-label-sm uppercase tracking-wider text-on-surface-variant mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> About FlowCheck
                </h3>
                <p className="text-body-md text-on-surface leading-relaxed bg-surface-container-highest/50 p-4 rounded-2xl border border-outline-variant/30">
                  FlowCheck is a open source project, secure event management and attendee QR scanning platform. It is designed to provide organizers with real-time insights and a seamless check-in experience across desktop, tablet, and mobile devices.
                </p>
              </section>

              {/* Tech Stack */}
              <section>
                <h3 className="text-sm font-label-sm uppercase tracking-wider text-on-surface-variant mb-3 flex items-center gap-2">
                  <Layout className="w-4 h-4" /> Technology Stack
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-surface-container-highest/50 border border-outline-variant/30 hover:bg-surface-variant transition-colors">
                    <Server className="w-6 h-6 text-primary" />
                    <span className="text-xs font-semibold">Next.js 15</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-surface-container-highest/50 border border-outline-variant/30 hover:bg-surface-variant transition-colors">
                    <Code2 className="w-6 h-6 text-blue-500" />
                    <span className="text-xs font-semibold">React 19</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-surface-container-highest/50 border border-outline-variant/30 hover:bg-surface-variant transition-colors">
                    <Layout className="w-6 h-6 text-teal-500" />
                    <span className="text-xs font-semibold">Tailwind CSS</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-surface-container-highest/50 border border-outline-variant/30 hover:bg-surface-variant transition-colors">
                    <Database className="w-6 h-6 text-green-500" />
                    <span className="text-xs font-semibold">Supabase</span>
                  </div>
                </div>
              </section>

              {/* Developer Info */}
              <section className="bg-primary/5 p-5 rounded-2xl border border-primary/10">
                <h3 className="text-sm font-label-sm uppercase tracking-wider text-primary mb-4 flex items-center gap-2">
                  <Code2 className="w-4 h-4" /> Developer
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <p className="text-lg font-bold text-on-surface">Christian Jay Basinillo</p>
                      <p className="text-sm text-on-surface-variant">Creator & Lead Developer</p>
                    </div>
                    <div className="flex gap-2">
                      <a 
                        href="https://github.com/christian1202" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-surface text-on-surface border border-outline-variant rounded-lg hover:bg-surface-variant transition-all text-sm font-semibold active-scale"
                      >
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                        </svg> GitHub Profile
                      </a>
                      <a 
                        href="https://github.com/christian1202/FlowCheck.git" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-surface text-on-surface border border-outline-variant rounded-lg hover:bg-surface-variant transition-all text-sm font-semibold active-scale"
                      >
                        <Code2 className="w-4 h-4" /> Source Code
                      </a>
                    </div>
                  </div>
                </div>
              </section>
              
            </div>

            {/* Footer Support Message */}
            <div className="px-6 py-4 bg-surface-container-highest/50 border-t border-outline-variant/30 text-center">
              <p className="text-sm text-on-surface-variant flex items-center justify-center gap-2 flex-wrap">
                Found a bug or error in the system? You can message me on
                <a 
                  href="https://www.facebook.com/xristianx.basinillo/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg> Facebook
                </a>
              </p>
            </div>
            
          </div>
        </div>
      )}
    </>
  );
}
