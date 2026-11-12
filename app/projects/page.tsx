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

export default function ProjectsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [networkError, setNetworkError] = useState(false);

  useEffect(() => {
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />
        <MobileNav />
        <main className="md:ml-64 min-h-screen flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </main>
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
    <div className="min-h-screen bg-background text-on-surface">
      <Sidebar />
      <MobileNav />
      
      <main className="md:ml-64 min-h-screen flex flex-col">
        <TopBar title="All Projects" />
        
        <div className="flex-1 p-6 sm:p-10 mt-16 animate-fade-in">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">All Projects</h1>
                <p className="text-on-surface-variant mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
              </div>
              <Button 
                onClick={() => router.push('/projects/new')}
                className="bg-primary text-white rounded-xl h-12 px-6 font-bold"
              >
                New Project
              </Button>
            </div>

            {projects.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <div 
                    key={project.id}
                    onClick={() => router.push(`/projects/${project.id}`)}
                    className="group bg-surface-container-lowest p-6 rounded-xl border border-transparent hover:border-primary/10 hover:shadow-xl hover:shadow-primary hover:translate-y-[-4px] transition-all cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-12 h-12 bg-primary-fixed rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
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
                      <Button size="sm" variant="ghost" className="h-8 w-8 rounded-full p-0 group-hover:bg-primary group-hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-lg">arrow_forward</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-surface-container-lowest rounded-xl p-12 text-center border border-dashed border-outline-variant">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="material-symbols-outlined text-3xl text-primary">folder_open</span>
                </div>
                <p className="text-on-surface-variant mb-6">No projects yet. Create your first project to get started.</p>
                <Button 
                  onClick={() => router.push('/projects/new')}
                  className="bg-primary text-white rounded-xl h-12 px-6 font-bold"
                >
                  Create First Project
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
