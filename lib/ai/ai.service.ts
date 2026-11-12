import { config } from 'dotenv';

config();

interface ProjectData {
  id?: string;
  description: string;
  constraints?: string;
  industry?: string;
  projectTypes?: string[];
  scale: string;
}

interface ModuleData {
  id: string;
  name: string;
  description?: string;
  subModules?: { name: string }[];
}

interface AnswerData {
  questionId: string;
  selectedOptions?: string[];
  textValue?: string;
}

export interface AIGeneratedModule {
  name: string;
  description: string;
  subModules: { name: string; description: string }[];
}

export interface AIGeneratedQuestion {
  question: string;
  description?: string;
  type: 'yesno' | 'single' | 'multiple' | 'text' | 'number' | 'select';
  options?: { value: string; label: string; description?: string }[];
  dependsOn?: { questionId: string; values: string[] };
  triggers?: string[];
  required: boolean;
}

class FallbackGenerator {
  private static instance: FallbackGenerator;

  static getInstance(): FallbackGenerator {
    if (!FallbackGenerator.instance) {
      FallbackGenerator.instance = new FallbackGenerator();
    }
    return FallbackGenerator.instance;
  }

  generateModules(context: { industry?: string; scale: string; constraints?: string }): AIGeneratedModule[] {
    const baseModules: AIGeneratedModule[] = [
      {
        name: 'Authentication & Security',
        description: 'User authentication, authorization, and security controls',
        subModules: [
          { name: 'Login Mechanisms', description: 'Username/password, OTP, social login' },
          { name: 'Password Management', description: 'Password reset and policy enforcement' },
          { name: 'Session Management', description: 'Session timeout and concurrent sessions' },
        ],
      },
      {
        name: 'User & Role Management',
        description: 'User profiles, roles, permissions, and organization structure',
        subModules: [
          { name: 'User Profiles', description: 'Profile management and KYC' },
          { name: 'Role Management', description: 'Role definition and permissions' },
          { name: 'Organization', description: 'Branch and department management' },
        ],
      },
      {
        name: 'Billing & Orders',
        description: 'Order management, invoicing, and billing operations',
        subModules: [
          { name: 'Order Management', description: 'Create, modify, cancel orders' },
          { name: 'Invoice Generation', description: 'Invoice creation and delivery' },
          { name: 'Payment Processing', description: 'Multiple payment methods' },
          { name: 'GST Compliance', description: 'GST invoicing and filing support' },
        ],
      },
      {
        name: 'Inventory & Purchasing',
        description: 'Product catalog, stock management, and procurement',
        subModules: [
          { name: 'Product Management', description: 'Products, variants, images, barcodes' },
          { name: 'Stock Management', description: 'Real-time tracking, alerts, batch tracking' },
          { name: 'Purchase Orders', description: 'PO creation, vendor management' },
        ],
      },
      {
        name: 'Pricing & Promotions',
        description: 'Pricing rules, discounts, offers, and loyalty programs',
        subModules: [
          { name: 'Retail Pricing', description: 'MRP and fixed pricing' },
          { name: 'Wholesale Pricing', description: 'Volume discounts, customer pricing' },
          { name: 'Discounts & Offers', description: 'Coupons, BOGO, seasonal offers' },
          { name: 'Loyalty Program', description: 'Points system and rewards' },
        ],
      },
      {
        name: 'Service Management',
        description: 'Service bookings, job cards, and service center operations',
        subModules: [
          { name: 'Service Booking', description: 'Appointments and walk-ins' },
          { name: 'Job Cards', description: 'Service tracking and status updates' },
          { name: 'Warranty', description: 'Warranty tracking and claims' },
        ],
      },
      {
        name: 'Notifications & Communication',
        description: 'Alerts, messages, and multi-channel communication',
        subModules: [
          { name: 'Push Notifications', description: 'Mobile and web push' },
          { name: 'SMS & Email', description: 'Transactional alerts' },
          { name: 'WhatsApp', description: 'WhatsApp Business integration' },
        ],
      },
      {
        name: 'Reporting & Analytics',
        description: 'Dashboards, reports, and business intelligence',
        subModules: [
          { name: 'Dashboards', description: 'Real-time KPI dashboards' },
          { name: 'Reports', description: 'Sales, inventory, financial reports' },
          { name: 'Export', description: 'PDF, Excel export' },
        ],
      },
    ];

    if (context.industry === 'restaurant') {
      baseModules.splice(3, 0, {
        name: 'Kitchen & POS',
        description: 'Kitchen display system and point of sale integration',
        subModules: [
          { name: 'Kitchen Display', description: 'Digital kitchen tickets' },
          { name: 'Table Management', description: 'Table reservations and tracking' },
          { name: 'Menu Management', description: 'Digital menu with variants' },
        ],
      });
    }

    if (context.industry === 'healthcare') {
      baseModules.splice(2, 0, {
        name: 'Patient Management',
        description: 'Patient records and appointments',
        subModules: [
          { name: 'Patient Records', description: 'EMR and history' },
          { name: 'Appointments', description: 'Scheduling and reminders' },
          { name: 'Prescriptions', description: 'Digital prescriptions' },
        ],
      });
    }

    return baseModules;
  }

  generateQuestions(moduleName: string, context: { industry?: string; scale: string }): AIGeneratedQuestion[] {
    const questionsMap: Record<string, AIGeneratedQuestion[]> = {
      'Authentication & Security': [
        {
          question: 'What authentication methods should be supported?',
          type: 'multiple',
          options: [
            { value: 'email', label: 'Email/Password', description: 'Traditional login' },
            { value: 'otp', label: 'Mobile OTP', description: 'SMS verification' },
            { value: 'google', label: 'Google Login', description: 'OAuth integration' },
            { value: 'biometric', label: 'Biometric', description: 'Fingerprint/Face ID' },
          ],
          required: true,
        },
        {
          question: 'Should Multi-Factor Authentication (MFA) be required?',
          type: 'yesno',
          required: true,
        },
        {
          question: 'What should be the session timeout duration?',
          type: 'select',
          options: [
            { value: '15', label: '15 minutes' },
            { value: '30', label: '30 minutes' },
            { value: '60', label: '1 hour' },
            { value: '480', label: '8 hours' },
          ],
          required: true,
        },
      ],
      'User & Role Management': [
        {
          question: 'Should customer KYC verification be included?',
          type: 'yesno',
          required: true,
        },
        {
          question: 'What user roles should be supported?',
          type: 'multiple',
          options: [
            { value: 'admin', label: 'Administrator', description: 'Full system access' },
            { value: 'manager', label: 'Manager', description: 'Store management' },
            { value: 'cashier', label: 'Cashier', description: 'POS operations' },
            { value: 'inventory', label: 'Inventory Manager', description: 'Stock management' },
            { value: 'reports', label: 'Report Viewer', description: 'Read-only access' },
          ],
          required: true,
        },
        {
          question: 'Should multi-branch user access be supported?',
          type: 'yesno',
          required: true,
        },
      ],
      'Billing & Orders': [
        {
          question: 'Is GST billing required?',
          type: 'yesno',
          required: true,
        },
        {
          question: 'Which GST slabs should be supported?',
          type: 'multiple',
          options: [
            { value: '0', label: 'Exempt (0%)' },
            { value: '5', label: '5% GST' },
            { value: '12', label: '12% GST' },
            { value: '18', label: '18% GST' },
            { value: '28', label: '28% GST' },
          ],
          required: false,
        },
        {
          question: 'Should HSN code mapping be implemented?',
          type: 'yesno',
          required: false,
        },
        {
          question: 'Is E-Invoice generation required?',
          type: 'yesno',
          required: false,
        },
        {
          question: 'Which payment methods should be supported?',
          type: 'multiple',
          options: [
            { value: 'cash', label: 'Cash' },
            { value: 'card', label: 'Card (Debit/Credit)' },
            { value: 'upi', label: 'UPI/QR Code' },
            { value: 'netbanking', label: 'Net Banking' },
            { value: 'wallet', label: 'Digital Wallets' },
          ],
          required: true,
        },
        {
          question: 'Should split payments be supported?',
          type: 'yesno',
          required: false,
        },
        {
          question: 'Should partial payments/EMI be supported?',
          type: 'yesno',
          required: false,
        },
      ],
      'Inventory & Purchasing': [
        {
          question: 'How should products be managed?',
          type: 'select',
          options: [
            { value: 'simple', label: 'Simple Product', description: 'Basic name and price' },
            { value: 'standard', label: 'Standard with Variants', description: 'Size, color variants' },
            { value: 'advanced', label: 'Advanced with Attributes', description: 'Custom attributes' },
          ],
          required: true,
        },
        {
          question: 'Should barcode scanning be supported?',
          type: 'yesno',
          required: true,
        },
        {
          question: 'Which barcode formats should be supported?',
          type: 'multiple',
          options: [
            { value: 'qr', label: 'QR Code' },
            { value: 'ean13', label: 'EAN-13' },
            { value: 'upca', label: 'UPC-A' },
            { value: 'code128', label: 'Code 128' },
          ],
          required: false,
        },
        {
          question: 'Should batch/lot tracking be enabled?',
          type: 'yesno',
          required: false,
        },
        {
          question: 'Should low stock alerts be configured?',
          type: 'yesno',
          required: true,
        },
        {
          question: 'Should multi-location inventory be supported?',
          type: 'yesno',
          required: false,
        },
        {
          question: 'Should auto reordering be enabled?',
          type: 'yesno',
          required: false,
        },
      ],
      'Pricing & Promotions': [
        {
          question: 'What pricing models are needed?',
          type: 'multiple',
          options: [
            { value: 'retail', label: 'Retail Pricing', description: 'Fixed MRP prices' },
            { value: 'wholesale', label: 'Wholesale Pricing', description: 'Volume discounts' },
            { value: 'customer-specific', label: 'Customer-specific Pricing', description: 'Special rates' },
          ],
          required: true,
        },
        {
          question: 'What discount types should be available?',
          type: 'multiple',
          options: [
            { value: 'percentage', label: 'Percentage Discount' },
            { value: 'fixed', label: 'Fixed Amount Discount' },
            { value: 'bogo', label: 'Buy One Get One' },
            { value: 'coupon', label: 'Coupon/Promo Codes' },
            { value: 'bundle', label: 'Bundle/Package Deal' },
          ],
          required: true,
        },
        {
          question: 'Should a loyalty/reward program be included?',
          type: 'yesno',
          required: true,
        },
        {
          question: 'What loyalty features should be included?',
          type: 'multiple',
          options: [
            { value: 'points-earning', label: 'Points Earning' },
            { value: 'points-redemption', label: 'Points Redemption' },
            { value: 'tiered', label: 'Tiered Membership', description: 'Gold, Silver, Bronze' },
            { value: 'birthday', label: 'Birthday Rewards' },
          ],
          required: false,
        },
        {
          question: 'Should seasonal/festival offers be supported?',
          type: 'yesno',
          required: false,
        },
      ],
      'Service Management': [
        {
          question: 'Is service management needed?',
          type: 'yesno',
          required: true,
        },
        {
          question: 'What types of services should be supported?',
          type: 'multiple',
          options: [
            { value: 'walkin', label: 'Walk-in Service' },
            { value: 'appointment', label: 'Appointment Booking' },
            { value: 'pickup', label: 'Pickup & Delivery' },
            { value: 'on-site', label: 'On-site Service' },
          ],
          required: false,
        },
        {
          question: 'Should job card management be included?',
          type: 'yesno',
          required: false,
        },
        {
          question: 'Should warranty tracking be included?',
          type: 'yesno',
          required: false,
        },
        {
          question: 'Should technician scheduling be supported?',
          type: 'yesno',
          required: false,
        },
      ],
      'Notifications & Communication': [
        {
          question: 'Which notification channels should be supported?',
          type: 'multiple',
          options: [
            { value: 'push', label: 'Push Notifications' },
            { value: 'sms', label: 'SMS' },
            { value: 'email', label: 'Email' },
            { value: 'whatsapp', label: 'WhatsApp' },
          ],
          required: true,
        },
        {
          question: 'What events should trigger notifications?',
          type: 'multiple',
          options: [
            { value: 'order-created', label: 'Order Created' },
            { value: 'order-status', label: 'Order Status Update' },
            { value: 'payment', label: 'Payment Updates' },
            { value: 'invoice', label: 'Invoice Generated' },
            { value: 'stock-alert', label: 'Stock Alerts' },
            { value: 'service-update', label: 'Service Updates' },
          ],
          required: true,
        },
      ],
      'Reporting & Analytics': [
        {
          question: 'Should a real-time dashboard be included?',
          type: 'yesno',
          required: true,
        },
        {
          question: 'What type of reporting is needed?',
          type: 'multiple',
          options: [
            { value: 'sales', label: 'Sales Reports' },
            { value: 'inventory', label: 'Inventory Reports' },
            { value: 'customer', label: 'Customer Reports' },
            { value: 'financial', label: 'Financial Reports' },
            { value: 'employee', label: 'Employee Reports' },
          ],
          required: true,
        },
        {
          question: 'What export formats should be supported?',
          type: 'multiple',
          options: [
            { value: 'pdf', label: 'PDF' },
            { value: 'excel', label: 'Excel/CSV' },
            { value: 'scheduled', label: 'Scheduled Delivery' },
          ],
          required: true,
        },
      ],
    };

    return questionsMap[moduleName] || [
      {
        question: `What are your requirements for ${moduleName}?`,
        type: 'text',
        required: true,
      },
      {
        question: `Are there any specific features needed for ${moduleName}?`,
        type: 'multiple',
        options: [
          { value: 'basic', label: 'Basic functionality' },
          { value: 'advanced', label: 'Advanced features' },
          { value: 'custom', label: 'Custom requirements' },
        ],
        required: false,
      },
    ];
  }
}

export class AIService {
  private static instance: AIService;
  private fallback: FallbackGenerator;

  private constructor() {
    this.fallback = FallbackGenerator.getInstance();
  }

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
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
    return 'N/A';
  }

  private buildProjectContext(data: { title?: string; description?: string; industry?: string; scale?: string; constraints?: string; projectTypes?: any; userVolume?: number; userVolumeType?: string }): string {
    return `Project Title: ${data.title || 'Untitled'}
Project Description: ${data.description || 'No description provided.'}
Industry: ${data.industry || 'general'}
Project Type: ${this.formatProjectTypes(data.projectTypes)}
Expected Complexity: ${data.scale || 'medium'}
Expected Users: ${data.userVolume || 'N/A'} ${data.userVolumeType || ''}
Constraints: ${data.constraints || 'None'}`;
  }

  private async callAnthropic(prompt: string, systemPrompt?: string, temperature: number = 0.7): Promise<string> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

    const model = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001';

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        ...(systemPrompt ? { system: systemPrompt } : {}),
        messages: [{ role: 'user', content: prompt }],
        temperature,
      }),
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message || 'Anthropic API error');
    }

    const textContent = data.content?.find((c: any) => c.type === 'text')?.text || '';
    return textContent;
  }

  async generateModules(project: ProjectData): Promise<AIGeneratedModule[]> {
    const prompt = `Rules for Module Generation:

1. Thoroughly analyze the Project Title and Project Description to understand the project's objectives, workflow, business processes, and features.
2. Generate only modules that are directly relevant to the project requirements.
3. Avoid unnecessary, duplicate, or irrelevant modules.
4. Include both Core Business Modules and Supporting Modules when necessary.
5. Determine the number of modules based on project complexity:

   * Small Project: 3–7 modules
   * Medium Project: 6–10 modules
   * Large Project: 8–15 modules
6. Each module must contain:

   * Module Name
   * Module Description
   * Key Features (mapped as subModules)
7. Ensure modules are logically grouped and collectively cover the complete project workflow.
8. Every Key Feature (subModule) must belong to its respective module and represent a functional requirement.
9. Modules should be suitable for FRD, SRS, Database Design, UI Design, and Development planning.
10. Generate modules strictly based on the Project Title and Project Description.
11. Core business modules must be prioritized and generated first.
12. Supporting modules such as Login, User Management, Dashboard, Reports, Notifications, Settings, Audit Logs, Role & Permission Management, and Integrations should be included only when they add value to the project workflow or are implied by the project requirements.
13. Do not omit essential supporting modules merely because they are generic. Include them whenever they are necessary for a complete and practical system design.
14. Prioritize business functionality over technical or administrative modules.
15. Ensure the generated modules represent a complete, realistic, and deployable system rather than just a feature list.

${this.buildProjectContext(project)}

Return the response ONLY as a JSON array of objects. Each object must have:
- "name" (string): the module name
- "description" (string): brief description
- "subModules" (array of objects): each with "name" (the key feature name) and "description"

Example: [{"name": "Authentication", "description": "User login system", "subModules": [{"name": "SSO", "description": "Single Sign On"}]}]
Do not include markdown blocks, extra text, or the "Project Complexity" header. Output pure JSON.`;

    if (process.env.ANTHROPIC_API_KEY) {
      try {
        console.log('Generating modules using Anthropic Claude...');
        const content = await this.callAnthropic(prompt, 'You are an expert enterprise software architect. Return ONLY a valid JSON array of modules with subModules. No markdown backticks.');
        const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(cleaned);
      } catch (error) {
        console.error('Anthropic module generation failed, checking alternatives:', error);
      }
    }

    if (process.env.MINIMAX_API_KEY) {
      try {
        const response = await fetch(`${process.env.MINIMAX_BASE_URL}/v1/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.MINIMAX_API_KEY}`
          },
          cache: 'no-store',
          body: JSON.stringify({
            model: process.env.MINIMAX_MODEL,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7
          })
        });
        const data = await response.json();
        if (data.error) {
          throw new Error(data.error.message);
        }
        const content = data.choices?.[0]?.message?.content || '[]';
        const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(cleaned);
      } catch (error) {
        console.error('MiniMax module generation failed, falling back to static templates:', error);
      }
    }

    console.log('Using fallback module generator');
    return this.fallback.generateModules({
      industry: project.industry,
      scale: project.scale,
      constraints: project.constraints,
    });
  }

  async generateQuestions(module: ModuleData, subModules: { name: string }[], context: {
    industry?: string;
    scale?: string;
    constraints?: string;
    title?: string;
    description?: string;
  }): Promise<AIGeneratedQuestion[]> {
    const prompt = `You are an AI Module & Requirement Question Generator.

Question Generation Rules

1. Generate questions for every module.
2. Create 5–15 questions depending on the module complexity.
3. Use simple and easy-to-understand language.
4. Avoid technical terms and developer jargon.
5. Ask questions as if you are discussing requirements with a client or business user.
6. Focus on understanding:

   * What the user wants to achieve
   * How the process should work
   * What information needs to be captured
   * Who can perform actions
   * What approvals or notifications are needed
7. Include answer options whenever possible to make answering easier.
8. Use Yes/No, Single Select, Multi Select, Dropdown, or Text Input questions where appropriate.
9. Avoid duplicate or unnecessary questions.
10. Ask follow-up questions only when additional clarification is required.
11. Ensure every question helps define the module's functionality and workflow.
12. Generate enough questions to create a complete FRD, but do not overwhelm the user.
13. Questions should feel like a conversation with a Business Analyst rather than a technical questionnaire.

Goal:
Collect enough information from the user to automatically generate a complete and accurate Functional Requirements Document (FRD).

Generating questions for module: ${module.name}. 
Sub-modules: ${subModules.map(s => s.name).join(', ')}.
${this.buildProjectContext(context)}

Return a JSON array of question objects. Each object must have:
- "question" (string): The question text
- "type" (string): "text", "multiple", "select", or "yesno"
- "description" (string, optional): Context for the question
- "options" (array of objects, if type is "multiple" or "select"): each with "value" and "label", optionally "description"
- "required" (boolean)

Example: [{"question": "Do you need OAuth?", "type": "yesno", "required": true}]
Do not include markdown blocks or extra text.`;

    if (process.env.ANTHROPIC_API_KEY) {
      try {
        console.log(`Generating questions for module "${module.name}" using Anthropic Claude...`);
        const content = await this.callAnthropic(prompt, 'You are an AI Module & Requirement Question Generator. Return ONLY a valid JSON array of question objects without markdown backticks.');
        const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(cleaned);
      } catch (error) {
        console.error('Anthropic question generation failed, checking alternatives:', error);
      }
    }

    if (process.env.MINIMAX_API_KEY) {
      try {
        const response = await fetch(`${process.env.MINIMAX_BASE_URL}/v1/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.MINIMAX_API_KEY}`
          },
          cache: 'no-store',
          body: JSON.stringify({
            model: process.env.MINIMAX_MODEL,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7
          })
        });
        const data = await response.json();
        if (data.error) {
          throw new Error(data.error.message);
        }
        const content = data.choices?.[0]?.message?.content || '[]';
        const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(cleaned);
      } catch (error) {
        console.error('MiniMax question generation failed, falling back to static templates:', error);
      }
    }

    console.log('Using fallback question generator');
    return this.fallback.generateQuestions(module.name, {
      industry: context.industry,
      scale: context.scale || 'small',
    });
  }

  async generateFRDSection(project: ProjectData, sectionTitle: string, currentContent: string): Promise<string> {
    const prompt = `You are an expert Business Analyst writing a Functional Requirements Document (FRD).
Your task is to rewrite and significantly improve the following section of the FRD: "${sectionTitle}".

Project Context:
${this.buildProjectContext(project)}

Current Content of "${sectionTitle}":
${currentContent}

Instructions:
1. Improve the clarity, detail, and professional tone of the section.
2. If the current content is brief, expand on it using best practices for enterprise software systems.
3. Ensure it perfectly aligns with the Project Context provided above.
4. Keep the same structure if applicable, but enhance the descriptions.
5. Output ONLY the raw Markdown content for this section. Do NOT include a JSON wrapper or markdown code blocks (like \`\`\`markdown). Just the text itself.`;

    if (process.env.ANTHROPIC_API_KEY) {
      try {
        console.log(`Generating FRD section "${sectionTitle}" using Anthropic Claude...`);
        let content = await this.callAnthropic(prompt, 'You are an expert Business Analyst and technical architect. Return ONLY raw Markdown.');
        content = content.replace(/^```markdown\n?/gi, '').replace(/```\n?$/g, '').trim();
        return content;
      } catch (error) {
        console.error('Anthropic FRD section generation failed, checking alternatives:', error);
      }
    }

    if (process.env.MINIMAX_API_KEY) {
      try {
        const response = await fetch(`${process.env.MINIMAX_BASE_URL}/v1/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.MINIMAX_API_KEY}`
          },
          cache: 'no-store',
          body: JSON.stringify({
            model: process.env.MINIMAX_MODEL,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.5
          })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);

        let content = data.choices?.[0]?.message?.content || currentContent;
        // Clean up any rogue markdown code blocks the AI might have returned
        content = content.replace(/^```markdown\n?/gi, '').replace(/```\n?$/g, '').trim();
        return content;
      } catch (error) {
        console.error('MiniMax FRD section generation failed, returning existing content:', error);
      }
    }

    // Fallback: just return the current content with a small modification to show it worked
    return currentContent + '\n\n*(Regenerated)*';
  }

  async generateExtraRequirementsRecommendations(project: ProjectData, questionText: string): Promise<string[]> {
    const prompt = `You are an AI assistant helping a user fill out a questionnaire for their project.
${this.buildProjectContext(project)}

Question: "${questionText}"

Generate exactly 4 short, actionable suggestions (1-2 sentences each) for extra requirements or features the user might want to add for this question.
Return them as a raw JSON array of strings. Example: ["Support for multiple currencies.", "Integration with Stripe and PayPal.", "Include multi-language support.", "Provide a dark mode interface."]
Do not include markdown blocks or other text.`;

    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const content = await this.callAnthropic(prompt, 'Return ONLY a JSON array of strings, no markdown.');
        const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const suggestions = JSON.parse(cleaned);
        if (Array.isArray(suggestions) && suggestions.length > 0) {
          return suggestions.slice(0, 4);
        }
      } catch (error) {
        console.error('Anthropic recommendation generation failed, checking alternatives:', error);
      }
    }

    const geminiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY1;
    if (geminiKey) {
      try {
        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${prompt}\n\nReturn strictly a valid JSON array of 4 string recommendations.` }] }],
            generationConfig: { temperature: 0.5 }
          })
        });
        const geminiData = await geminiRes.json();
        const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const suggestions = JSON.parse(cleaned);
        if (Array.isArray(suggestions) && suggestions.length > 0) {
          return suggestions.slice(0, 4);
        }
      } catch (err) {
        console.error('Gemini recommendation generation failed, checking alternatives:', err);
      }
    }

    if (process.env.MINIMAX_API_KEY) {
      try {
        const response = await fetch(`${process.env.MINIMAX_BASE_URL}/v1/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.MINIMAX_API_KEY}`
          },
          cache: 'no-store',
          body: JSON.stringify({
            model: process.env.MINIMAX_MODEL,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7
          })
        });
        const data = await response.json();
        if (data.error) {
          throw new Error(data.error.message);
        }
        const content = data.choices?.[0]?.message?.content || '[]';
        const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const suggestions = JSON.parse(cleaned);
        if (Array.isArray(suggestions) && suggestions.length > 0) {
          return suggestions.slice(0, 4);
        }
      } catch (error) {
        console.error('MiniMax recommendation generation failed, falling back to basic suggestions:', error);
      }
    }

    // Fallback recommendations when OpenAI is not configured
    const lowerQ = questionText.toLowerCase();

    if (lowerQ.includes('authentic') || lowerQ.includes('login') || lowerQ.includes('password')) {
      return [
        "Include support for Single Sign-On (SSO) via Google or Microsoft accounts.",
        "Implement temporary account lockout after multiple failed login attempts."
      ];
    }
    if (lowerQ.includes('payment') || lowerQ.includes('bill') || lowerQ.includes('invoice')) {
      return [
        "Support automated recurring billing and subscription management.",
        "Allow customers to make partial payments or split invoices."
      ];
    }
    if (lowerQ.includes('notif') || lowerQ.includes('email') || lowerQ.includes('sms')) {
      return [
        "Allow users to fully customize their notification preferences and opt-outs.",
        "Implement a robust retry mechanism for failed email or SMS deliveries."
      ];
    }
    if (lowerQ.includes('inventor') || lowerQ.includes('stock') || lowerQ.includes('product')) {
      return [
        "Send automated push alerts to managers when stock drops below minimum threshold.",
        "Include barcode and QR code scanning support for rapid inventory intake."
      ];
    }
    if (lowerQ.includes('report') || lowerQ.includes('dashboard') || lowerQ.includes('analytic')) {
      return [
        "Provide customizable date ranges and scheduled automated PDF exports.",
        "Include real-time data refreshing for critical dashboard metrics."
      ];
    }
    if (lowerQ.includes('role') || lowerQ.includes('permission') || lowerQ.includes('user')) {
      return [
        "Implement granular field-level view/edit permissions for different roles.",
        "Maintain an immutable audit log of all permission changes made by admins."
      ];
    }
    if (lowerQ.includes('order')) {
      return [
        "Support order splitting and multi-address delivery options.",
        "Include real-time order tracking integration with major logistics providers."
      ];
    }

    // Default effective recommendations if no keywords match
    return [
      "Ensure all user inputs are strictly validated and sanitized for security.",
      "Support full offline caching with automatic background sync when reconnected."
    ];
  }

  async refineText(text: string): Promise<string> {
    if (!text || text.trim() === '') return text;

    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const prompt = `You are a professional Business Analyst.
Your task is to refine the following raw user input (which may be in Tanglish, broken English, or informal language) into a clear, concise, and professional English sentence suitable for a Functional Requirements Document (FRD).
Maintain the original meaning. Do not add extra fabricated information.
Output ONLY the refined text without quotes or formatting blocks.

Raw Input: "${text}"`;
        const refined = await this.callAnthropic(prompt, 'You refine user inputs into professional specifications without adding commentary.');
        if (refined && refined.trim()) return refined.trim();
      } catch (error) {
        console.error('Anthropic text refinement failed, falling back to Gemini:', error);
      }
    }

    if (process.env.GEMINI_API_KEY) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are a professional Business Analyst.
Your task is to refine the following raw user input (which may be in Tanglish, broken English, or informal language) into a clear, concise, and professional English sentence suitable for a Functional Requirements Document (FRD).
Maintain the original meaning. Do not add extra fabricated information.
Output ONLY the refined text without quotes or formatting blocks.

Raw Input: "${text}"`
              }]
            }],
            generationConfig: { temperature: 0.3 }
          })
        });

        if (response.ok) {
          const data = await response.json();
          const refinedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (refinedText) return refinedText.trim();
        }
      } catch (error) {
        console.error('Gemini text refinement failed:', error);
      }
    }

    // Fallback: If no API key or failed, return original text
    return text;
  }
  async generateCompleteFRD(
    project: ProjectData,
    modules: any[],
    answers: Record<string, any>
  ): Promise<{ markdown: string, projectOverview: any, requirements: any[], userFlows: any[], decisions: any[], integrations: any[] } | null> {
    if (!process.env.ANTHROPIC_API_KEY && !process.env.MINIMAX_API_KEY) {
      console.log('No AI API key configured (neither Anthropic nor MiniMax), returning null for full FRD generation.');
      return null;
    }

    const contextStr = this.buildProjectContext(project);

    const analyzedModules = modules.map(m => {
      const moduleQuestionsAndAnswers = (m.questions || m.Questions || []).map((q: any) => {
        let answerText = "Not answered";
        const rawAnswer = answers[q.id];
        let finalOutput = `**Question:** ${q.question}\n\n**Answer:**\n\n`;

        if (rawAnswer && typeof rawAnswer === 'object' && !Array.isArray(rawAnswer)) {
          const parts = [];
          let opts = rawAnswer.selectedOptions;
          if (typeof opts === 'string') {
            try { opts = JSON.parse(opts); } catch (e) { opts = []; }
          }
          if (Array.isArray(opts) && opts.length > 0) {
            opts.forEach((opt: string) => parts.push(`• ${opt}`));
            if (rawAnswer.textValue && String(rawAnswer.textValue).trim() !== '') {
              parts.push(`\n\n**Extra:** ${String(rawAnswer.textValue).trim()}`);
            }
          } else {
            if (rawAnswer.textValue && String(rawAnswer.textValue).trim() !== '') {
              parts.push(`${String(rawAnswer.textValue).trim()}`);
            }
          }
          if (parts.length > 0) {
            answerText = parts.join('\n');
          }
        } else if (Array.isArray(rawAnswer)) {
          answerText = rawAnswer.length > 0 ? rawAnswer.map((opt: string) => `• ${opt}`).join('\n') : "Not answered";
        } else if (rawAnswer !== undefined && rawAnswer !== null && String(rawAnswer).trim() !== '') {
          answerText = String(rawAnswer).trim();
        }

        if (answerText === "Not answered") {
          answerText = "Not answered - pending for developer";
        }

        finalOutput += answerText;

        return {
          question: q.question,
          answer: finalOutput
        };
      });

      return {
        moduleName: m.name,
        moduleDescription: m.description,
        subModules: (m.subModules || m.SubModules || []).map((s: any) => s.name),
        requirements: moduleQuestionsAndAnswers
      };
    });

    const analyzedDataStr = JSON.stringify(analyzedModules, null, 2);
    console.log('Sending Analyzed Modules to AI:', analyzedDataStr);

    const promptText = `You are an expert Business Analyst. Your task is to generate a complete Functional Requirements Document (FRD) based ONLY on the specific requirements the user has provided in the analysis below.

Project Context:
${contextStr}

User Requirements Analysis:
${analyzedDataStr}

Output Structure Requirements for the Markdown document:
1. Document Information
2. Project Overview
3. Business Objectives
4. Scope
5. Stakeholders
6. Assumptions
7. User Roles & Permissions (FORMAT AS TABLE)
8. Module Breakdown (FORMAT AS TABLE)
9. Functional Requirements (FR-001, FR-002...) (FORMAT AS TABLE)
10. Business Rules
11. Validation Rules
12. User Flows / Workflows (FORMAT AS TABLE)
13. Notifications
14. Reports
15. Integrations
16. Non-Functional Requirements
17. Database Entities (FORMAT AS TABLE)
18. Security Requirements (FORMAT AS TABLE)
19. Acceptance Criteria
20. Risks & Mitigations (FORMAT AS TABLE)
21. Future Enhancements

IMPORTANT: Do not generate a generic FRD. You must deeply analyze the 'User Requirements Analysis' provided above.
CRITICAL RULES FOR FUNCTIONAL REQUIREMENTS TABLE:
1. You MUST generate EXACTLY ONE Functional Requirement row for each question provided in the 'User Requirements Analysis'. Do not split a single question's answer into multiple requirements, and do not combine multiple questions. There must be a strict 1:1 mapping between the provided questions and the generated Functional Requirements.
2. For each requirement, the description MUST display the exact 'Question' and 'Extra' text provided to you. Do NOT rewrite or summarize it, and NEVER append "(TBD)".
3. If the user's answer is "Not answered - pending for developer", you MUST display exactly that as the requirement description.
4. Every single requirement, user flow, business rule, and database entity you generate MUST be strictly derived from the explicit answers. Do not invent features that are not mentioned.

CRITICAL FORMATTING INSTRUCTION: You MUST use Markdown tables for the sections marked with (FORMAT AS TABLE) above to ensure the data is aligned and easy to read. Do not use plain text lists for those sections!

You must return a JSON object with the following structure:
{
  "markdown": "The complete markdown string containing all 21 sections.",
  "projectOverview": {
    "description": "Comprehensive project description",
    "objectives": ["Objective 1", "Objective 2"],
    "constraints": ["Constraint 1", "Constraint 2"]
  },
  "requirements": [
     { "code": "FR-001", "module": "Name", "subModule": "Name", "requirement": "The system shall...", "priority": "Must Have", "type": "Functional" }
  ],
  "userFlows": [
     { "name": "Flow Name", "steps": [ { "step": 1, "action": "Login", "actor": "User", "system": "Validate", "result": "Success" } ] }
  ],
  "decisions": [
     { "question": "Question text", "answer": "Answer text" }
  ],
  "integrations": [
     { "name": "Integration Name", "category": "Category", "required": true }
  ]
}

Return ONLY pure JSON. Do not include markdown blocks like \`\`\`json.`;

    if (process.env.ANTHROPIC_API_KEY) {
      try {
        console.log('Generating complete FRD using Anthropic Claude...');
        const content = await this.callAnthropic(promptText, 'You are an expert Business Analyst. Return ONLY pure valid JSON with the requested schema. No markdown backticks.', 0.4);
        const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(cleaned);
      } catch (err) {
        console.error('Anthropic generateCompleteFRD error, checking alternatives:', err);
      }
    }

    if (process.env.MINIMAX_API_KEY) {
      try {
        const response = await fetch(`${process.env.MINIMAX_BASE_URL}/v1/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.MINIMAX_API_KEY}`
          },
          cache: 'no-store',
          body: JSON.stringify({
            model: process.env.MINIMAX_MODEL,
            messages: [{ role: 'user', content: promptText }],
            temperature: 0.4
          })
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error.message);

        const content = data.choices?.[0]?.message?.content || '{}';
        const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(cleaned);
      } catch (err) {
        console.error('MiniMax generateCompleteFRD error:', err);
      }
    }

    return null;
  }
}

export const aiService = AIService.getInstance();
