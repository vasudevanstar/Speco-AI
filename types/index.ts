export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'consultant' | 'user';
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  constraints?: string;
  industry?: string;
  scale: 'small' | 'medium' | 'large' | 'enterprise';
  status: 'draft' | 'in_progress' | 'completed';
  userId: string;
  createdAt: string;
  updatedAt: string;
  modules?: Module[];
  frdDocument?: FRDDocument;
}

export interface Module {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  order: number;
  isCustom: boolean;
  subModules?: SubModule[];
  questions?: Question[];
  createdAt: string;
  updatedAt: string;
}

export interface SubModule {
  id: string;
  moduleId: string;
  name: string;
  description?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  id: string;
  moduleId: string;
  question: string;
  description?: string;
  type: 'yesno' | 'single' | 'multiple' | 'text' | 'number' | 'select';
  options: QuestionOption[];
  dependsOn?: {
    questionId: string;
    values: string[];
  };
  triggers?: string[];
  required: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionOption {
  value: string;
  label: string;
  description?: string;
}

export interface Answer {
  id: string;
  projectId: string;
  questionId: string;
  selectedOptions: string[];
  textValue?: string;
  numericValue?: number;
  createdAt: string;
  updatedAt: string;
}

export interface FRDDocument {
  id: string;
  projectId: string;
  content: FRDContent;
  markdown?: string;
  version: string;
  status: 'draft' | 'final' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface FRDContent {
  projectOverview: {
    description: string;
    constraints: string[];
    objectives: string[];
    scope: string[];
  };
  modules: FRDModule[];
}

export interface FRDModule {
  module: string;
  description: string;
  subModules: {
    name: string;
    description: string;
    features: string[];
    requirements: string[];
  }[];
}

export interface FunctionalRequirement {
  id: string;
  frdDocumentId: string;
  moduleId?: string;
  subModuleId?: string;
  code: string;
  requirement: string;
  priority: 'Must Have' | 'Should Have' | 'Could Have' | "Won't Have";
  type: 'Functional' | 'Technical' | 'Business' | 'Edge Case';
}

export interface UserFlow {
  id: string;
  frdDocumentId: string;
  code: string;
  name: string;
  description?: string;
  steps: UserFlowStep[];
}

export interface UserFlowStep {
  step: number;
  action: string;
  actor: string;
  system: string;
  result: string;
}

export interface Integration {
  id: string;
  frdDocumentId: string;
  name: string;
  category?: string;
  required: boolean;
  configuration: {
    key: string;
    value: string;
  }[];
}

export interface Decision {
  id: string;
  frdDocumentId: string;
  question: string;
  answer: string;
}
