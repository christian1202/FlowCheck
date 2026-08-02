export default function EventsSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Cards grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="claude-card rounded-3xl p-6 h-[300px] border border-white/10 bg-slate-900/40 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="h-5 bg-slate-800/80 rounded-full w-24"></div>
              <div className="h-6 bg-slate-800/80 rounded-xl w-3/4"></div>
              <div className="h-4 bg-slate-800/40 rounded-lg w-full"></div>
            </div>
            <div className="space-y-2 pt-4 border-t border-white/5">
              <div className="h-4 bg-slate-800/60 rounded w-1/2"></div>
              <div className="h-2 bg-slate-800/80 rounded-full w-full"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
