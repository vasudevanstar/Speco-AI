'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import ContentBreadcrumbs from '@/components/layout/ContentBreadcrumbs';
import MobileNav from '@/components/layout/MobileNav';
import { cn, formatDate } from '@/lib/utils';

interface ApiError {
  response?: {
    status?: number;
    data?: {
      error?: string;
    };
  };
  message?: string;
}

interface Project {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  Modules?: ModuleWithQuestions[];
  answers?: any[];
}

interface ModuleWithQuestions {
  id: string;
  name: string;
  description: string;
  status?: 'pending' | 'in_progress' | 'completed';
  Questions?: Question[];
}

interface Question {
  id: string;
  question: string;
}

interface FRDDocument {
  id: number;
  version: string;
  status: string;
  createdAt: string;
  content: {
    sections?: any[];
  };
}

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [modules, setModules] = useState<ModuleWithQuestions[]>([]);
  const [frd, setFrd] = useState<FRDDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [networkError, setNetworkError] = useState(false);
  const [generatingModules, setGeneratingModules] = useState(false);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [generatingFRD, setGeneratingFRD] = useState(false);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState(0);
  const [activeTab, setActiveTab] = useState('Modules');
  
  const [showAddModuleModal, setShowAddModuleModal] = useState(false);
  const [newModuleName, setNewModuleName] = useState('');
  const [newModuleDescription, setNewModuleDescription] = useState('');
  const [isAddingModule, setIsAddingModule] = useState(false);

  useEffect(() => {
    if (projectId) {
      loadProjectData();
    }
  }, [projectId]);

  const loadProjectData = async () => {
    try {
      setError(null);
      setNetworkError(false);
      const projectRes = await api.get(`/projects/${projectId}`);
      const projectData = projectRes.data?.data || projectRes.data;
      setProject(projectData);
      setModules(projectData?.Modules || []);
      setTotalQuestions(projectData?.Modules?.reduce((acc: number, m: ModuleWithQuestions) => acc + (m.Questions?.length || 0), 0) || 0);
      setAnsweredQuestions(projectData?.answers?.length || 0);

      try {
        const frdRes = await api.get(`/frd/${projectId}`, {
          validateStatus: (status) => status >= 200 && status < 400 || status === 404,
        });
        if (frdRes.status === 200) {
          setFrd(frdRes.data?.data || frdRes.data);
        }
      } catch (e) {
        // FRD not found - that's OK, just don't set it
      }
    } catch (error: any) {
      console.error('Failed to load project:', error);
      if (error.message?.includes('Network') || error.code === 'ERR_NETWORK' || !error.response) {
        setNetworkError(true);
      } else {
        setError(error.response?.data?.error || 'Failed to load project');
      }
    } finally {
      setLoading(false);
    }
  };

  const generateModules = async () => {
    setGeneratingModules(true);
    try {
      await api.post(`/projects/${projectId}/generate-modules`);
      await loadProjectData();
    } catch (error: any) {
      console.error('Failed to generate modules:', error);
      if (error.response?.status === 404) {
        setError('Server not running. Please start the backend server.');
      } else {
        setError('Failed to generate modules. Please try again.');
      }
    } finally {
      setGeneratingModules(false);
    }
  };

  const handleAddCustomModule = async () => {
    if (!newModuleName.trim() || !newModuleDescription.trim()) return;
    setIsAddingModule(true);
    try {
      const res = await api.post(`/projects/${projectId}/modules`, {
        name: newModuleName,
        description: newModuleDescription
      });
      if (res.data?.success) {
        setModules([...modules, res.data.data]);
        setShowAddModuleModal(false);
        setNewModuleName('');
        setNewModuleDescription('');
      }
    } catch (e) {
      console.error('Failed to add module:', e);
    } finally {
      setIsAddingModule(false);
    }
  };

  const generateQuestions = async () => {
    setGeneratingQuestions(true);
    setError(null);
    try {
      await api.post(`/questionnaire/${projectId}/generate-questions`);
      await loadProjectData();
    } catch (err: any) {
      console.error('Failed to generate questionnaire:', err);
      if (err.response?.status === 404) {
        setError('Questionnaire generation service not available. Please ensure the backend is running.');
      } else if (err.response?.status === 400 || err.response?.status === 403) {
        setError(err.response?.data?.error || 'Unable to generate questions for the current configuration.');
      } else {
        setError('Failed to generate questions. Please try again or check your project modules.');
      }
    } finally {
      setGeneratingQuestions(false);
    }
  };

  const generateFRD = async () => {
    setError(null);
    setGeneratingFRD(true);
    try {
      await api.post(`/frd/generate/${projectId}`);
      await loadProjectData();
    } catch (error: any) {
      console.error('Failed to generate FRD:', error);
      if (error.response?.status === 404) {
        setError('FRD endpoint not found. Please start the backend server.');
      } else if (error.response?.data?.error) {
        setError(`Failed to generate FRD: ${error.response.data.error}`);
      } else {
        setError('Failed to generate FRD. Please try again.');
      }
    } finally {
      setGeneratingFRD(false);
    }
  };

  const getQuestionnaireProgress = () => {
    if (!modules || modules.length === 0) return 0;
    const completedModules = modules.filter(m => m.status === 'completed').length;
    return Math.round((completedModules / modules.length) * 100);
  };

  const handleDeleteProject = async () => {
    if (confirm('Are you sure you want to delete this project?')) {
      try {
        await api.delete(`/projects/${projectId}`);
        router.push('/projects');
      } catch (error) {
        console.error('Failed to delete project:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-on-surface">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (networkError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full rounded-[2rem] p-8 text-center border-none shadow-xl">
          <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-3xl">wifi_off</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Server Not Running</h2>
          <p className="text-on-surface-variant mb-8">The backend server is not running. Please start the server to continue.</p>
          <Button onClick={() => router.push('/')} className="w-full bg-primary text-white rounded-xl h-12">
            Back to Home
          </Button>
        </Card>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full rounded-[2rem] p-8 text-center border-none shadow-xl">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-3xl">error</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Project not found</h2>
          <p className="text-on-surface-variant mb-8">The project you are looking for doesn't exist or has been removed.</p>
          <Button onClick={() => router.push('/')} className="w-full bg-primary text-white rounded-xl h-12">
            Back to Home
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <Sidebar projectName={project?.title} projectId={projectId} />
      <MobileNav />
      
      <main className="md:ml-64 min-h-screen flex flex-col">
        <TopBar 
          title={project?.title || 'Project'}
          activeTab={activeTab === 'FRD Document' ? 'FRD Generator' : activeTab} 
          tabs={[
            { label: 'Modules', href: '#' },
            { label: 'Questionnaire', href: '#' },
            { label: 'FRD Generator', href: '#' }
          ]}
          onTabChange={(label) => setActiveTab(label === 'FRD Generator' ? 'FRD Document' : label)}
        />

        <div className="pt-24 px-8 pb-12 sm:px-12 flex-1 animate-fade-in relative">
          {/* Subtle Background Elements */}
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] dark:bg-primary/10"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-accent/5 rounded-full blur-[120px] dark:bg-accent/10"></div>
          </div>

          <div className="max-w-6xl mx-auto mb-8 flex justify-between items-center relative z-10">
            <ContentBreadcrumbs 
              items={[
                { label: 'Projects', href: '/projects' },
                { label: project?.title || 'Project' }
              ]} 
            />
            <Button variant="outline" className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200" onClick={handleDeleteProject}>
              Delete Project
            </Button>
          </div>
          {activeTab === 'Modules' && (
            <div className="max-w-6xl mx-auto space-y-12 relative z-10">
              <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                <div className="relative p-2 sm:p-4">
                  <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold tracking-[0.2em] mb-6 uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                      Project Configurator
                    </div>
                    <h1 className="text-5xl sm:text-6xl font-black text-on-surface tracking-tighter leading-tight mb-4">
                      Project <span className="text-primary">Modules.</span>
                    </h1>
                    <p className="text-lg text-on-surface-variant max-w-2xl font-medium leading-relaxed">
                      Define the core functionality for <span className="font-bold text-on-surface">{project?.title}</span>. Our AI has curated these modules based on your initial scope.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Button 
                    variant="outline" 
                    onClick={generateModules} 
                    disabled={generatingModules}
                    className="glass-card text-on-surface px-6 h-12 rounded-xl font-bold hover:bg-surface-container-highest hover:text-primary transition-all flex gap-2 border-outline-variant"
                  >
                    <span className="material-symbols-outlined text-lg">refresh</span>
                    {generatingModules ? 'Generating...' : 'Regenerate'}
                  </Button>
                  <Button 
                    onClick={() => setActiveTab('Questionnaire')}
                    className="bg-gradient-to-r from-primary to-accent text-white px-8 h-12 rounded-xl font-bold shadow-[0_0_20px_rgba(99,102,241,0.5)] hover:shadow-[0_0_30px_rgba(99,102,241,0.8)] hover:scale-105 active:scale-95 transition-all flex gap-2"
                  >
                    Start Questionnaire
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </Button>
                </div>
              </div>

              {modules.length === 0 ? (
                <div className="glass-card rounded-3xl p-16 text-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 opacity-50 group-hover:opacity-100 transition-opacity animate-pulse-glow"></div>
                  <div className="relative z-10">
                    <div className="w-24 h-24 bg-on-surface/5 border border-outline-variant rounded-full flex items-center justify-center mx-auto mb-8 text-primary shadow-[0_0_30px_rgba(99,102,241,0.2)] group-hover:scale-110 transition-transform duration-500">
                      <span className="material-symbols-outlined text-5xl">extension</span>
                    </div>
                    <h3 className="text-3xl font-black mb-4 drop-shadow-md">No Modules Yet</h3>
                    <p className="text-on-surface-variant text-lg mb-10 max-w-md mx-auto">Generate the architectural foundation of your project using our highly advanced AI engine.</p>
                    <Button onClick={generateModules} size="lg" className="bg-gradient-to-r from-primary to-accent text-white rounded-xl h-16 px-12 font-bold shadow-[0_0_30px_rgba(99,102,241,0.5)] hover:scale-105 transition-all text-lg">
                      Generate Modules
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {modules.map((module, idx) => (
                    <div 
                      key={module.id} 
                      className="glass-card p-8 rounded-2xl relative overflow-hidden group hover:scale-[1.02] hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.5)] hover:border-primary/50 transition-all duration-500 cursor-pointer"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:scale-125 duration-300">
                        <span className="material-symbols-outlined text-accent drop-shadow-[0_0_10px_rgba(255,121,198,0.8)] material-symbols-filled">check_circle</span>
                      </div>
                      <div className="relative z-10">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-on-surface/5 border border-outline-variant group-hover:bg-gradient-to-br group-hover:from-primary group-hover:to-accent group-hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] text-primary group-hover:text-white transition-all duration-500">
                          <span className="material-symbols-outlined text-2xl">{idx % 2 === 0 ? 'bar_chart' : 'home_repair_service'}</span>
                        </div>
                        <h3 className="text-2xl font-bold mb-3 drop-shadow-md group-hover:text-primary transition-colors">{module.name}</h3>
                        <p className="text-sm leading-relaxed mb-8 line-clamp-3 text-on-surface-variant group-hover:text-on-surface transition-colors">
                          {module.description}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-primary/10 text-primary border border-primary/20 group-hover:border-outline-variant group-hover:text-white transition-all">
                            Core
                          </span>
                          <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-accent/10 text-accent border border-accent/20 group-hover:border-outline-variant group-hover:text-white transition-all">
                            AI Curated
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button 
                    onClick={() => setShowAddModuleModal(true)}
                    className="glass-card border-dashed border-outline-variant p-8 rounded-2xl flex flex-col items-center justify-center text-on-surface-variant hover:border-primary/50 hover:bg-surface-container-highest hover:text-primary transition-all duration-300 cursor-pointer group hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.5)]"
                  >
                    <div className="w-16 h-16 rounded-full border border-outline-variant flex items-center justify-center mb-6 group-hover:bg-gradient-to-br group-hover:from-primary group-hover:to-accent group-hover:text-primary group-hover:border-primary group-hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] group-hover:scale-110 transition-all duration-500">
                      <span className="material-symbols-outlined text-3xl">add</span>
                    </div>
                    <span className="text-lg font-bold group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-primary group-hover:to-accent transition-all">Add Custom Module</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'Questionnaire' && (
            <div className="max-w-6xl mx-auto space-y-12 relative z-10">
              <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                <div className="max-w-2xl relative p-2 sm:p-4">
                  <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-[10px] font-bold tracking-[0.2em] mb-6 uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                      Specification Engine
                    </div>
                    <h1 className="text-5xl sm:text-6xl font-black text-on-surface tracking-tighter leading-tight mb-4">
                      Requirements <span className="text-accent">Questionnaire.</span>
                    </h1>
                    <p className="text-lg text-on-surface-variant leading-relaxed font-medium">
                      Define your project's technical DNA. Complete the curated modules below to generate a comprehensive document.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={generateQuestions}
                    disabled={generatingQuestions || modules.length === 0}
                    className="h-12 px-6 rounded-xl font-bold bg-surface-container-high border-none flex gap-2 hover:bg-surface-container-highest transition-all"
                  >
                    {generatingQuestions ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <span className="material-symbols-outlined text-lg">refresh</span>
                    )}
                    {generatingQuestions ? 'Generating...' : totalQuestions === 0 ? 'Generate Questionnaire' : 'Regenerate Questions'}
                  </Button>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="glass-card border-red-500/50 bg-red-500/10 p-6 rounded-2xl flex items-center gap-4 animate-shake mb-8 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                  <span className="material-symbols-outlined text-3xl text-red-400">error_outline</span>
                  <p className="text-red-200 font-bold text-lg">{error}</p>
                </div>
              )}

              {/* Progress Summary Area */}
                {totalQuestions === 0 ? (
                  <div className="md:col-span-12 bg-surface-container-low rounded-3xl p-16 text-center border-2 border-dashed border-outline-variant relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50"></div>
                    <div className="relative z-10 max-w-xl mx-auto flex flex-col items-center">
                      <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mb-10 shadow-xl shadow-primary group-hover:scale-110 transition-transform duration-500">
                        <span className="material-symbols-outlined text-5xl text-primary material-symbols-filled">
                          {modules.length === 0 ? 'extension_off' : 'auto_awesome'}
                        </span>
                      </div>
                      
                      {modules.length === 0 ? (
                        <>
                          <h3 className="text-3xl font-bold text-on-background mb-4">Foundation Missing</h3>
                          <p className="text-on-surface-variant text-lg mb-10 leading-relaxed">
                            We need project modules before we can generate a questionnaire. Start by defining your project structure in the Modules tab.
                          </p>
                          <Button 
                            onClick={() => setActiveTab('Modules')}
                            className="h-16 px-12 bg-primary text-white rounded-xl font-black text-xl flex items-center gap-3 shadow-[0_20px_40px_rgba(var(--primary-rgb),0.25)] hover:translate-y-[-4px] active:scale-95 transition-all"
                          >
                            <span className="material-symbols-outlined text-2xl font-bold">arrow_back</span>
                            Back to Modules
                          </Button>
                        </>
                      ) : (
                        <>
                          <h3 className="text-3xl font-bold text-on-background mb-4">Generate Questionnaire</h3>
                          <p className="text-on-surface-variant text-lg mb-10 leading-relaxed">
                             AI will analyze your {modules.length} modules to create a custom requirement specification workflow tailored to your project goals.
                          </p>
                          <Button 
                            onClick={generateQuestions}
                            disabled={generatingQuestions}
                            className="h-16 px-12 bg-primary text-white rounded-xl font-black text-xl flex items-center gap-3 shadow-[0_20px_40px_rgba(53,37,205,0.25)] hover:translate-y-[-4px] active:scale-95 transition-all"
                          >
                            {generatingQuestions ? (
                              <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                              <span className="material-symbols-outlined text-2xl material-symbols-filled">quiz</span>
                            )}
                            {generatingQuestions ? 'Generating Analysis...' : 'Start AI Generation'}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="md:col-span-8 glass-card rounded-3xl p-10 flex flex-col justify-between relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-primary/20 to-transparent rounded-full -mr-40 -mt-40 blur-[80px] group-hover:scale-110 transition-transform duration-1000"></div>
                      <div className="relative z-10">
                        <div className="flex justify-between items-start mb-10">
                          <div>
                            <p className="text-xs font-bold text-accent uppercase tracking-widest mb-3 drop-shadow-[0_0_8px_rgba(255,121,198,0.5)]">Total Completion</p>
                            <h3 className="text-6xl font-black text-on-background drop-shadow-lg">
                              {getQuestionnaireProgress()}% <span className="text-2xl font-bold text-on-surface-variant opacity-50">/ 100%</span>
                            </h3>
                          </div>
                          <div className="px-5 py-2 bg-on-surface/5 backdrop-blur-md border border-outline-variant text-white rounded-full text-[10px] font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                            In Analysis
                          </div>
                        </div>
                        <div className="w-full h-6 bg-black/40 rounded-full overflow-hidden mb-6 p-1 backdrop-blur-sm border border-white/5">
                          <div 
                            className="h-full bg-gradient-to-r from-primary via-accent to-primary rounded-full shadow-[0_0_20px_rgba(255,121,198,0.8)] transition-all duration-1000 relative overflow-hidden" 
                            style={{ width: `${Math.max(5, getQuestionnaireProgress())}%` }}
                          >
                            <div className="absolute inset-0 bg-white/20 w-full h-full" style={{ backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.15) 50%, rgba(255,255,255,.15) 75%, transparent 75%, transparent)', backgroundSize: '1rem 1rem' }}></div>
                          </div>
                        </div>
                        <p className="text-base text-on-surface-variant font-medium">
                          {answeredQuestions} of {totalQuestions} requirements defined across {modules.length} modules.
                        </p>
                      </div>
                    </div>
                    <div className="md:col-span-4 relative rounded-3xl p-10 flex flex-col text-white overflow-hidden group hover:scale-[1.02] transition-transform duration-500 shadow-[0_20px_50px_rgba(99,102,241,0.4)]">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent opacity-90 z-0"></div>
                      <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/20 rounded-full blur-[50px] z-0 pointer-events-none group-hover:scale-150 transition-transform duration-1000"></div>
                      <div className="relative z-10 h-full flex flex-col">
                        <h3 className="text-3xl font-black mb-4 drop-shadow-md">Finalize Architecture</h3>
                        <p className="text-white/90 text-base leading-relaxed mb-10 font-medium drop-shadow-sm">
                          Continue refining the security and data management requirements to unlock documentation generation.
                        </p>
                        <Button 
                          onClick={() => router.push(`/questionnaire/${projectId}`)}
                          className="mt-auto w-full h-16 bg-white hover:bg-white/90 text-primary rounded-xl font-black text-xl hover:scale-105 active:scale-95 transition-all shadow-[0_10px_30px_rgba(0,0,0,0.3)] flex gap-2"
                        >
                          Start Refining
                          <span className="material-symbols-outlined material-symbols-filled text-2xl">arrow_forward</span>
                        </Button>
                      </div>
                    </div>
                  </>
                )}

              {/* Questionnaire Modules Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {modules.map((module, idx) => (
                  <div 
                    key={module.id} 
                    onClick={() => router.push(`/questionnaire/${projectId}?moduleId=${module.id}`)}
                    className="glass-card rounded-2xl p-8 hover:scale-[1.03] hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.5)] transition-all duration-500 cursor-pointer border border-transparent hover:border-primary/40 group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-8">
                        <div className="w-16 h-16 bg-on-surface/5 border border-outline-variant text-primary rounded-2xl flex items-center justify-center group-hover:bg-gradient-to-br group-hover:from-primary group-hover:to-accent group-hover:text-white group-hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] transition-all duration-500">
                          <span className="material-symbols-outlined text-3xl material-symbols-filled">
                            {idx === 0 ? 'architecture' : idx === 1 ? 'shield_person' : 'payments'}
                          </span>
                        </div>
                        {module.status === 'completed' && <span className="material-symbols-outlined text-accent text-4xl material-symbols-filled drop-shadow-[0_0_10px_rgba(255,121,198,0.8)]">check_circle</span>}
                      </div>
                      <h4 className="text-2xl font-bold mb-3 drop-shadow-md group-hover:text-primary transition-colors">{module.name}</h4>
                      <p className="text-base font-medium text-on-surface-variant mb-10 line-clamp-2 group-hover:text-on-surface transition-colors">Definition of {module.name.toLowerCase()} parameters and technical constraints.</p>
                      <div className="flex items-center justify-between text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.2em] border-t border-outline-variant pt-6 group-hover:border-outline-variant transition-colors">
                        <span className="bg-background/50 px-3 py-1 rounded-full">{module.Questions?.length || 0} Questions</span>
                        <span className={cn(
                          "px-3 py-1 rounded-full",
                          module.status === 'completed' ? "bg-accent/20 text-accent border border-accent/30" : "bg-primary/20 text-primary border border-primary/30"
                        )}>
                          {module.status === 'completed' ? 'Complete' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                <button 
                  onClick={() => setShowAddModuleModal(true)}
                  className="glass-card rounded-2xl p-8 hover:scale-[1.03] transition-all duration-500 cursor-pointer border-2 border-dashed border-outline-variant hover:border-primary/50 group flex flex-col items-center justify-center min-h-[250px] relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-16 h-16 bg-on-surface/5 border border-outline-variant rounded-full flex items-center justify-center group-hover:bg-gradient-to-br group-hover:from-primary group-hover:to-accent group-hover:border-transparent group-hover:shadow-[0_0_20px_rgba(99,102,241,0.6)] group-hover:scale-110 group-hover:text-white transition-all duration-500 mb-6 text-on-surface-variant">
                      <span className="material-symbols-outlined text-3xl">add</span>
                    </div>
                    <h4 className="text-2xl font-bold mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-primary group-hover:to-accent transition-all">Add Custom Module</h4>
                    <p className="text-base font-medium text-on-surface-variant text-center px-4 group-hover:text-on-surface">Define your own parameters and technical constraints.</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'FRD Document' && (
            <div className="max-w-6xl mx-auto space-y-12 relative z-10">
              <div className="mb-10 flex flex-col md:flex-row justify-between items-end relative p-2 sm:p-4">
                <div className="relative z-10 max-w-3xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/10 text-secondary-foreground text-[10px] font-bold tracking-[0.2em] mb-6 uppercase border border-border">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary-foreground"></span>
                    {project?.title}
                  </div>
                  <h1 className="text-5xl sm:text-6xl font-black text-on-surface tracking-tighter leading-tight mb-4">
                    FRD <span className="text-primary">Generator.</span>
                  </h1>
                  <p className="text-lg text-on-surface-variant leading-relaxed font-medium">
                    Transform your architectural definitions into a comprehensive Technical Specification.
                  </p>
                </div>
                <div className="px-5 py-2 glass-card rounded-full text-[10px] font-bold tracking-[0.2em] text-on-surface uppercase mt-6 md:mt-0">
                  <span className="w-2 h-2 rounded-full bg-green-500 inline-block mr-2 animate-pulse"></span>
                  Version 2.4.0
                </div>
              </div>

              {!frd ? (
                <div className="flex flex-col gap-8 relative z-10 animate-fade-in">
                  {error && (
                    <div className="glass-card border-red-500/50 bg-red-500/10 p-6 rounded-2xl flex items-center gap-4 animate-shake shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                      <span className="material-symbols-outlined text-3xl text-red-400">error_outline</span>
                      <p className="text-red-200 font-bold text-lg">{error}</p>
                    </div>
                  )}

                  {/* Readiness and Overall Completion Header */}
                  <div className="glass-card rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group border border-primary/20">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 opacity-50"></div>
                    <div className="flex items-center gap-8 relative z-10">
                      <div className="relative w-32 h-32 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-surface-container-highest" />
                          <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-primary transition-all duration-1000" strokeDasharray={`${Math.round((answeredQuestions / (totalQuestions || 1)) * 283)} 283`} />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-3xl font-black">{totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0}%</span>
                          <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Score</span>
                        </div>
                      </div>
                      <div>
                        <h2 className="text-3xl font-black mb-2">FRD Readiness Score</h2>
                        <p className="text-on-surface-variant font-medium">
                          {answeredQuestions} of {totalQuestions} requirements entered. 
                          <span className="text-orange-400 ml-2 font-bold">{Math.max(0, totalQuestions - answeredQuestions)} missing.</span>
                        </p>
                      </div>
                    </div>
                    <div className="relative z-10 flex flex-col items-end">
                      <Button 
                        onClick={generateFRD}
                        disabled={generatingFRD || (totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) < 10 : true)}
                        className={cn(
                          "h-16 px-10 rounded-xl font-black text-xl flex items-center gap-3 transition-all",
                          (totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) >= 10 : false) 
                            ? "bg-gradient-to-r from-primary to-accent text-white hover:scale-105 shadow-[0_15px_30px_rgba(99,102,241,0.4)]" 
                            : "bg-surface-container-high text-on-surface-variant cursor-not-allowed opacity-70 border-none"
                        )}
                      >
                        {generatingFRD ? (
                          <>
                            <Loader2 className="w-6 h-6 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-2xl material-symbols-filled drop-shadow-md">auto_awesome</span>
                            Generate FRD
                          </>
                        )}
                      </Button>
                      {(totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) < 10 : true) && (
                        <p className="text-xs font-bold text-orange-400 mt-3 uppercase tracking-widest flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">lock</span>
                          Requires 10% Completion
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Two Column Layout for Status Cards and Module Table */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Status Cards and Missing Info */}
                    <div className="lg:col-span-8 flex flex-col gap-8">
                      <h3 className="text-2xl font-bold flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">analytics</span>
                        Information Status
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                          { label: 'Modules Completed', completed: modules.filter(m => m.status === 'completed').length, total: modules.length, icon: 'view_module' },
                          { label: 'Questions Answered', completed: answeredQuestions, total: totalQuestions, icon: 'quiz' },
                          { label: 'Data Entities Defined', completed: Math.round(answeredQuestions * 0.15), total: Math.round(totalQuestions * 0.15) || 10, icon: 'database' },
                          { label: 'Business Rules', completed: Math.round(answeredQuestions * 0.25), total: Math.round(totalQuestions * 0.25) || 15, icon: 'rule' },
                          { label: 'Forms Designed', completed: Math.round(answeredQuestions * 0.10), total: Math.round(totalQuestions * 0.10) || 5, icon: 'list_alt' },
                          { label: 'Reports Configured', completed: Math.round(answeredQuestions * 0.08), total: Math.round(totalQuestions * 0.08) || 4, icon: 'monitoring' }
                        ].map((stat, i) => {
                          const pct = stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0;
                          return (
                            <div key={i} className="glass-card p-6 rounded-3xl flex flex-col border border-outline-variant hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-300 group bg-surface-container-lowest">
                              <div className="flex justify-between items-start mb-6">
                                <div className="w-12 h-12 bg-surface-container-low border border-outline-variant rounded-xl flex items-center justify-center group-hover:bg-primary/10 group-hover:border-primary/30 transition-all duration-300">
                                  <span className="material-symbols-outlined text-2xl text-on-surface-variant group-hover:text-primary transition-colors">{stat.icon}</span>
                                </div>
                                <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-br from-on-background to-on-surface-variant">{pct}%</span>
                              </div>
                              <p className="text-xs font-bold text-on-background uppercase tracking-[0.2em] mb-4">{stat.label}</p>
                              <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden mb-3 border border-outline-variant">
                                <div className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-1000 shadow-[0_0_10px_rgba(99,102,241,0.5)]" style={{ width: `${pct}%` }}></div>
                              </div>
                              <p className="text-[11px] text-on-surface-variant font-bold uppercase tracking-widest">
                                <span className="text-primary">{stat.completed}</span> / {stat.total} 
                                <span className="text-orange-400 ml-1">({Math.max(0, stat.total - stat.completed)} req)</span>
                              </p>
                            </div>
                          );
                        })}
                      </div>

                      {/* Missing Information Panel */}
                      <div className="glass-card border-orange-500/30 bg-orange-500/5 p-6 rounded-2xl">
                        <h4 className="text-lg font-black text-orange-400 mb-4 flex items-center gap-2">
                          <span className="material-symbols-outlined">warning</span>
                          Missing Information
                        </h4>
                        <ul className="space-y-3">
                          {modules.filter(m => m.status !== 'completed').flatMap(m => m.Questions || []).slice(0, 6).map((q, idx) => (
                            <li key={idx} className="flex gap-3 text-sm font-medium text-on-surface-variant">
                              <span className="material-symbols-outlined text-orange-500/50 text-lg">circle</span>
                              <span className="line-clamp-1">{q.question}</span>
                            </li>
                          ))}
                          {totalQuestions - answeredQuestions <= 0 && (
                            <li className="text-green-500 font-bold flex items-center gap-2">
                              <span className="material-symbols-outlined">check_circle</span>
                              All required information has been collected!
                            </li>
                          )}
                        </ul>
                        {(totalQuestions - answeredQuestions) > 6 && (
                          <p className="text-xs text-orange-400/80 mt-4 font-bold uppercase tracking-wider">
                            + {(totalQuestions - answeredQuestions) - 6} more pending requirements
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right Column: Module Completion Table */}
                    <div className="lg:col-span-4 flex flex-col gap-8">
                      <h3 className="text-2xl font-bold flex items-center gap-2">
                        <span className="material-symbols-outlined text-accent">view_list</span>
                        Module Completion
                      </h3>
                      <div className="glass-card p-6 rounded-2xl flex-1 border border-on-surface/10">
                        <div className="space-y-3">
                          {modules.map((m, idx) => {
                            const mTotal = m.Questions?.length || 0;
                            const mAnswered = project?.answers ? project.answers.filter((a: any) => m.Questions?.some((q: any) => q.id === a.questionId)).length : 0;
                            
                            let mPct = 0;
                            if (m.status === 'completed' || (mTotal > 0 && mAnswered >= mTotal)) {
                              mPct = 100;
                            } else if (mTotal > 0) {
                              mPct = Math.round((mAnswered / mTotal) * 100);
                            }
                            const isComplete = mPct === 100;

                            return (
                              <div key={idx} className="flex items-center justify-between p-4 bg-surface-container-lowest rounded-2xl border border-outline-variant hover:border-primary/30 hover:bg-surface-container-low transition-all duration-300 group">
                                <div className="flex items-center gap-3">
                                  <div className={cn("w-2 h-2 rounded-full", isComplete ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : mPct > 0 ? "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]" : "bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.6)]")}></div>
                                  <span className="text-sm font-bold truncate max-w-[150px] group-hover:text-primary transition-colors">{m.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {isComplete ? (
                                    <span className="flex items-center gap-1 text-[10px] font-black uppercase text-green-500 bg-green-500/10 px-2 py-1 rounded">
                                      <span className="material-symbols-outlined text-[14px]">check</span> Complete
                                    </span>
                                  ) : mPct > 0 ? (
                                    <span className="flex items-center gap-1 text-[10px] font-black uppercase text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded">
                                      {mPct}%
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1 text-[10px] font-black uppercase text-red-400 bg-red-400/10 px-2 py-1 rounded">
                                      Not Started
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                          {modules.length === 0 && (
                            <p className="text-sm text-on-surface-variant text-center py-4">No modules found.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="glass-card rounded-3xl p-12 shadow-[0_10px_40px_rgba(0,0,0,0.1)] animate-fade-in hover:border-primary/20 transition-all relative z-10">
                  <div className="flex justify-between items-center mb-12 border-b border-on-surface/10 pb-8">
                    <div className="flex gap-4">
                      <div className="bg-gradient-to-r from-primary to-accent px-5 py-2 rounded-xl text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-[0_0_15px_rgba(99,102,241,0.5)]">Version {frd.version}</div>
                      <div className="bg-green-500/10 px-5 py-2 rounded-xl text-green-500 text-[11px] font-black uppercase tracking-[0.2em] border border-green-500/30">Finalized</div>
                    </div>
                    <div className="flex gap-4">
                      <Button 
                        variant="outline" 
                        onClick={() => router.push(`/frd/${projectId}`)}
                        className="h-12 px-8 rounded-xl font-bold border-outline-variant hover:bg-surface-container-low transition-all flex gap-2"
                      >
                         View Specification
                        <span className="material-symbols-outlined text-lg">visibility</span>
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={generateFRD}
                        disabled={generatingFRD}
                        className="h-12 px-8 rounded-xl font-bold bg-primary text-white border-none shadow-lg shadow-primary hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                      >
                        {generatingFRD ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          'Regenerate'
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  {frd.content && (
                    <div className="max-w-4xl mx-auto space-y-12 py-8">
                      {frd.content.sections?.slice(0, 3).map((section: any, idx: number) => (
                        <div key={idx} className="space-y-4 animate-slide-up bg-surface-container-lowest p-10 rounded-3xl border border-outline-variant hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 group" style={{ animationDelay: `${idx * 100}ms` }}>
                          <h3 className="text-2xl font-black tracking-tight flex items-center gap-4 text-on-surface">
                            <span className="text-transparent bg-clip-text bg-gradient-to-br from-primary to-accent text-3xl font-black drop-shadow-sm group-hover:scale-110 transition-transform">0{idx + 1}</span>
                            {section.title}
                          </h3>
                          <p className="text-on-surface-variant text-base leading-relaxed font-medium pl-12 border-l-2 border-surface-container ml-4 group-hover:border-primary/30 transition-colors">{section.content}</p>
                        </div>
                      ))}
                      <div className="flex justify-center pt-8">
                         <Button 
                          onClick={() => router.push(`/frd/${projectId}`)}
                          className="h-16 px-12 bg-primary text-white rounded-xl font-black text-xl hover:scale-105 active:scale-95 transition-all shadow-md hover:shadow-lg group"
                         >
                           Read Entire Specification
                           <span className="material-symbols-outlined ml-3 text-2xl group-hover:translate-x-2 transition-transform">arrow_forward</span>
                         </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {/* Add Custom Module Modal */}
          {showAddModuleModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-surface-container-lowest rounded-2xl w-full max-w-md p-8 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold">Add Custom Module</h3>
                  <button onClick={() => setShowAddModuleModal(false)} className="text-on-surface-variant hover:text-on-surface">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold mb-2 text-on-surface-variant">Module Name</label>
                    <input 
                      placeholder="e.g., Database Migration"
                      value={newModuleName}
                      onChange={e => setNewModuleName(e.target.value)}
                      className="w-full bg-surface-container-low border-transparent focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-base p-4 outline-none transition-all text-on-surface"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2 text-on-surface-variant">Description</label>
                    <textarea 
                      placeholder="Describe what this module will cover..."
                      value={newModuleDescription}
                      onChange={e => setNewModuleDescription(e.target.value)}
                      className="w-full bg-surface-container-low border-transparent focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-base p-4 min-h-[120px] resize-none outline-none transition-all text-on-surface"
                    />
                  </div>
                  <div className="flex gap-4 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowAddModuleModal(false)}
                      className="flex-1 h-12 rounded-xl"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleAddCustomModule}
                      disabled={!newModuleName.trim() || !newModuleDescription.trim() || isAddingModule}
                      className="flex-1 h-12 rounded-xl bg-primary text-white relative"
                    >
                      {isAddingModule ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin mr-2 inline-block" />
                          Generating...
                        </>
                      ) : (
                        'Add Module'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
