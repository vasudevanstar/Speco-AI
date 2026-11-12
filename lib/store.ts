import { create } from 'zustand';
import { Project, Module, Question, Answer } from '@/types/index';

interface AppState {
  projects: Project[];
  currentProject: Project | null;
  modules: Module[];
  questions: Question[];
  answers: Record<string, any>;
  currentModuleIndex: number;
  isLoading: boolean;
  frdContent: any;
  
  setProjects: (projects: Project[]) => void;
  setCurrentProject: (project: Project | null) => void;
  setModules: (modules: Module[]) => void;
  setQuestions: (questions: Question[]) => void;
  setAnswers: (answers: Record<string, any>) => void;
  updateAnswer: (questionId: string, value: any) => void;
  setCurrentModuleIndex: (index: number) => void;
  setIsLoading: (loading: boolean) => void;
  setFRDContent: (content: any) => void;
  reset: () => void;
}

const initialState = {
  projects: [],
  currentProject: null,
  modules: [],
  questions: [],
  answers: {},
  currentModuleIndex: 0,
  isLoading: false,
  frdContent: null,
};

export const useAppStore = create<AppState>((set) => ({
  ...initialState,
  
  setProjects: (projects) => set({ projects }),
  setCurrentProject: (project) => set({ currentProject: project }),
  setModules: (modules) => set({ modules }),
  setQuestions: (questions) => set({ questions }),
  setAnswers: (answers) => set({ answers }),
  updateAnswer: (questionId, value) => 
    set((state) => ({ 
      answers: { ...state.answers, [questionId]: value } 
    })),
  setCurrentModuleIndex: (index) => set({ currentModuleIndex: index }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setFRDContent: (content) => set({ frdContent: content }),
  reset: () => set(initialState),
}));
