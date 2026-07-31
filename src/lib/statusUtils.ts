export function getEventDisplayStatus(status: string, closesAt?: string | Date | null): string {
  const isClosed = closesAt && new Date() > new Date(closesAt);
  return isClosed || status === 'closed' ? 'Closed' : (status === 'draft' ? 'Draft' : 'Open');
}

export function getEventStatusStyles(displayStatus: string): string {
  if (displayStatus === 'Open') {
    return 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]';
  } else if (displayStatus === 'Draft') {
    return 'bg-amber-500/15 border border-amber-500/30 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]';
  } else if (displayStatus === 'Closed') {
    return 'bg-red-500/15 border border-red-500/30 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.2)]';
  }
  
  return 'bg-white/5 border border-white/10 text-slate-400';
}
