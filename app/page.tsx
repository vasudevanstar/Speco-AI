'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import MobileNav from '@/components/layout/MobileNav';
import { cn, formatDate } from '@/lib/utils';

interface Project {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

export default function HomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [networkError, setNetworkError] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        setUser({ id: 'demo-user', name: 'Demo User', email: 'demo@speco.ai' });
      }
    } else {
      const defaultUser = { id: 'demo-user', name: 'Demo User', email: 'demo@speco.ai' };
      localStorage.setItem('user', JSON.stringify(defaultUser));
      setUser(defaultUser);
    }
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/projects');
      setProjects(response.data?.data || response.data || []);
    } catch (error: any) {
      console.error('Error loading projects:', error);
      if (error.message?.includes('Network') || error.code === 'ERR_NETWORK' || !error.response) {
        setNetworkError(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm font-medium text-on-surface-variant animate-pulse">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (networkError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-[2rem] p-8 text-center">
          <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-3xl">wifi_off</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Server Not Running</h2>
          <p className="text-on-surface-variant mb-8">The backend server is not running. Please start the server to continue.</p>
          <Button onClick={() => window.location.reload()} className="w-full bg-primary text-white rounded-xl h-12">
            Retry Connection
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-surface selection:bg-primary-fixed selection:text-primary">
      <Sidebar />
      <MobileNav />
      
      <main className="md:ml-64 min-h-screen flex flex-col">
        <TopBar title="Overview" />
        
        <div className="flex-1 p-6 sm:p-10 mt-16 animate-fade-in">
          <div className="max-w-7xl mx-auto space-y-12">
            
            {/* Dashboard Header */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-outline-variant pb-8 relative z-10">
              <div>
                <span className="text-accent font-bold text-[10px] tracking-[0.2em] uppercase mb-3 block drop-shadow-md">Workspace Overview</span>
                <h1 className="text-4xl sm:text-5xl font-black text-on-surface tracking-tighter">
                  Welcome back{user?.name ? `, ${user.name}` : ''}.
                </h1>
                <div className="mt-4 flex items-center gap-3 text-on-surface-variant">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-green-500/20 text-green-500">
                    <span className="material-symbols-outlined text-[12px]">done</span>
                  </span>
                  <span className="text-sm font-medium tracking-wide">Workspace synchronized</span>
                  <span className="w-1 h-1 rounded-full bg-on-surface"></span>
                  <span className="text-sm text-on-surface/50">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                </div>
              </div>
              <Button 
                onClick={() => router.push('/projects/new')}
                className="bg-gradient-to-r from-primary to-accent text-white rounded-xl px-8 h-12 font-bold shadow-[0_5px_20px_rgba(99,102,241,0.4)] hover:scale-105 active:scale-95 transition-all flex gap-2 border border-primary-foreground/20"
              >
                <span className="material-symbols-outlined">add</span>
                New Project
              </Button>
            </div>

            {/* Content Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Column: Recent Projects */}
              <div className="lg:col-span-8 space-y-6">
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-2xl font-bold tracking-tight">Recent Projects</h2>
                  <Button variant="ghost" size="sm" className="font-bold text-primary text-xs uppercase tracking-widest hover:bg-primary-fixed/50">
                    View All
                  </Button>
                </div>

                {projects.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {projects.map((project) => (
                      <div 
                        key={project.id}
                        onClick={() => router.push(`/projects/${project.id}`)}
                        className="group relative glass-card p-6 rounded-2xl hover:scale-[1.02] hover:-translate-y-1 hover:shadow-xl hover:shadow-primary hover:border-primary/50 transition-all duration-300 cursor-pointer overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative z-10">
                          <div className="flex justify-between items-start mb-6">
                            <div className="w-12 h-12 bg-surface-container-high border border-outline-variant rounded-xl flex items-center justify-center text-primary group-hover:bg-gradient-to-br group-hover:from-primary group-hover:to-accent group-hover:text-white group-hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] transition-all duration-300">
                            <span className="material-symbols-outlined">description</span>
                          </div>
                          <div className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                            project.status === 'completed' 
                              ? "bg-green-100 text-green-700" 
                              : "bg-secondary-container text-on-secondary-container"
                          )}>
                            {project.status || 'Draft'}
                          </div>
                        </div>
                        <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{project.title}</h3>
                        <p className="text-sm text-on-surface-variant line-clamp-2 mb-6">
                          {project.description || 'Define technical requirements and user flows.'}
                        </p>
                        <div className="flex items-center justify-between pt-4 border-t border-surface-container">
                          <div className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant">
                            <span className="material-symbols-outlined text-sm">calendar_today</span>
                            {formatDate(project.createdAt || (project as any).created_at)}
                          </div>
                            <Button size="sm" variant="ghost" className="h-8 w-8 rounded-full p-0 group-hover:bg-primary group-hover:text-white group-hover:shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all">
                              <span className="material-symbols-outlined text-lg">arrow_forward</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <div 
                      onClick={() => router.push('/projects/new')}
                      className="glass-card border-dashed border-outline-variant p-6 rounded-2xl flex flex-col items-center justify-center text-on-surface-variant hover:border-primary/50 hover:bg-surface-container-highest hover:text-primary hover:shadow-xl hover:shadow-primary transition-all duration-300 cursor-pointer group hover:-translate-y-1"
                    >
                      <div className="w-12 h-12 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white group-hover:shadow-[0_0_20px_rgba(99,102,241,0.6)] group-hover:scale-110 transition-all duration-300">
                        <span className="material-symbols-outlined">add</span>
                      </div>
                      <span className="text-lg font-bold">New Project</span>
                      <p className="text-xs text-center mt-1">Initialize another technical documentation project.</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-surface-container-lowest rounded-xl p-12 text-center border border-dashed border-outline-variant">
                    <p className="text-on-surface-variant mb-6">No projects yet. Let's create your first technical specification.</p>
                    <Button 
                      onClick={() => router.push('/projects/new')}
                      className="bg-primary text-white rounded-xl h-12 px-6 font-bold"
                    >
                      Create First Project
                    </Button>
                  </div>
                )}
              </div>

              {/* Right Column: Premium Dashboard Widgets */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* System & Quota Widget */}
                <div className="glass-card rounded-2xl p-7">
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] mb-6 text-on-surface-variant flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-primary/70">donut_large</span>
                    Resource Quota
                  </h3>
                  
                  <div className="space-y-6">
                    {/* Quota Item 1 */}
                    <div>
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-sm font-medium text-on-surface/90">Projects Capacity</span>
                        <span className="text-xs text-on-surface-variant font-bold">{projects.length} / 10</span>
                      </div>
                      <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden border border-outline-variant">
                        <div className="h-full bg-primary rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" style={{ width: `${Math.max(5, (projects.length / 10) * 100)}%` }}></div>
                      </div>
                    </div>

                    {/* Quota Item 2 */}
                    <div>
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-sm font-medium text-on-surface/90">AI Generation Tokens</span>
                        <span className="text-xs text-on-surface-variant font-bold">42.5k / 50k</span>
                      </div>
                      <div className="w-full h-1.5 bg-on-surface rounded-full overflow-hidden border border-on-surface/5">
                        <div className="h-full bg-accent rounded-full shadow-[0_0_10px_rgba(255,121,198,0.5)]" style={{ width: '85%' }}></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-5 border-t border-on-surface/10 flex justify-between items-center">
                    <span className="text-[10px] text-on-surface-variant uppercase tracking-widest bg-surface-container-high px-2 py-1 rounded">Plan: Pro</span>
                    <span className="text-xs text-on-surface/80 font-bold cursor-pointer hover:text-on-surface transition-colors">Upgrade</span>
                  </div>
                </div>

                {/* AI Insights Widget */}
                <div className="glass-card rounded-2xl p-7">
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] mb-6 text-on-surface-variant flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-accent/70">auto_awesome</span>
                    AI Intelligence
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="p-5 rounded-xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 relative overflow-hidden group hover:border-primary/40 transition-colors">
                      <div className="absolute -top-2 -right-2 p-2 opacity-10 text-primary group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500">
                        <span className="material-symbols-outlined text-6xl">lightbulb</span>
                      </div>
                      <h4 className="text-sm font-bold text-on-surface mb-2 relative z-10">Architecture Optimization</h4>
                      <p className="text-xs text-on-surface-variant leading-relaxed relative z-10 font-medium">
                        Consider adding a caching layer (e.g. Redis) to your next project to improve database read performance by 40%.
                      </p>
                    </div>
                    
                    <div className="p-5 rounded-xl bg-surface-container-high border border-on-surface/5 hover:border-on-surface/10 transition-colors">
                      <h4 className="text-sm font-bold text-on-surface/90 mb-2">Security Recommendation</h4>
                      <p className="text-xs text-on-surface-variant leading-relaxed font-medium">
                        Ensure all user endpoints in your specifications explicitly include rate limiting definitions.
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>


          </div>
        </div>
      </main>
    </div>
  );
}
