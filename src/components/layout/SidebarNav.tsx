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
      // Dashboard is strictly the main /events path
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
      <ul className="flex items-center justify-around w-full px-2">
        {links.map((link) => (
          <li key={link.href} className="flex-1">
            <Link
              href={link.href}
              className={`flex flex-col items-center justify-center gap-1 py-2 w-full rounded-xl active-scale transition-colors ${
                link.isActive
                  ? 'text-primary'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <div className={`relative flex items-center justify-center w-14 h-8 rounded-full transition-all duration-300 ${link.isActive ? 'bg-primary text-on-primary' : ''}`}>
                <span
                  className="material-symbols-outlined text-[22px]"
                  style={link.isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {link.icon}
                </span>
              </div>
              <span className={`text-[10px] font-semibold tracking-wide ${link.isActive ? 'text-primary' : 'text-on-surface-variant'}`}>{link.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="space-y-1.5 px-3">
      {links.map((link) => (
        <li key={link.href}>
          <Link
            href={link.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-label-sm transition-all duration-200 active-scale ${
              link.isActive
                ? 'text-primary font-bold bg-surface-container-high'
                : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
            }`}
          >
            <span
              className="material-symbols-outlined"
              style={link.isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {link.icon}
            </span>
            {!isCollapsed && <span>{link.label}</span>}
          </Link>
        </li>
      ))}
    </ul>
  );
}
