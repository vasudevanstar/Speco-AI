'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { api } from '@/lib/api';
import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';
import { cn, formatDate } from '@/lib/utils';
import { Download, FileText, Printer, ChevronLeft, Calendar, User, ShieldCheck, RefreshCw, Check, X, Terminal, Code, CheckCircle2, AlertCircle, HelpCircle, Lightbulb, Sparkles, Database, Layers, ArrowRight, Table } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface FRDDocument {
  id: string | number;
  version: string;
  status: string;
  createdAt: string;
  markdown?: string;
  content: {
    sections?: Section[];
    modules?: Module[];
    requirements?: Requirement[];
    user_flows?: UserFlow[];
    traceabilityMatrix?: TraceabilityItem[];
  };
}

interface TraceabilityItem {
  requirementId: string;
  questionId: string;
  questionText: string;
  userAnswer: string;
  generatedRequirement: string;
  developerHint: string;
  acceptanceCriteria: string;
  status: string;
}

interface Section {
  title: string;
  content: string;
}

interface Module {
  id: number;
  name: string;
  description: string;
  priority: string;
  sub_modules?: SubModule[];
}

interface SubModule {
  id: number;
  name: string;
  description: string;
}

interface Requirement {
  id: number;
  module_id: number;
  code: string;
  questionCode?: string;
  title: string;
  description: string;
  developerHint?: string;
  technicalSpec?: string;
  originalQuestion?: string;
  originalAnswer?: string;
  validationRules?: string[];
  acceptanceCriteria?: string[];
  priority: string;
  type: string;
  clarificationStatus?: string;
}

interface UserFlow {
  id: number;
  module_id: number;
  title: string;
  steps: string;
}

export default function FRDViewPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;
  
  const [frd, setFrd] = useState<FRDDocument | null>(null);
  const [projectName, setProjectName] = useState('');
  const [loading, setLoading] = useState(true);
  const [networkError, setNetworkError] = useState(false);
  const [regeneratingSectionIndex, setRegeneratingSectionIndex] = useState<number | null>(null);
  const [newSectionContent, setNewSectionContent] = useState<string | null>(null);

  useEffect(() => {
    if (projectId) {
      loadFRD();
    }
  }, [projectId]);

  const loadFRD = async () => {
    try {
      const [frdRes, projectRes] = await Promise.all([
        api.get(`/frd/${projectId}`),
        api.get(`/projects/${projectId}`)
      ]);
      setFrd(frdRes.data?.data || frdRes.data);
      const projectData = projectRes.data?.data || projectRes.data;
      setProjectName(projectData?.title || 'Unknown Project');
    } catch (error: any) {
      console.error('Failed to load FRD:', error);
      if (error.message?.includes('Network') || error.code === 'ERR_NETWORK' || !error.response) {
        setNetworkError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateSection = async (sectionIndex: number) => {
    setRegeneratingSectionIndex(sectionIndex);
    setNewSectionContent(null);
    try {
      const res = await api.post(`/frd/section/generate/${projectId}`, { sectionIndex });
      if (res.data?.success) {
        setNewSectionContent(res.data.data.newContent);
      }
    } catch (error) {
      console.error('Failed to regenerate section', error);
      setRegeneratingSectionIndex(null);
    }
  };

  const handleAcceptSection = async (sectionIndex: number) => {
    if (!newSectionContent) return;
    try {
      const res = await api.post(`/frd/section/accept/${projectId}`, { sectionIndex, newContent: newSectionContent });
      if (res.data?.success) {
        setFrd((prev) => prev ? { ...prev, content: res.data.data.content, version: res.data.data.version } : prev);
        setRegeneratingSectionIndex(null);
        setNewSectionContent(null);
      }
    } catch (error) {
      console.error('Failed to accept section', error);
    }
  };

  const handleRejectSection = () => {
    setRegeneratingSectionIndex(null);
    setNewSectionContent(null);
  };

  const exportToPDF = () => {
    window.print();
  };

  const exportToMarkdown = () => {
    if (!frd) return;
    
    let markdown = (frd as any).markdown;
    if (!markdown) {
      markdown = `# Functional Requirements Document\n\n`;
      markdown += `**Project:** ${projectName}\n`;
      markdown += `**Version:** ${frd.version}\n`;
      markdown += `**Date:** ${formatDate(frd.createdAt || (frd as any).created_at)}\n\n`;
      markdown += `---\n\n`;
      
      if (frd.content.sections) {
        frd.content.sections.forEach(section => {
          markdown += `## ${section.title}\n\n${section.content}\n\n`;
        });
      }
    }
    
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FRD-${projectName.replace(/\s+/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-on-surface">
         <div className="animate-pulse flex flex-col items-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full mb-4"></div>
            <div className="h-4 w-32 bg-surface-container rounded"></div>
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
          <Button onClick={() => router.push('/')} className="w-full bg-primary text-white rounded-xl h-12">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  if (!frd) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-[2rem] p-8 text-center">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-3xl">description</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">No FRD Generated Yet</h2>
          <p className="text-on-surface-variant mb-8">The Functional Requirements Document hasn't been generated yet. Complete the questionnaire and generate your FRD.</p>
          <Button onClick={() => router.push(`/projects/${projectId}`)} className="w-full bg-primary text-white rounded-xl h-12">
            Back to Project
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <main className="min-h-screen flex flex-col bg-background">
        {/* Header - Hidden on Print */}
        <header className="h-20 flex items-center justify-between px-8 sm:px-12 glass-header sticky top-0 z-50 print:hidden">
           <button 
            onClick={() => router.push(`/projects/${projectId}`)}
            className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-bold text-sm"
           >
             <ChevronLeft className="w-5 h-5" />
             Back to Project
           </button>
           <div className="flex items-center gap-4">
             <Button 
              variant="outline" 
              onClick={exportToMarkdown}
              className="h-10 px-6 rounded-lg font-bold border-surface-container hover:bg-surface-container-low flex gap-2"
             >
               <FileText className="w-4 h-4" />
               Export Markdown
             </Button>
             <Button 
              onClick={exportToPDF}
              className="h-10 px-6 bg-primary text-white rounded-lg font-bold shadow-lg shadow-primary hover:scale-105 active:scale-95 transition-all flex gap-2"
             >
               <Printer className="w-4 h-4" />
               Print / PDF
             </Button>
           </div>
        </header>

        {/* Document Container */}
        <div className="flex-1 py-16 sm:py-24 px-8 sm:px-16 lg:px-32 max-w-6xl mx-auto w-full animate-fade-in print:p-0 print:max-w-none">
           {/* Document Metadata Area */}
           <div className="mb-20 space-y-8">
              <div className="flex items-center gap-4 text-primary font-bold tracking-[0.2em] uppercase text-[10px] print:text-xs">
                <span>Technical Architecture</span>
                <span className="w-1 h-1 bg-primary/30 rounded-full"></span>
                <span>v.{frd.version}</span>
              </div>
              
              <h1 className="text-6xl sm:text-7xl font-black tracking-tighter text-on-background leading-none">
                Functional <br/> Requirements <br/> Document
              </h1>
              
              <div className="flex flex-wrap gap-12 pt-8 border-t border-surface-container">
                 <div className="space-y-1">
                   <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest flex items-center gap-2">
                     <User className="w-3 h-3" /> Project
                   </p>
                   <p className="text-xl font-bold text-on-background">{projectName}</p>
                 </div>
                 <div className="space-y-1">
                   <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest flex items-center gap-2">
                     <Calendar className="w-3 h-3" /> Date
                   </p>
                   <p className="text-xl font-bold text-on-background">{formatDate(frd.createdAt || (frd as any).created_at)}</p>
                 </div>
                 <div className="space-y-1">
                   <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest flex items-center gap-2">
                     <ShieldCheck className="w-3 h-3" /> Status
                   </p>
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <p className="text-xl font-bold text-on-background uppercase">{frd.status}</p>
                   </div>
                 </div>
              </div>
           </div>

           {/* Content Sections */}
           <div className="space-y-24">
              {frd.content.sections?.map((section: any, idx: number) => (
                <section key={idx} className="space-y-8 animate-slide-up relative group" style={{ animationDelay: `${idx * 100}ms` }}>
                  <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-black tracking-tight flex items-center gap-6">
                      <span className="text-primary font-black opacity-20 text-xl">0{idx + 1}</span>
                      {section.title}
                    </h2>
                    {regeneratingSectionIndex !== idx && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRegenerateSection(idx)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 print:hidden text-primary border-primary/20 hover:bg-primary/5"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Regenerate
                      </Button>
                    )}
                  </div>

                  {regeneratingSectionIndex === idx ? (
                    <div className="mt-4 p-6 border-2 border-primary/20 rounded-2xl bg-surface-container-lowest shadow-inner">
                      {newSectionContent ? (
                        <div className="space-y-6">
                          <div className="flex justify-between items-center border-b border-surface-container pb-4 mb-4">
                            <h3 className="font-bold text-lg text-primary flex items-center gap-2">
                              <RefreshCw className="w-5 h-5" /> Comparison View
                            </h3>
                            <div className="flex gap-2">
                              <Button variant="outline" onClick={handleRejectSection} className="text-red-500 border-red-200 hover:bg-red-50">
                                <X className="w-4 h-4 mr-2" /> Reject
                              </Button>
                              <Button onClick={() => handleAcceptSection(idx)} className="bg-green-500 hover:bg-green-600 text-white">
                                <Check className="w-4 h-4 mr-2" /> Accept
                              </Button>
                            </div>
                          </div>
                          
                          <div className="grid md:grid-cols-2 gap-8">
                            <div>
                              <div className="inline-block px-3 py-1 bg-surface-container rounded-full text-xs font-bold text-on-surface-variant mb-4 uppercase tracking-wider">Current Content</div>
                              <div className="text-sm text-on-surface-variant leading-relaxed opacity-70">
                                <ReactMarkdown 
                                  remarkPlugins={[remarkGfm]}
                                  components={{
                                    table: ({node, ...props}) => <div className="overflow-x-auto my-4"><table className="w-full border-collapse" {...props} /></div>,
                                    th: ({node, ...props}) => <th className="border border-outline-variant bg-surface-container-low p-2 text-left font-bold text-xs" {...props} />,
                                    td: ({node, ...props}) => <td className="border border-outline-variant p-2 text-xs" {...props} />,
                                    p: ({node, ...props}) => <p className="mb-2 whitespace-pre-wrap" {...props} />,
                                    ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-2 space-y-1" {...props} />,
                                    ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-2 space-y-1" {...props} />,
                                  }}
                                >
                                  {section.content}
                                </ReactMarkdown>
                              </div>
                            </div>
                            <div>
                              <div className="inline-block px-3 py-1 bg-primary/10 rounded-full text-xs font-bold text-primary mb-4 uppercase tracking-wider">New Content</div>
                              <div className="text-sm text-on-surface leading-relaxed">
                                <ReactMarkdown 
                                  remarkPlugins={[remarkGfm]}
                                  components={{
                                    table: ({node, ...props}) => <div className="overflow-x-auto my-4"><table className="w-full border-collapse" {...props} /></div>,
                                    th: ({node, ...props}) => <th className="border border-outline-variant bg-surface-container-low p-2 text-left font-bold text-xs" {...props} />,
                                    td: ({node, ...props}) => <td className="border border-outline-variant p-2 text-xs" {...props} />,
                                    p: ({node, ...props}) => <p className="mb-2 whitespace-pre-wrap" {...props} />,
                                    ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-2 space-y-1" {...props} />,
                                    ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-2 space-y-1" {...props} />,
                                  }}
                                >
                                  {newSectionContent}
                                </ReactMarkdown>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-on-surface-variant">
                          <RefreshCw className="w-8 h-8 animate-spin text-primary mb-4" />
                          <p className="font-bold">Regenerating {section.title}...</p>
                          <p className="text-sm mt-2 opacity-70">Using AI to analyze project context and improve content</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-lg text-on-surface-variant leading-relaxed max-w-4xl">
                       <ReactMarkdown 
                         remarkPlugins={[remarkGfm]}
                         components={{
                           table: ({node, ...props}) => <div className="overflow-x-auto my-6"><table className="w-full border-collapse" {...props} /></div>,
                           th: ({node, ...props}) => <th className="border border-outline-variant bg-surface-container-low p-4 text-left font-bold text-sm tracking-wide text-on-surface" {...props} />,
                           td: ({node, ...props}) => <td className="border border-outline-variant p-4 text-sm align-top" {...props} />,
                           h1: ({node, ...props}) => <h1 className="text-3xl font-bold mt-8 mb-4 text-on-background" {...props} />,
                           h2: ({node, ...props}) => <h2 className="text-2xl font-bold mt-8 mb-4 text-on-background" {...props} />,
                           h3: ({node, ...props}) => <h3 className="text-xl font-bold mt-6 mb-3 text-on-background" {...props} />,
                           h4: ({node, ...props}) => <h4 className="text-lg font-bold mt-4 mb-2 text-on-background" {...props} />,
                           p: ({node, ...props}) => <p className="mb-4 whitespace-pre-wrap" {...props} />,
                           ul: ({node, ...props}) => <ul className="list-disc pl-8 mb-4 space-y-1" {...props} />,
                           ol: ({node, ...props}) => <ol className="list-decimal pl-8 mb-4 space-y-1" {...props} />,
                           strong: ({node, ...props}) => <strong className="font-bold text-on-background" {...props} />,
                           blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-primary/50 pl-4 italic text-on-surface-variant my-4" {...props} />,
                         }}
                       >
                         {section.content}
                       </ReactMarkdown>
                    </div>
                  )}
                </section>
              ))}

              {frd.content.modules && frd.content.modules.length > 0 && (
                <section className="space-y-12">
                   <h2 className="text-3xl font-black tracking-tight flex items-center gap-6">
                    <span className="text-primary font-black opacity-20 text-xl">0{frd.content.sections?.length ? frd.content.sections.length + 1 : 1}</span>
                    System Modules
                  </h2>
                  <div className="grid grid-cols-1 gap-6">
                    {frd.content.modules.map((mod, mIdx) => (
                       <div key={mIdx} className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-10 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 group overflow-hidden relative">
                          <div className="absolute top-0 right-0 p-8 text-8xl font-black opacity-5 text-primary group-hover:scale-110 group-hover:-translate-y-4 group-hover:opacity-10 transition-all duration-500">
                             0{mIdx + 1}
                          </div>
                          <div className="relative z-10">
                            <h3 className="text-3xl font-black mb-4 drop-shadow-sm">{mod.name}</h3>
                            <p className="text-on-surface-variant text-base leading-relaxed mb-10 max-w-2xl">{mod.description}</p>
                            
                            {mod.sub_modules && mod.sub_modules.length > 0 && (
                              <div className="pt-6 border-t border-surface-container/50">
                                <p className="text-[10px] font-black tracking-widest uppercase text-primary mb-4">Functional Capabilities</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  {mod.sub_modules.map((sub, sIdx) => (
                                    <div key={sIdx} className="flex gap-3 items-start">
                                       <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/40"></div>
                                       <div>
                                          <p className="font-bold text-sm text-on-background">{sub.name}</p>
                                          <p className="text-xs text-on-surface-variant">{sub.description}</p>
                                       </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                       </div>
                    ))}
                  </div>
                </section>
              )}

              {frd.content.requirements && frd.content.requirements.length > 0 && (
                <section className="space-y-10">
                   <div>
                     <h2 className="text-3xl font-black tracking-tight flex items-center gap-6">
                      <span className="text-primary font-black opacity-20 text-xl">
                        {frd.content.sections?.length ? frd.content.sections.length + 2 : (frd.content.modules ? 2 : 1)}
                      </span>
                      Functional Requirements & Developer Hints
                    </h2>
                    <p className="text-on-surface-variant text-base mt-2 max-w-3xl">
                      Every requirement below is directly derived from user discovery answers. Each requirement includes original questions and answers, technical specifications, actionable developer hints, and verifiable acceptance criteria.
                    </p>
                   </div>

                  <div className="grid grid-cols-1 gap-8">
                    {frd.content.requirements.map((req, rIdx) => {
                      const isConfirmed = req.clarificationStatus?.includes('Confirmed');
                      const isRecommendation = req.clarificationStatus?.includes('Recommendation');
                      const isClarification = req.clarificationStatus?.includes('Clarification');

                      return (
                        <div 
                          key={rIdx} 
                          className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-8 sm:p-10 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden"
                        >
                          {/* Top Badges and Title */}
                          <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-outline-variant/60">
                            <div className="flex items-center gap-3">
                              <span className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary font-mono text-sm font-black flex items-center gap-1.5">
                                <Terminal className="w-4 h-4" />
                                {req.code}
                              </span>
                              <h3 className="text-2xl font-black text-on-background tracking-tight">
                                {req.title.replace(/^FR-\d+:\s*/, '')}
                              </h3>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              {/* Clarification / Confirmation Badge */}
                              <span className={cn(
                                "px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 border",
                                isConfirmed
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                                  : isRecommendation
                                  ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800"
                                  : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                              )}>
                                {isConfirmed ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> :
                                 isRecommendation ? <Lightbulb className="w-3.5 h-3.5 text-blue-600" /> :
                                 <AlertCircle className="w-3.5 h-3.5 text-amber-600" />}
                                {req.clarificationStatus || 'Confirmed User Requirement'}
                              </span>

                              {/* Priority Badge */}
                              <span className={cn(
                                "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                                req.priority === 'High' ? "bg-red-50 text-red-600 border border-red-200 dark:bg-red-950/40 dark:text-red-300" :
                                req.priority === 'Medium' ? "bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300" :
                                "bg-green-50 text-green-600 border border-green-200 dark:bg-green-950/40 dark:text-green-300"
                              )}>
                                {req.priority || 'Medium'} Priority
                              </span>
                            </div>
                          </div>

                          {/* Source Discovery Card (Preserved Question & Answer) */}
                          <div className="mt-6 rounded-2xl bg-surface-container-low/70 p-6 border border-outline-variant/60">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-[11px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
                                <HelpCircle className="w-4 h-4" />
                                Requirement Source ({req.questionCode || 'User Q&A'})
                              </span>
                            </div>
                            <p className="text-sm font-semibold text-on-background mb-3">
                              <span className="text-on-surface-variant font-normal">Original Question: </span>
                              {req.originalQuestion || req.title}
                            </p>
                            <div className="p-3.5 rounded-xl bg-background border border-primary/20">
                              <span className="text-xs font-bold uppercase tracking-wider text-primary block mb-1">
                                User Original Answer (Preserved Verbatim)
                              </span>
                              <p className="text-base font-bold text-on-background">
                                "{req.originalAnswer || 'Specified in discovery'}"
                              </p>
                            </div>
                          </div>

                          {/* Technical Specification */}
                          <div className="mt-6">
                            <h4 className="text-xs font-black uppercase tracking-wider text-on-surface-variant/80 mb-2 flex items-center gap-1.5">
                              <Code className="w-4 h-4 text-primary" />
                              Technical Specification
                            </h4>
                            <p className="text-sm text-on-background leading-relaxed font-medium bg-surface-container-low/30 p-4 rounded-xl border border-outline-variant/40">
                              {req.technicalSpec || (req.description ? req.description.split('\n')[0] : 'System shall execute functional specification according to requirements.')}
                            </p>
                          </div>

                          {/* Dedicated Developer Implementation Hint Callout Box */}
                          <div className="mt-6 rounded-2xl bg-primary/5 border border-primary/20 p-6 relative">
                            <div className="flex items-center gap-2 mb-3">
                              <Sparkles className="w-5 h-5 text-primary" />
                              <h4 className="text-sm font-black text-primary tracking-wide uppercase">
                                Developer Implementation Hint
                              </h4>
                            </div>
                            <p className="text-sm text-on-background leading-relaxed font-normal">
                              {req.developerHint || 'Implement validation and handling logic strictly honoring the user requirements on both frontend and backend.'}
                            </p>

                            {/* Validation Rules if present */}
                            {req.validationRules && req.validationRules.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-primary/10">
                                <span className="text-xs font-black uppercase tracking-wider text-primary block mb-2">
                                  Validation Constraints & Rules:
                                </span>
                                <ul className="space-y-1.5">
                                  {req.validationRules.map((vRule, vIdx) => (
                                    <li key={vIdx} className="text-xs text-on-surface-variant flex items-start gap-2">
                                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                      <span className="font-mono">{vRule}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>

                          {/* Acceptance Criteria */}
                          {req.acceptanceCriteria && req.acceptanceCriteria.length > 0 && (
                            <div className="mt-6">
                              <h4 className="text-xs font-black uppercase tracking-wider text-on-surface-variant/80 mb-3 flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                Acceptance Criteria & Quality Checklist
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                {req.acceptanceCriteria.map((criterion, aIdx) => (
                                  <div key={aIdx} className="flex items-start gap-2.5 p-3 rounded-xl bg-surface-container-low/40 border border-outline-variant/40">
                                    <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                                    <span className="text-xs font-medium text-on-background leading-snug">{criterion}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Section: Requirement Traceability Matrix (RTM) */}
              {frd.content.traceabilityMatrix && frd.content.traceabilityMatrix.length > 0 && (
                <section className="space-y-8 mt-16">
                  <div>
                    <h2 className="text-3xl font-black tracking-tight flex items-center gap-6">
                      <span className="text-primary font-black opacity-20 text-xl">
                        <Table className="w-6 h-6 inline-block text-primary" />
                      </span>
                      Requirement Traceability Matrix (RTM)
                    </h2>
                    <p className="text-on-surface-variant text-base mt-2 max-w-3xl">
                      Complete end-to-end traceability linking original user discovery questions to generated functional requirements, technical developer hints, and test acceptance criteria.
                    </p>
                  </div>

                  <div className="border border-outline-variant rounded-3xl overflow-hidden bg-surface-container-lowest shadow-xl shadow-primary/5">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left text-sm">
                        <thead>
                          <tr className="bg-surface-container-low/70 border-b border-outline-variant">
                            <th className="p-4 text-[11px] font-black uppercase tracking-[0.2em] text-on-surface-variant/80 whitespace-nowrap">Req ID</th>
                            <th className="p-4 text-[11px] font-black uppercase tracking-[0.2em] text-on-surface-variant/80 whitespace-nowrap">Question Ref</th>
                            <th className="p-4 text-[11px] font-black uppercase tracking-[0.2em] text-on-surface-variant/80 min-w-[200px]">User Question</th>
                            <th className="p-4 text-[11px] font-black uppercase tracking-[0.2em] text-on-surface-variant/80 min-w-[150px]">Original User Answer</th>
                            <th className="p-4 text-[11px] font-black uppercase tracking-[0.2em] text-on-surface-variant/80 min-w-[260px]">Developer Hint</th>
                            <th className="p-4 text-[11px] font-black uppercase tracking-[0.2em] text-on-surface-variant/80 min-w-[200px]">Acceptance Criteria</th>
                            <th className="p-4 text-[11px] font-black uppercase tracking-[0.2em] text-on-surface-variant/80 whitespace-nowrap">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {frd.content.traceabilityMatrix.map((item, tIdx) => {
                            const isConfirmed = item.status?.includes('Confirmed');
                            const isRecommendation = item.status?.includes('Recommendation');

                            return (
                              <tr key={tIdx} className="border-b border-outline-variant hover:bg-primary/5 transition-colors last:border-b-0">
                                <td className="p-4 font-mono font-black text-primary whitespace-nowrap">{item.requirementId}</td>
                                <td className="p-4 font-mono text-xs text-on-surface-variant whitespace-nowrap">{item.questionId}</td>
                                <td className="p-4 text-xs font-semibold text-on-background">{item.questionText}</td>
                                <td className="p-4 text-xs font-bold text-primary bg-primary/5 rounded-lg">{item.userAnswer}</td>
                                <td className="p-4 text-xs text-on-surface-variant leading-relaxed">{item.developerHint}</td>
                                <td className="p-4 text-xs text-on-surface-variant leading-relaxed">{item.acceptanceCriteria}</td>
                                <td className="p-4 whitespace-nowrap">
                                  <span className={cn(
                                    "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 border",
                                    isConfirmed
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
                                      : isRecommendation
                                      ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300"
                                      : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300"
                                  )}>
                                    {item.status}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </section>
              )}
           </div>

           <div className="mt-40 pt-16 border-t border-surface-container flex flex-col items-center gap-6 print:hidden">
              <p className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-[0.4em]">Engineered with Speco Intelligence</p>
              <div className="flex gap-4">
                 <button 
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="w-12 h-12 rounded-full border border-surface-container flex items-center justify-center text-on-surface-variant hover:bg-primary hover:text-white hover:border-primary transition-all shadow-sm"
                 >
                   <span className="material-symbols-outlined">arrow_upward</span>
                 </button>
              </div>
           </div>
        </div>
      </main>
    </div>
  );
}
