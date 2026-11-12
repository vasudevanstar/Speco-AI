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

interface TimelineEvent {
  id: string;
  type: 'project_created' | 'project_updated' | 'frd_generated' | 'modules_generated' | 'questionnaire_completed';
  title: string;
  description: string;
  projectId: string;
  projectTitle: string;
  timestamp: string;
}

interface Project {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  Modules?: { id: string }[];
  FRDDocument?: {
    id: string;
    version: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
}

export default function HistoryPage() {
  const router = useRouter();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [networkError, setNetworkError] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const response = await api.get('/projects');
      const projects: Project[] = response.data?.data || response.data || [];
      
      const timeline: TimelineEvent[] = [];
      
      projects.forEach((project) => {
        timeline.push({
          id: `${project.id}-created`,
          type: 'project_created',
          title: 'Project Created',
          description: `${project.title} was created`,
          projectId: project.id,
          projectTitle: project.title,
          timestamp: project.createdAt || (project as any).created_at,
        });

        if (project.Modules && project.Modules.length > 0) {
          timeline.push({
            id: `${project.id}-modules`,
            type: 'modules_generated',
            title: 'Modules Generated',
            description: `${project.Modules.length} modules created for ${project.title}`,
            projectId: project.id,
            projectTitle: project.title,
            timestamp: project.updatedAt || (project as any).updated_at || project.createdAt || (project as any).created_at,
          });
        }

        if (project.FRDDocument) {
          timeline.push({
            id: `${project.id}-frd`,
            type: 'frd_generated',
            title: 'FRD Generated',
            description: `Version ${project.FRDDocument.version} for ${project.title}`,
            projectId: project.id,
            projectTitle: project.title,
            timestamp: project.FRDDocument.createdAt || (project.FRDDocument as any).created_at,
          });
        }
      });

      timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setEvents(timeline);
    } catch (error: any) {
      console.error('Error loading history:', error);
      if (error.message?.includes('Network') || error.code === 'ERR_NETWORK' || !error.response) {
        setNetworkError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'project_created':
        return 'add_circle';
      case 'project_updated':
        return 'edit';
      case 'modules_generated':
        return 'view_module';
      case 'frd_generated':
        return 'description';
      case 'questionnaire_completed':
        return 'check_circle';
      default:
        return 'circle';
    }
  };

  const getEventColor = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'project_created':
        return 'text-green-500 bg-green-50';
      case 'project_updated':
        return 'text-blue-500 bg-blue-50';
      case 'modules_generated':
        return 'text-purple-500 bg-purple-50';
      case 'frd_generated':
        return 'text-primary bg-primary/10';
      case 'questionnaire_completed':
        return 'text-amber-500 bg-amber-50';
      default:
        return 'text-gray-500 bg-gray-50';
    }
  };

  // using imported formatDate

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
        <TopBar title="History" />
        
        <div className="pt-24 px-8 pb-12 sm:px-12 max-w-4xl mx-auto animate-fade-in">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Activity History</h1>
            <p className="text-on-surface-variant">
              Track all changes and milestones across your projects.
            </p>
          </div>
          
          {events.length > 0 ? (
            <div className="relative">
              <div className="absolute left-8 top-0 bottom-0 w-px bg-outline-variant" />
              
              <div className="space-y-6">
                {events.map((event, idx) => (
                  <div key={event.id} className="relative flex gap-6">
                    <div className={cn(
                      "w-16 h-16 rounded-xl flex items-center justify-center shrink-0 z-10",
                      getEventColor(event.type)
                    )}>
                      <span className="material-symbols-outlined text-2xl">
                        {getEventIcon(event.type)}
                      </span>
                    </div>
                    
                    <div className="flex-1 bg-surface-container-lowest p-6 rounded-xl">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-lg">{event.title}</h3>
                        <span className="text-xs text-on-surface-variant">
                          {formatDate(event.timestamp)}
                        </span>
                      </div>
                      <p className="text-on-surface-variant mb-4">{event.description}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => router.push(`/projects/${event.projectId}`)}
                          className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                        >
                          View Project
                          <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </button>
                        {event.type === 'frd_generated' && (
                          <button
                            onClick={() => router.push(`/frd/${event.projectId}`)}
                            className="text-xs font-medium text-on-surface-variant hover:text-primary flex items-center gap-1"
                          >
                            View FRD
                            <span className="material-symbols-outlined text-sm">description</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-surface-container-lowest rounded-xl p-12 text-center border border-dashed border-outline-variant">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
                <span className="material-symbols-outlined text-3xl">history</span>
              </div>
              <h3 className="text-xl font-bold mb-2">No Activity Yet</h3>
              <p className="text-on-surface-variant mb-6">
                Your project activity will appear here once you start creating projects.
              </p>
              <Button onClick={() => router.push('/projects/new')} className="bg-primary text-white">
                Create Your First Project
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
