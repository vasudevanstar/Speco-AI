'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, ChevronLeft, Save, Plus, Trash2, ChevronDown } from 'lucide-react';
import { api } from '@/lib/api';
import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';
import { cn } from '@/lib/utils';

interface OptionItem {
  value: string;
  label: string;
  description?: string;
  isActive?: boolean;
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
}

interface Module {
  id: string;
  name: string;
  description: string;
  Questions: Question[];
}

interface QuestionConfig {
  questionId: string;
  isActive: boolean;
  isSkippable: boolean;
  allowMultiple: boolean | null;
  allowOther: boolean;
  options?: OptionItem[];
  respondentPrompt: string;
  showRespondentPrompt: boolean;
}

const CHOICE_TYPES = ['single', 'multiple', 'select', 'yesno'];

function normalizeOptions(raw: any[]): OptionItem[] {
  return raw.map((opt: any) => {
    if (typeof opt === 'string') {
      return { value: opt, label: opt, isActive: true };
    }
    return {
      value: opt.value || opt.label || '',
      label: opt.label || opt.value || '',
      description: opt.description,
      isActive: opt.isActive === false ? false : true,
    };
  });
}

export default function ConfigureQuestionsPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;

  const [modules, setModules] = useState<Module[]>([]);
  const [configs, setConfigs] = useState<Record<string, QuestionConfig>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (projectId) {
      loadQuestions();
    }
  }, [projectId]);

  const loadQuestions = async () => {
    try {
      const response = await api.get(`/questionnaire/${projectId}`);
      const data = response.data?.data || [];

      const sanitizedModules = data.map((mod: any) => ({
        ...mod,
        Questions: (mod.Questions || []).map((q: any) => {
          let options = q.options;
          if (typeof options === 'string') {
            try {
              options = JSON.parse(options);
            } catch (e) {
              options = [];
            }
          }
          if (!Array.isArray(options)) options = [];
          return {
            ...q,
            options: normalizeOptions(options),
            respondentPrompt: q.respondentPrompt ?? '',
            showRespondentPrompt: q.showRespondentPrompt === true,
          };
        }),
      }));

      setModules(sanitizedModules);

      const initialConfigs: Record<string, QuestionConfig> = {};
      sanitizedModules.forEach((mod: Module) => {
        mod.Questions.forEach((q: Question) => {
          initialConfigs[q.id] = {
            questionId: q.id,
            isActive: q.isActive !== false,
            isSkippable: q.isSkippable !== false,
            allowMultiple: q.allowMultiple ?? null,
            allowOther: q.allowOther === true,
            options: [...(q.options || [])],
            respondentPrompt: (q.respondentPrompt as string) || '',
            showRespondentPrompt: q.showRespondentPrompt === true,
          };
        });
      });
      setConfigs(initialConfigs);
    } catch (error) {
      console.error('Failed to load questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = (questionId: string, field: keyof QuestionConfig, value: any) => {
    setConfigs((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], [field]: value },
    }));
  };

  const toggleQuestionExpanded = (questionId: string) => {
    setExpandedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  };

  const updateOption = (questionId: string, index: number, field: keyof OptionItem, value: string) => {
    setConfigs((prev) => {
      const config = prev[questionId];
      if (!config?.options) return prev;
      const newOptions = [...config.options];
      newOptions[index] = { ...newOptions[index], [field]: value };
      if (field === 'label' && !newOptions[index].value) {
        newOptions[index].value = value
          .toLowerCase()
          .replace(/\s+/g, '_')
          .replace(/[^a-z0-9_]/g, '');
      }
      return { ...prev, [questionId]: { ...config, options: newOptions } };
    });
  };

  const setOptionActive = (questionId: string, index: number, active: boolean) => {
    setConfigs((prev) => {
      const config = prev[questionId];
      if (!config?.options) return prev;
      const newOptions = [...config.options];
      newOptions[index] = { ...newOptions[index], isActive: active };
      return { ...prev, [questionId]: { ...config, options: newOptions } };
    });
  };

  const addOption = (questionId: string) => {
    setConfigs((prev) => {
      const config = prev[questionId];
      if (!config) return prev;
      const newOptions = [...(config.options || [])];
      newOptions.push({
        value: `opt_${Date.now()}`,
        label: '',
        description: '',
        isActive: true,
      });
      return { ...prev, [questionId]: { ...config, options: newOptions } };
    });
  };

  const removeOption = (questionId: string, index: number) => {
    setConfigs((prev) => {
      const config = prev[questionId];
      if (!config?.options) return prev;
      const newOptions = config.options.filter((_, i) => i !== index);
      return { ...prev, [questionId]: { ...config, options: newOptions } };
    });
  };

  const toggleAllInModule = (moduleId: string, field: 'isActive' | 'isSkippable' | 'allowOther', value: boolean) => {
    const module = modules.find((m) => m.id === moduleId);
    if (!module) return;
    setConfigs((prev) => {
      const updated = { ...prev };
      module.Questions.forEach((q) => {
        updated[q.id] = { ...updated[q.id], [field]: value };
      });
      return updated;
    });
  };

  const isMultipleChoice = (q: Question, config: QuestionConfig) =>
    q.type === 'multiple' || (CHOICE_TYPES.includes(q.type) && config.allowMultiple === true);

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const configurations = Object.values(configs).map((c) => ({
        questionId: c.questionId,
        isActive: c.isActive,
        isSkippable: c.isSkippable,
        allowMultiple: c.allowMultiple,
        allowOther: c.allowOther,
        options: c.options,
        respondentPrompt: c.respondentPrompt,
        showRespondentPrompt: c.showRespondentPrompt,
      }));
      await api.put(`/questionnaire/${projectId}/configure-questions`, { configurations });
      router.push(`/projects/${projectId}`);
    } catch (error: any) {
      console.error('Failed to save configurations:', error);
      setSaveError(
        error.response?.data?.error || error.message || 'Failed to save. Check option labels and duplicate values.'
      );
    } finally {
      setSaving(false);
    }
  };

  const activeCount = Object.values(configs).filter((c) => c.isActive).length;
  const totalCount = Object.values(configs).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-on-surface">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <Sidebar projectId={projectId} />
      <MobileNav />

      <main className="md:ml-64 min-h-screen flex flex-col">
        <header className="h-20 flex items-center justify-between px-8 sm:px-12 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-surface-container sticky top-0 z-50">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-bold text-sm"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="h-10 px-4 rounded-lg font-bold border-surface-container text-on-surface-variant">
              {activeCount} / {totalCount} questions active
            </Badge>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="h-10 px-8 bg-primary text-white rounded-lg font-black shadow-lg shadow-primary hover:scale-105 active:scale-95 transition-all flex gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save changes'}
            </Button>
          </div>
        </header>

        <div className="flex-1 p-8 sm:p-12 lg:p-16 max-w-6xl mx-auto w-full animate-fade-in space-y-10">
          <div className="space-y-3">
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-primary">Survey editor</span>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-on-background leading-tight">
              Edit Questions &amp; Options
            </h1>
            <p className="text-lg text-on-surface-variant max-w-3xl leading-relaxed">
              Show or hide each question, control whether respondents can skip it, add optional instructions they will see,
              and manage answer choices—including custom options and which options are visible.
            </p>
          </div>

          {saveError && (
            <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 p-4 rounded-xl border border-red-100 dark:border-red-900 flex items-start gap-2">
              <span className="material-symbols-outlined text-lg shrink-0">error_outline</span>
              {saveError}
            </div>
          )}

          <div className="space-y-12">
            {modules.map((module) => (
              <div key={module.id} className="space-y-8 animate-slide-up">
                <div className="flex flex-col sm:flex-row justify-between items-end gap-6 border-b border-surface-container pb-6">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black text-on-background tracking-tight">{module.name}</h2>
                    <p className="text-sm text-on-surface-variant">{module.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleAllInModule(module.id, 'isActive', true)}
                      className="h-9 rounded-lg font-bold text-[10px] uppercase border-surface-container"
                    >
                      Activate all
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleAllInModule(module.id, 'isActive', false)}
                      className="h-9 rounded-lg font-bold text-[10px] uppercase border-surface-container"
                    >
                      Hide all
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {module.Questions.map((q, idx) => {
                    const config = configs[q.id];
                    if (!config) return null;
                    const isExpanded = expandedQuestions.has(q.id);
                    const hasOptions = CHOICE_TYPES.includes(q.type);
                    const options = config.options || [];
                    const multi = isMultipleChoice(q, config);

                    return (
                      <div
                        key={q.id}
                        className={cn(
                          'rounded-xl transition-all duration-300 border',
                          config.isActive
                            ? 'bg-white dark:bg-slate-900 border-primary/10 shadow-sm'
                            : 'bg-surface-container-low border-transparent opacity-70'
                        )}
                      >
                        <div className="p-6 sm:p-8 flex flex-col lg:flex-row items-start lg:items-start justify-between gap-8">
                          <div className="flex-1 space-y-3 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[10px] font-black font-mono text-primary/40 uppercase tracking-widest">
                                Q-{idx + 1}
                              </span>
                              {multi && (
                                <Badge className="text-[9px] font-black uppercase tracking-tighter bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200 border-0 h-5 px-2">
                                  Multiple choice
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter h-5 px-2">
                                {q.type}
                              </Badge>
                            </div>
                            <h3
                              className={cn(
                                'text-lg font-bold tracking-tight leading-snug',
                                !config.isActive && 'line-through text-on-surface-variant'
                              )}
                            >
                              {q.question}
                            </h3>
                            <p className="text-xs text-on-surface-variant leading-relaxed max-w-xl">{q.description}</p>

                            <div className="flex flex-wrap gap-2 pt-2">
                              {hasOptions && (
                                <button
                                  type="button"
                                  onClick={() => toggleQuestionExpanded(q.id)}
                                  className="flex items-center gap-1 text-[9px] font-black uppercase tracking-tighter bg-surface-container-low border border-surface-container/30 h-6 px-2 rounded-md hover:bg-primary/10 transition-colors"
                                >
                                  {options.length} options
                                  <ChevronDown className={cn('w-3 h-3 transition-transform', isExpanded && 'rotate-180')} />
                                </button>
                              )}
                            </div>

                            <div className="pt-4 space-y-3 border-t border-surface-container/40 mt-4">
                              <div className="flex items-center justify-between gap-4">
                                <div>
                                  <Label className="text-xs font-bold">Extra instructions for respondents</Label>
                                  <p className="text-[10px] text-on-surface-variant mt-0.5">
                                    Optional text shown under the question when enabled.
                                  </p>
                                </div>
                                <Switch
                                  checked={config.showRespondentPrompt}
                                  onCheckedChange={(v) => updateConfig(q.id, 'showRespondentPrompt', v)}
                                  disabled={!config.isActive}
                                  className="data-[state=checked]:bg-primary shrink-0"
                                />
                              </div>
                              {config.showRespondentPrompt && config.isActive && (
                                <textarea
                                  value={config.respondentPrompt}
                                  onChange={(e) => updateConfig(q.id, 'respondentPrompt', e.target.value)}
                                  placeholder="e.g. Please consider your peak traffic scenarios…"
                                  rows={3}
                                  className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-sm text-on-background placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                />
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-6 sm:gap-8 bg-surface-container-lowest p-5 rounded-xl border border-surface-container/30 w-full lg:w-auto lg:min-w-[280px]">
                            <div className="flex flex-col items-center gap-2 min-w-[72px]">
                              <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant opacity-60 text-center">
                                Question active
                              </span>
                              <Switch
                                checked={config.isActive}
                                onCheckedChange={(v) => updateConfig(q.id, 'isActive', v)}
                                className="data-[state=checked]:bg-primary"
                              />
                              <span className="text-[9px] text-on-surface-variant text-center">Shown in survey</span>
                            </div>
                            <div className="flex flex-col items-center gap-2 min-w-[72px]">
                              <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant opacity-60 text-center">
                                Skippable
                              </span>
                              <Switch
                                checked={config.isSkippable}
                                onCheckedChange={(v) => updateConfig(q.id, 'isSkippable', v)}
                                disabled={!config.isActive}
                                className="data-[state=checked]:bg-blue-500"
                              />
                              <span className="text-[9px] text-on-surface-variant text-center">
                                {config.isSkippable ? 'Skip allowed' : 'Required'}
                              </span>
                            </div>
                            <div className="flex flex-col items-center gap-2 min-w-[72px]">
                              <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant opacity-60 text-center">
                                Multi
                              </span>
                              <Switch
                                checked={config.allowMultiple === true}
                                onCheckedChange={(v) => updateConfig(q.id, 'allowMultiple', v ? true : false)}
                                disabled={!config.isActive || !hasOptions || q.type === 'multiple'}
                                className="data-[state=checked]:bg-purple-500"
                              />
                              <span className="text-[9px] text-on-surface-variant text-center">Allow many</span>
                            </div>
                            <div className="flex flex-col items-center gap-2 min-w-[72px]">
                              <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant opacity-60 text-center">
                                &quot;Other&quot;
                              </span>
                              <Switch
                                checked={config.allowOther}
                                onCheckedChange={(v) => updateConfig(q.id, 'allowOther', v)}
                                disabled={!config.isActive || !hasOptions}
                                className="data-[state=checked]:bg-orange-500"
                              />
                              <span className="text-[9px] text-on-surface-variant text-center">Custom text</span>
                            </div>
                          </div>
                        </div>

                        {hasOptions && isExpanded && (
                          <div className="px-6 sm:px-8 pb-8 border-t border-surface-container/30 pt-6">
                            <div className="flex items-center justify-between mb-4">
                              <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                                Answer options
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => addOption(q.id)}
                                disabled={options.length >= 20}
                                className="h-7 text-[10px] font-bold uppercase border-primary/30 text-primary hover:bg-primary/5"
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                Add custom option
                              </Button>
                            </div>
                            {options.length === 0 ? (
                              <p className="text-xs text-on-surface-variant italic">
                                No options. Add at least one for choice questions.
                              </p>
                            ) : (
                              <div className="space-y-3">
                                {options.map((opt, optIdx) => (
                                  <div
                                    key={optIdx}
                                    className="flex flex-col sm:flex-row sm:items-start gap-3 bg-surface-container-low p-4 rounded-lg border border-surface-container/20"
                                  >
                                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <div>
                                        <Label className="text-[9px] font-bold uppercase text-on-surface-variant/60 mb-1 block">
                                          Label
                                        </Label>
                                        <Input
                                          value={opt.label}
                                          onChange={(e) => updateOption(q.id, optIdx, 'label', e.target.value)}
                                          placeholder="Option label"
                                          className="h-9 text-sm"
                                        />
                                      </div>
                                      <div>
                                        <Label className="text-[9px] font-bold uppercase text-on-surface-variant/60 mb-1 block">
                                          Value
                                        </Label>
                                        <Input
                                          value={opt.value}
                                          onChange={(e) => updateOption(q.id, optIdx, 'value', e.target.value)}
                                          placeholder="option_value"
                                          className="h-9 text-sm font-mono"
                                        />
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3 sm:flex-col sm:items-center sm:pt-6">
                                      <div className="flex flex-col items-center gap-1">
                                        <span className="text-[9px] font-bold uppercase text-on-surface-variant/70">
                                          Option active
                                        </span>
                                        <Switch
                                          checked={opt.isActive !== false}
                                          onCheckedChange={(v) => setOptionActive(q.id, optIdx, v)}
                                          className="data-[state=checked]:bg-emerald-600"
                                        />
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeOption(q.id, optIdx)}
                                        className="h-9 w-9 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                                        aria-label="Remove option"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
