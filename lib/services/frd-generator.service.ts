import { developerHintService, StructuredRequirement } from './developer-hint.service';

interface Module {
  id: string;
  name: string;
  description?: string;
  subModules?: SubModule[];
  questions?: any[];
  Questions?: any[];
}

interface SubModule {
  id: string;
  name: string;
  description?: string;
}

interface ProjectContext {
  title?: string;
  description: string;
  constraints?: string;
  industry?: string;
  scale?: string;
  projectTypes?: string[];
  userVolume?: number | null;
  userVolumeType?: string;
}

export class FRDGeneratorService {
  private static instance: FRDGeneratorService;

  private constructor() { }

  static getInstance(): FRDGeneratorService {
    if (!FRDGeneratorService.instance) {
      FRDGeneratorService.instance = new FRDGeneratorService();
    }
    return FRDGeneratorService.instance;
  }

  private formatProjectTypes(types: any): string {
    if (!types) return 'N/A';
    if (Array.isArray(types)) return types.join(', ');
    if (typeof types === 'string') {
      try {
        const parsed = JSON.parse(types);
        if (Array.isArray(parsed)) return parsed.join(', ');
      } catch {}
      return types;
    }
    return String(types);
  }

  async generateFRD(
    context: ProjectContext,
    answers: Record<string, any>,
    modules: any[]
  ): Promise<{
    content: any;
    markdown: string;
    requirements: StructuredRequirement[];
    userFlows: any[];
    decisions: any[];
    integrations: any[];
    traceabilityMatrix: any[];
  }> {
    // 1. Gather all questions from all modules
    const allQuestions: { question: any; module: any }[] = [];
    for (const mod of modules) {
      const qs = mod.Questions || mod.questions || [];
      for (const q of qs) {
        allQuestions.push({ question: q, module: mod });
      }
    }

    // 2. Build Structured Requirements with Developer Hints for every user question & answer
    let requirements: StructuredRequirement[] = [];
    if (allQuestions.length > 0) {
      requirements = allQuestions.map((item, idx) => {
        const rawAns = answers[item.question.id];
        return developerHintService.analyzeRequirement(context, item.module, item.question, rawAns, idx);
      });
    } else {
      // If no questions exist yet, synthesize baseline requirements from project description
      requirements = this.buildBaselineRequirements(context);
    }

    // 3. Build Requirement Traceability Matrix (RTM)
    const traceabilityMatrix = requirements.map(req => ({
      requirementId: req.id,
      questionId: req.questionCode,
      questionText: req.originalQuestion,
      userAnswer: req.originalAnswer,
      generatedRequirement: req.technicalSpecification,
      developerHint: req.developerHint,
      acceptanceCriteria: req.acceptanceCriteria.join('; '),
      status: req.clarificationStatus,
    }));

    // 4. Build User Flows
    const userFlows = this.buildUserFlows(modules, requirements);

    // 5. Build Integrations & Decisions
    const decisions = requirements.map(r => ({
      question: r.originalQuestion,
      answer: r.originalAnswer,
      developerHint: r.developerHint,
    }));

    const integrations = this.buildIntegrations(context, requirements);

    // 6. Build the 13 standard FRD sections
    const sections = this.build13Sections(context, modules, requirements, traceabilityMatrix, userFlows, integrations);

    // 7. Assemble content object for UI and APIs
    const contentModules = modules.map((m: any, idx: number) => ({
      id: idx + 1,
      name: m.name,
      description: m.description || '',
      priority: 'Must Have',
      sub_modules: ((m.subModules || m.SubModules || []) as any[]).map((s: any, sIdx: number) => ({
        id: sIdx + 1,
        name: s.name,
        description: s.description || '',
      })),
      requirements: requirements.filter(r => r.moduleName === m.name),
    }));

    const contentUserFlows = userFlows.map((f: any, idx: number) => ({
      id: idx + 1,
      module_id: 1,
      title: f.name,
      steps: f.steps.map((s: any) => `${s.action} (${s.actor}) → ${s.result}`).join('\n'),
    }));

    // Compatible requirements list for legacy UI components + new developer fields
    const contentRequirements = requirements.map((r, idx) => ({
      id: idx + 1,
      module_id: 1,
      code: r.id,
      questionCode: r.questionCode,
      title: r.requirementTitle,
      description: `**Source Question (${r.questionCode}):** ${r.originalQuestion}\n\n**User Answer:** ${r.originalAnswer}\n\n**Technical Spec:** ${r.technicalSpecification}\n\n**Developer Hint:** ${r.developerHint}\n\n**Acceptance Criteria:**\n${r.acceptanceCriteria.map(a => `• ${a}`).join('\n')}`,
      developerHint: r.developerHint,
      technicalSpec: r.technicalSpecification,
      originalQuestion: r.originalQuestion,
      originalAnswer: r.originalAnswer,
      validationRules: r.validationRules,
      acceptanceCriteria: r.acceptanceCriteria,
      priority: r.priority,
      type: 'Functional',
      clarificationStatus: r.clarificationStatus,
    }));

    const content = {
      sections,
      projectOverview: {
        title: context.title,
        description: context.description,
        industry: context.industry,
        scale: context.scale,
        projectTypes: context.projectTypes,
        userVolume: context.userVolume,
        userVolumeType: context.userVolumeType,
        constraints: context.constraints ? context.constraints.split(';').map(c => c.trim()) : [],
      },
      modules: contentModules,
      requirements: contentRequirements,
      user_flows: contentUserFlows,
      traceabilityMatrix,
      decisions,
      integrations,
    };

    // 8. Build complete 13-Section Markdown document
    const markdown = this.buildMarkdown(context, sections, requirements, traceabilityMatrix);

    return {
      content,
      markdown,
      requirements,
      userFlows,
      decisions,
      integrations,
      traceabilityMatrix,
    };
  }

  /**
   * Generates all 13 standard FRD sections requested in specifications
   */
  private build13Sections(
    context: ProjectContext,
    modules: any[],
    requirements: StructuredRequirement[],
    traceabilityMatrix: any[],
    userFlows: any[],
    integrations: any[]
  ): { title: string; content: string }[] {
    const sections: { title: string; content: string }[] = [];

    // Section 1: Project Overview
    sections.push({
      title: '1. Project Overview',
      content: `### 1.1 Executive Summary
**Project Name:** ${context.title || 'Untitled Project'}
**Industry / Domain:** ${context.industry || 'General Software'}
**Project Types:** ${this.formatProjectTypes(context.projectTypes)}
**Expected Scale / Complexity:** ${context.scale || 'Standard'}
**Target User Volume:** ${context.userVolume ? `${context.userVolume} ${context.userVolumeType || 'users'}` : 'Not Specified'}

### 1.2 Project Description
${context.description || 'No detailed description provided.'}

### 1.3 Project Objectives
• Deliver an automated, robust software solution fulfilling user specifications.
• Establish strict architectural foundations, input validation, and secure authentication.
• Provide clear developer implementation guidance and verifiable acceptance criteria.

### 1.4 Project Scope & Constraints
• **Included Scope:** Functional modules, user interface requirements, backend workflows, and data models detailed herein.
• **Technical Constraints:** ${context.constraints || 'Standard web/cloud deployment practices apply.'}`,
    });

    // Section 2: User Requirements (Original Questions & Answers)
    let userReqContent = `Every requirement originates from user responses to guided discovery questions. Below is the complete record of user-submitted inputs:\n\n`;
    userReqContent += `| Ref ID | Category / Module | Original Question | Original User Answer | Data Type | Status |\n`;
    userReqContent += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;
    requirements.forEach(r => {
      const safeQ = r.originalQuestion.replace(/\|/g, '\\|');
      const safeA = r.originalAnswer.replace(/\|/g, '\\|');
      userReqContent += `| **${r.questionCode}** | ${r.questionCategory} | ${safeQ} | **${safeA}** | \`${r.answerDataType}\` | ${r.clarificationStatus} |\n`;
    });
    sections.push({
      title: '2. User Requirements (Original Question & Answer Log)',
      content: userReqContent,
    });

    // Section 3: Functional Requirements
    let funcReqContent = `Detailed technical specifications derived directly from user inputs with actionable developer implementation hints:\n\n`;
    requirements.forEach(r => {
      funcReqContent += `### ${r.id}: ${r.requirementTitle}\n`;
      funcReqContent += `- **Requirement Source:** User Question **${r.questionCode}**\n`;
      funcReqContent += `- **Original Question:** *${r.originalQuestion}*\n`;
      funcReqContent += `- **Original User Answer:** **${r.originalAnswer}**\n`;
      funcReqContent += `- **Technical Specification:** ${r.technicalSpecification}\n`;
      funcReqContent += `> **💡 Developer Hint:** ${r.developerHint}\n\n`;
      funcReqContent += `- **Input Requirements:** ${r.inputRequirements} (\`Data Type: ${r.dataType}\`)\n`;
      funcReqContent += `- **Expected Output:** ${r.outputRequirements}\n`;
      if (r.validationRules && r.validationRules.length > 0) {
        funcReqContent += `- **Validation Rules:**\n${r.validationRules.map(v => `  - ${v}`).join('\n')}\n`;
      }
      if (r.acceptanceCriteria && r.acceptanceCriteria.length > 0) {
        funcReqContent += `- **Acceptance Criteria:**\n${r.acceptanceCriteria.map(a => `  - [ ] ${a}`).join('\n')}\n`;
      }
      funcReqContent += `- **Priority:** \`${r.priority}\` | **Status:** *${r.clarificationStatus}*\n\n---\n\n`;
    });
    sections.push({
      title: '3. Functional Requirements',
      content: funcReqContent,
    });

    // Section 4: Input Validation Requirements
    let validationContent = `Comprehensive input validation matrix covering all field constraints specified by user responses:\n\n`;
    validationContent += `| Requirement Ref | Field / Concept | Required | Data Type | Specific Validation Constraints | Acceptance Rule |\n`;
    validationContent += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;
    requirements.forEach(r => {
      const vRule = r.validationRules.length > 0 ? r.validationRules[0] : 'Standard format validation';
      const aRule = r.acceptanceCriteria.length > 0 ? r.acceptanceCriteria[0] : 'Valid values accepted';
      validationContent += `| **${r.id}** | ${r.requirementTitle.split(': ')[1] || r.requirementTitle} | ${r.isRequired ? 'Yes' : 'No'} | \`${r.dataType}\` | ${vRule.replace(/\|/g, '\\|')} | ${aRule.replace(/\|/g, '\\|')} |\n`;
    });
    sections.push({
      title: '4. Input Validation Requirements',
      content: validationContent,
    });

    // Section 5: Non-Functional Requirements
    sections.push({
      title: '5. Non-Functional Requirements',
      content: `### 5.1 Security Requirements
• **Password Security:** Sensitive credentials must be hashed using bcrypt or Argon2 with cryptographic salts. Plaintext passwords must never be logged or stored.
• **Transport Security:** All client-server communications must enforce TLS 1.3 encryption.
• **Authentication Security:** Secure, HTTP-only, SameSite cookies or signed JWTs with expiration for session management.
• **Input Sanitization:** Enforce strict server-side validation and parameter binding to eliminate SQL injection, XSS, and command injection vulnerabilities.

### 5.2 Performance & Responsiveness
• **API Response Times:** Standard CRUD operations should respond within ≤ 300ms under standard loads.
• **Client Performance:** Initial page load and layout render target ≤ 1.5s First Contentful Paint.
• **Target User Load:** Architecture dimensioned to support ${context.userVolume ? `${context.userVolume} ${context.userVolumeType || 'users'}` : 'baseline user activity'}.

### 5.3 Availability & Scalability
• Stateless application layer enabling horizontal auto-scaling behind reverse proxies/load balancers.
• Database connection pooling with structured indexing on frequently queried columns.`,
    });

    // Section 6: Module-Wise Requirements
    let moduleContent = `System modules organized with their related user questions, answers, and developer hints:\n\n`;
    modules.forEach((mod, mIdx) => {
      const modReqs = requirements.filter(r => r.moduleName === mod.name);
      moduleContent += `### 6.${mIdx + 1} Module: ${mod.name}\n`;
      moduleContent += `**Description:** ${mod.description || 'Core system capability.'}\n\n`;
      if (mod.subModules && mod.subModules.length > 0) {
        moduleContent += `**Submodules:** ${mod.subModules.map((s: any) => s.name).join(', ')}\n\n`;
      }
      if (modReqs.length > 0) {
        moduleContent += `**Related User Requirements & Developer Hints:**\n`;
        modReqs.forEach(mr => {
          moduleContent += `• **[${mr.id}] ${mr.originalQuestion}**\n`;
          moduleContent += `  - *User Answer:* **${mr.originalAnswer}**\n`;
          moduleContent += `  - *Developer Hint:* ${mr.developerHint}\n`;
          moduleContent += `  - *Technical Spec:* ${mr.technicalSpecification}\n\n`;
        });
      } else {
        moduleContent += `*No specific custom questions answered for this module; baseline domain workflows apply.*\n\n`;
      }
    });
    sections.push({
      title: '6. Module-Wise Requirements',
      content: moduleContent,
    });

    // Section 7: Database Requirements
    sections.push({
      title: '7. Database Requirements',
      content: `### 7.1 Entity & Schema Design
• **Users Entity:** \`id\` (UUID, PK), \`email\` (VARCHAR(255), UNIQUE), \`password_hash\` (VARCHAR(255)), \`name\` (VARCHAR(255)), \`role\` (ENUM), \`created_at\`, \`updated_at\`.
• **Projects Entity:** \`id\` (UUID, PK), \`title\` (VARCHAR(255)), \`description\` (TEXT), \`industry\`, \`scale\`, \`status\`, \`user_id\` (FK, users.id).
• **Questionnaire & Answers Entity:** \`id\` (UUID, PK), \`project_id\` (FK), \`question_id\` (FK), \`selected_options\` (JSON), \`text_value\` (TEXT), \`numeric_value\`, \`history\` (JSON).
• **Specification & Requirements Entity:** \`id\` (UUID, PK), \`project_id\` (FK), \`code\`, \`requirement\`, \`developer_hint\`, \`technical_spec\`, \`validation_rules\` (JSON), \`acceptance_criteria\` (JSON).

### 7.2 Database Considerations
• Implement foreign keys with appropriate cascade rules (\`ON DELETE CASCADE\` on project-owned sub-records).
• Apply database indexes on foreign keys (\`project_id\`, \`question_id\`) and search fields (e.g. \`email\`).
• Treat user mobile numbers, postal codes, and identifiers as string types to preserve leading zeros.`,
    });

    // Section 8: API and Backend Requirements
    sections.push({
      title: '8. API and Backend Requirements',
      content: `### 8.1 API Architectural Guidelines
• RESTful endpoints conforming to standard HTTP status codes:
  - \`200 OK\` / \`201 Created\` for successful transactions.
  - \`400 Bad Request\` with structured field-level validation errors.
  - \`401 Unauthorized\` / \`403 Forbidden\` for authentication and authorization denials.
  - \`404 Not Found\` for missing resources.
  - \`409 Conflict\` for duplicate records or concurrent slot booking collisions.

### 8.2 Proposed API Operations (Developer Recommendations)
• \`GET /api/projects/:id\` - Retrieve project details, modules, and completion state.
• \`POST /api/questionnaire/:projectId/save-answers\` - Upsert user answers with full change tracking.
• \`POST /api/frd/generate/:projectId\` - Generate complete specification with Developer Hints and Traceability.
• \`GET /api/frd/:projectId\` - Retrieve the finalized specification document and RTM.
• \`GET /api/frd/export-markdown/:projectId\` & \`export-pdf/:projectId\` - Export specification.`,
    });

    // Section 9: Frontend Requirements
    sections.push({
      title: '9. Frontend Requirements',
      content: `### 9.1 Form Controls & Real-Time Validation
• Input fields must display instant validation feedback on blur and keystroke throttle where appropriate.
• Form submission buttons must display loading spinners and disable duplicate clicks while operations are in flight.
• Error messages must be placed directly adjacent to the offending input control with high-contrast accessibility.

### 9.2 Responsive User Interface
• Mobile-first, responsive layouts supporting desktop (≥ 1024px), tablet (768px - 1023px), and mobile (≤ 767px).
• Accessibility compliance with semantic HTML elements and ARIA labels.`,
    });

    // Section 10: Developer Implementation Notes
    let devNotesContent = `Practical implementation notes and architectural advice for developers:\n\n`;
    requirements.forEach(r => {
      devNotesContent += `#### [${r.id}] ${r.requirementTitle}\n`;
      devNotesContent += `• **Implementation Note:** ${r.developerHint}\n`;
      if (r.frontendGuidance) devNotesContent += `• **Frontend:** ${r.frontendGuidance}\n`;
      if (r.backendGuidance) devNotesContent += `• **Backend:** ${r.backendGuidance}\n`;
      if (r.databaseConsiderations) devNotesContent += `• **Database:** ${r.databaseConsiderations}\n`;
      devNotesContent += `\n`;
    });
    sections.push({
      title: '10. Developer Implementation Notes',
      content: devNotesContent,
    });

    // Section 11: Acceptance Criteria and Testing
    let testContent = `Verifiable criteria and test scenarios for Quality Assurance and developer verification:\n\n`;
    requirements.forEach(r => {
      testContent += `#### Test Suite: ${r.id} (${r.requirementTitle})\n`;
      testContent += `*Source: Q&A ${r.questionCode} ("${r.originalAnswer}")*\n\n`;
      r.acceptanceCriteria.forEach((crit, cIdx) => {
        testContent += `• **TC-${r.id.replace('FR-', '')}.${cIdx + 1}:** ${crit}\n`;
      });
      testContent += `\n`;
    });
    sections.push({
      title: '11. Acceptance Criteria and Testing',
      content: testContent,
    });

    // Section 12: Requirement Traceability Matrix (RTM)
    let rtmContent = `Complete traceability linking every user question and original answer to its generated technical requirement, developer hint, and acceptance test:\n\n`;
    rtmContent += `| Req ID | Question Ref | User Question | Original User Answer | Generated Requirement | Developer Hint | Acceptance Summary | Status |\n`;
    rtmContent += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;
    traceabilityMatrix.forEach(t => {
      const qText = t.questionText.replace(/\|/g, '\\|');
      const aText = t.userAnswer.replace(/\|/g, '\\|');
      const rText = t.generatedRequirement.replace(/\|/g, '\\|');
      const hText = t.developerHint.substring(0, 120).replace(/\|/g, '\\|') + '...';
      const cText = t.acceptanceCriteria.substring(0, 80).replace(/\|/g, '\\|') + '...';
      rtmContent += `| **${t.requirementId}** | \`${t.questionId}\` | ${qText} | **${aText}** | ${rText} | ${hText} | ${cText} | ${t.status} |\n`;
    });
    sections.push({
      title: '12. Requirement Traceability Matrix (RTM)',
      content: rtmContent,
    });

    // Section 13: Clarifications and Assumptions
    const unconfirmed = requirements.filter(r => r.clarificationStatus === 'Clarification Required');
    let clarContent = `Explicit separation of confirmed requirements versus items requiring stakeholder clarification:\n\n`;
    clarContent += `### 13.1 Confirmed Requirements\n`;
    clarContent += `• Total **${requirements.length - unconfirmed.length}** requirements are directly confirmed by user answers.\n\n`;

    clarContent += `### 13.2 Clarifications Required\n`;
    if (unconfirmed.length > 0) {
      clarContent += `The following requirements had blank or ambiguous answers during discovery and require stakeholder sign-off:\n\n`;
      unconfirmed.forEach(u => {
        clarContent += `• **[${u.id} / ${u.questionCode}]:** *${u.originalQuestion}* — Pending exact user input.\n`;
      });
    } else {
      clarContent += `• All discovery questions have been answered. No pending clarifications at this time.\n\n`;
    }

    clarContent += `\n### 13.3 Architectural Assumptions\n`;
    clarContent += `• Standard HTTPS and modern web browser support (Chrome, Firefox, Safari, Edge) are assumed.\n`;
    clarContent += `• Cloud hosting environment supports Node.js LTS and relational database storage.\n`;
    clarContent += `• Third-party APIs (e.g. payment gateways, email delivery) provide standard sandbox environments for testing.`;

    sections.push({
      title: '13. Clarifications and Assumptions',
      content: clarContent,
    });

    return sections;
  }

  /**
   * Builds the comprehensive Markdown document representation
   */
  private buildMarkdown(
    context: ProjectContext,
    sections: { title: string; content: string }[],
    requirements: StructuredRequirement[],
    traceabilityMatrix: any[]
  ): string {
    let md = `# Functional Requirements Document (FRD)\n\n`;
    md += `**Project Name:** ${context.title || 'Untitled Project'}\n`;
    md += `**Domain:** ${context.industry || 'Software'}\n`;
    md += `**Generated:** ${new Date().toISOString()}\n`;
    md += `**Version:** 1.0.0\n\n`;
    md += `---\n\n`;

    sections.forEach(s => {
      md += `## ${s.title}\n\n${s.content}\n\n---\n\n`;
    });

    return md;
  }

  private buildUserFlows(modules: any[], requirements: StructuredRequirement[]): any[] {
    const flows = [
      {
        code: 'UF-001',
        name: 'Primary User Operational Flow',
        description: 'End-to-end workflow executing core business logic according to specified requirements',
        steps: [
          { step: 1, action: 'Access System', actor: 'User', system: 'Render main workspace', result: 'Workspace displayed' },
          { step: 2, action: 'Input Requirements', actor: 'User', system: 'Validate inputs against validation rules', result: 'Input validated' },
          { step: 3, action: 'Execute Operation', actor: 'System', system: 'Process transaction with database lock', result: 'Data persisted' },
          { step: 4, action: 'Confirmation', actor: 'System', system: 'Generate receipt / confirmation response', result: 'Operation completed' },
        ],
      },
      {
        code: 'UF-002',
        name: 'Exception and Validation Handling Flow',
        description: 'Workflow triggered when invalid input or conflicting records are detected',
        steps: [
          { step: 1, action: 'Submit Invalid Value', actor: 'User', system: 'Run validation rules', result: 'Validation error flagged' },
          { step: 2, action: 'Display Error Feedback', actor: 'System', system: 'Render specific inline error message', result: 'Error clearly displayed' },
          { step: 3, action: 'Correct Input', actor: 'User', system: 'Re-validate field on blur', result: 'Valid input accepted' },
        ],
      },
    ];

    return flows;
  }

  private buildIntegrations(context: ProjectContext, requirements: StructuredRequirement[]): any[] {
    const integrations: any[] = [];
    const text = requirements.map(r => `${r.originalQuestion} ${r.originalAnswer}`).join(' ').toLowerCase();

    if (text.includes('payment') || text.includes('upi') || text.includes('card') || text.includes('stripe') || text.includes('razorpay')) {
      integrations.push({
        name: 'Payment Gateway',
        category: 'Billing',
        required: true,
        configuration: ['API Key', 'Webhook Secret', 'Merchant ID'],
      });
    }

    if (text.includes('email') || text.includes('mail') || text.includes('notification')) {
      integrations.push({
        name: 'Email Service Provider (SMTP / SendGrid)',
        category: 'Communications',
        required: false,
        configuration: ['SMTP Host', 'Port', 'API Key'],
      });
    }

    if (text.includes('sms') || text.includes('otp') || text.includes('mobile')) {
      integrations.push({
        name: 'SMS / OTP Gateway',
        category: 'Authentication',
        required: false,
        configuration: ['API Secret', 'Sender ID'],
      });
    }

    return integrations;
  }

  private buildBaselineRequirements(context: ProjectContext): StructuredRequirement[] {
    const defaultItem = developerHintService.analyzeRequirement(
      context,
      { name: 'Core Functionality' },
      { id: 'q-default', question: 'What is the primary objective of this system?', required: true, type: 'text' },
      { textValue: context.description || 'Deliver functional system features' },
      0
    );
    return [defaultItem];
  }
}

export const frdGenerator = FRDGeneratorService.getInstance();
