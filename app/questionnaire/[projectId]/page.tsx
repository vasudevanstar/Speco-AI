'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Loader2, ChevronLeft, ChevronRight, Check, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

interface OptionItem {
  value: string;
  label: string;
  description?: string;
  isActive?: boolean;
}

interface Module {
  id: string;
  name: string;
  description: string;
  status?: 'pending' | 'in_progress' | 'completed';
  Questions: Question[];
}

interface Question {
  id: string;
  moduleId: string;
  question: string;
  description: string;
  type: string;
  options: OptionItem[];
  required: boolean;
  order: number;
  isActive: boolean;
  isSkippable: boolean;
  allowMultiple: boolean | null;
  allowOther: boolean;
  respondentPrompt?: string | null;
  showRespondentPrompt?: boolean;
  Answer?: {
    answer: string;
  };
}

function hasMeaningfulAnswer(raw: string | undefined): boolean {
  if (raw === undefined || raw === null) return false;
  const s = String(raw).trim();
  if (!s) return false;
  if (s.includes('||')) return s.split('||').some((p) => p.trim() !== '');
  return true;
}

function isMultipleChoice(q: Question): boolean {
  return q.type === 'multiple' || q.allowMultiple === true;
}

export default function QuestionnairePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = params.projectId as string;
  const targetModuleId = searchParams.get('moduleId');
  
  const [modules, setModules] = useState<Module[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [recommendations, setRecommendations] = useState<Record<string, string[]>>({});
  const [loadingRecommendations, setLoadingRecommendations] = useState<Record<string, boolean>>({});
  const [refiningTexts, setRefiningTexts] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (projectId) {
      loadQuestions();
    }
  }, [projectId]);

  const loadQuestions = async () => {
    try {
      const response = await api.get(`/questionnaire/${projectId}`);
      const data = response.data?.data || [];
      
      if (data.length === 0 || data.every((mod: any) => !mod.Questions || mod.Questions.length === 0)) {
        // No questions generated yet
        setModules([]);
        setLoading(false);
        return;
      }
      
      const answersPayload = response.data?.answers || [];
      const answersByQuestionId: Record<string, string> = {};
      
      const qMap = new Map();
      data.forEach((m: any) => {
        (m.Questions || []).forEach((q: any) => {
          qMap.set(q.id, q);
        });
      });

      const choiceTypes = ['single', 'multiple', 'select', 'yesno'];

      (answersPayload as any[]).forEach((a: any) => {
        if (!a?.questionId) return;
        const q = qMap.get(a.questionId);
        let opts = a.selectedOptions;
        if (typeof opts === 'string') {
          try {
            opts = JSON.parse(opts);
          } catch(e) {}
        }
        
        const isChoice = q && choiceTypes.includes(q.type) && (q.options?.length ?? 0) > 0;

        if (isChoice) {
          if (Array.isArray(opts) && opts.length > 0) {
            answersByQuestionId[a.questionId] = opts.join('||');
          }
          if (a.textValue != null && String(a.textValue).trim() !== '') {
            let extraText = String(a.textValue);
            if (answersByQuestionId[a.questionId] && answersByQuestionId[a.questionId].includes('__other__')) {
              // Extract the other text and extra text if possible, but for simplicity, the _other text was saved inside finalValue.
              // Wait, the previous logic replaced '__other__' with the otherText in finalValue. But that was a mistake, because it merged the two concepts in textValue. 
              // Wait, no. If 'allowOther' uses the same textValue, they will conflict.
              // We should just read textValue to _extra.
            }
            answersByQuestionId[`${a.questionId}_extra`] = extraText;
          }
        } else {
          if (a.textValue != null && String(a.textValue).trim() !== '') {
            answersByQuestionId[a.questionId] = String(a.textValue);
          } else if (a.numericValue != null) {
            answersByQuestionId[a.questionId] = String(a.numericValue);
          }
        }
      });

      const sanitizedModules = data
        .map((mod: any) => ({
          ...mod,
          Questions: (mod.Questions || [])
            .filter((q: any) => q.isActive !== false)
            .map((q: any) => {
              let options = q.options;
              if (typeof options === 'string') {
                try {
                  options = JSON.parse(options);
                } catch (e) {
                  options = [];
                }
              }
              if (!Array.isArray(options)) {
                options = [];
              }
              const normalizedOptions: OptionItem[] = options
                .map((opt: any) => {
                  if (typeof opt === 'string') {
                    return { value: opt, label: opt, isActive: true };
                  }
                  return {
                    value: opt.value || opt.label || '',
                    label: opt.label || opt.value || '',
                    description: opt.description,
                    isActive: opt.isActive === false ? false : true,
                  };
                })
                .filter((opt: OptionItem) => opt.isActive !== false);

              if (q.allowOther) {
                normalizedOptions.push({
                  value: '__other__',
                  label: 'Other (please specify)',
                  isActive: true,
                });
              }

              return {
                ...q,
                options: normalizedOptions,
                respondentPrompt: q.respondentPrompt ?? null,
                showRespondentPrompt: q.showRespondentPrompt === true,
              };
            }),
        }))
        .filter((mod: Module) => (mod.Questions || []).length > 0);

      setModules(sanitizedModules);
      setAnswers(answersByQuestionId);

      if (targetModuleId) {
        const foundIndex = sanitizedModules.findIndex((m: Module) => m.id === targetModuleId);
        if (foundIndex !== -1) {
          setCurrentModuleIndex(foundIndex);
          const moduleQuestions = sanitizedModules[foundIndex].Questions || [];
          const firstUnansweredIndex = moduleQuestions.findIndex((q: Question) => !hasMeaningfulAnswer(answersByQuestionId[q.id]));
          if (firstUnansweredIndex !== -1) {
            setCurrentQuestionIndex(firstUnansweredIndex);
          }
        }
      } else {
        const firstIncompleteModuleIndex = sanitizedModules.findIndex((m: Module) => {
          if (m.status === 'completed') return false;
          const requiredQuestions = (m.Questions || []).filter((q: Question) => q.required !== false);
          if (requiredQuestions.length === 0) {
            return !(m.Questions || []).some((q: Question) => hasMeaningfulAnswer(answersByQuestionId[q.id]));
          }
          return !requiredQuestions.every((q: Question) => hasMeaningfulAnswer(answersByQuestionId[q.id]));
        });

        if (firstIncompleteModuleIndex !== -1) {
          setCurrentModuleIndex(firstIncompleteModuleIndex);
          const moduleQuestions = sanitizedModules[firstIncompleteModuleIndex].Questions || [];
          const firstUnansweredIndex = moduleQuestions.findIndex((q: Question) => !hasMeaningfulAnswer(answersByQuestionId[q.id]));
          if (firstUnansweredIndex !== -1) {
            setCurrentQuestionIndex(firstUnansweredIndex);
          }
        }
      }
    } catch (error: any) {
      console.error('Failed to load questions:', error);
      if (error.message?.includes('Network') || error.code === 'ERR_NETWORK' || !error.response) {
        setNetworkError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  const fetchRecommendations = async (questionId: string) => {
    if (!projectId) return;
    
    // Clear the previous recommendations if we are regenerating
    setRecommendations(prev => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });

    setLoadingRecommendations(prev => ({ ...prev, [questionId]: true }));
    try {
      const res = await api.post(`/questionnaire/${projectId}/recommendations`, { questionId });
      if (res.data?.recommendations) {
        setRecommendations(prev => ({ ...prev, [questionId]: res.data.recommendations }));
      }
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    } finally {
      setLoadingRecommendations(prev => ({ ...prev, [questionId]: false }));
    }
  };

  const findQuestion = (questionId: string): Question | undefined => {
    for (const m of modules) {
      const q = m.Questions?.find((x) => x.id === questionId);
      if (q) return q;
    }
    return undefined;
  };

  const handleToggleMultiOption = (questionId: string, optionValue: string, checked: boolean) => {
    const raw = answers[questionId] || '';
    const set = new Set(raw.split('||').filter(Boolean));
    if (checked) set.add(optionValue);
    else set.delete(optionValue);
    handleAnswerChange(questionId, Array.from(set).join('||'));
  };

  const saveAnswers = async (action: 'next' | 'exit' | 'back' = 'next') => {
    setSaving(true);
    try {
      const choiceTypes = ['single', 'multiple', 'select', 'yesno'];
      const formattedAnswers = Object.entries(answers).map(([questionId, value]) => {
        if (questionId.endsWith('_other') || questionId.endsWith('_extra')) return null;

        const q = findQuestion(questionId);
        let finalValue = value;
        
        const isChoice =
          q && choiceTypes.includes(q.type) && (q.options?.length ?? 0) > 0;

        if (isChoice) {
          const parts = finalValue.split('||').filter(Boolean);
          const otherText = answers[`${questionId}_other`];
          // If "__other__" is checked, we replace it with the custom otherText in the selectedOptions if we wanted, 
          // but to keep it simple, let's keep "__other__" in selectedOptions and we can store otherText in textValue.
          // Wait, we have BOTH _extra and _other. We can combine them into textValue separated by a delimiter, or just save them.
          // Let's just save _extra + _other into textValue.
          
          let combinedText = [];
          if (parts.includes('__other__') && otherText) {
             combinedText.push(`Other: ${otherText}`);
          }
          if (answers[`${questionId}_extra`]) {
             combinedText.push(answers[`${questionId}_extra`]);
          }

          return {
            questionId,
            selectedOptions: parts,
            textValue: combinedText.length > 0 ? combinedText.join('\n\n') : null,
          };
        }

        return {
          questionId,
          selectedOptions: [] as string[],
          textValue: finalValue,
        };
      }).filter(Boolean);
      
      await api.post(`/questionnaire/${projectId}/save-answers`, { answers: formattedAnswers });
      if (action === 'exit') {
        router.push(`/projects/${projectId}`);
      } else if (action === 'back') {
        handleBack();
      } else {
        handleNext();
      }
    } catch (error) {
      console.error('Failed to save answers:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleNext = () => {
    const currentModule = modules[currentModuleIndex];
    if (currentQuestionIndex < currentModule.Questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else if (currentModuleIndex < modules.length - 1) {
      setCurrentModuleIndex(currentModuleIndex + 1);
      setCurrentQuestionIndex(0);
    } else {
      router.push(`/projects/${projectId}`);
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else if (currentModuleIndex > 0) {
      const prevIdx = currentModuleIndex - 1;
      setCurrentModuleIndex(prevIdx);
      setCurrentQuestionIndex(modules[prevIdx].Questions.length - 1);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (networkError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
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

  const currentModule = modules[currentModuleIndex];
  const allActiveQuestions = modules.flatMap(m => (m.Questions || []));
  const currentQuestion = currentModule?.Questions?.[currentQuestionIndex];
  
  if (!currentQuestion || modules.length === 0 || allActiveQuestions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full rounded-[2rem] p-8 text-center">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-3xl">quiz</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">No Questions Yet</h2>
          <p className="text-on-surface-variant mb-8">
            No questionnaire has been generated for this project yet. Please generate modules first and then create the questionnaire.
          </p>
          <Button onClick={() => router.push(`/projects/${projectId}`)} className="w-full bg-primary text-white rounded-xl h-12">
            Back to Project
          </Button>
        </div>
      </div>
    );
  }

  const isModuleComplete = (m: Module) => {
    if (m.status === 'completed') return true;
    const requiredQuestions = (m.Questions || []).filter(q => q.required !== false);
    if (requiredQuestions.length === 0) {
      return (m.Questions || []).some(q => hasMeaningfulAnswer(answers[q.id]));
    }
    return requiredQuestions.every(q => hasMeaningfulAnswer(answers[q.id]));
  };

  const completedModulesCount = modules.filter(isModuleComplete).length;

  const overallProgress = modules.length === 0 ? 0 : Math.round((completedModulesCount / modules.length) * 100);

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <Sidebar projectId={projectId} />
      <MobileNav />
      
      <main className="md:ml-64 min-h-screen flex relative">
        {/* Floating Toggle for Collapsed State */}
        {isSidebarCollapsed && (
          <button 
            onClick={() => setIsSidebarCollapsed(false)}
            className="fixed top-8 left-[calc(16rem+1.5rem)] z-50 w-10 h-10 bg-white border border-surface-container shadow-lg rounded-full flex items-center justify-center text-primary transform -translate-x-1/2 hover:scale-110 active:scale-95 transition-all animate-fade-in"
          >
            <span className="material-symbols-outlined">menu_open</span>
          </button>
        )}

        {/* Left Nav Pane */}
        <div className={cn(
          "hidden lg:flex bg-surface-container-low border-r border-surface-container flex-col overflow-hidden transition-all duration-500 ease-in-out relative group",
          isSidebarCollapsed ? "w-0 p-0 opacity-0" : "w-80 p-6 opacity-100"
        )}>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold px-2 whitespace-nowrap">Engineering Survey</h2>
            <button 
              onClick={() => setIsSidebarCollapsed(true)}
              className="w-8 h-8 rounded-lg hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant transition-colors"
            >
              <span className="material-symbols-outlined text-xl">keyboard_double_arrow_left</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-6 pr-2 min-w-[280px]">
            {modules.map((mod, mIdx) => (
              <div key={mod.id} className="space-y-3">
                <div className="flex items-center gap-3 px-2">
                   <div className={cn(
                    "w-2 h-2 rounded-full",
                    isModuleComplete(mod) && mIdx !== currentModuleIndex ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" :
                    mIdx === currentModuleIndex ? "bg-primary animate-pulse" : "bg-outline-variant"
                  )}></div>
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest",
                    mIdx === currentModuleIndex ? "text-primary" : "text-on-surface-variant opacity-60"
                  )}>
                    {mod.name}
                  </span>
                  {isModuleComplete(mod) && mIdx !== currentModuleIndex && <Check className="w-3 h-3 text-green-500" />}
                </div>
                {mIdx === currentModuleIndex && (
                  <div className="pl-5 space-y-1">
                    {mod.Questions.map((q, qIdx) => (
                      <button
                        key={q.id}
                        onClick={() => setCurrentQuestionIndex(qIdx)}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-lg text-[11px] font-bold transition-all",
                          qIdx === currentQuestionIndex 
                            ? "bg-white text-primary shadow-sm translate-x-1" 
                            : "text-on-surface-variant/60 hover:bg-on-surface/50"
                        )}
                      >
                        Requirement 0{qIdx + 1}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-auto pt-6 min-w-[280px]">
            <div className="bg-primary-fixed rounded-xl p-5 border border-primary/5">
              <span className="material-symbols-outlined text-primary mb-2">auto_awesome</span>
              <p className="text-[10px] font-bold text-on-primary-fixed-variant leading-relaxed">
                Speco is analyzing your answers in real-time to generate your architecture.
              </p>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col p-6 sm:p-10 lg:p-14 animate-fade-in relative overflow-y-auto">
          <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
            {/* Top Progress Banner */}
            <div className="mb-10 p-6 bg-surface-container-low rounded-2xl border border-surface-container/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">
                    Survey Progress
                  </span>
                  <span className="text-xs font-black text-primary">
                    {completedModulesCount} / {modules.length} Modules Completed
                  </span>
                </div>
                <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(53,37,205,0.3)]" 
                    style={{ width: `${overallProgress}%` }}
                  ></div>
                </div>
              </div>

              {/* Recent Answers Chips */}
              {Object.keys(answers).length > 0 && (
                <div className="flex flex-col gap-2 min-w-[200px]">
                  <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-40 px-1">
                    Recent Answers
                  </span>
                  <div className="flex gap-2">
                    {Object.entries(answers).slice(-2).map(([id, val], i) => (
                      <div key={i} className="px-3 py-1.5 bg-surface-container-lowest rounded-lg border border-surface-container shadow-sm flex items-center gap-2 animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <span className="text-[10px] font-bold text-on-surface truncate max-w-[80px]">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mb-10">
              <div className="inline-block bg-primary-fixed text-on-primary-fixed-variant px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4">
                {currentModule.name}
              </div>
              <h1 className="text-4xl font-bold tracking-tight mb-4">Technical Specification</h1>
              <p className="text-on-surface-variant text-lg leading-relaxed">{currentModule.description}</p>
            </div>

            <div className="bg-surface-container-lowest rounded-2xl p-10 sm:p-14 shadow-sm relative overflow-hidden group">
               <div className="flex justify-between items-center mb-10">
                 <span className="text-xs font-bold text-primary tracking-widest uppercase">
                   Question 0{currentQuestionIndex + 1} of 0{currentModule.Questions.length}
                 </span>
                 <div className="flex gap-1">
                    {[...Array(currentModule.Questions.length)].map((_, i) => (
                      <div key={i} className={cn(
                        "w-6 h-1 rounded-full transition-all",
                        i === currentQuestionIndex ? "bg-primary w-10 shadow-[0_0_8px_rgba(53,37,205,0.3)]" : 
                        i < currentQuestionIndex ? "bg-green-500" : "bg-outline-variant"
                      )}></div>
                    ))}
                 </div>
               </div>

               <div className="flex flex-wrap items-center gap-2 mb-4">
                 <h3 className="text-2xl font-bold text-on-background leading-snug flex-1 min-w-[200px]">
                   {currentQuestion.question}
                 </h3>
                 {isMultipleChoice(currentQuestion) && currentQuestion.options.length > 0 && (
                   <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200 border-0 text-[10px] font-bold uppercase tracking-wide">
                     Multiple choice
                   </Badge>
                 )}
               </div>

               {currentQuestion.showRespondentPrompt &&
                 currentQuestion.respondentPrompt &&
                 String(currentQuestion.respondentPrompt).trim() !== '' && (
                   <div className="mb-8 p-4 rounded-xl bg-primary/5 border border-primary/15 text-sm text-on-surface leading-relaxed">
                     {currentQuestion.respondentPrompt}
                   </div>
                 )}

               <div className="space-y-4 mb-12">
                  {currentQuestion.options &&
                    currentQuestion.options.length > 0 &&
                    isMultipleChoice(currentQuestion) &&
                    currentQuestion.options.map((option: OptionItem, oIdx) => {
                      const selected = (answers[currentQuestion.id] || '')
                        .split('||')
                        .filter(Boolean)
                        .includes(option.value);
                      return (
                        <div
                          key={oIdx}
                          role="button"
                          tabIndex={0}
                          onClick={() =>
                            handleToggleMultiOption(currentQuestion.id, option.value, !selected)
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleToggleMultiOption(currentQuestion.id, option.value, !selected);
                            }
                          }}
                          className={cn(
                            'p-6 rounded-xl border-2 transition-all cursor-pointer flex justify-between items-center group/opt',
                            selected
                              ? 'bg-surface-container-lowest border-primary shadow-lg translate-y-[-2px]'
                              : 'bg-surface-container-low border-transparent hover:border-primary/20 hover:bg-surface-container-lowest'
                          )}
                        >
                          <div className="flex items-center gap-4">
                            <Checkbox
                              checked={selected}
                              id={`${currentQuestion.id}-${option.value}`}
                              className="h-5 w-5"
                              onClick={(e) => e.stopPropagation()}
                              onCheckedChange={(c) =>
                                handleToggleMultiOption(
                                  currentQuestion.id,
                                  option.value,
                                  c === true
                                )
                              }
                            />
                            <Label
                              htmlFor={`${currentQuestion.id}-${option.value}`}
                              className="font-bold cursor-pointer text-on-background"
                            >
                              {option.label}
                            </Label>
                          </div>
                        </div>
                      );
                    })}

                  {currentQuestion.options &&
                    currentQuestion.options.length > 0 &&
                    !isMultipleChoice(currentQuestion) &&
                    currentQuestion.options.map((option: OptionItem, oIdx) => (
                      <div
                        key={oIdx}
                        onClick={() => handleAnswerChange(currentQuestion.id, option.value)}
                        className={cn(
                          'p-6 rounded-xl border-2 transition-all cursor-pointer flex justify-between items-center group/opt',
                          answers[currentQuestion.id] === option.value
                            ? 'bg-surface-container-lowest border-primary shadow-lg translate-y-[-2px]'
                            : 'bg-surface-container-low border-transparent hover:border-primary/20 hover:bg-surface-container-lowest'
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={cn(
                              'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
                              answers[currentQuestion.id] === option.value
                                ? 'bg-primary border-primary'
                                : 'bg-surface-container-lowest border-outline-variant group-hover/opt:border-primary/50'
                            )}
                          >
                            {answers[currentQuestion.id] === option.value && (
                              <div className="w-2 h-2 rounded-full bg-surface-container-lowest"></div>
                            )}
                          </div>
                          <span
                            className={cn(
                              'font-bold transition-all',
                              answers[currentQuestion.id] === option.value
                                ? 'text-on-background'
                                : 'text-on-surface-variant group-hover/opt:text-on-background'
                            )}
                          >
                            {option.label}
                          </span>
                        </div>
                      </div>
                    ))}

                  {currentQuestion.allowOther &&
                    (answers[currentQuestion.id] || '').includes('__other__') && (
                      <div className="mt-4 p-6 rounded-xl bg-surface-container-low border border-primary/20 animate-in fade-in slide-in-from-top-2">
                        <Label className="text-sm font-bold text-on-background mb-3 block">
                          Please specify your custom answer:
                        </Label>
                        <Input
                          value={answers[`${currentQuestion.id}_other`] || ''}
                          onChange={(e) => handleAnswerChange(`${currentQuestion.id}_other`, e.target.value)}
                          placeholder="Type your answer here..."
                          className="bg-surface-container-lowest border-outline-variant focus:border-primary focus:ring-primary transition-all text-on-background font-medium h-12"
                        />
                      </div>
                    )}

                  {currentQuestion.options && currentQuestion.options.length > 0 && (
                    <div className="mt-4 p-6 rounded-xl bg-surface-container-low border border-transparent transition-all">
                      <div className="flex justify-between items-center mb-3">
                        <Label className="text-sm font-bold text-on-background block">
                          Define your extra requirements (Optional)
                        </Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-[11px] font-bold text-primary hover:bg-primary/10 px-2"
                          disabled={refiningTexts[`${currentQuestion.id}_extra`]}
                          onClick={async () => {
                            const val = answers[`${currentQuestion.id}_extra`];
                            if (!val) return;
                            setRefiningTexts(prev => ({ ...prev, [`${currentQuestion.id}_extra`]: true }));
                            try {
                              const res = await api.post('/ai/refine', { text: val });
                              if (res.data?.refinedText) {
                                handleAnswerChange(`${currentQuestion.id}_extra`, res.data.refinedText);
                              }
                            } catch (e) {
                              console.error(e);
                            } finally {
                              setRefiningTexts(prev => ({ ...prev, [`${currentQuestion.id}_extra`]: false }));
                            }
                          }}
                        >
                          {refiningTexts[`${currentQuestion.id}_extra`] ? (
                            <><span className="animate-spin mr-1">⌛</span> Refining...</>
                          ) : '✨ Refine text'}
                        </Button>
                      </div>
                      <textarea
                        value={answers[`${currentQuestion.id}_extra`] || ''}
                        onChange={(e) => handleAnswerChange(`${currentQuestion.id}_extra`, e.target.value)}
                        placeholder="Tell us any extra features or requirements you need..."
                        className="w-full min-h-[100px] p-4 rounded-xl bg-surface-container-lowest border-outline-variant focus:border-primary focus:ring-primary transition-all text-on-background font-medium outline-none"
                      />
                      <div className="mt-2">
                        {!recommendations[currentQuestion.id] && !loadingRecommendations[currentQuestion.id] && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-primary hover:bg-primary/5 h-8 text-xs font-bold px-2"
                            onClick={() => fetchRecommendations(currentQuestion.id)}
                          >
                            ✨ Get AI Recommendations
                          </Button>
                        )}
                        {loadingRecommendations[currentQuestion.id] && (
                          <div className="flex items-center gap-2 text-xs text-on-surface-variant px-2 py-1">
                            <Loader2 className="w-3 h-3 animate-spin text-primary" /> Generating suggestions...
                          </div>
                        )}
                        {recommendations[currentQuestion.id] && (
                          <div className="flex flex-wrap gap-2 mt-2 items-center">
                            {recommendations[currentQuestion.id].map((rec, rIdx) => (
                              <button
                                key={rIdx}
                                className="text-left text-xs bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-lg px-3 py-2 transition-all shadow-sm"
                                onClick={() => {
                                  const currentVal = answers[`${currentQuestion.id}_extra`] || '';
                                  const separator = currentVal.trim() ? '\n' : '';
                                  handleAnswerChange(`${currentQuestion.id}_extra`, currentVal + separator + rec);
                                }}
                              >
                                + {rec}
                              </button>
                            ))}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-primary hover:bg-primary/5 h-8 text-xs font-bold px-2 ml-2"
                              onClick={() => fetchRecommendations(currentQuestion.id)}
                            >
                              <RefreshCw className="w-3 h-3 mr-1" /> Regenerate
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {(currentQuestion.type === 'text' ||
                    currentQuestion.type === 'number' ||
                    !currentQuestion.options ||
                    currentQuestion.options.length === 0) && (
                    <div className="space-y-4">
                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-[11px] font-bold text-primary hover:bg-primary/10 px-2"
                          disabled={refiningTexts[currentQuestion.id]}
                          onClick={async () => {
                            const val = answers[currentQuestion.id];
                            if (!val) return;
                            setRefiningTexts(prev => ({ ...prev, [currentQuestion.id]: true }));
                            try {
                              const res = await api.post('/ai/refine', { text: val });
                              if (res.data?.refinedText) {
                                handleAnswerChange(currentQuestion.id, res.data.refinedText);
                              }
                            } catch (e) {
                              console.error(e);
                            } finally {
                              setRefiningTexts(prev => ({ ...prev, [currentQuestion.id]: false }));
                            }
                          }}
                        >
                          {refiningTexts[currentQuestion.id] ? (
                            <><span className="animate-spin mr-1">⌛</span> Refining...</>
                          ) : '✨ Refine text'}
                        </Button>
                      </div>
                      <textarea
                        className="w-full min-h-[160px] p-6 rounded-xl bg-surface-container-low border-transparent focus:bg-surface-container-lowest focus:border-primary focus:ring-primary transition-all text-on-background font-medium"
                        placeholder="Define your requirements..."
                        value={answers[currentQuestion.id] || ''}
                        onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                      />
                      <div className="mt-2">
                        {!recommendations[currentQuestion.id] && !loadingRecommendations[currentQuestion.id] && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-primary hover:bg-primary/5 h-8 text-xs font-bold px-2"
                            onClick={() => fetchRecommendations(currentQuestion.id)}
                          >
                            ✨ Get AI Recommendations
                          </Button>
                        )}
                        {loadingRecommendations[currentQuestion.id] && (
                          <div className="flex items-center gap-2 text-xs text-on-surface-variant px-2 py-1">
                            <Loader2 className="w-3 h-3 animate-spin text-primary" /> Generating suggestions...
                          </div>
                        )}
                        {recommendations[currentQuestion.id] && (
                          <div className="flex flex-wrap gap-2 mt-2 items-center">
                            {recommendations[currentQuestion.id].map((rec, rIdx) => (
                              <button
                                key={rIdx}
                                className="text-left text-xs bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-lg px-3 py-2 transition-all shadow-sm"
                                onClick={() => {
                                  const currentVal = answers[currentQuestion.id] || '';
                                  const separator = currentVal.trim() ? '\n' : '';
                                  handleAnswerChange(currentQuestion.id, currentVal + separator + rec);
                                }}
                              >
                                + {rec}
                              </button>
                            ))}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-primary hover:bg-primary/5 h-8 text-xs font-bold px-2 ml-2"
                              onClick={() => fetchRecommendations(currentQuestion.id)}
                            >
                              <RefreshCw className="w-3 h-3 mr-1" /> Regenerate
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
               </div>

               <div className="flex justify-between items-center pt-8 border-t border-surface-container">
                 <button 
                  onClick={() => saveAnswers('back')}
                  disabled={currentModuleIndex === 0 && currentQuestionIndex === 0 || saving}
                  className="px-6 py-3 rounded-xl font-bold text-on-surface-variant hover:bg-surface-container-low transition-all disabled:opacity-30 disabled:pointer-events-none flex items-center gap-2"
                 >
                   <ChevronLeft className="w-5 h-5" />
                   Back
                 </button>
                  <div className="flex gap-4">
                   <button
                     type="button"
                     onClick={() => saveAnswers('exit')}
                     className="px-6 py-3 rounded-xl font-bold text-primary hover:bg-primary/5 transition-all"
                   >
                     Save & Exit
                   </button>
                   {currentQuestion.isSkippable && (
                     <button
                       type="button"
                       onClick={handleNext}
                       className="px-6 py-3 rounded-xl font-bold text-on-surface-variant hover:bg-surface-container-low transition-all"
                     >
                       Skip question
                     </button>
                   )}
                   <Button 
                    onClick={() => saveAnswers('next')}
                    disabled={
                      saving ||
                      (currentQuestion.required &&
                        !hasMeaningfulAnswer(answers[currentQuestion.id]))
                    }
                    className="h-14 px-10 bg-primary text-white rounded-xl font-black text-lg shadow-xl shadow-primary hover:translate-y-[-2px] active:scale-95 transition-all flex items-center gap-2"
                   >
                     {saving ? (
                       <Loader2 className="w-5 h-5 animate-spin" />
                     ) : (
                       <>
                         Next Requirement
                         <ChevronRight className="w-5 h-5" />
                       </>
                     )}
                   </Button>
                 </div>
               </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
