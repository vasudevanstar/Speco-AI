'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface ContentBreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function ContentBreadcrumbs({ items, className }: ContentBreadcrumbsProps) {
  if (!items || items.length === 0) return null;

  return (
    <nav className={cn("flex items-center gap-2 text-sm", className)}>
      {items.map((item, idx) => (
        <span key={idx} className="flex items-center gap-2">
          {idx > 0 && <span className="text-outline-variant">/</span>}
          {item.href ? (
            <Link 
              href={item.href} 
              className="text-on-surface-variant hover:text-primary transition-colors hover:underline underline-offset-4"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-on-surface-variant font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
