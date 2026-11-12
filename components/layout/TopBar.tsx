'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface Tab {
  label: string;
  href?: string;
}

interface TopBarProps {
  title?: string;
  activeTab?: string;
  className?: string;
  hideBrand?: boolean;
  tabs?: Tab[];
  onTabChange?: (label: string) => void;
}

export default function TopBar({ 
  title,
  activeTab,
  className,
  hideBrand = false,
  tabs = [],
  onTabChange
}: TopBarProps) {
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [user, setUser] = useState<{ name?: string } | null>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const isDark = document.documentElement.classList.contains('dark') || 
                   (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches));
    setTheme(isDark ? 'dark' : 'light');
  }, []);

  const toggleTheme = () => {
    if (theme === 'light') {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
      setTheme('dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
      setTheme('light');
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse user:', e);
      }
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showTabs = tabs && tabs.length > 0;

  return (
    <header className={cn(
      "fixed top-0 left-0 md:left-64 right-0 h-16 bg-[#f6fafe]/80 dark:bg-slate-950/80 backdrop-blur-md flex justify-between items-center px-8 z-40 border-b border-outline-variant/10",
      className
    )}>
      <div className="flex items-center gap-6 min-w-0">
        {title && (
          <h2 className="text-lg font-bold text-on-background truncate min-w-0 hidden md:block">
            {title}
          </h2>
        )}
        
        {showTabs && (
          <nav className="hidden lg:flex items-center gap-6 h-full ml-4">
            {tabs.map((tab) => (
              <button
                key={tab.label}
                onClick={() => onTabChange?.(tab.label)}
                className={cn(
                  "text-sm font-medium h-16 transition-all duration-200 relative px-1",
                  activeTab === tab.label 
                    ? "text-primary dark:text-[#4f46e5] font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary" 
                    : "text-[#464555] dark:text-slate-400 hover:text-[#171c1f] dark:hover:text-slate-100"
                )}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* Theme Toggle */}
        {mounted && (
          <button 
            onClick={toggleTheme}
            className="p-2 hover:bg-[#f0f4f8] dark:hover:bg-slate-800 rounded-lg transition-colors text-on-surface-variant relative flex items-center justify-center"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            <span className="material-symbols-outlined text-xl">
              {theme === 'light' ? 'dark_mode' : 'light_mode'}
            </span>
          </button>
        )}

        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 hover:bg-[#f0f4f8] dark:hover:bg-slate-800 rounded-lg transition-colors text-on-surface-variant relative"
          >
            <span className="material-symbols-outlined text-xl">notifications</span>
          </button>
          
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-outline-variant/20 overflow-hidden">
              <div className="p-4 border-b border-surface-container">
                <h3 className="font-bold">Notifications</h3>
              </div>
              <div className="max-h-80 overflow-y-auto">
                <div className="p-4 text-center text-sm text-on-surface-variant">
                  <span className="material-symbols-outlined text-2xl mb-2 block text-outline-variant">notifications_off</span>
                  No new notifications
                </div>
              </div>
              <div className="p-3 border-t border-surface-container">
                <button 
                  onClick={() => {
                    setShowNotifications(false);
                    router.push('/history');
                  }}
                  className="w-full text-center text-sm text-primary hover:underline font-medium"
                >
                  View all activity
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Settings */}
        <button 
          onClick={() => router.push('/settings')}
          className="p-2 hover:bg-[#f0f4f8] dark:hover:bg-slate-800 rounded-lg transition-colors text-on-surface-variant"
        >
          <span className="material-symbols-outlined text-xl">settings</span>
        </button>
        
        {/* Avatar - Links to Account */}
        <button 
          onClick={() => router.push('/account')}
          className="h-9 w-9 rounded-full overflow-hidden border border-outline-variant/30 ml-2 hover:ring-2 hover:ring-primary/20 transition-all"
        >
          <div className="w-full h-full bg-primary flex items-center justify-center text-white font-bold text-sm">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
        </button>
      </div>
    </header>
  );
}
