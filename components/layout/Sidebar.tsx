'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

interface SidebarProps {
  projectName?: string;
  projectStatus?: string;
  projectId?: string;
}

export default function Sidebar({ 
  projectName = "Speco", 
  projectStatus = "Active Specification",
  projectId
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems: NavItem[] = [
    { label: 'Overview', href: '/', icon: 'dashboard' },
    { label: 'Projects', href: '/projects', icon: 'view_list' },
    { label: 'Pricing & Plans', href: '/pricing', icon: 'payments' },
    { label: 'Subscription', href: '/subscription', icon: 'credit_card' },
    { label: 'Configure', href: projectId ? `/configure-questions/${projectId}` : '/configure', icon: 'settings_suggest' },
    { label: 'History', href: '/history', icon: 'history' },
    { label: 'Documentation', href: '/docs', icon: 'auto_stories' },
  ];

  // Helper to check if a link is active
  const isActive = (href: string) => {
    if (href === '/' && pathname === '/') return true;
    if (href !== '/' && pathname.startsWith(href)) return true;
    return false;
  };

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 bg-[#f0f4f8] dark:bg-slate-900 flex flex-col p-5 gap-2 z-50 hidden md:flex border-r border-outline-variant/10">
      <div className="flex items-center gap-3 px-3 py-6 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white shadow-lg shadow-primary/30 transform hover:scale-105 transition-transform duration-300">
          <span className="material-symbols-outlined material-symbols-filled text-[22px]">deployed_code</span>
        </div>
        <div>
          <h2 className="text-md font-bold text-on-surface leading-tight">{projectName}</h2>
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest opacity-60 font-label">{projectStatus}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-300 rounded-xl relative overflow-hidden group",
                active 
                  ? "bg-gradient-to-r from-primary/10 to-accent/10 dark:from-primary/20 dark:to-accent/20 text-primary dark:text-accent font-bold shadow-sm translate-x-1 border border-primary/20" 
                  : "text-[#464555] dark:text-slate-400 hover:bg-[#dfe3e7]/50 dark:hover:bg-slate-800/50 hover:text-on-surface"
              )}
            >
              {active && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-accent rounded-r-full"></div>
              )}
              <span className={cn(
                "material-symbols-outlined text-xl transition-transform duration-300 group-hover:scale-110", 
                active && "material-symbols-filled text-transparent bg-clip-text bg-gradient-to-br from-primary to-accent"
              )}>
                {item.icon}
              </span>
              <span className="relative z-10">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-2 pt-6 border-t border-outline-variant/10">
        <button 
          onClick={() => router.push('/projects/new')}
          className="w-full mb-6 bg-gradient-to-r from-primary to-accent text-white py-3.5 px-4 rounded-xl font-black flex items-center justify-center gap-2 transition-all duration-300 shadow-[0_10px_20px_rgba(99,102,241,0.2)] hover:shadow-[0_15px_30px_rgba(99,102,241,0.4)] hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full -translate-x-full transition-transform duration-700 ease-in-out skew-x-12"></div>
          <span className="material-symbols-outlined text-xl group-hover:rotate-90 transition-transform duration-300 relative z-10">add_circle</span>
          <span className="text-sm tracking-wide relative z-10">New Project</span>
        </button>
        
        <Link 
          href="/support"
          className="flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-[#464555] dark:text-slate-400 hover:bg-[#dfe3e7] dark:hover:bg-slate-800 rounded-lg transition-all"
        >
          <span className="material-symbols-outlined text-lg">help</span>
          <span>Support</span>
        </Link>
        
        <Link 
          href="/account"
          className="flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-[#464555] dark:text-slate-400 hover:bg-[#dfe3e7] dark:hover:bg-slate-800 rounded-lg transition-all"
        >
          <span className="material-symbols-outlined text-lg">account_circle</span>
          <span>Account</span>
        </Link>
      </div>
    </aside>
  );
}
