export interface BranchingQuestion {
  id: string;
  dependsOn?: { questionId: string; values: string[] };
  triggers?: string[];
}

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
    question: BranchingQuestion,
    answers: Record<string, any>
  ): boolean {
    if (!question.dependsOn) {
      return true;
    }

    const parentAnswer = answers[question.dependsOn.questionId];
    if (parentAnswer === undefined || parentAnswer === null) {
      return false;
    }

    if (Array.isArray(parentAnswer)) {
      return parentAnswer.some((v) => question.dependsOn!.values.includes(v));
    }

    return question.dependsOn.values.includes(parentAnswer);
  }

  getVisibleQuestions<T extends BranchingQuestion>(
    questions: T[],
    answers: Record<string, any>
  ): T[] {
    return questions.filter((q) => this.shouldShowQuestion(q, answers));
  }

  calculateProgress(
    allQuestions: BranchingQuestion[],
    answers: Record<string, any>
  ): { total: number; answered: number; percentage: number } {
    const total = allQuestions.length;
    let answered = 0;

    for (const q of allQuestions) {
      const answer = answers[q.id];
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
