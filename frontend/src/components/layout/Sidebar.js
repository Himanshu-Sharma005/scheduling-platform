'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, Clock, Users, Link2, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getMe } from '@/lib/api';
import { getInitials } from '@/lib/utils';

const navItems = [
  { href: '/event-types', label: 'Event Types', icon: Link2 },
  { href: '/bookings', label: 'Bookings', icon: Calendar },
  { href: '/availability', label: 'Availability', icon: Clock },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState(null);

  useEffect(() => {
    getMe().then(setUser).catch(console.error);
  }, []);

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">C</div>
        <span className="sidebar-logo-text">Cal.com</span>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Main</div>
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {user && (
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {getInitials(user.name)}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user.name}</div>
            <div className="sidebar-user-link">/{user.username}</div>
          </div>
        </div>
      )}
    </aside>
  );
}
