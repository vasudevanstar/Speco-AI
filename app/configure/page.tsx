'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import ContentBreadcrumbs from '@/components/layout/ContentBreadcrumbs';
import MobileNav from '@/components/layout/MobileNav';
import { cn } from '@/lib/utils';

interface Project {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  Modules?: { id: string; name: string }[];
}

export default function ConfigurePage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [networkError, setNetworkError] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await api.get('/projects');
      setProjects(response.data?.data || response.data || []);
    } catch (error: any) {
      console.error('Error loading projects:', error);
      if (error.message?.includes('Network') || error.code === 'ERR_NETWORK' || !error.response) {
        setNetworkError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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
          <p className="text-on-surface-variant mb-8">The backend server is not running.</p>
          <Button onClick={() => window.location.reload()} className="w-full bg-primary text-white rounded-xl h-12">
            Retry
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
        <TopBar title="Configure" />
        
        <div className="pt-24 px-8 pb-12 sm:px-12 max-w-5xl mx-auto animate-fade-in">
          <ContentBreadcrumbs 
            items={[
              { label: 'Configure' }
            ]} 
            className="mb-8"
          />
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Configure Projects</h1>
            <p className="text-on-surface-variant">
              Select a project to configure its questionnaire and requirements.
            </p>
          </div>
          
          {projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projects.map((project) => (
                <div 
                  key={project.id}
                  className="bg-surface-container-lowest p-6 rounded-xl border border-transparent hover:border-primary/10 hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => router.push(`/configure-questions/${project.id}`)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                      <span className="material-symbols-outlined">settings</span>
                    </div>
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      project.status === 'completed' 
                        ? "bg-green-100 text-green-700" 
                        : "bg-secondary-container text-on-secondary-container"
                    )}>
                      {project.status || 'Draft'}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                    {project.title}
                  </h3>
                  
                  <p className="text-sm text-on-surface-variant line-clamp-2 mb-4">
                    {project.description || 'No description'}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-on-surface-variant border-t border-surface-container pt-4">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">view_module</span>
                      {project.Modules?.length || 0} modules
                    </span>
                    <span className="flex items-center gap-1 text-primary">
                      Configure
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-surface-container-lowest rounded-xl p-12 text-center border border-dashed border-outline-variant">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
                <span className="material-symbols-outlined text-3xl">folder_open</span>
              </div>
              <h3 className="text-xl font-bold mb-2">No Projects Yet</h3>
              <p className="text-on-surface-variant mb-6">Create a project first to configure its requirements.</p>
              <Button onClick={() => router.push('/projects/new')} className="bg-primary text-white">
                Create Project
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
