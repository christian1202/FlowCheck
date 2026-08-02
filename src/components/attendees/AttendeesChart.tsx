'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function AttendeesChart({ stats }: { stats: { total: number; checkedIn: number; registered: number } }) {
  const pieData = [
    { name: 'Checked In', value: stats.checkedIn, color: '#10b981' },
    { name: 'Pending', value: stats.registered, color: '#f59e0b' },
  ];

  if (stats.total === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs font-mono">
        No telemetry available
      </div>
    );
  }

  return (
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
  );
}
