'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Search, Loader2 } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { fetchEventsPage } from '@/app/(dashboard)/events/all/actions';
import type { EventWithRole } from '@/data/events';
import { getEventDisplayStatus, getEventStatusStyles } from '@/lib/statusUtils';

export default function EventsList({ initialEvents, linkSuffix = '/settings' }: { initialEvents: EventWithRole[], linkSuffix?: string }) {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  const [events, setEvents] = useState<EventWithRole[]>(initialEvents);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialEvents.length === 20);
  const [isLoading, setIsLoading] = useState(false);
  const [columns, setColumns] = useState(3);

  // Responsive columns
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setColumns(3);
      else if (window.innerWidth >= 768) setColumns(2);
      else setColumns(1);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Track page via ref so loadMore callback stays stable
  const pageRef = useRef(page);
  pageRef.current = page;

  // Reload data on search
  useEffect(() => {
    let isMounted = true;
    const loadNewSearch = async () => {
      setIsLoading(true);
      try {
        const newEvents = await fetchEventsPage(1, 20, debouncedSearchTerm);
        if (isMounted) {
          setEvents(newEvents);
          setPage(1);
          setHasMore(newEvents.length === 20);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    loadNewSearch();
    return () => { isMounted = false; };
  }, [debouncedSearchTerm]);

  // Load next page
  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    try {
      const nextPage = pageRef.current + 1;
      const newEvents = await fetchEventsPage(nextPage, 20, debouncedSearchTerm);
      
      setEvents(prev => [...prev, ...newEvents]);
      setPage(nextPage);
      setHasMore(newEvents.length === 20);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, debouncedSearchTerm]);

  // Virtualizer setup
  const parentRef = useRef<HTMLDivElement>(null);
  
  const rowCount = Math.ceil((events.length + (hasMore ? 1 : 0)) / columns);

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 340,
    overscan: 3,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  const lastItemIndex = virtualItems.length > 0 ? virtualItems[virtualItems.length - 1].index : -1;

  useEffect(() => {
    if (lastItemIndex < 0) return;
    
    if (lastItemIndex >= rowCount - 1 && hasMore && !isLoading) {
      loadMore();
    }
  }, [lastItemIndex, rowCount, hasMore, isLoading, loadMore]);

  return (
    <div className="flex flex-col space-y-6">
      {/* Search Bar */}
      <div className="claude-card p-4 rounded-2xl border border-white/10 shadow-lg">
        <div className="relative w-full max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search events by title..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-950/60 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all font-mono"
          />
        </div>
      </div>

      <div 
        ref={parentRef}
        className="overflow-auto h-[600px] md:h-[700px] w-full hide-scrollbar"
      >
        {events.length === 0 ? (
          <div className="text-center claude-card rounded-3xl p-12 mt-4 flex flex-col items-center text-slate-100">
            <div className="h-16 w-16 bg-white/[0.04] border border-white/10 rounded-full flex items-center justify-center mb-4 text-slate-400">
              <span className="material-symbols-outlined text-3xl">search_off</span>
            </div>
            <h3 className="text-lg font-bold text-white mb-1">No events found</h3>
            <p className="text-xs text-slate-400 max-w-sm">
              {searchTerm ? `We couldn't find any events matching "${searchTerm}".` : "You haven't created any events yet."}
            </p>
          </div>
        ) : (
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualItems.map((virtualRow) => {
              const startIndex = virtualRow.index * columns;
              const rowEvents = events.slice(startIndex, startIndex + columns);
              const isLoader = rowEvents.length === 0;

              return (
                <div
                  key={virtualRow.index}
                  data-index={virtualRow.index}
                  ref={rowVirtualizer.measureElement}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6 items-stretch px-1"
                >
                  {isLoader ? (
                    <div className="col-span-1 md:col-span-2 lg:col-span-3 flex justify-center items-center py-8 text-slate-400">
                      <Loader2 className="w-5 h-5 animate-spin mr-3 text-amber-400" /> 
                      <span className="text-xs font-mono tracking-wide">Loading more events...</span>
                    </div>
                  ) : (
                    rowEvents.map(event => {
                      const displayStatus = getEventDisplayStatus(event.status, event.closesAt);
                      const statusClasses = getEventStatusStyles(displayStatus);

                      return (
                        <div key={event.id} className="block group h-full fade-in-stagger relative">
                          <div className="claude-card rounded-3xl hover-lift p-6 flex flex-col h-full min-h-[280px] transition-all duration-300 relative overflow-hidden">
                            
                            {/* Link */}
                            <Link href={`/events/${event.id}${linkSuffix}`} className="absolute inset-0 z-10" aria-label={`View settings for ${event.title}`}></Link>

                            {/* Top: Status */}
                            <div className="mb-4 relative z-10">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest ${statusClasses}`}>
                                {displayStatus}
                              </span>
                            </div>

                            {/* Title */}
                            <div className="mb-4 flex-1 relative z-10">
                              <h4 className="text-base font-bold text-white mb-1.5 line-clamp-2 group-hover:text-amber-300 transition-colors">{event.title}</h4>
                              {event.description && (
                                <p className="text-xs text-slate-400 line-clamp-2">
                                  {event.description}
                                </p>
                              )}
                            </div>

                            {/* Details */}
                            <div className="space-y-2 mb-6 relative z-10 text-xs text-slate-300">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center text-slate-400">
                                  <span className="material-symbols-outlined text-[15px]">calendar_today</span>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                  <span>{new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                  {event.closesAt && (
                                    <span className="text-[10px] text-slate-500 font-mono">Closes: {new Date(event.closesAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center text-slate-400">
                                  <span className="material-symbols-outlined text-[15px]">location_on</span>
                                </div>
                                <span className="line-clamp-1 flex-1">{event.location || 'No location set'}</span>
                                {event.mapLink && (
                                  <button 
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      window.open(event.mapLink as string, '_blank', 'noopener,noreferrer');
                                    }} 
                                    className="relative z-20 ml-auto w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center hover:bg-amber-500/20 transition-colors" 
                                    title="View on Google Maps"
                                  >
                                    <span className="material-symbols-outlined text-[15px]">map</span>
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Attendance Meter */}
                            <div className="pt-4 border-t border-white/10 relative z-10">
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Attendance Rate</span>
                                  <span className="font-mono text-amber-400 font-bold">{event.checkedInCount || 0} / {event.registeredCount || 0}</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                                  <div 
                                    className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full transition-all duration-1000 ease-out" 
                                    style={{ width: `${event.registeredCount ? Math.min(100, ((event.checkedInCount || 0) / event.registeredCount) * 100) : 0}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                            
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
