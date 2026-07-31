export default function RegisterLoading() {
  return (
    <div className="bg-ambient-mesh text-slate-100 font-sans antialiased min-h-screen flex flex-col items-center justify-center py-10 px-4 md:px-8 relative overflow-hidden animate-pulse">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[550px] h-[550px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none"></div>

      {/* Header Skeleton */}
      <header className="mb-6 flex flex-col items-center gap-2 relative z-10 w-full max-w-2xl text-center">
        <div className="p-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-1">
          <div className="h-8 w-8 bg-slate-800 rounded-lg"></div>
        </div>
        <div className="h-4 bg-slate-800 rounded w-48"></div>
      </header>

      {/* Event Details Card Skeleton */}
      <div className="w-full max-w-2xl claude-card rounded-3xl shadow-2xl p-6 md:p-8 mb-6 relative z-10 border border-white/10">
        <div className="flex justify-between items-center mb-4">
          <div className="h-6 bg-slate-800 rounded-full w-32"></div>
          <div className="h-4 bg-slate-800 rounded w-24"></div>
        </div>
        <div className="h-8 bg-slate-800 rounded w-3/4 mb-5"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
          <div className="h-16 bg-slate-800 rounded-2xl"></div>
          <div className="h-16 bg-slate-800 rounded-2xl"></div>
        </div>
        <div className="mt-4 h-20 bg-slate-800 rounded-2xl"></div>
      </div>

      {/* Registration Form Card Skeleton */}
      <div className="w-full max-w-2xl relative z-10">
        <div className="claude-card rounded-3xl shadow-2xl p-6 md:p-8 border border-white/10 space-y-5">
          <div className="h-6 bg-slate-800 rounded w-24 mb-2"></div>
          <div className="space-y-2">
            <div className="h-4 bg-slate-800 rounded w-16"></div>
            <div className="h-12 bg-slate-800 rounded-xl w-full"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-slate-800 rounded w-20"></div>
            <div className="h-12 bg-slate-800 rounded-xl w-full"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-slate-800 rounded w-24"></div>
            <div className="h-12 bg-slate-800 rounded-xl w-full"></div>
          </div>
          <div className="h-12 bg-slate-800 rounded-xl w-full mt-2"></div>
        </div>
      </div>
    </div>
  );
}