export default function SettingsLoading() {
  return (
    <div className="p-4 md:p-8 lg:p-12 flex-1 fade-in-stagger w-full max-w-5xl mx-auto animate-pulse">
      {/* Header Skeleton */}
      <div className="mb-10">
        <div className="h-8 bg-slate-800 rounded w-56 mb-4"></div>
        <div className="h-4 bg-slate-800 rounded w-64"></div>
      </div>

      {/* Form Card Skeleton */}
      <div className="glass-panel p-6 md:p-8 rounded-3xl space-y-6">
        {/* Name Field */}
        <div className="space-y-2">
          <div className="h-4 bg-slate-800 rounded w-16"></div>
          <div className="h-12 bg-slate-800 rounded-xl w-full max-w-md"></div>
        </div>

        {/* Email Field */}
        <div className="space-y-2">
          <div className="h-4 bg-slate-800 rounded w-12"></div>
          <div className="h-12 bg-slate-800 rounded-xl w-full max-w-md"></div>
        </div>

        {/* Submit Button */}
        <div className="h-10 bg-slate-800 rounded-xl w-28 mt-4"></div>
      </div>
    </div>
  );
}