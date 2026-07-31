export default function AttendeesLoading() {
  return (
    <div className="p-4 md:p-8 lg:p-12 flex-1 fade-in-stagger w-full max-w-7xl mx-auto animate-pulse">
      {/* Header Skeleton */}
      <div className="mb-10 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <div className="h-8 bg-slate-800 rounded w-48 mb-4"></div>
          <div className="h-4 bg-slate-800 rounded w-64"></div>
        </div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="claude-card flex flex-col justify-between rounded-2xl p-6 h-28"
          >
            <div className="h-4 bg-slate-800 rounded w-20"></div>
            <div className="h-8 bg-slate-800 rounded w-12"></div>
          </div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="claude-card rounded-2xl p-4 space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 py-3 border-b border-white/5">
            <div className="w-10 h-10 bg-slate-800 rounded-xl shrink-0"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-800 rounded w-32"></div>
              <div className="h-3 bg-slate-800 rounded w-24"></div>
            </div>
            <div className="h-6 w-16 bg-slate-800 rounded-full"></div>
          </div>
        ))}
      </div>
    </div>
  );
}