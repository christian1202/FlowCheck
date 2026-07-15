'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { AttendeeWithEvent } from '@/data/attendees';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend
} from 'recharts';
import { Search, Filter, Loader2, Download } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { fetchAttendeesPage, fetchAttendeesStats, fetchAllAttendeesForExport } from '@/app/(dashboard)/attendees/actions';
import { useVirtualizer } from '@tanstack/react-virtual';

export default function AttendeesDashboard({ 
  initialAttendees,
  initialStats,
  uniqueEvents
}: { 
  initialAttendees: AttendeeWithEvent[],
  initialStats: { total: number; checkedIn: number; registered: number },
  uniqueEvents: { id: string; title: string }[]
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  const [statusFilter, setStatusFilter] = useState<'all' | 'registered' | 'checked_in'>('all');
  const [eventFilter, setEventFilter] = useState<string>('all');
  
  const [attendees, setAttendees] = useState<AttendeeWithEvent[]>(initialAttendees);
  const [stats, setStats] = useState(initialStats);
  
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialAttendees.length === 50);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  
  // Reload data when filters change
  useEffect(() => {
    let isMounted = true;
    const loadNewFilters = async () => {
      setIsLoading(true);
      try {
        const filters = {
          search: debouncedSearchTerm,
          eventId: eventFilter,
          status: statusFilter
        };
        const [newStats, newAttendees] = await Promise.all([
          fetchAttendeesStats(filters),
          fetchAttendeesPage(filters, 1)
        ]);
        
        if (isMounted) {
          setStats(newStats);
          setAttendees(newAttendees);
          setPage(1);
          setHasMore(newAttendees.length === 50);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    
    // We only skip if everything is exact initial state, but it's safer to just fetch if filters change.
    // However, on first mount with no filters, we already have initial data.
    if (debouncedSearchTerm === '' && statusFilter === 'all' && eventFilter === 'all' && page === 1 && attendees === initialAttendees) {
      return;
    }
    
    loadNewFilters();
    
    return () => { isMounted = false; };
  }, [debouncedSearchTerm, statusFilter, eventFilter]);
  
  // Load next page
  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    try {
      const nextPage = page + 1;
      const filters = { search: debouncedSearchTerm, eventId: eventFilter, status: statusFilter };
      const newAttendees = await fetchAttendeesPage(filters, nextPage);
      
      setAttendees(prev => [...prev, ...newAttendees]);
      setPage(nextPage);
      setHasMore(newAttendees.length === 50);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, page, debouncedSearchTerm, eventFilter, statusFilter]);
  
  // Virtualizer setup
  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: hasMore ? attendees.length + 1 : attendees.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 73, // estimated height of a row
    overscan: 5,
  });
  
  // Trigger loadMore when scrolling to bottom
  const virtualItems = rowVirtualizer.getVirtualItems();
  const lastItem = virtualItems[virtualItems.length - 1];
  
  useEffect(() => {
    if (!lastItem) return;
    
    if (lastItem.index >= attendees.length - 1 && hasMore && !isLoading) {
      loadMore();
    }
  }, [lastItem?.index, attendees.length, hasMore, isLoading, loadMore]);
  
  // Chart data
  const pieData = [
    { name: 'Checked In', value: stats.checkedIn, color: '#4ade80' },
    { name: 'Pending', value: stats.registered, color: '#facc15' },
  ];

  const handleExportClick = () => {
    setShowExportModal(true);
  };

  const handleExportCSV = async () => {
    setShowExportModal(false);
    if (isExporting) return;
    setIsExporting(true);
    try {
      const filters = { search: debouncedSearchTerm, eventId: eventFilter, status: statusFilter };
      const allData = await fetchAllAttendeesForExport(filters);
      
      // Convert to CSV
      const headers = ['Name', 'Email', 'Event', 'Local', 'Duty', 'Status', 'Registered At', 'Checked In At'];
      const csvRows = [headers.join(',')];
      
      for (const row of allData) {
        const values = [
          `"${(row.name || '').replace(/"/g, '""')}"`,
          `"${(row.email || '').replace(/"/g, '""')}"`,
          `"${(row.eventTitle || '').replace(/"/g, '""')}"`,
          `"${(row.local || '').replace(/"/g, '""')}"`,
          `"${(row.duty || '').replace(/"/g, '""')}"`,
          `"${row.status}"`,
          `"${row.registeredAt ? new Date(row.registeredAt).toISOString() : ''}"`,
          `"${row.checkedInAt ? new Date(row.checkedInAt).toISOString() : ''}"`
        ];
        csvRows.push(values.join(','));
      }
      
      const csvString = csvRows.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `attendees_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to export CSV', err);
      alert('Failed to export CSV. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      
      {/* Filters and Search Bar */}
      <div className="bg-surface-container-lowest p-4 rounded-xl border border-surface-container-high flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-on-surface-variant w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search name, email, local..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface border border-outline-variant rounded-lg font-body-sm text-sm focus:ring-1 focus:ring-primary focus:outline-none"
          />
        </div>

        <div className="flex w-full md:w-auto gap-4">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="text-on-surface-variant w-4 h-4" />
            <select 
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              className="w-full md:w-48 bg-surface border border-outline-variant rounded-lg py-2 px-3 text-sm font-body-sm focus:ring-1 focus:ring-primary focus:outline-none"
            >
              <option value="all">All Events</option>
              {uniqueEvents.map(e => (
                <option key={e.id} value={e.id}>{e.title}</option>
              ))}
            </select>
          </div>
          
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full md:w-40 bg-surface border border-outline-variant rounded-lg py-2 px-3 text-sm font-body-sm focus:ring-1 focus:ring-primary focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="checked_in">Checked In</option>
            <option value="registered">Pending</option>
          </select>
          
          <button
            onClick={handleExportClick}
            disabled={isExporting}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg font-body-sm text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 shrink-0"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span className="hidden md:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Metrics & Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex flex-col gap-4">
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-surface-container-high shadow-sm">
            <h3 className="font-label-sm text-on-surface-variant mb-2">Total Attendees</h3>
            <p className="font-headline-lg text-3xl font-bold text-primary">{stats.total}</p>
          </div>
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-surface-container-high shadow-sm">
            <h3 className="font-label-sm text-on-surface-variant mb-2">Checked In</h3>
            <p className="font-headline-lg text-3xl font-bold text-green-600">{stats.checkedIn}</p>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl border border-surface-container-high shadow-sm md:col-span-2 h-64 flex flex-col">
          <h3 className="font-label-sm font-bold text-on-surface mb-2">Registration Status Overview</h3>
          <div className="flex-1 w-full min-h-0">
            {stats.total === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-on-surface-variant font-body-sm">
                No data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Virtualized Attendees Table */}
      <div className="bg-surface-container-lowest rounded-xl border border-surface-container-high shadow-sm overflow-hidden flex flex-col h-[500px]">
        {/* Table Header */}
        <div className="bg-surface-container-low text-on-surface-variant border-b border-surface-container-high grid grid-cols-12 gap-4 px-6 py-4 font-semibold text-sm font-body-sm">
          <div className="col-span-4 md:col-span-3">Name / Email</div>
          <div className="col-span-3 md:col-span-3 hidden md:block">Event</div>
          <div className="col-span-4 md:col-span-2">Local / Duty</div>
          <div className="col-span-4 md:col-span-2">Status</div>
          <div className="hidden md:block md:col-span-2">Check-in Time</div>
        </div>
        
        {/* Virtualized Body */}
        <div 
          ref={parentRef}
          className="flex-1 overflow-auto"
        >
          {attendees.length === 0 ? (
            <div className="flex items-center justify-center h-full text-on-surface-variant p-6">
              {isLoading ? 'Loading...' : 'No attendees found matching your criteria.'}
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
                    className="grid grid-cols-12 gap-4 px-6 items-center border-b border-surface-container-high hover:bg-surface-container-low transition-colors text-sm font-body-sm"
                  >
                    {isLoaderRow ? (
                      <div className="col-span-12 flex justify-center py-4 text-on-surface-variant">
                        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading more...
                      </div>
                    ) : (
                      <>
                        <div className="col-span-4 md:col-span-3 py-2">
                          <div className="font-semibold text-on-surface truncate">{attendee.name}</div>
                          <div className="text-on-surface-variant text-xs truncate">{attendee.email}</div>
                        </div>
                        <div className="col-span-3 md:col-span-3 py-2 hidden md:block text-on-surface-variant truncate">
                          {attendee.eventTitle}
                        </div>
                        <div className="col-span-4 md:col-span-2 py-2">
                          <div className="text-on-surface truncate">{attendee.local || '-'}</div>
                          <div className="text-on-surface-variant text-xs truncate">{attendee.duty || '-'}</div>
                        </div>
                        <div className="col-span-4 md:col-span-2 py-2">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-semibold whitespace-nowrap ${
                            attendee.status === 'checked_in' 
                              ? 'bg-green-100 text-green-700 border border-green-200' 
                              : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                          }`}>
                            {attendee.status === 'checked_in' ? 'Checked In' : 'Pending'}
                          </span>
                        </div>
                        <div className="hidden md:block md:col-span-2 py-2 text-on-surface-variant text-xs truncate">
                          {attendee.checkedInAt ? new Date(attendee.checkedInAt).toLocaleString() : '-'}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      {/* Export Confirmation Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface rounded-2xl max-w-md w-full p-6 shadow-xl border border-surface-container-high">
            <h3 className="font-headline-sm text-xl text-on-surface mb-2">Confirm Export</h3>
            <p className="font-body-md text-on-surface-variant mb-6">
              Are you sure you want to export attendees for <strong>{eventFilter === 'all' ? 'all events' : uniqueEvents.find(e => e.id === eventFilter)?.title}</strong>?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 font-body-sm font-semibold rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExportCSV}
                className="px-4 py-2 font-body-sm font-semibold rounded-lg bg-primary text-on-primary hover:bg-primary/90 transition-colors"
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
