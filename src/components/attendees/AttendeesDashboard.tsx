'use client';

import { useState, useMemo } from 'react';
import type { AttendeeWithEvent } from '@/data/attendees';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import { Search, Filter } from 'lucide-react';

export default function AttendeesDashboard({ 
  initialAttendees 
}: { 
  initialAttendees: AttendeeWithEvent[] 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'registered' | 'checked_in'>('all');
  const [eventFilter, setEventFilter] = useState<string>('all');

  // Unique events for the filter dropdown
  const uniqueEvents = useMemo(() => {
    const eventsMap = new Map<string, string>();
    initialAttendees.forEach(a => {
      eventsMap.set(a.eventId, a.eventTitle);
    });
    return Array.from(eventsMap.entries()).map(([id, title]) => ({ id, title }));
  }, [initialAttendees]);

  // Filtered attendees based on search and filters
  const filteredAttendees = useMemo(() => {
    return initialAttendees.filter(attendee => {
      const matchesSearch = 
        attendee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        attendee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (attendee.local && attendee.local.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || attendee.status === statusFilter;
      const matchesEvent = eventFilter === 'all' || attendee.eventId === eventFilter;

      return matchesSearch && matchesStatus && matchesEvent;
    });
  }, [initialAttendees, searchTerm, statusFilter, eventFilter]);

  // Metrics calculation
  const totalAttendees = filteredAttendees.length;
  const checkedIn = filteredAttendees.filter(a => a.status === 'checked_in').length;
  const preRegistered = totalAttendees - checkedIn;

  // Chart data
  const pieData = [
    { name: 'Checked In', value: checkedIn, color: '#4ade80' }, // green-400
    { name: 'Pending', value: preRegistered, color: '#facc15' }, // yellow-400
  ];

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
        </div>
      </div>

      {/* Metrics & Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* KPI Cards */}
        <div className="flex flex-col gap-4">
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-surface-container-high shadow-sm">
            <h3 className="font-label-sm text-on-surface-variant mb-2">Total Attendees</h3>
            <p className="font-headline-lg text-3xl font-bold text-primary">{totalAttendees}</p>
          </div>
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-surface-container-high shadow-sm">
            <h3 className="font-label-sm text-on-surface-variant mb-2">Checked In</h3>
            <p className="font-headline-lg text-3xl font-bold text-green-600">{checkedIn}</p>
          </div>
        </div>

        {/* Donut Chart */}
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-surface-container-high shadow-sm md:col-span-2 h-64 flex flex-col">
          <h3 className="font-label-sm font-bold text-on-surface mb-2">Registration Status Overview</h3>
          <div className="flex-1 w-full min-h-0">
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
          </div>
        </div>
      </div>

      {/* Attendees Table */}
      <div className="bg-surface-container-lowest rounded-xl border border-surface-container-high shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm font-body-sm">
            <thead className="bg-surface-container-low text-on-surface-variant border-b border-surface-container-high">
              <tr>
                <th className="px-6 py-4 font-semibold">Name / Email</th>
                <th className="px-6 py-4 font-semibold">Event</th>
                <th className="px-6 py-4 font-semibold">Local / Duty</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Check-in Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-high">
              {filteredAttendees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-on-surface-variant">
                    No attendees found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredAttendees.map(attendee => (
                  <tr key={attendee.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-on-surface">{attendee.name}</div>
                      <div className="text-on-surface-variant text-xs">{attendee.email}</div>
                    </td>
                    <td className="px-6 py-4 text-on-surface-variant">
                      {attendee.eventTitle}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-on-surface">{attendee.local || '-'}</div>
                      <div className="text-on-surface-variant text-xs">{attendee.duty || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        attendee.status === 'checked_in' 
                          ? 'bg-green-100 text-green-700 border border-green-200' 
                          : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                      }`}>
                        {attendee.status === 'checked_in' ? 'Checked In' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-on-surface-variant text-xs">
                      {attendee.checkedInAt ? new Date(attendee.checkedInAt).toLocaleString() : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
}
