'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Search, Loader2 } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { fetchEventsPage } from '@/app/(dashboard)/events/all/actions';
import type { EventWithRole } from '@/data/events';

export default function EventsList({ initialEvents }: { initialEvents: EventWithRole[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  const [events, setEvents] = useState<EventWithRole[]>(initialEvents);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialEvents.length === 20);
  const [isLoading, setIsLoading] = useState(false);

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
  
  // Since we display events in a grid on large screens, react-virtual supports grid but it's simpler
  // to virtualize as a vertical list where each "virtualRow" contains 1 or 2 items (depending on screen width).
  // For simplicity and responsiveness, we'll keep it as a vertical list of rows. 
  // We chunk the array into pairs.
  const isMd = typeof window !== 'undefined' ? window.innerWidth >= 768 : true;
  const columns = isMd ? 2 : 1;
  const rowCount = Math.ceil((events.length + (hasMore ? 1 : 0)) / columns);

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 160, // estimated height of the card + gap
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
                  className={`grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 items-start`}
                >
                  {isLoader ? (
                    <div className="col-span-1 md:col-span-2 flex justify-center items-center py-8 text-on-surface-variant">
                      <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading more events...
                    </div>
                  ) : (
                    rowEvents.map(event => (
                      <Link key={event.id} href={`/events/${event.id}/settings`} className="block group h-full">
                        <div className="bg-surface-container-lowest rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-surface-container-high overflow-hidden flex flex-col sm:flex-row h-full min-h-[140px]">
                          <div className="p-6 flex flex-col justify-between flex-1">
                            <div>
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-headline-md text-headline-md text-primary font-bold group-hover:underline decoration-2 underline-offset-4 truncate pr-2">{event.title}</h4>
                                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors transform group-hover:translate-x-1 shrink-0">arrow_forward</span>
                              </div>
                              <p className="font-body-md text-body-md text-on-surface-variant mb-4 flex items-center gap-2 truncate">
                                <span className="material-symbols-outlined text-[18px]">location_on</span>
                                {event.location || 'No location set'} • {new Date(event.date).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex justify-between items-center border-t border-surface-container-highest pt-4 mt-auto">
                              <div className="flex flex-wrap items-center gap-4">
                                <div className="flex flex-col">
                                  <span className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider">Status</span>
                                  <span className="font-label-sm text-label-sm text-primary font-bold capitalize">{event.status}</span>
                                </div>
                                <div className="h-8 w-px bg-surface-container-highest hidden sm:block"></div>
                                <div className="flex flex-col">
                                  <span className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider">Capacity</span>
                                  <span className="font-label-sm text-label-sm text-primary font-bold">{event.maxAttendees || 'Unlimited'}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))
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
