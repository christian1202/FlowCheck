export default function EventSettingsLoading() {
  return (
    <div className="p-container-margin md:p-section-padding flex-1 w-full max-w-4xl mx-auto space-y-6 animate-pulse">
      {/* Back button skeleton */}
      <div className="mb-2">
        <div className="h-4 bg-surface-container-high rounded w-24"></div>
      </div>

      {/* Main Settings Card Skeleton */}
      <div className="bg-surface-container-lowest shadow-sm sm:rounded-xl border border-surface-container-high overflow-hidden">
        {/* Header Skeleton */}
        <div className="px-4 py-5 sm:px-6 flex justify-between items-start border-b border-surface-container-highest">
          <div>
            <div className="h-6 bg-surface-container-high rounded w-48 mb-2"></div>
            <div className="h-4 bg-surface-container-highest rounded w-64"></div>
          </div>
          <div className="h-6 w-16 bg-surface-container-highest rounded-full"></div>
        </div>
        
        {/* Details List Skeleton */}
        <div className="px-4 py-5 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="sm:col-span-1">
                <div className="h-4 bg-surface-container-highest rounded w-16 mb-2"></div>
                <div className="h-5 bg-surface-container-high rounded w-32"></div>
              </div>
            ))}
            <div className="sm:col-span-2">
              <div className="h-4 bg-surface-container-highest rounded w-24 mb-2"></div>
              <div className="h-5 bg-surface-container-high rounded w-3/4"></div>
            </div>
          </div>
          
          {/* Action Buttons Skeleton */}
          <div className="border-t border-surface-container-highest pt-6 flex gap-4">
            <div className="h-10 bg-surface-container-high rounded-md w-32"></div>
          </div>
        </div>
      </div>

      {/* Team Management Skeleton */}
      <div className="bg-surface-container-lowest shadow-sm sm:rounded-xl border border-surface-container-high p-6">
        <div className="h-6 bg-surface-container-high rounded w-48 mb-6"></div>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="flex justify-between items-center py-4 border-b border-surface-container-highest">
              <div className="flex gap-4 items-center">
                <div className="w-10 h-10 bg-surface-container-high rounded-full"></div>
                <div>
                  <div className="h-4 bg-surface-container-high rounded w-32 mb-2"></div>
                  <div className="h-3 bg-surface-container-highest rounded w-24"></div>
                </div>
              </div>
              <div className="h-8 bg-surface-container-highest rounded-full w-20"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
