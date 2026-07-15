export function getEventDisplayStatus(status: string, closesAt?: string | Date | null): string {
  const isClosed = closesAt && new Date() > new Date(closesAt);
  return isClosed || status === 'closed' ? 'Closed' : (status === 'draft' ? 'Draft' : 'Open');
}

export function getEventStatusStyles(displayStatus: string): string {
  if (displayStatus === 'Open') {
    return 'bg-green-600 text-white dark:bg-green-700 dark:text-white';
  } else if (displayStatus === 'Draft') {
    return 'bg-orange-500 text-white dark:bg-orange-600 dark:text-white';
  } else if (displayStatus === 'Closed') {
    return 'bg-red-600 text-white dark:bg-red-700 dark:text-white';
  }
  
  return 'bg-surface-container-high text-on-surface-variant';
}
