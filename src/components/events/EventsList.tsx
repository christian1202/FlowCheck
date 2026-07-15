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
    handleResize(); // init
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    
    if (debouncedSearchTerm === '' && page === 1 && events === initialEvents) {
      return;
    }
    
    loadNewSearch();
    return () => { isMounted = false; };
  }, [debouncedSearchTerm]);

  // Load next page
  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    try {
      const nextPage = page + 1;
      const newEvents = await fetchEventsPage(nextPage, 20, debouncedSearchTerm);
      
      setEvents(prev => [...prev, ...newEvents]);
      setPage(nextPage);
      setHasMore(newEvents.length === 20);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, page, debouncedSearchTerm]);

  // Virtualizer setup
  const parentRef = useRef<HTMLDivElement>(null);
  
  const rowCount = Math.ceil((events.length + (hasMore ? 1 : 0)) / columns);

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 360, // estimated height of the card (h-40 + p-5 content = ~336px) + gap
    overscan: 3,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  const lastItem = virtualItems[virtualItems.length - 1];

  useEffect(() => {
    if (!lastItem) return;
    
    if (lastItem.index >= rowCount - 1 && hasMore && !isLoading) {
      loadMore();
    }
  }, [lastItem?.index, rowCount, hasMore, isLoading, loadMore]);

  return (
    <div className="flex flex-col space-y-6 md:space-y-8">
      {/* Search Bar */}
      <div className="glass-panel p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-sm">
        <div className="relative w-full max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-on-surface-variant w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search events by title..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-surface/50 border border-outline-variant/50 rounded-xl font-body-md focus:bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all shadow-inner"
          />
        </div>
      </div>

      <div 
        ref={parentRef}
        className="overflow-auto h-[600px] md:h-[700px] w-full hide-scrollbar"
      >
        {events.length === 0 ? (
          <div className="text-center glass-panel rounded-3xl p-12 mt-4 flex flex-col items-center">
            <div className="h-20 w-20 bg-surface-container-high rounded-full flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant">search_off</span>
            </div>
            <h3 className="text-xl font-bold text-primary mb-2">No events found</h3>
            <p className="font-body-md text-on-surface-variant max-w-sm">
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
                    <div className="col-span-1 md:col-span-2 lg:col-span-3 flex justify-center items-center py-8 text-on-surface-variant">
                      <Loader2 className="w-6 h-6 animate-spin mr-3 text-primary" /> 
                      <span className="font-medium tracking-wide">Loading more events...</span>
                    </div>
                  ) : (
                    rowEvents.map(event => {
                      const displayStatus = getEventDisplayStatus(event.status, event.closesAt);
                      const statusClasses = getEventStatusStyles(displayStatus);

                      return (
                        <div key={event.id} className="block group h-full fade-in-stagger relative">
                          <div className="glass-panel rounded-3xl hover-lift p-6 flex flex-col h-full min-h-[280px] transition-all duration-300 relative overflow-hidden">
                            
                            {/* Full card clickable link */}
                            <Link href={`/events/${event.id}${linkSuffix}`} className="absolute inset-0 z-10" aria-label={`View settings for ${event.title}`}></Link>

                            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors pointer-events-none"></div>

                            {/* Top: Pill */}
                            <div className="mb-6 relative z-10">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-sm ${statusClasses}`}>
                                {displayStatus}
                              </span>
                            </div>

                            {/* Title & Description */}
                            <div className="mb-6 flex-1 relative z-10">
                              <h4 className="font-headline-md text-on-surface mb-2 line-clamp-2 group-hover:text-primary transition-colors">{event.title}</h4>
                              {event.description && (
                                <p className="font-body-md text-sm text-on-surface-variant line-clamp-2">
                                  {event.description}
                                </p>
                              )}
                            </div>

                            {/* Date & Location */}
                            <div className="space-y-3 mb-8 relative z-10">
                              <div className="flex items-center gap-3 text-sm text-on-surface-variant">
                                <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center">
                                  <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                  <span className="font-medium">{new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                  {event.closesAt && (
                                    <span className="text-xs text-on-surface-variant/80">Closes: {new Date(event.closesAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-3 text-sm text-on-surface-variant">
                                <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center">
                                  <span className="material-symbols-outlined text-[16px]">location_on</span>
                                </div>
                                <span className="line-clamp-1 font-medium">{event.location || 'No location set'}</span>
                                {event.mapLink && (
                                  <button 
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      window.open(event.mapLink as string, '_blank', 'noopener,noreferrer');
                                    }} 
                                    className="relative z-20 ml-auto w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors cursor-pointer" 
                                    title="View on Google Maps"
                                  >
                                    <span className="material-symbols-outlined text-[16px]">map</span>
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Footer */}
                            <div className="pt-4 border-t border-outline-variant/30 relative z-10">
                              {displayStatus === 'Closed' ? (
                                <div className="flex flex-col gap-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Final Attendance</span>
                                    <span className="text-sm font-bold text-on-surface">{event.checkedInCount || 0}</span>
                                  </div>
                                  <div className="flex flex-col gap-1.5">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-widest">Pre-registered vs Scanned</span>
                                      <span className="text-[10px] font-bold text-on-surface">{event.checkedInCount || 0} / {event.registeredCount || 0}</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-green-500 rounded-full transition-all duration-1000 ease-out" 
                                        style={{ width: `${event.registeredCount ? Math.min(100, ((event.checkedInCount || 0) / event.registeredCount) * 100) : 0}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-col gap-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Capacity</span>
                                    <span className="text-sm font-bold text-on-surface">
                                      {event.registeredCount || 0} / {event.maxAttendees ? event.maxAttendees.toLocaleString() : 'Unlimited'}
                                    </span>
                                  </div>
                                  <div className="flex flex-col gap-1.5">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-widest">Pre-registered vs Scanned</span>
                                      <span className="text-[10px] font-bold text-on-surface">{event.checkedInCount || 0} / {event.registeredCount || 0}</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out" 
                                        style={{ width: `${event.registeredCount ? Math.min(100, ((event.checkedInCount || 0) / event.registeredCount) * 100) : 0}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                </div>
                              )}
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
