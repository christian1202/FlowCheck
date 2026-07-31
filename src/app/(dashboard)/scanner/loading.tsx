export default function ScannerLoading() {
  return (
    <div className="p-4 md:p-8 lg:p-12 flex-1 fade-in-stagger w-full max-w-7xl mx-auto flex flex-col h-[calc(100vh-80px)] animate-pulse">
      {/* Hero Greeting Skeleton */}
      <div className="mb-8">
        <div className="h-9 bg-slate-800 rounded w-52 mb-4"></div>
        <div className="h-4 bg-slate-800 rounded w-72"></div>
      </div>

      {/* Events List Skeleton */}
      <div className="flex-1 min-h-0 relative">
        {/* Search Bar Skeleton */}
        <div className="mb-6 h-14 bg-slate-800 rounded-2xl w-full max-w-2xl mx-auto"></div>

        {/* Event Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="claude-card rounded-3xl p-6 h-72 flex flex-col">
              <div className="h-6 bg-slate-800 rounded-full w-20 mb-4"></div>
              <div className="h-6 bg-slate-800 rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-slate-800 rounded w-1/2 mb-6"></div>
              <div className="space-y-3 mt-auto">
                <div className="h-4 bg-slate-800 rounded w-40"></div>
                <div className="h-4 bg-slate-800 rounded w-32"></div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-800">
                <div className="h-3 bg-slate-800 rounded w-full"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}