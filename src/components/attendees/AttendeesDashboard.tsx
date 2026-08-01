'use client';

import { useState, useEffect, useRef, useCallback, useTransition, useDeferredValue, memo } from 'react';
import type { AttendeeWithEvent } from '@/data/attendees';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend
} from 'recharts';
import { Search, Filter, Loader2, Download } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { fetchAttendeesPage, fetchAttendeesStats } from '@/app/(dashboard)/attendees/actions';
import { useVirtualizer } from '@tanstack/react-virtual';
import AsyncEventCombobox from './AsyncEventCombobox';

const AttendeeRow = memo(function AttendeeRow({
  attendee,
  isLoaderRow,
}: {
  attendee?: AttendeeWithEvent;
  isLoaderRow: boolean;
}) {
  return (
    <div style={{ contain: 'content' }} className="h-[68px] max-h-[68px] overflow-hidden grid grid-cols-12 gap-4 px-6 items-center border-b border-slate-800 md:border-white/5 hover:bg-white/[0.03] transition-colors text-xs">
      {isLoaderRow || !attendee ? (
        <div className="col-span-12 flex justify-center py-4 text-slate-400 font-mono">
          <Loader2 className="w-4 h-4 animate-spin mr-2 text-amber-400" /> Loading stream...
        </div>
      ) : (
        <>
          <div className="col-span-4 md:col-span-3 py-2">
            <div className="font-bold text-white truncate">{attendee.name}</div>
            <div className="text-slate-400 text-[11px] truncate font-mono">{attendee.email}</div>
          </div>
          <div className="col-span-3 md:col-span-3 py-2 hidden md:block text-slate-300 truncate">
            {attendee.eventTitle}
          </div>
          <div className="col-span-4 md:col-span-2 py-2">
            <div className="text-slate-200 truncate">{attendee.local || '-'}</div>
            <div className="text-slate-400 text-[11px] truncate">{attendee.duty || '-'}</div>
          </div>
          <div className="col-span-4 md:col-span-2 py-2">
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider ${
              attendee.status === 'checked_in' 
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' 
                : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
            }`}>
              {attendee.status === 'checked_in' ? 'Checked In' : 'Pending'}
            </span>
          </div>
          <div className="hidden md:block md:col-span-2 py-2 text-slate-400 text-[11px] font-mono truncate">
            {attendee.checkedInAt ? new Date(attendee.checkedInAt).toLocaleString('en-US', { hour12: true, month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
          </div>
        </>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.isLoaderRow === nextProps.isLoaderRow && 
         prevProps.attendee?.id === nextProps.attendee?.id;
});

export default function AttendeesDashboard({ 
  initialAttendees,
  initialStats,
  uniqueEvents
}: { 
  initialAttendees: AttendeeWithEvent[],
  initialStats: { total: number; checkedIn: number; registered: number },
  uniqueEvents: { id: string; title: string }[]
}) {
  const [isPending, startTransition] = useTransition();

  const [inputValue, setInputValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const debouncedSearchTerm = useDebounce(deferredSearchTerm, 300);
  
  const [statusFilter, setStatusFilter] = useState<'all' | 'registered' | 'checked_in'>('all');
  const [eventFilter, setEventFilter] = useState<string>('all');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    startTransition(() => {
      setSearchTerm(val);
    });
  };
  
  const handleEventFilterChange = (val: string) => {
    startTransition(() => setEventFilter(val));
  };

  const handleStatusFilterChange = (val: 'all' | 'registered' | 'checked_in') => {
    startTransition(() => setStatusFilter(val));
  };
  
  const [attendees, setAttendees] = useState<AttendeeWithEvent[]>(initialAttendees);
  const [stats, setStats] = useState(initialStats);
  
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialAttendees.length === 20);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  
  const isInitialMount = useRef(true);

  // Reload data when filters change
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    let isMounted = true;
    const loadNewFilters = async () => {
      startTransition(() => {
        setAttendees([]);
      });
      setIsLoading(true);
      try {
        const filters = {
          search: debouncedSearchTerm,
          eventId: eventFilter,
          status: statusFilter
        };
        const newStats = await fetchAttendeesStats(eventFilter);
        const newAttendees = await fetchAttendeesPage(filters, 1);
        
        if (isMounted) {
          startTransition(() => {
            setStats(newStats);
            setAttendees(newAttendees);
            setPage(1);
            setHasMore(newAttendees.length === 20);
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    
    loadNewFilters();
    
    return () => { isMounted = false; };
  }, [debouncedSearchTerm, statusFilter, eventFilter]);
  
  // Load next page
  const isFetchingRef = useRef(false);
  
  const loadMore = useCallback(async () => {
    if (isFetchingRef.current || !hasMore) return;
    isFetchingRef.current = true;
    setIsLoading(true);
    
    try {
      const nextPage = page + 1;
      const filters = { search: debouncedSearchTerm, eventId: eventFilter, status: statusFilter };
      const newAttendees = await fetchAttendeesPage(filters, nextPage);
      
      startTransition(() => {
        setAttendees(prev => {
          // Avoid duplicate appends if strict mode double-invokes
          const existingIds = new Set(prev.map(a => a.id));
          const uniqueNew = newAttendees.filter(a => !existingIds.has(a.id));
          return [...prev, ...uniqueNew];
        });
        setPage(nextPage);
        setHasMore(newAttendees.length === 20);
      });
    } catch (err) {
      console.error(err);
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
    }
  }, [hasMore, page, debouncedSearchTerm, eventFilter, statusFilter]);
  
  // Virtualizer setup
  const parentRef = useRef<HTMLDivElement>(null);
  
  const estimateSize = useCallback(() => 68, []);
  const virtualItemCount = hasMore ? attendees.length + 1 : attendees.length;
  
  const rowVirtualizer = useVirtualizer({
    count: virtualItemCount,
    getScrollElement: () => parentRef.current,
    estimateSize,
    overscan: 5,
  });
  
  const virtualItems = rowVirtualizer.getVirtualItems();
  const lastItemIndex = virtualItems.length > 0 ? virtualItems[virtualItems.length - 1].index : -1;
  
  useEffect(() => {
    if (lastItemIndex < 0) return;
    
    if (lastItemIndex >= attendees.length - 1 && hasMore && !isFetchingRef.current) {
      loadMore();
    }
  }, [lastItemIndex, attendees.length, hasMore, loadMore]);
  
  // Chart data
  const pieData = [
    { name: 'Checked In', value: stats.checkedIn, color: '#10b981' },
    { name: 'Pending', value: stats.registered, color: '#f59e0b' },
  ];

  const handleExportClick = () => {
    setShowExportModal(true);
  };

  const handleExportCSV = async () => {
    setShowExportModal(false);
    if (isExporting) return;
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearchTerm) params.set('search', debouncedSearchTerm);
      if (eventFilter !== 'all') params.set('eventId', eventFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      window.location.assign(`/api/export-attendees?${params.toString()}`);
    } catch (err) {
      console.error('Failed to export CSV', err);
      alert('Failed to export CSV. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col space-y-6 text-slate-100">
      
      {/* Filters and Search Bar */}
      <div className="claude-card p-4 rounded-3xl border border-white/10 flex flex-col md:flex-row gap-4 items-center justify-between shadow-lg">
        
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search name, email, local..." 
            value={inputValue}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 font-mono transition-colors transform-gpu"
          />
        </div>

        <div className="flex w-full md:w-auto gap-3">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className={`text-slate-400 w-4 h-4 shrink-0 hidden md:block ${isPending ? 'animate-pulse text-amber-500' : ''}`} />
            <AsyncEventCombobox 
              value={eventFilter} 
              onChange={handleEventFilterChange} 
              initialEvents={uniqueEvents} 
            />
          </div>
          
          <select 
            value={statusFilter}
            onChange={(e) => handleStatusFilterChange(e.target.value as 'all' | 'registered' | 'checked_in')}
            className="w-full md:w-36 bg-slate-950/60 border border-white/10 rounded-xl py-2.5 px-3 text-xs text-white font-mono focus:outline-none focus:border-amber-500/50 transition-colors transform-gpu"
          >
            <option value="all">All Status</option>
            <option value="checked_in">Checked In</option>
            <option value="registered">Pending</option>
          </select>
          
          <button
            onClick={handleExportClick}
            disabled={isExporting}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl transition-colors transition-transform transform-gpu shadow-[0_0_15px_rgba(245,158,11,0.2)] disabled:opacity-50 shrink-0 active-scale"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span className="hidden md:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Metrics & Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex flex-col gap-4">
          <div className="claude-card p-5 rounded-3xl border border-white/10">
            <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-1">Total Registered</h3>
            <p className="text-3xl font-extrabold text-white tracking-tight">{stats.total}</p>
          </div>
          <div className="claude-card p-5 rounded-3xl border border-white/10">
            <h3 className="text-xs font-mono uppercase tracking-widest text-emerald-400 mb-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> Checked In
            </h3>
            <p className="text-3xl font-extrabold text-emerald-400 tracking-tight">{stats.checkedIn}</p>
          </div>
        </div>

        <div className="claude-card p-5 rounded-3xl border border-white/10 md:col-span-2 min-h-[250px] flex flex-col">
          <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-2">Check-in Status Distribution</h3>
          <div className="flex-1 w-full min-h-[190px]">
            {stats.total === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs font-mono">
                No telemetry available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 10, right: 0, bottom: 0, left: 0 }}>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="38%"
                    innerRadius={46}
                    outerRadius={66}
                    paddingAngle={6}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(0,0,0,0.5)" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Virtualized grid: only visible rows plus overscan are mounted. */}
      <div className={`claude-card rounded-3xl border border-white/10 overflow-hidden h-[500px] transition-opacity duration-200 ${isPending ? 'opacity-50' : 'opacity-100'}`}>
        <div ref={parentRef} className={`h-full overflow-auto touch-pan-y overscroll-contain hide-scrollbar ${rowVirtualizer.isScrolling ? 'pointer-events-none' : ''}`} style={{ contain: 'strict' }}>
          {/* Header is inside the scroll container so it remains sticky. */}
          <div className="sticky top-0 z-10 bg-slate-950 transform-gpu isolation-isolate text-slate-400 border-b border-white/10 grid grid-cols-12 gap-4 px-6 py-3.5 text-xs font-mono uppercase tracking-wider">
          <div className="col-span-4 md:col-span-3">Attendee Name / Email</div>
          <div className="col-span-3 md:col-span-3 hidden md:block">Event</div>
          <div className="col-span-4 md:col-span-2">Local / Duty</div>
          <div className="col-span-4 md:col-span-2">Status</div>
          <div className="hidden md:block md:col-span-2">Timestamp</div>
          </div>

          {attendees.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-500 text-xs font-mono p-6">
              {isLoading ? 'Loading records...' : 'No attendee records found matching your criteria.'}
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
                const isLoaderRow = virtualRow.index > attendees.length - 1;
                const attendee = attendees[virtualRow.index];
                const transform = `translateY(${virtualRow.start}px)`;

                return (
                  <div
                    key={virtualRow.index}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: virtualRow.size,
                      transform,
                    }}
                    className="w-full transform-gpu"
                  >
                    <AttendeeRow attendee={attendee} isLoaderRow={isLoaderRow} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 md:bg-slate-950/80 md:backdrop-blur-md p-4 transform-gpu">
          <div className="claude-card rounded-3xl max-w-md w-full p-6 shadow-2xl border border-white/10 text-slate-100">
            <h3 className="text-lg font-bold text-white mb-2">Confirm Data Export</h3>
            <p className="text-xs text-slate-300 mb-6">
              Export CSV telemetry for <strong>{eventFilter === 'all' ? 'all events' : uniqueEvents.find(e => e.id === eventFilter)?.title}</strong>?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 text-xs font-mono uppercase tracking-wider rounded-xl text-slate-400 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExportCSV}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 transition-colors transform-gpu shadow-[0_0_15px_rgba(245,158,11,0.2)]"
              >
                Confirm Export
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
