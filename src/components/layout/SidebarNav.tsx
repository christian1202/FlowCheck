'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarNavProps {
  isCollapsed?: boolean;
  isHorizontal?: boolean;
}

export default function SidebarNav({ isCollapsed = false, isHorizontal = false }: SidebarNavProps) {
  const pathname = usePathname();

  const links = [
    {
      href: '/events',
      label: 'Dashboard',
      icon: 'dashboard',
      isActive: pathname === '/events',
    },
    {
      href: '/events/all',
      label: 'Events',
      icon: 'event',
      isActive: pathname !== '/events' && pathname?.startsWith('/events') && !pathname.includes('/scanner'),
    },
    {
      href: '/attendees',
      label: 'Attendees',
      icon: 'groups',
      isActive: pathname?.startsWith('/attendees'),
    },
    {
      href: '/scanner',
      label: 'Scanner',
      icon: 'qr_code_scanner',
      isActive: pathname?.startsWith('/scanner') || pathname?.includes('/scanner'),
    },
    {
      href: '/settings',
      label: 'Settings',
      icon: 'settings',
      isActive: pathname?.startsWith('/settings'),
    },
  ];

  if (isHorizontal) {
    return (
      <ul className="flex items-center justify-around w-full px-3">
        {links.map((link) => (
          <li key={link.href} className="flex-1">
            <Link
              href={link.href}
              prefetch={false}
              className={`flex flex-col items-center justify-center gap-1 py-1.5 w-full rounded-2xl active-scale transition-colors duration-150 transform-gpu ${
                link.isActive
                  ? 'text-white font-medium'
                  : 'text-slate-400 md:hover:text-slate-200'
              }`}
            >
              <div
                className={`relative flex items-center justify-center w-12 h-7 rounded-full transition-colors duration-150 transform-gpu ${
                  link.isActive
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                    : ''
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {link.icon}
                </span>
              </div>
              <span
                className={`text-[10px] font-medium tracking-wide ${
                  link.isActive ? 'text-amber-400 font-semibold' : 'text-slate-400'
                }`}
              >
                {link.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="space-y-2 px-3">
      {links.map((link) => (
        <li key={link.href} className="flex justify-center">
          <Link
            href={link.href}
            prefetch={false}
            title={isCollapsed ? link.label : undefined}
            className={`flex items-center text-xs tracking-wide transition-colors duration-150 active-scale transform-gpu ${
              isCollapsed
                ? `w-10 h-10 justify-center rounded-xl ${
                    link.isActive
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/35 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                      : 'text-slate-400 md:hover:bg-white/[0.06] md:hover:text-slate-200'
                  }`
                : `w-full gap-3.5 px-3.5 py-2.5 rounded-xl ${
                    link.isActive
                      ? 'bg-gradient-to-r from-amber-500/15 to-transparent text-amber-300 font-semibold border border-amber-500/25 shadow-[0_0_15px_rgba(245,158,11,0.12)]'
                      : 'text-slate-400 md:hover:bg-white/[0.04] md:hover:text-slate-200'
                  }`
            }`}
          >
            <span
              className={`material-symbols-outlined text-[20px] transition-colors shrink-0 ${
                link.isActive ? 'text-amber-400 font-bold' : 'text-slate-400'
              }`}
            >
              {link.icon}
            </span>
            {!isCollapsed && <span className="font-medium truncate">{link.label}</span>}
          </Link>
        </li>
      ))}
    </ul>
  );
}
