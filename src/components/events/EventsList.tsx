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
    <div className="flex flex-col space-y-6">
      <div className="bg-surface-container-lowest p-4 rounded-xl border border-surface-container-high shadow-sm">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-on-surface-variant w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search events by title..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface border border-outline-variant rounded-lg font-body-sm text-sm focus:ring-1 focus:ring-primary focus:outline-none"
          />
        </div>
      </div>

      <div 
        ref={parentRef}
        className="overflow-auto h-[600px] w-full"
      >
        {events.length === 0 ? (
          <div className="text-center border-2 border-dashed border-outline-variant rounded-xl p-12 mt-4">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-4">event_note</span>
            <h3 className="font-label-sm font-bold text-primary">No events found</h3>
            <p className="mt-1 font-body-md text-on-surface-variant mb-6">
              {searchTerm ? 'Try adjusting your search criteria.' : "You haven't created any events yet."}
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
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6 items-start`}
                >
                  {isLoader ? (
                    <div className="col-span-1 md:col-span-2 lg:col-span-3 flex justify-center items-center py-8 text-on-surface-variant">
                      <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading more events...
                    </div>
                  ) : (
                    rowEvents.map(event => {
                      const displayStatus = getEventDisplayStatus(event.status, event.closesAt);
                      const statusClasses = getEventStatusStyles(displayStatus);

                      return (
                        <Link key={event.id} href={`/events/${event.id}${linkSuffix}`} className="block group h-full">
                          <div className="bg-white dark:bg-surface-container-lowest rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-surface-container-high p-6 flex flex-col h-full min-h-[300px]">
                            
                            {/* Top: Pill */}
                            <div className="mb-4">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full font-label-xs font-bold uppercase tracking-wider ${statusClasses}`}>
                                {displayStatus}
                              </span>
                            </div>

                            {/* Title & Description */}
                            <div className="mb-6 flex-1">
                              <h4 className="text-xl font-bold text-on-surface mb-2 line-clamp-2 group-hover:text-primary transition-colors">{event.title}</h4>
                              {event.description && (
                                <p className="text-sm text-on-surface-variant line-clamp-2">
                                  {event.description}
                                </p>
                              )}
                            </div>

                            {/* Date & Location */}
                            <div className="space-y-3 mb-6">
                              <div className="flex items-center gap-3 text-sm text-on-surface-variant font-medium">
                                <span className="material-symbols-outlined text-[20px]">calendar_today</span>
                                <div className="flex flex-col gap-0.5">
                                  <span>{new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                  {event.closesAt && (
                                    <span className="text-xs text-on-surface-variant/80">Closes: {new Date(event.closesAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-3 text-sm text-on-surface-variant font-medium">
                                <span className="material-symbols-outlined text-[20px]">location_on</span>
                                <span className="line-clamp-1">{event.location || 'No location set'}</span>
                              </div>
                            </div>

                            {/* Divider */}
                            <div className="h-px w-full bg-surface-container-highest mb-4"></div>

                            {/* Footer */}
                            {displayStatus === 'Closed' ? (
                              <div className="flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-bold text-on-surface-variant">Final Attendance</span>
                                  <span className="text-sm font-bold text-on-surface-variant">{event.checkedInCount || 0}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-on-surface-variant">Pre-registered vs Scanned</span>
                                    <span className="text-xs font-bold text-on-surface-variant">{event.checkedInCount || 0} / {event.registeredCount || 0}</span>
                                  </div>
                                  <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-green-500 dark:bg-green-600 rounded-full transition-all duration-500" 
                                      style={{ width: `${event.registeredCount ? Math.min(100, ((event.checkedInCount || 0) / event.registeredCount) * 100) : 0}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-bold text-on-surface-variant">Capacity</span>
                                  <span className="text-sm font-bold text-on-surface-variant">
                                    {event.registeredCount || 0} / {event.maxAttendees ? event.maxAttendees.toLocaleString() : 'Unlimited'}
                                  </span>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-on-surface-variant">Pre-registered vs Scanned</span>
                                    <span className="text-xs font-bold text-on-surface-variant">{event.checkedInCount || 0} / {event.registeredCount || 0}</span>
                                  </div>
                                  <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-green-500 dark:bg-green-600 rounded-full transition-all duration-500" 
                                      style={{ width: `${event.registeredCount ? Math.min(100, ((event.checkedInCount || 0) / event.registeredCount) * 100) : 0}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                          </div>
                        </Link>
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
