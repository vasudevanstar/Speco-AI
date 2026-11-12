export class BranchingEngine {
  private static instance: BranchingEngine;

  private constructor() {}

  static getInstance(): BranchingEngine {
    if (!BranchingEngine.instance) {
      BranchingEngine.instance = new BranchingEngine();
    }
    return BranchingEngine.instance;
  }

  shouldShowQuestion(
    question: { dependsOn?: { questionId: string; values: string[] } },
    answers: Record<string, string | string[]>
  ): boolean {
    if (!question.dependsOn) {
      return true;
    }

    const parentAnswer = answers[question.dependsOn.questionId];
    if (parentAnswer === undefined) {
      return false;
    }

    if (Array.isArray(parentAnswer)) {
      return parentAnswer.some(v => question.dependsOn!.values.includes(v));
    }

    return question.dependsOn.values.includes(parentAnswer);
  }

  getVisibleQuestions(
    questions: Array<{
      id: string;
      dependsOn?: { questionId: string; values: string[] };
    }>,
    answers: Record<string, string | string[]>
  ): string[] {
    return questions
      .filter(q => this.shouldShowQuestion(q, answers))
      .map(q => q.id);
  }

  getFollowUpQuestions(
    questions: Array<{
      id: string;
      dependsOn?: { questionId: string; values: string[] };
      triggers?: string[];
    }>,
    answers: Record<string, string | string[]>
  ): string[] {
    const triggeredIds: string[] = [];

    for (const [answerId, answerValue] of Object.entries(answers)) {
      const value = Array.isArray(answerValue) ? answerValue : [answerValue];

      for (const q of questions) {
        if (q.triggers?.some(t => value.includes(t))) {
          if (this.shouldShowQuestion(q, answers)) {
            triggeredIds.push(q.id);
          }
        }
      }
    }

    return triggeredIds;
  }

  getQuestionDependencies(
    questions: Array<{ id: string; dependsOn?: { questionId: string; values: string[] } }>
  ): Record<string, string[]> {
    const graph: Record<string, string[]> = {};

    for (const q of questions) {
      if (q.dependsOn) {
        if (!graph[q.dependsOn.questionId]) {
          graph[q.dependsOn.questionId] = [];
        }
        graph[q.dependsOn.questionId].push(q.id);
      }
    }

    return graph;
  }

  validateAnswer(
    question: {
      type: string;
      required?: boolean;
      options?: { value: string }[];
    },
    answer: string | string[]
  ): { valid: boolean; error?: string } {
    if (question.required) {
      if (answer === undefined || answer === null || answer === '') {
        return { valid: false, error: 'This question is required' };
      }

      if (Array.isArray(answer) && answer.length === 0) {
        return { valid: false, error: 'Please select at least one option' };
      }
    }

    if (question.type === 'single' || question.type === 'select' || question.type === 'yesno') {
      if (Array.isArray(answer) && answer.length > 1) {
        return { valid: false, error: 'Please select only one option' };
      }
    }

    if (question.options && question.options.length > 0) {
      const validValues = question.options.map(o => o.value);
      const answerValues = Array.isArray(answer) ? answer : [answer];

      for (const v of answerValues) {
        if (v && !validValues.includes(v)) {
          return { valid: false, error: `Invalid option: ${v}` };
        }
      }
    }

    return { valid: true };
  }

  calculateProgress(
    allQuestions: string[],
    answeredQuestions: string[],
    answers: Record<string, string | string[]>
  ): { total: number; answered: number; percentage: number } {
    const total = allQuestions.length;
    let answered = 0;

    for (const qId of answeredQuestions) {
      const answer = answers[qId];
      if (answer !== undefined && answer !== '' && !(Array.isArray(answer) && answer.length === 0)) {
        answered++;
      }
    }

    return {
      total,
      answered,
      percentage: total > 0 ? Math.round((answered / total) * 100) : 0,
    };
  }
}

export const branchingEngine = BranchingEngine.getInstance();
