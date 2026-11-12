export interface Feature {
  id: string;
  name: string;
  required: boolean;
}

export interface SubModule {
  id: string;
  name: string;
  features: Feature[];
}

export interface Module {
  id: string;
  name: string;
  description: string;
  subModules: SubModule[];
}

export interface MCQOption {
  value: string;
  label: string;
  description?: string;
  triggers?: string[];
}

export interface MCQQuestion {
  id: string;
  moduleId: string;
  subModuleId?: string;
  question: string;
  description?: string;
  type: 'single' | 'multiple' | 'yesno' | 'text' | 'number' | 'select';
  options?: MCQOption[];
  dependsOn?: { questionId: string; values: string[] };
  multiSelect?: boolean;
  required?: boolean;
  skipIf?: { questionId: string; values: string[] };
  followUpQuestions?: string[];
}

export interface MCQSection {
  id: string;
  moduleId: string;
  moduleName: string;
  questions: MCQQuestion[];
}

export interface ProjectContext {
  projectDescription: string;
  constraints?: string;
  industry?: string;
  scale?: 'small' | 'medium' | 'large' | 'enterprise';
}

export interface ProjectAnswers {
  [questionId: string]: string | string[] | number | boolean;
}

export interface SelectedFeatures {
  [moduleId: string]: {
    [subModuleId: string]: string[];
  };
}

export interface FRDSection {
  title: string;
  content: string | string[];
  subsections?: FRDSection[];
}

export interface FunctionalRequirement {
  id: string;
  module: string;
  subModule: string;
  requirement: string;
  priority: 'Must Have' | 'Should Have' | 'Could Have' | 'Won\'t Have';
  type: 'Functional' | 'Technical' | 'Business' | 'Edge Case';
}

export interface UserFlow {
  id: string;
  name: string;
  description: string;
  steps: {
    step: number;
    action: string;
    actor: string;
    system: string;
    result: string;
  }[];
}

export interface TechnicalSpec {
  frontend: {
    framework: string;
    language: string;
    uiLibrary: string;
    stateManagement: string;
    routing: string;
  };
  backend: {
    framework: string;
    language: string;
    orm: string;
    database: string;
    auth: string;
    apiStyle: string;
  };
  infrastructure: {
    hosting: string;
    storage: string;
    cdn: string;
    monitoring: string;
  };
}

export interface Integration {
  name: string;
  category: string;
  required: boolean;
  configuration: {
    key: string;
    value: string;
  }[];
}

export interface FRD {
  metadata: {
    projectName: string;
    version: string;
    createdAt: string;
    documentId: string;
  };
  projectOverview: {
    description: string;
    constraints: string[];
    objectives: string[];
    scope: string[];
  };
  modules: {
    module: string;
    description: string;
    subModules: {
      name: string;
      features: string[];
      requirements: string[];
    }[];
  }[];
  functionalRequirements: FunctionalRequirement[];
  userFlows: UserFlow[];
  technicalArchitecture: TechnicalSpec;
  databaseSchema: {
    entities: string[];
    relationships: string[];
  };
  integrations: Integration[];
  securityConsiderations: string[];
  deploymentConfig: {
    platforms: string[];
    deploymentModel: string;
    offlineSupport: boolean;
  };
  decisionSummary: {
    decisions: { question: string; answer: string }[];
  };
  assumptions: string[];
  risks: { risk: string; mitigation: string }[];
}
