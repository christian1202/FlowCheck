'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SidebarNav({ isCollapsed = false }: { isCollapsed?: boolean }) {
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
      // Events is active for /events/all, but not for /events/123/scanner or /scanner
      isActive: pathname !== '/events' && pathname?.startsWith('/events') && !pathname.includes('/scanner'),
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

  return (
    <ul className="space-y-2 px-4">
      {links.map((link) => (
        <li key={link.href}>
          <Link
            href={link.href}
            className={`flex items-center gap-3 px-4 py-2 rounded-md font-label-sm text-label-sm transition-all duration-200 ${
              link.isActive
                ? 'text-primary font-bold border-r-4 border-primary bg-surface-container-low hover:bg-surface-container-high'
                : 'text-on-surface-variant hover:bg-surface-container-high'
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
