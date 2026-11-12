'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/components/ui/use-toast';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Check, Save, Eye, Loader2 } from 'lucide-react';
import { branchingEngine } from '@/lib/branching-engine';
import { api } from '@/lib/api';

interface QuestionnaireEngineProps {
  projectId: string;
  modules: any[];
  initialAnswers?: Record<string, any>;
  onComplete?: () => void;
}

export function QuestionnaireEngine({
  projectId,
  modules,
  initialAnswers = {},
  onComplete,
}: QuestionnaireEngineProps) {
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [moduleQuestions, setModuleQuestions] = useState<Record<string, any[]>>({});
  const [answers, setAnswers] = useState<Record<string, any>>(initialAnswers);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [frdGenerated, setFrdGenerated] = useState(false);
  const { toast } = useToast();

  const currentModule = modules[currentModuleIndex];

  useEffect(() => {
    loadQuestionsForModule(currentModuleIndex);
  }, [currentModuleIndex]);

  const loadQuestionsForModule = async (index: number) => {
    const module = modules[index];
    if (!module) return;

    if (moduleQuestions[module.id]) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/questionnaire/generate-questions', {
        projectId,
        moduleId: module.id,
      });

      if (response.data.success) {
        setModuleQuestions((prev) => ({
          ...prev,
          [module.id]: response.data.data,
        }));
      }
    } catch (error) {
      console.error('Error loading questions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load questions for this module',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const questions = moduleQuestions[currentModule?.id] || [];

  const visibleQuestions = useMemo(() => {
    return questions.filter((q) => 
      branchingEngine.shouldShowQuestion(q, answers)
    );
  }, [questions, answers]);

  const currentQuestion = visibleQuestions[currentQuestionIndex];

  const progress = useMemo(() => {
    if (visibleQuestions.length === 0) return 0;
    const answeredCount = visibleQuestions.filter((q) => {
      const ans = answers[q.id];
      return ans !== undefined && ans !== '' && !(Array.isArray(ans) && ans.length === 0);
    }).length;
    return Math.round((answeredCount / visibleQuestions.length) * 100);
  }, [visibleQuestions, answers]);

  const moduleProgress = useMemo(() => {
    return modules.map((mod, index) => {
      const modQuestions = moduleQuestions[mod.id] || [];
      if (modQuestions.length === 0) return 0;
      const answeredCount = modQuestions.filter((q) => {
        const ans = answers[q.id];
        return ans !== undefined && ans !== '' && !(Array.isArray(ans) && ans.length === 0);
      }).length;
      return Math.round((answeredCount / modQuestions.length) * 100);
    });
  }, [modules, moduleQuestions, answers]);

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < visibleQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else if (currentModuleIndex < modules.length - 1) {
      setCurrentModuleIndex(currentModuleIndex + 1);
      setCurrentQuestionIndex(0);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else if (currentModuleIndex > 0) {
      setCurrentModuleIndex(currentModuleIndex - 1);
      setCurrentQuestionIndex(0);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const formattedAnswers = Object.entries(answers).map(([questionId, selectedOptions]) => ({
        questionId,
        selectedOptions: Array.isArray(selectedOptions) ? selectedOptions : [selectedOptions],
      }));

      await api.post(`/questionnaire/save-answers/${projectId}`, {
        answers: formattedAnswers,
      });

      toast({
        title: 'Saved',
        description: 'Your answers have been saved successfully',
      });
    } catch (error) {
      console.error('Error saving answers:', error);
      toast({
        title: 'Error',
        description: 'Failed to save answers',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateFRD = async () => {
    setIsGenerating(true);
    try {
      await api.post(`/frd/generate/${projectId}`);
      setFrdGenerated(true);
      toast({
        title: 'FRD Generated',
        description: 'Your Functional Requirements Document is ready',
      });
      onComplete?.();
    } catch (error) {
      console.error('Error generating FRD:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate FRD',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const isLastModule = currentModuleIndex === modules.length - 1;
  const isLastQuestion = currentQuestionIndex === visibleQuestions.length - 1;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Requirement Questionnaire</CardTitle>
              <CardDescription>
                Complete all modules to generate your FRD
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Progress
              </Button>
              {!frdGenerated && (
                <Button onClick={handleGenerateFRD} disabled={isGenerating || progress < 100}>
                  {isGenerating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="mr-2 h-4 w-4" />
                  )}
                  Generate FRD
                </Button>
              )}
              {frdGenerated && (
                <a href={`/frd/${projectId}`} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                  <Eye className="mr-2 h-4 w-4" />
                  View FRD
                </a>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Overall Progress</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <Tabs value={currentModule?.id} className="w-full">
            <TabsList className="w-full flex-wrap h-auto gap-1">
              {modules.map((mod, index) => (
                <TabsTrigger
                  key={mod.id}
                  value={mod.id}
                  onClick={() => {
                    setCurrentModuleIndex(index);
                    setCurrentQuestionIndex(0);
                  }}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  {mod.name}
                  {moduleProgress[index] === 100 ? (
                    <Check className="ml-2 h-4 w-4 text-green-500" />
                  ) : (
                    <Badge variant="secondary" className="ml-2">
                      {moduleProgress[index]}%
                    </Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card className="min-h-[500px]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <Badge variant="outline" className="mb-2">
                    Module {currentModuleIndex + 1} of {modules.length}
                  </Badge>
                  <CardTitle>{currentModule?.name}</CardTitle>
                  <CardDescription>{currentModule?.description}</CardDescription>
                </div>
                <div className="text-sm text-muted-foreground">
                  Question {currentQuestionIndex + 1} of {visibleQuestions.length}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : currentQuestion ? (
                <>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-lg font-medium">
                        {currentQuestion.question}
                      </Label>
                      {currentQuestion.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {currentQuestion.description}
                        </p>
                      )}
                      {currentQuestion.required && (
                        <span className="text-destructive">*</span>
                      )}
                    </div>

                    {currentQuestion.type === 'yesno' && (
                      <RadioGroup
                        value={answers[currentQuestion.id] || ''}
                        onValueChange={(value) => 
                          handleAnswerChange(currentQuestion.id, value)
                        }
                        className="flex space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="yes" />
                          <Label htmlFor="yes">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="no" />
                          <Label htmlFor="no">No</Label>
                        </div>
                      </RadioGroup>
                    )}

                    {currentQuestion.type === 'single' && currentQuestion.options && (
                      <RadioGroup
                        value={answers[currentQuestion.id] || ''}
                        onValueChange={(value) => 
                          handleAnswerChange(currentQuestion.id, value)
                        }
                        className="space-y-3"
                      >
                        {currentQuestion.options.map((option: any) => (
                          <div
                            key={option.value}
                            className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                            onClick={() => handleAnswerChange(currentQuestion.id, option.value)}
                          >
                            <RadioGroupItem value={option.value} id={option.value} />
                            <div className="flex-1">
                              <Label htmlFor={option.value} className="cursor-pointer font-normal">
                                {option.label}
                              </Label>
                              {option.description && (
                                <p className="text-sm text-muted-foreground">
                                  {option.description}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </RadioGroup>
                    )}

                    {currentQuestion.type === 'multiple' && currentQuestion.options && (
                      <div className="space-y-3">
                        {currentQuestion.options.map((option: any) => {
                          const selected = answers[currentQuestion.id] || [];
                          const isChecked = Array.isArray(selected) && selected.includes(option.value);
                          
                          return (
                            <div
                              key={option.value}
                              className={`flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer ${
                                isChecked ? 'bg-primary/5 border-primary' : ''
                              }`}
                              onClick={() => {
                                const current = answers[currentQuestion.id] || [];
                                const updated = Array.isArray(current) 
                                  ? (isChecked 
                                      ? current.filter((v: string) => v !== option.value)
                                      : [...current, option.value])
                                  : [option.value];
                                handleAnswerChange(currentQuestion.id, updated);
                              }}
                            >
                              <Checkbox
                                checked={isChecked}
                                id={option.value}
                                className="mt-1"
                              />
                              <div className="flex-1">
                                <Label htmlFor={option.value} className="cursor-pointer font-normal">
                                  {option.label}
                                </Label>
                                {option.description && (
                                  <p className="text-sm text-muted-foreground">
                                    {option.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {currentQuestion.type === 'text' && (
                      <Input
                        value={answers[currentQuestion.id] || ''}
                        onChange={(e) => 
                          handleAnswerChange(currentQuestion.id, e.target.value)
                        }
                        placeholder="Enter your answer..."
                        className="max-w-lg"
                      />
                    )}

                    {currentQuestion.type === 'number' && (
                      <Input
                        type="number"
                        value={answers[currentQuestion.id] || ''}
                        onChange={(e) => 
                          handleAnswerChange(currentQuestion.id, e.target.value)
                        }
                        placeholder="Enter a number..."
                        className="max-w-xs"
                      />
                    )}

                    {currentQuestion.type === 'select' && currentQuestion.options && (
                      <Select
                        value={answers[currentQuestion.id] || ''}
                        onValueChange={(value) => 
                          handleAnswerChange(currentQuestion.id, value)
                        }
                      >
                        <SelectTrigger className="w-full max-w-xs">
                          <SelectValue placeholder="Select an option..." />
                        </SelectTrigger>
                        <SelectContent>
                          {currentQuestion.options.map((option: any) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t">
                    <Button
                      variant="outline"
                      onClick={handlePrevQuestion}
                      disabled={currentModuleIndex === 0 && currentQuestionIndex === 0}
                    >
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Previous
                    </Button>

                    <div className="flex items-center gap-3">
                      <Button
                        variant="secondary"
                        onClick={async () => {
                          await handleSave();
                          window.location.href = '/projects';
                        }}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="mr-2 h-4 w-4" />
                        )}
                        Save & Exit
                      </Button>

                      {isLastModule && isLastQuestion ? (
                        <Button
                          onClick={handleGenerateFRD}
                          disabled={isGenerating || progress < 100}
                        >
                          {isGenerating ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="mr-2 h-4 w-4" />
                          )}
                          Generate FRD
                        </Button>
                      ) : (
                        <Button onClick={handleNextQuestion}>
                          Next
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                  <p>No questions available for this module.</p>
                  <Button
                    variant="link"
                    onClick={() => {
                      if (currentModuleIndex < modules.length - 1) {
                        setCurrentModuleIndex(currentModuleIndex + 1);
                        setCurrentQuestionIndex(0);
                      }
                    }}
                  >
                    Go to next module
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Module Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible defaultValue={currentModule?.id}>
                {modules.map((mod, index) => {
                  const modQuestions = moduleQuestions[mod.id] || [];
                  const answeredCount = modQuestions.filter((q) => {
                    const ans = answers[q.id];
                    return ans !== undefined && ans !== '' && !(Array.isArray(ans) && ans.length === 0);
                  }).length;

                  return (
                    <AccordionItem key={mod.id} value={mod.id}>
                      <AccordionTrigger className="text-sm">
                        <span className="flex items-center gap-2">
                          {index + 1}. {mod.name}
                          {modQuestions.length > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {answeredCount}/{modQuestions.length}
                            </Badge>
                          )}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">
                            {mod.description}
                          </p>
                          {modQuestions.length > 0 && (
                            <Progress
                              value={(answeredCount / modQuestions.length) * 100}
                              className="h-1"
                            />
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="w-full"
                            onClick={() => {
                              setCurrentModuleIndex(index);
                              setCurrentQuestionIndex(0);
                            }}
                          >
                            {modQuestions.length > 0 ? 'Continue' : 'Load Questions'}
                          </Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
