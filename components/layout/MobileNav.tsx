'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function MobileNav() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Home', href: '/', icon: 'dashboard' },
    { label: 'Projects', href: '/projects', icon: 'view_list' },
    { label: 'Pricing', href: '/pricing', icon: 'payments' },
    { label: 'Billing', href: '/subscription', icon: 'credit_card' },
    { label: 'Profile', href: '/account', icon: 'account_circle' },
  ];

  const isActive = (href: string) => {
    if (href === '/' && pathname !== '/') return false;
    return pathname.startsWith(href);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md flex items-center justify-around px-4 z-[100] no-line-rule shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 transition-colors duration-200",
              active ? "text-primary" : "text-[#464555]"
            )}
          >
            <span className={cn(
              "material-symbols-outlined",
              active && "material-symbols-filled"
            )}>
              {item.icon}
            </span>
            <span className={cn(
              "text-[10px] font-medium leading-none",
              active ? "font-bold" : "font-medium"
            )}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
