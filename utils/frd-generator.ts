import {
  ProjectAnswers,
  FRD,
  FunctionalRequirement,
  UserFlow,
  TechnicalSpec,
  Integration,
} from '../types';
import { allModules } from '../modules';
import { mcqSections } from '../data/mcq-questions';
import { 
  FRDDocument, 
  FunctionalRequirement as DBFunctionalRequirement, 
  UserFlow as DBUserFlow, 
  Integration as DBIntegration, 
  Decision as DBDecision 
} from '../lib/db/models';

export class FRDGenerator {
  private answers: ProjectAnswers;
  private projectDescription: string;
  private constraints: string[];

  constructor(projectDescription: string, constraints: string, answers: ProjectAnswers) {
    this.projectDescription = projectDescription;
    this.constraints = constraints ? constraints.split(';').map(c => c.trim()).filter(Boolean) : [];
    this.answers = answers;
  }

  private getAnswer(questionId: string): any {
    return this.answers[questionId];
  }

  private hasAnswer(questionId: string, values: string[]): boolean {
    const answer = this.getAnswer(questionId);
    if (Array.isArray(answer)) {
      return answer.some(v => values.includes(v));
    }
    return values.includes(answer as string);
  }

  private getSelectedFeatures(): { [key: string]: string[] } {
    const features: { [key: string]: string[] } = {};

    allModules.forEach(module => {
      module.subModules.forEach(subModule => {
        const key = `${module.id}.${subModule.id}`;
        features[key] = [];
        
        subModule.features.forEach(feature => {
          const answerKey = `${module.id}.${feature.id}`;
          if (this.answers[answerKey] === true || this.answers[answerKey] === 'yes') {
            features[key].push(feature.name);
          }
        });
      });
    });

    return features;
  }

  private generateFunctionalRequirements(): FunctionalRequirement[] {
    const requirements: FunctionalRequirement[] = [];
    let idCounter = 1;

    const addReq = (module: string, subModule: string, req: string, priority: FunctionalRequirement['priority'], type: FunctionalRequirement['type']) => {
      requirements.push({
        id: `FR-${idCounter.toString().padStart(3, '0')}`,
        module,
        subModule,
        requirement: req,
        priority,
        type,
      });
      idCounter++;
    };

    const industry = this.getAnswer('industry-type') || 'general';
    const scale = this.getAnswer('scale-size') || 'small';
    const hasGst = this.hasAnswer('gst-enabled', ['yes']);
    const hasService = this.hasAnswer('service-management', ['yes']);
    const hasLoyalty = this.hasAnswer('loyalty-program', ['yes']);
    const hasMultiBranch = this.hasAnswer('multi-branch', ['yes']);
    const hasOffline = this.hasAnswer('offline-support', ['yes']);

    addReq('Authentication', 'Login', 'The system shall allow users to authenticate using email/password credentials', 'Must Have', 'Functional');
    
    if (this.hasAnswer('auth-methods', ['mobile-otp'])) {
      addReq('Authentication', 'OTP', 'The system shall send and verify one-time passwords via SMS for mobile login', 'Must Have', 'Functional');
    }
    
    if (this.hasAnswer('auth-methods', ['social-google', 'social-facebook', 'social-apple'])) {
      addReq('Authentication', 'Social Login', 'The system shall support OAuth-based social login (Google/Facebook/Apple)', 'Should Have', 'Functional');
    }
    
    if (this.hasAnswer('mfa-required', ['yes'])) {
      addReq('Authentication', 'MFA', 'The system shall support multi-factor authentication for enhanced security', 'Should Have', 'Functional');
    }

    addReq('User Management', 'Profiles', 'The system shall maintain user profiles with essential information', 'Must Have', 'Functional');
    addReq('User Management', 'Roles', 'The system shall support role-based access control with configurable permissions', 'Must Have', 'Functional');

    if (hasMultiBranch) {
      addReq('User Management', 'Branch Access', 'The system shall support branch-specific user access controls', 'Must Have', 'Functional');
    }

    addReq('Billing', 'Order Creation', 'The system shall allow creation of sales orders with products/services', 'Must Have', 'Functional');
    addReq('Billing', 'Invoice Generation', 'The system shall generate invoices automatically upon order completion', 'Must Have', 'Functional');

    if (hasGst) {
      addReq('Billing', 'GST Invoice', 'The system shall generate GST-compliant invoices with proper tax calculations', 'Must Have', 'Functional');
      addReq('Billing', 'GST Slabs', 'The system shall support multiple GST slabs (5%, 12%, 18%, 28%)', 'Must Have', 'Functional');
      
      if (this.hasAnswer('gst-hsn', ['yes'])) {
        addReq('Billing', 'HSN Codes', 'The system shall support HSN code mapping for products', 'Should Have', 'Functional');
      }
      
      if (this.hasAnswer('gst-einvoice', ['yes'])) {
        addReq('Billing', 'E-Invoice', 'The system shall generate e-invoices via GST e-invoice portal', 'Should Have', 'Functional');
        addReq('Billing', 'E-Way Bill', 'The system shall generate e-way bills for applicable transactions', 'Should Have', 'Functional');
      }
    }

    if (this.hasAnswer('payment-methods', ['cash'])) {
      addReq('Billing', 'Cash Payment', 'The system shall accept cash payments with change calculation', 'Must Have', 'Functional');
    }
    if (this.hasAnswer('payment-methods', ['upi'])) {
      addReq('Billing', 'UPI Payment', 'The system shall accept UPI payments via QR code scanning', 'Must Have', 'Functional');
    }
    if (this.hasAnswer('payment-methods', ['card'])) {
      addReq('Billing', 'Card Payment', 'The system shall accept card payments via integrated POS', 'Should Have', 'Functional');
    }

    if (this.hasAnswer('split-payment', ['yes'])) {
      addReq('Billing', 'Split Payment', 'The system shall support multiple payment methods in a single transaction', 'Should Have', 'Functional');
    }

    if (this.hasAnswer('partial-payment', ['yes'])) {
      addReq('Billing', 'Partial Payment', 'The system shall allow partial payments with remaining balance tracking', 'Should Have', 'Functional');
    }

    if (this.hasAnswer('return-policy', ['yes'])) {
      addReq('Billing', 'Returns', 'The system shall process product returns and generate credit notes', 'Should Have', 'Functional');
    }

    addReq('Inventory', 'Product Catalog', 'The system shall maintain a product catalog with name, price, and description', 'Must Have', 'Functional');

    if (this.hasAnswer('product-catalog', ['standard', 'advanced'])) {
      addReq('Inventory', 'Variants', 'The system shall support product variants (size, color, etc.)', 'Should Have', 'Functional');
    }

    if (this.hasAnswer('barcode-support', ['yes'])) {
      addReq('Inventory', 'Barcode', 'The system shall support barcode scanning for product lookup', 'Should Have', 'Functional');
    }

    addReq('Inventory', 'Stock Tracking', 'The system shall track real-time stock quantities', 'Must Have', 'Functional');

    if (this.hasAnswer('stock-alerts', ['yes'])) {
      addReq('Inventory', 'Low Stock Alert', 'The system shall alert users when stock falls below threshold', 'Must Have', 'Functional');
    }

    if (this.hasAnswer('multi-location', ['yes'])) {
      addReq('Inventory', 'Multi-Location', 'The system shall track inventory across multiple locations/branches', 'Should Have', 'Functional');
    }

    if (this.hasAnswer('batch-tracking', ['yes'])) {
      addReq('Inventory', 'Batch Tracking', 'The system shall track batch numbers and expiry dates', 'Should Have', 'Functional');
    }

    addReq('Pricing', 'Price Management', 'The system shall manage product prices with support for retail pricing', 'Must Have', 'Functional');

    if (this.hasAnswer('pricing-model', ['wholesale'])) {
      addReq('Pricing', 'Wholesale Pricing', 'The system shall support wholesale pricing with volume discounts', 'Should Have', 'Functional');
    }

    if (this.hasAnswer('tiered-pricing', ['yes'])) {
      addReq('Pricing', 'Tiered Pricing', 'The system shall support tiered pricing based on quantity', 'Should Have', 'Functional');
    }

    if (this.hasAnswer('discount-types', ['percentage', 'fixed'])) {
      addReq('Pricing', 'Discounts', 'The system shall apply percentage and fixed amount discounts', 'Must Have', 'Functional');
    }

    if (this.hasAnswer('discount-types', ['coupon'])) {
      addReq('Pricing', 'Coupon Codes', 'The system shall validate and apply coupon/promo codes', 'Should Have', 'Functional');
    }

    if (hasLoyalty) {
      addReq('Pricing', 'Loyalty Points', 'The system shall award loyalty points on purchases', 'Should Have', 'Functional');
      addReq('Pricing', 'Points Redemption', 'The system shall allow customers to redeem loyalty points', 'Should Have', 'Functional');
      
      if (this.hasAnswer('loyalty-config', ['tiered'])) {
        addReq('Pricing', 'Customer Tiers', 'The system shall support tiered membership levels (Gold, Silver, Bronze)', 'Could Have', 'Functional');
      }
    }

    if (hasService) {
      addReq('Service', 'Service Booking', 'The system shall allow booking of services with date/time slots', 'Must Have', 'Functional');
      addReq('Service', 'Job Card', 'The system shall create and manage job cards for service orders', 'Should Have', 'Functional');
      
      if (this.hasAnswer('service-types', ['pickup', 'on-site'])) {
        addReq('Service', 'Pickup/Delivery', 'The system shall manage pickup and delivery logistics', 'Should Have', 'Functional');
      }
      
      if (this.hasAnswer('warranty-track', ['yes'])) {
        addReq('Service', 'Warranty', 'The system shall track warranty periods and validate claims', 'Should Have', 'Functional');
      }
    }

    if (this.hasAnswer('notification-channels', ['push'])) {
      addReq('Notifications', 'Push Notifications', 'The system shall send push notifications for order updates', 'Should Have', 'Functional');
    }
    if (this.hasAnswer('notification-channels', ['sms'])) {
      addReq('Notifications', 'SMS', 'The system shall send SMS notifications for critical updates', 'Should Have', 'Functional');
    }
    if (this.hasAnswer('notification-channels', ['whatsapp'])) {
      addReq('Notifications', 'WhatsApp', 'The system shall send WhatsApp notifications via Business API', 'Could Have', 'Functional');
    }

    if (this.hasAnswer('reporting-required', ['sales'])) {
      addReq('Reporting', 'Sales Reports', 'The system shall generate sales reports with filtering options', 'Must Have', 'Functional');
    }
    if (this.hasAnswer('reporting-required', ['inventory'])) {
      addReq('Reporting', 'Inventory Reports', 'The system shall generate inventory status and movement reports', 'Should Have', 'Functional');
    }
    if (this.hasAnswer('reporting-required', ['customer'])) {
      addReq('Reporting', 'Customer Reports', 'The system shall generate customer purchase history and segmentation reports', 'Should Have', 'Functional');
    }
    if (this.hasAnswer('reporting-required', ['financial'])) {
      addReq('Reporting', 'Financial Reports', 'The system shall generate financial reports including GST summaries', 'Should Have', 'Functional');
    }

    if (this.hasAnswer('dashboard-type', ['yes'])) {
      addReq('Reporting', 'Dashboard', 'The system shall display a real-time dashboard with key metrics', 'Should Have', 'Functional');
    }

    if (this.hasAnswer('payment-gateways', ['razorpay', 'stripe', 'paytm'])) {
      addReq('Integrations', 'Payment Gateway', 'The system shall integrate with payment gateway for online transactions', 'Should Have', 'Technical');
    }

    if (this.hasAnswer('accounting-software', ['yes'])) {
      addReq('Integrations', 'Accounting Sync', 'The system shall sync data with accounting software', 'Could Have', 'Technical');
    }

    if (this.hasAnswer('ecom-sync', ['yes'])) {
      addReq('Integrations', 'E-commerce Sync', 'The system shall sync inventory and orders with e-commerce platforms', 'Could Have', 'Technical');
    }

    if (hasOffline) {
      addReq('Technical', 'Offline Mode', 'The system shall function offline with local data storage', 'Should Have', 'Technical');
      addReq('Technical', 'Data Sync', 'The system shall sync data when connection is restored', 'Should Have', 'Technical');
    }

    return requirements;
  }

  private generateUserFlows(): UserFlow[] {
    const flows: UserFlow[] = [];
    const hasGst = this.hasAnswer('gst-enabled', ['yes']);
    const hasService = this.hasAnswer('service-management', ['yes']);
    const hasLoyalty = this.hasAnswer('loyalty-program', ['yes']);

    flows.push({
      id: 'UF-001',
      name: 'Retail Sale Flow',
      description: 'Standard retail sale transaction from product selection to invoice',
      steps: [
        { step: 1, action: 'Login to POS', actor: 'Cashier', system: 'Authenticate user', result: 'User authenticated' },
        { step: 2, action: 'Search/Scan Product', actor: 'Cashier', system: 'Search product catalog', result: 'Product added to cart' },
        { step: 3, action: 'Apply Discounts', actor: 'Cashier', system: 'Calculate discounts', result: 'Discounts applied' },
        { step: 4, action: 'Select Payment Method', actor: 'Customer', system: 'Display payment options', result: 'Payment method selected' },
        { step: 5, action: 'Process Payment', actor: 'Customer', system: 'Process via payment gateway', result: 'Payment confirmed' },
        { step: 6, action: 'Generate Invoice', actor: 'System', system: 'Create invoice record', result: `Invoice generated${hasGst ? ' with GST' : ''}` },
        { step: 7, action: 'Update Inventory', actor: 'System', system: 'Decrement stock', result: 'Stock updated' },
        { step: 8, action: 'Print/Send Invoice', actor: 'System', system: 'Generate invoice', result: 'Invoice delivered' },
      ],
    });

    flows.push({
      id: 'UF-002',
      name: 'Customer Registration Flow',
      description: 'New customer signup and profile creation',
      steps: [
        { step: 1, action: 'Initiate Signup', actor: 'Customer', system: 'Display registration form', result: 'Form shown' },
        { step: 2, action: 'Enter Details', actor: 'Customer', system: 'Validate input', result: 'Data validated' },
        { step: 3, action: 'Verify OTP', actor: 'Customer', system: 'Send and verify OTP', result: 'Phone verified' },
        { step: 4, action: 'Set Password', actor: 'Customer', system: 'Hash and store password', result: 'Account created' },
        { step: 5, action: 'Profile Setup', actor: 'Customer', system: 'Save profile data', result: 'Profile complete' },
        { step: 6, action: 'Assign Loyalty', actor: 'System', system: 'Create loyalty record', result: `Loyalty ${hasLoyalty ? 'enabled' : 'skipped'}` },
      ],
    });

    flows.push({
      id: 'UF-003',
      name: 'Purchase Order Flow',
      description: 'Wholesale purchase order creation and fulfillment',
      steps: [
        { step: 1, action: 'Login to System', actor: 'Sales Rep', system: 'Authenticate user', result: 'User authenticated' },
        { step: 2, action: 'Search Customer', actor: 'Sales Rep', system: 'Search customer database', result: 'Customer selected' },
        { step: 3, action: 'Add Products', actor: 'Sales Rep', system: 'Add to order', result: 'Products added' },
        { step: 4, action: 'Apply Wholesale Pricing', actor: 'System', system: 'Calculate wholesale rates', result: 'Prices updated' },
        { step: 5, action: 'Apply Volume Discounts', actor: 'System', system: 'Calculate tiered pricing', result: 'Discounts applied' },
        { step: 6, action: 'Generate Proforma Invoice', actor: 'System', system: 'Create proforma', result: 'PI generated' },
        { step: 7, action: 'Confirm Order', actor: 'Customer', system: 'Update order status', result: 'Order confirmed' },
        { step: 8, action: 'Generate Tax Invoice', actor: 'System', system: `Create invoice${hasGst ? ' with GST' : ''}`, result: 'Tax invoice generated' },
        { step: 9, action: 'Update Inventory', actor: 'System', system: 'Decrement stock', result: 'Stock updated' },
      ],
    });

    if (hasService) {
      flows.push({
        id: 'UF-004',
        name: 'Service Booking Flow',
        description: 'Service appointment booking and completion',
        steps: [
          { step: 1, action: 'Select Service', actor: 'Customer', system: 'Display available services', result: 'Service selected' },
          { step: 2, action: 'Choose Date/Time', actor: 'Customer', system: 'Show available slots', result: 'Slot selected' },
          { step: 3, action: 'Provide Details', actor: 'Customer', system: 'Capture service info', result: 'Details captured' },
          { step: 4, action: 'Confirm Booking', actor: 'Customer', system: 'Create appointment', result: 'Booking confirmed' },
          { step: 5, action: 'Send Confirmation', actor: 'System', system: 'Send notification', result: 'Customer notified' },
          { step: 6, action: 'Service Completion', actor: 'Technician', system: 'Update job card', result: 'Service done' },
          { step: 7, action: 'Generate Invoice', actor: 'System', system: 'Create invoice', result: 'Invoice generated' },
          { step: 8, action: 'Collect Payment', actor: 'Customer', system: 'Process payment', result: 'Payment received' },
        ],
      });
    }

    return flows;
  }

  private generateTechnicalSpec(): TechnicalSpec {
    return {
      frontend: {
        framework: 'Next.js 14+ (App Router)',
        language: 'TypeScript 5+',
        uiLibrary: 'ShadCN UI + Tailwind CSS',
        stateManagement: 'Zustand / React Context',
        routing: 'Next.js App Router',
      },
      backend: {
        framework: 'Node.js + Express / NestJS',
        language: 'TypeScript 5+',
        orm: 'Sequelize / Prisma',
        database: 'MySQL 8.0',
        auth: 'JWT + Refresh Tokens',
        apiStyle: 'REST API / tRPC',
      },
      infrastructure: {
        hosting: 'AWS / GCP / Azure / Vercel',
        storage: 'AWS S3 / Cloud Storage',
        cdn: 'Cloudflare / AWS CloudFront',
        monitoring: 'Datadog / New Relic / Sentry',
      },
    };
  }

  private generateIntegrations(): Integration[] {
    const integrations: Integration[] = [];

    const gateway = this.getAnswer('payment-gateways');
    if (gateway) {
      (Array.isArray(gateway) ? gateway : [gateway]).forEach((g: string) => {
        integrations.push({
          name: g.charAt(0).toUpperCase() + g.slice(1),
          category: 'Payment Gateway',
          required: false,
          configuration: [
            { key: 'merchantId', value: '' },
            { key: 'merchantKey', value: '' },
            { key: 'environment', value: 'test' },
          ],
        });
      });
    }

    if (this.hasAnswer('accounting-software', ['yes'])) {
      const providers = this.getAnswer('accounting-providers') || [];
      (Array.isArray(providers) ? providers : [providers]).forEach((p: string) => {
        integrations.push({
          name: p.charAt(0).toUpperCase() + p.slice(1),
          category: 'Accounting Software',
          required: false,
          configuration: [
            { key: 'apiKey', value: '' },
            { key: 'companyId', value: '' },
          ],
        });
      });
    }

    const smsProvider = this.getAnswer('sms-provider');
    if (smsProvider) {
      integrations.push({
        name: smsProvider as string,
        category: 'SMS Provider',
        required: false,
        configuration: [
          { key: 'apiKey', value: '' },
          { key: 'senderId', value: '' },
        ],
      });
    }

    return integrations;
  }

  private generateDecisionSummary(): { question: string; answer: string }[] {
    const decisions: { question: string; answer: string }[] = [];

    mcqSections.forEach(section => {
      section.questions.forEach(q => {
        const answer = this.answers[q.id];
        if (answer !== undefined && answer !== '') {
          let displayAnswer = '';
          if (Array.isArray(answer)) {
            displayAnswer = answer.join(', ');
          } else if (typeof answer === 'boolean') {
            displayAnswer = answer ? 'Yes' : 'No';
          } else {
            displayAnswer = String(answer);
          }
          
          decisions.push({
            question: q.question,
            answer: displayAnswer,
          });
        }
      });
    });

    return decisions;
  }

  private generateAssumptions(): string[] {
    const assumptions: string[] = [
      'Users will have basic smartphone/computer literacy',
      'Stable internet connectivity is assumed for cloud deployment',
      'Customers will provide accurate contact information',
      'Products will have valid GST classifications where applicable',
    ];

    if (!this.hasAnswer('offline-support', ['yes'])) {
      assumptions.push('System requires continuous internet connection for operations');
    }

    if (!this.hasAnswer('gst-enabled', ['yes'])) {
      assumptions.push('Business operates without GST registration');
    }

    return assumptions;
  }

  private generateRisks(): { risk: string; mitigation: string }[] {
    return [
      {
        risk: 'Payment gateway integration failures',
        mitigation: 'Implement retry logic and fallback to alternate payment methods',
      },
      {
        risk: 'Data sync issues in offline mode',
        mitigation: 'Implement conflict resolution strategy and audit logs',
      },
      {
        risk: 'High transaction volume impacting performance',
        mitigation: 'Implement horizontal scaling and database optimization',
      },
      {
        risk: 'GST compliance errors',
        mitigation: 'Regular audit of tax calculations and third-party verification',
      },
    ];
  }

  public generate(): FRD {
    const hasGst = this.hasAnswer('gst-enabled', ['yes']);
    const hasMultiBranch = this.hasAnswer('multi-branch', ['yes']);
    const hasService = this.hasAnswer('service-management', ['yes']);
    const scale = this.getAnswer('scale-size') || 'small';

    const selectedModules = allModules.filter(m => {
      if (m.id === 'service' && !hasService) return false;
      if (m.id === 'user-mgmt' && scale === 'small') return true;
      if (m.id === 'reporting' && !this.hasAnswer('reporting-required', ['sales'])) return false;
      return true;
    });

    const modules = selectedModules.map(module => ({
      module: module.name,
      description: module.description,
      subModules: module.subModules.map(subModule => ({
        name: subModule.name,
        features: subModule.features.map(f => f.name),
        requirements: subModule.features
          .filter(f => this.answers[`${module.id}.${f.id}`] === true || this.answers[`${module.id}.${f.id}`] === 'yes')
          .map(f => f.name),
      })),
    }));

    const platforms = (this.getAnswer('platforms-needed') || []) as string[];

    return {
      metadata: {
        projectName: 'Shop Management System',
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        documentId: `FRD-${Date.now()}`,
      },
      projectOverview: {
        description: this.projectDescription,
        constraints: this.constraints,
        objectives: [
          'Streamline retail/wholesale operations',
          'Enable efficient inventory management',
          'Support multiple billing scenarios',
          'Enhance customer experience',
        ],
        scope: [
          'Point of Sale operations',
          hasGst ? 'GST-compliant billing' : 'Standard billing',
          hasMultiBranch ? 'Multi-branch management' : 'Single location management',
          hasService ? 'Service management' : 'Product sales only',
          'Customer management',
          'Reporting and analytics',
        ],
      },
      modules,
      functionalRequirements: this.generateFunctionalRequirements(),
      userFlows: this.generateUserFlows(),
      technicalArchitecture: this.generateTechnicalSpec(),
      databaseSchema: {
        entities: [
          'users', 'roles', 'permissions',
          'customers', 'addresses',
          'products', 'variants', 'categories', 'hsn_codes',
          'inventory', 'stock_movements', 'warehouses',
          'orders', 'order_items', 'invoices', 'payments',
          'services', 'appointments', 'job_cards',
          'loyalty_points', 'transactions',
          'notifications', 'audit_logs',
        ],
        relationships: [
          'users -> roles (many-to-one)',
          'customers -> addresses (one-to-many)',
          'products -> categories (many-to-one)',
          'products -> variants (one-to-many)',
          'orders -> customers (many-to-one)',
          'orders -> invoices (one-to-one)',
          'orders -> payments (one-to-many)',
        ],
      },
      integrations: this.generateIntegrations(),
      securityConsiderations: [
        'JWT-based authentication with refresh token rotation',
        'Password hashing using bcrypt with salt rounds',
        'HTTPS/TLS encryption for all communications',
        'Role-based access control (RBAC)',
        'Input validation and SQL injection prevention',
        'Rate limiting on API endpoints',
        'Audit logging for sensitive operations',
        'Data encryption at rest for sensitive information',
        'CORS configuration for API security',
      ],
      deploymentConfig: {
        platforms: platforms.map(p => {
          const map: { [key: string]: string } = {
            android: 'Android (React Native)',
            ios: 'iOS (React Native)',
            web: 'Web (Next.js PWA)',
            admin: 'Admin Dashboard (Next.js)',
          };
          return map[p] || p;
        }),
        deploymentModel: this.getAnswer('deployment-model') as string || 'saas',
        offlineSupport: this.hasAnswer('offline-support', ['yes']),
      },
      decisionSummary: {
        decisions: this.generateDecisionSummary(),
      },
      assumptions: this.generateAssumptions(),
      risks: this.generateRisks(),
    };
  }

  public toMarkdown(): string {
    const frd = this.generate();
    let md = `# Functional Requirements Document (FRD)\n\n`;
    md += `**Document ID:** ${frd.metadata.documentId}\n`;
    md += `**Version:** ${frd.metadata.version}\n`;
    md += `**Created:** ${new Date(frd.metadata.createdAt).toLocaleDateString()}\n\n`;

    md += `## 1. Project Overview\n\n`;
    md += `### 1.1 Description\n${frd.projectOverview.description}\n\n`;
    md += `### 1.2 Constraints\n${frd.projectOverview.constraints.map(c => `- ${c}`).join('\n')}\n\n`;
    md += `### 1.3 Objectives\n${frd.projectOverview.objectives.map(o => `- ${o}`).join('\n')}\n\n`;
    md += `### 1.4 Scope\n${frd.projectOverview.scope.map(s => `- ${s}`).join('\n')}\n\n`;

    md += `## 2. Module Breakdown\n\n`;
    frd.modules.forEach((mod, i) => {
      md += `### 2.${i + 1} ${mod.module}\n${mod.description}\n\n`;
      mod.subModules.forEach((sub, j) => {
        md += `#### 2.${i + 1}.${j + 1} ${sub.name}\n`;
        if (sub.requirements.length > 0) {
          md += `**Selected Features:**\n${sub.requirements.map(r => `- ${r}`).join('\n')}\n\n`;
        }
      });
    });

    md += `## 3. Functional Requirements\n\n`;
    const groupedReqs: { [key: string]: FunctionalRequirement[] } = {};
    frd.functionalRequirements.forEach(req => {
      const key = `${req.module}.${req.subModule}`;
      if (!groupedReqs[key]) groupedReqs[key] = [];
      groupedReqs[key].push(req);
    });

    Object.entries(groupedReqs).forEach(([key, reqs]) => {
      const [mod, subMod] = key.split('.');
      md += `### ${mod} - ${subMod}\n`;
      reqs.forEach(req => {
        md += `- **[${req.id}]** (${req.priority}) ${req.requirement}\n`;
      });
      md += '\n';
    });

    md += `## 4. User Flows\n\n`;
    frd.userFlows.forEach(flow => {
      md += `### 4.${flow.id.replace('UF-', '')} ${flow.name}\n${flow.description}\n\n`;
      flow.steps.forEach(step => {
        md += `${step.step}. **${step.action}** (${step.actor})\n   - System: ${step.system}\n   - Result: ${step.result}\n`;
      });
      md += '\n';
    });

    md += `## 5. Technical Architecture\n\n`;
    md += `### 5.1 Frontend\n`;
    md += `| Component | Technology |\n|-----------|------------|\n`;
    Object.entries(frd.technicalArchitecture.frontend).forEach(([key, value]) => {
      md += `| ${key.replace(/([A-Z])/g, ' $1').trim()} | ${value} |\n`;
    });

    md += `\n### 5.2 Backend\n`;
    md += `| Component | Technology |\n|-----------|------------|\n`;
    Object.entries(frd.technicalArchitecture.backend).forEach(([key, value]) => {
      md += `| ${key.replace(/([A-Z])/g, ' $1').trim()} | ${value} |\n`;
    });

    md += `\n### 5.3 Infrastructure\n`;
    md += `| Component | Technology |\n|-----------|------------|\n`;
    Object.entries(frd.technicalArchitecture.infrastructure).forEach(([key, value]) => {
      md += `| ${key} | ${value} |\n`;
    });

    md += `\n## 6. Database Schema\n\n`;
    md += `### 6.1 Core Entities\n`;
    frd.databaseSchema.entities.forEach(entity => {
      md += `- ${entity}\n`;
    });

    md += `\n### 6.2 Relationships\n`;
    frd.databaseSchema.relationships.forEach(rel => {
      md += `- ${rel}\n`;
    });

    md += `\n## 7. Security Considerations\n\n`;
    frd.securityConsiderations.forEach(sec => {
      md += `- ${sec}\n`;
    });

    md += `\n## 8. Integrations\n\n`;
    if (frd.integrations.length > 0) {
      frd.integrations.forEach(int => {
        md += `### ${int.name}\n`;
        md += `- Category: ${int.category}\n`;
        md += `- Required: ${int.required ? 'Yes' : 'No'}\n`;
      });
    } else {
      md += `No third-party integrations configured.\n`;
    }

    md += `\n## 9. Deployment Configuration\n\n`;
    md += `- **Platforms:** ${frd.deploymentConfig.platforms.join(', ')}\n`;
    md += `- **Model:** ${frd.deploymentConfig.deploymentModel}\n`;
    md += `- **Offline Support:** ${frd.deploymentConfig.offlineSupport ? 'Yes' : 'No'}\n`;

    md += `\n## 10. Decision Summary\n\n`;
    md += `| Question | Answer |\n|----------|--------|\n`;
    frd.decisionSummary.decisions.forEach(d => {
      md += `| ${d.question} | ${d.answer} |\n`;
    });

    md += `\n## 11. Assumptions\n\n`;
    frd.assumptions.forEach(a => {
      md += `- ${a}\n`;
    });

    md += `\n## 12. Risks & Mitigations\n\n`;
    md += `| Risk | Mitigation |\n|------|-----------|\n`;
    frd.risks.forEach(r => {
      md += `| ${r.risk} | ${r.mitigation} |\n`;
    });

    return md;
  }

  public async saveToDatabase(projectId: string): Promise<void> {
    const frd = this.generate();
    const markdown = this.toMarkdown();

    // 1. Save or update FRDDocument
    const [frdDocument, created] = await FRDDocument.findOrCreate({
      where: { projectId },
      defaults: {
        content: frd,
        markdown: markdown,
        version: '1.0.0',
        status: 'draft',
      },
    }) as any;

    if (!created) {
      await frdDocument.update({
        content: frd,
        markdown: markdown,
      });
    }

    const frdDocumentId = frdDocument.id;

    // 2. Cleanup old associated data to avoid duplicates if re-running
    await DBFunctionalRequirement.destroy({ where: { frdDocumentId } });
    await DBUserFlow.destroy({ where: { frdDocumentId } });
    await DBIntegration.destroy({ where: { frdDocumentId } });
    await DBDecision.destroy({ where: { frdDocumentId } });

    // 3. Save Functional Requirements
    if (frd.functionalRequirements && frd.functionalRequirements.length > 0) {
      const dbReqs = frd.functionalRequirements.map((req) => ({
        frdDocumentId,
        code: req.id,
        requirement: req.requirement,
        priority: req.priority,
        type: req.type,
      }));
      await DBFunctionalRequirement.bulkCreate(dbReqs as any[]);
    }

    // 4. Save User Flows
    if (frd.userFlows && frd.userFlows.length > 0) {
      const dbFlows = frd.userFlows.map((flow) => ({
        frdDocumentId,
        code: flow.id,
        name: flow.name,
        description: flow.description,
        steps: flow.steps,
      }));
      await DBUserFlow.bulkCreate(dbFlows as any[]);
    }

    // 5. Save Integrations
    if (frd.integrations && frd.integrations.length > 0) {
      const dbInteg = frd.integrations.map((integ) => ({
        frdDocumentId,
        name: integ.name,
        category: integ.category,
        required: integ.required || true,
        configuration: integ.configuration || [],
      }));
      await DBIntegration.bulkCreate(dbInteg as any[]);
    }

    // 6. Save Decisions
    if (frd.decisionSummary && frd.decisionSummary.decisions.length > 0) {
      const dbDecisions = frd.decisionSummary.decisions.map((dec) => ({
        frdDocumentId,
        question: dec.question,
        answer: dec.answer,
      }));
      await DBDecision.bulkCreate(dbDecisions as any[]);
    }
  }
}
