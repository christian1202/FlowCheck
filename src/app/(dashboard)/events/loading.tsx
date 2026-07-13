export default function EventsLoading() {
  return (
    <div className="p-container-margin md:p-section-padding flex-1 w-full max-w-7xl mx-auto animate-pulse">
      {/* Hero Greeting Skeleton */}
      <div className="mb-10">
        <div className="h-10 bg-surface-container-high rounded w-48 mb-4"></div>
        <div className="h-4 bg-surface-container-highest rounded w-64"></div>
      </div>

      {/* Metrics Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-surface-container-lowest flex flex-col justify-between rounded-xl p-6 shadow-sm border border-surface-container-high h-32">
            <div className="flex justify-between items-start mb-4">
              <div className="h-4 bg-surface-container-high rounded w-24"></div>
              <div className="h-6 w-6 bg-surface-container-highest rounded-full"></div>
            </div>
            <div className="h-8 bg-surface-container-high rounded w-16 mb-2"></div>
          </div>
        ))}
      </div>

      {/* Main Content Skeleton */}
      <div className="w-full">
        <div className="space-y-6">
          <div className="h-8 bg-surface-container-high rounded w-32 mb-4"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container-high p-6 flex flex-col justify-between h-48">
                <div>
                  <div className="h-6 bg-surface-container-high rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-surface-container-highest rounded w-1/2"></div>
                </div>
                <div className="flex gap-4 mt-auto">
                  <div className="h-4 bg-surface-container-high rounded w-16"></div>
                  <div className="h-4 bg-surface-container-highest rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
