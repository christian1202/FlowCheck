export default function AttendeesSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Search & filter bar skeleton */}
      <div className="claude-card p-4 rounded-3xl border border-white/10 flex flex-col md:flex-row gap-4 justify-between">
        <div className="h-10 bg-slate-900/80 rounded-xl w-full md:w-1/3 border border-white/5"></div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="h-10 bg-slate-900/80 rounded-xl w-24 md:w-36 border border-white/5"></div>
          <div className="h-10 bg-slate-900/80 rounded-xl w-24 md:w-36 border border-white/5"></div>
        </div>
      </div>

      {/* Metrics skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex flex-col gap-4">
          <div className="claude-card p-5 rounded-3xl border border-white/10 h-28 bg-slate-900/40"></div>
          <div className="claude-card p-5 rounded-3xl border border-white/10 h-28 bg-slate-900/40"></div>
        </div>
        <div className="claude-card p-5 rounded-3xl border border-white/10 md:col-span-2 min-h-[240px] bg-slate-900/40"></div>
      </div>

      {/* Table grid skeleton */}
      <div className="claude-card rounded-3xl border border-white/10 p-6 h-[400px] bg-slate-900/40 space-y-4">
        <div className="h-12 bg-slate-800/60 rounded-xl w-full"></div>
        <div className="h-12 bg-slate-800/40 rounded-xl w-full"></div>
        <div className="h-12 bg-slate-800/40 rounded-xl w-full"></div>
        <div className="h-12 bg-slate-800/40 rounded-xl w-full"></div>
      </div>
    </div>
  );
}
