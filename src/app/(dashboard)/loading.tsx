export default function DashboardLoading() {
  return (
    <div className="flex-1 p-4 md:p-8 flex items-center justify-center h-[calc(100vh-80px)] w-full">
      <div className="flex flex-col items-center gap-4 text-slate-400 fade-in-stagger">
        <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></div>
        <p className="font-mono text-[10px] uppercase tracking-widest text-amber-500/70">Loading View...</p>
      </div>
    </div>
  );
}
