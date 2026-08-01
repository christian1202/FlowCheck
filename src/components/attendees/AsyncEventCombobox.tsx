'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Check, Loader2 } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { searchEventsAction } from '@/app/(dashboard)/attendees/actions';

export default function AsyncEventCombobox({ 
  value, 
  onChange, 
  initialEvents 
}: { 
  value: string; 
  onChange: (val: string) => void;
  initialEvents: { id: string; title: string }[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [events, setEvents] = useState(initialEvents);
  const [isLoading, setIsLoading] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadEvents = async () => {
      if (!isOpen) return;
      setIsLoading(true);
      try {
        const results = await searchEventsAction(debouncedSearch);
        if (isMounted) {
          setEvents(results);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    loadEvents();
    return () => { isMounted = false; };
  }, [debouncedSearch, isOpen]);

  const selectedEvent = value === 'all' 
    ? { id: 'all', title: 'All Events' } 
    : events.find(e => e.id === value) || initialEvents.find(e => e.id === value);

  return (
    <div className="relative w-full md:w-64" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-slate-950/60 border border-white/10 rounded-xl py-2.5 px-3 text-xs text-white font-mono hover:border-amber-500/30 transition-all"
      >
        <span className="truncate pr-2">{selectedEvent?.title || 'Select Event...'}</span>
        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute z-50 top-full left-0 mt-2 w-full min-w-[240px] bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[300px]">
          <div className="p-2 border-b border-white/10 relative shrink-0">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
            <input
              type="text"
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-white/5 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>
          
          <div className="overflow-y-auto flex-1 p-1 custom-scrollbar">
            {isLoading ? (
              <div className="flex items-center justify-center p-4 text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => { onChange('all'); setIsOpen(false); setSearch(''); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-mono text-left transition-colors ${value === 'all' ? 'bg-amber-500/10 text-amber-400' : 'text-slate-300 hover:bg-white/5'}`}
                >
                  <span className="truncate">All Events</span>
                  {value === 'all' && <Check className="w-3.5 h-3.5 shrink-0" />}
                </button>
                
                {events.map(event => (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => { onChange(event.id); setIsOpen(false); setSearch(''); }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-mono text-left transition-colors ${value === event.id ? 'bg-amber-500/10 text-amber-400' : 'text-slate-300 hover:bg-white/5'}`}
                  >
                    <span className="truncate">{event.title}</span>
                    {value === event.id && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                ))}
                
                {events.length === 0 && (
                  <div className="p-3 text-center text-xs text-slate-500 font-mono">
                    No events found
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
