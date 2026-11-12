'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import MobileNav from '@/components/layout/MobileNav';
import ContentBreadcrumbs from '@/components/layout/ContentBreadcrumbs';

export default function SettingsPage() {
  const router = useRouter();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.className = savedTheme;
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.className = newTheme;
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <Sidebar />
      <MobileNav />

      <main className="md:ml-64 min-h-screen flex flex-col">
        <TopBar title="Application Settings" />

        <div className="w-full pt-24 px-6 pb-12 sm:px-10 max-w-4xl mx-auto animate-fade-in">

          <div className="mb-10 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary-container/30 to-primary-fixed/20 rounded-3xl blur-xl"></div>
            <div className="relative bg-surface-container-lowest border border-outline-variant rounded-3xl p-8 sm:p-10 flex flex-col sm:flex-row items-center sm:items-start gap-8 shadow-xl shadow-primary">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary-container text-white flex items-center justify-center shadow-lg shadow-primary shrink-0">
                <span className="material-symbols-outlined text-4xl">settings</span>
              </div>
              <div className="text-center sm:text-left flex-1">
                <h1 className="text-3xl font-bold mb-2">Preferences</h1>
                <p className="text-on-surface-variant max-w-md">
                  Manage your workspace appearance, account security, and application integrations.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">

              {/* Appearance */}
              <section className="bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant shadow-sm">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined">palette</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Appearance</h2>
                    <p className="text-sm text-on-surface-variant">Customize your visual workspace</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-surface-container-low rounded-xl gap-4">
                    <div>
                      <p className="font-bold">Theme Preference</p>
                      <p className="text-sm text-on-surface-variant">Switch between light and dark modes</p>
                    </div>
                    <div className="flex gap-2 p-1 bg-surface-container rounded-xl w-full sm:w-auto">
                      <button
                        onClick={() => {
                          setTheme('light');
                          localStorage.setItem('theme', 'light');
                          document.documentElement.className = 'light';
                        }}
                        className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${theme === 'light'
                            ? 'bg-white text-black shadow-sm'
                            : 'text-on-surface-variant hover:bg-surface-container-highest'
                          }`}
                      >
                        <span className="material-symbols-outlined text-base">light_mode</span>
                        Light
                      </button>
                      <button
                        onClick={() => {
                          setTheme('dark');
                          localStorage.setItem('theme', 'dark');
                          document.documentElement.className = 'dark';
                        }}
                        className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${theme === 'dark'
                            ? 'bg-neutral-800 text-white shadow-sm'
                            : 'text-on-surface-variant hover:bg-surface-container-highest'
                          }`}
                      >
                        <span className="material-symbols-outlined text-base">dark_mode</span>
                        Dark
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              {/* Account Links */}
              <section className="bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant shadow-sm">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined">shield_person</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Account Access</h2>
                    <p className="text-sm text-on-surface-variant">Manage your profile and authentication</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => router.push('/account')}
                    className="w-full flex items-center justify-between p-4 bg-surface-container-low hover:bg-surface-container-high hover:shadow-md hover:translate-y-[-2px] rounded-xl transition-all group border border-transparent hover:border-primary/20"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-sm">person</span>
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-sm">Profile Details</p>
                        <p className="text-xs text-on-surface-variant">Update email and personal info</p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">chevron_right</span>
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-between p-4 bg-red-50/50 hover:bg-red-50 hover:shadow-md hover:translate-y-[-2px] rounded-xl transition-all group border border-transparent hover:border-red-200"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-sm">logout</span>
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-sm text-red-600">Sign Out</p>
                        <p className="text-xs text-red-900/60">End your current session safely</p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-red-400 group-hover:text-red-600 transition-colors">chevron_right</span>
                  </button>
                </div>
              </section>

            </div>

            <div className="space-y-8">
              {/* System Info */}
              <section className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant mb-6">System Information</h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl">
                    <span className="text-sm font-bold text-on-surface-variant">Version</span>
                    <span className="px-3 py-1 bg-surface-container-highest rounded-full text-xs font-mono font-bold">v1.4.2</span>
                  </div>

                  <a href="/docs" className="flex items-center gap-3 p-3 hover:bg-surface-container-low rounded-xl transition-colors group">
                    <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">menu_book</span>
                    <span className="text-sm font-bold flex-1">Documentation</span>
                    <span className="material-symbols-outlined text-sm text-on-surface-variant/50 group-hover:text-primary transition-colors">open_in_new</span>
                  </a>

                  <a href="/support" className="flex items-center gap-3 p-3 hover:bg-surface-container-low rounded-xl transition-colors group">
                    <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">support_agent</span>
                    <span className="text-sm font-bold flex-1">Get Help</span>
                    <span className="material-symbols-outlined text-sm text-on-surface-variant/50 group-hover:text-primary transition-colors">open_in_new</span>
                  </a>
                </div>
              </section>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
