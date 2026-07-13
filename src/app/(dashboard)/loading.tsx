export default function DashboardLoading() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center space-y-4">
        <span className="material-symbols-outlined text-primary text-4xl animate-spin" style={{ animationDuration: '1.5s' }}>
          progress_activity
        </span>
        <p className="text-on-surface-variant font-label-md animate-pulse">Loading...</p>
      </div>
    </div>
  );
}
