// @ts-nocheck
const { DataTypes } = require('sequelize');
import * as database from './config/database';
const sequelize = database.sequelize;

export const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('admin', 'consultant', 'user'),
    defaultValue: 'user',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  timestamps: true,
  tableName: 'users',
});

export const Project = sequelize.define('Project', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  constraints: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  industry: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  projectTypes: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  scale: {
    type: DataTypes.ENUM('small', 'medium', 'large', 'enterprise'),
    defaultValue: 'small',
  },
  userVolume: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  userVolumeType: {
    type: DataTypes.ENUM('daily', 'monthly'),
    defaultValue: 'monthly',
  },
  status: {
    type: DataTypes.ENUM('draft', 'in_progress', 'completed'),
    defaultValue: 'draft',
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
}, {
  timestamps: true,
  tableName: 'projects',
});

export const Module = sequelize.define('Module', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  projectId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'projects',
      key: 'id',
    },
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  isCustom: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'in_progress', 'completed'),
    defaultValue: 'pending',
  },
}, {
  timestamps: true,
  tableName: 'modules',
});

export const SubModule = sequelize.define('SubModule', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  moduleId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'modules',
      key: 'id',
    },
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  timestamps: true,
  tableName: 'sub_modules',
});

export const Question = sequelize.define('Question', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  moduleId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'modules',
      key: 'id',
    },
  },
  question: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  type: {
    type: DataTypes.ENUM('yesno', 'single', 'multiple', 'text', 'number', 'select'),
    defaultValue: 'single',
  },
  options: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  dependsOn: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  triggers: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  required: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  isSkippable: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  allowMultiple: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: null,
  },
  allowOther: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  respondentPrompt: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  showRespondentPrompt: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  timestamps: true,
  tableName: 'questions',
});

export const Answer = sequelize.define('Answer', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  projectId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'projects',
      key: 'id',
    },
  },
  questionId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'questions',
      key: 'id',
    },
  },
  selectedOptions: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  textValue: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  numericValue: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  additionalExplanation: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  history: {
    type: DataTypes.JSON,
    allowNull: true,
  },
}, {
  timestamps: true,
  tableName: 'answers',
});

export const FRDDocument = sequelize.define('FRDDocument', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  projectId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: {
      model: 'projects',
      key: 'id',
    },
  },
  content: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  markdown: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
  },
  version: {
    type: DataTypes.STRING(50),
    defaultValue: '1.0.0',
  },
  status: {
    type: DataTypes.ENUM('draft', 'final', 'archived'),
    defaultValue: 'draft',
  },
  history: {
    type: DataTypes.JSON,
    allowNull: true,
  },

}, {
  timestamps: true,
  tableName: 'frd_documents',
});

export const FunctionalRequirement = sequelize.define('FunctionalRequirement', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  frdDocumentId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'frd_documents',
      key: 'id',
    },
  },
  moduleId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  subModuleId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  code: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  requirement: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  priority: {
    type: DataTypes.ENUM('Must Have', 'Should Have', 'Could Have', 'Won\'t Have'),
    defaultValue: 'Should Have',
  },
  type: {
    type: DataTypes.ENUM('Functional', 'Technical', 'Business', 'Edge Case'),
    defaultValue: 'Functional',
  },
  questionId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  developerHint: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  technicalSpec: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  validationRules: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  acceptanceCriteria: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  clarificationStatus: {
    type: DataTypes.STRING(50),
    defaultValue: 'Confirmed User Requirement',
  },
}, {
  timestamps: true,
  tableName: 'functional_requirements',
});

export const UserFlow = sequelize.define('UserFlow', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  frdDocumentId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'frd_documents',
      key: 'id',
    },
  },
  code: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  steps: {
    type: DataTypes.JSON,
    allowNull: false,
  },
}, {
  timestamps: true,
  tableName: 'user_flows',
});

export const Integration = sequelize.define('Integration', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  frdDocumentId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'frd_documents',
      key: 'id',
    },
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  required: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  configuration: {
    type: DataTypes.JSON,
    allowNull: true,
  },
}, {
  timestamps: true,
  tableName: 'integrations',
});

export const Decision = sequelize.define('Decision', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  frdDocumentId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'frd_documents',
      key: 'id',
    },
  },
  question: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  answer: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
}, {
  timestamps: true,
  tableName: 'decisions',
});

Project.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' });
User.hasMany(Project, { foreignKey: 'userId', onDelete: 'CASCADE' });

Module.belongsTo(Project, { foreignKey: 'projectId', onDelete: 'CASCADE' });
Project.hasMany(Module, { foreignKey: 'projectId', onDelete: 'CASCADE' });

SubModule.belongsTo(Module, { foreignKey: 'moduleId', onDelete: 'CASCADE' });
Module.hasMany(SubModule, { foreignKey: 'moduleId', onDelete: 'CASCADE' });

Question.belongsTo(Module, { foreignKey: 'moduleId', onDelete: 'CASCADE' });
Module.hasMany(Question, { foreignKey: 'moduleId', onDelete: 'CASCADE' });

Answer.belongsTo(Project, { foreignKey: 'projectId', onDelete: 'CASCADE' });
Project.hasMany(Answer, { foreignKey: 'projectId', onDelete: 'CASCADE' });

Answer.belongsTo(Question, { foreignKey: 'questionId', onDelete: 'CASCADE' });
Question.hasMany(Answer, { foreignKey: 'questionId', onDelete: 'CASCADE' });

FRDDocument.belongsTo(Project, { foreignKey: 'projectId', onDelete: 'CASCADE' });
Project.hasOne(FRDDocument, { foreignKey: 'projectId', onDelete: 'CASCADE' });

FunctionalRequirement.belongsTo(FRDDocument, { foreignKey: 'frdDocumentId', onDelete: 'CASCADE' });
FRDDocument.hasMany(FunctionalRequirement, { foreignKey: 'frdDocumentId', onDelete: 'CASCADE' });

UserFlow.belongsTo(FRDDocument, { foreignKey: 'frdDocumentId', onDelete: 'CASCADE' });
FRDDocument.hasMany(UserFlow, { foreignKey: 'frdDocumentId', onDelete: 'CASCADE' });

Integration.belongsTo(FRDDocument, { foreignKey: 'frdDocumentId', onDelete: 'CASCADE' });
FRDDocument.hasMany(Integration, { foreignKey: 'frdDocumentId', onDelete: 'CASCADE' });

Decision.belongsTo(FRDDocument, { foreignKey: 'frdDocumentId', onDelete: 'CASCADE' });
FRDDocument.hasMany(Decision, { foreignKey: 'frdDocumentId', onDelete: 'CASCADE' });

// --- Subscription & Payment Models ---

export const SubscriptionPlan = sequelize.define('SubscriptionPlan', {
  id: {
    type: DataTypes.STRING(50),
    primaryKey: true,
  },
  planName: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },
  currency: {
    type: DataTypes.STRING(10),
    defaultValue: 'INR',
  },
  billingInterval: {
    type: DataTypes.STRING(20),
    defaultValue: 'month',
  },
  features: {
    type: DataTypes.JSON,
    defaultValue: [],
    get() {
      const raw = this.getDataValue('features');
      if (typeof raw === 'string') {
        try {
          return JSON.parse(raw);
        } catch (e) {
          return [];
        }
      }
      return raw || [];
    },
    set(val: any) {
      this.setDataValue('features', typeof val === 'string' ? val : JSON.stringify(val));
    },
  },
  usageLimits: {
    type: DataTypes.JSON,
    defaultValue: {},
    get() {
      const raw = this.getDataValue('usageLimits');
      if (typeof raw === 'string') {
        try {
          return JSON.parse(raw);
        } catch (e) {
          return {};
        }
      }
      return raw || {};
    },
    set(val: any) {
      this.setDataValue('usageLimits', typeof val === 'string' ? val : JSON.stringify(val));
    },
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  timestamps: true,
  tableName: 'subscription_plans',
});

export const UserSubscription = sequelize.define('UserSubscription', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  planId: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  paypalSubscriptionId: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  paypalOrderId: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  subscriptionStatus: {
    type: DataTypes.STRING(50),
    defaultValue: 'active', // active, cancelled, expired, pending
  },
  startDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  nextBillingDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  expiryDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  cancellationDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  timestamps: true,
  tableName: 'user_subscriptions',
});

export const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  subscriptionId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  planId: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  paypalOrderId: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  paypalCaptureId: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  currency: {
    type: DataTypes.STRING(10),
    defaultValue: 'INR',
  },
  paymentStatus: {
    type: DataTypes.STRING(50),
    defaultValue: 'COMPLETED', // COMPLETED, PENDING, FAILED, CANCELLED
  },
  paymentDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  rawDetails: {
    type: DataTypes.JSON,
    allowNull: true,
  },
}, {
  timestamps: true,
  tableName: 'payments',
});

export const SubscriptionUsage = sequelize.define('SubscriptionUsage', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  subscriptionId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  featureName: {
    type: DataTypes.STRING(100),
    allowNull: false, // frd_generation, project_storage, document_export, ai_recommendation
  },
  usageCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  usageLimit: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 10,
  },
  periodStart: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  periodEnd: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  timestamps: true,
  tableName: 'subscription_usage',
});

export const SubscriptionHistory = sequelize.define('SubscriptionHistory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  subscriptionId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  oldPlanId: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  newPlanId: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  action: {
    type: DataTypes.STRING(50),
    allowNull: false, // purchased, upgraded, downgraded, cancelled, renewed
  },
  effectiveDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  note: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  timestamps: true,
  tableName: 'subscription_history',
});

export const PaypalWebhookEvent = sequelize.define('PaypalWebhookEvent', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  paypalEventId: {
    type: DataTypes.STRING(100),
    unique: true,
    allowNull: false,
  },
  eventType: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  processingStatus: {
    type: DataTypes.STRING(50),
    defaultValue: 'processed', // processed, ignored, failed
  },
  receivedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  processedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  payload: {
    type: DataTypes.JSON,
    allowNull: true,
  },
}, {
  timestamps: true,
  tableName: 'paypal_webhook_events',
});

// Associations
UserSubscription.belongsTo(SubscriptionPlan, { foreignKey: 'planId', as: 'plan' });
SubscriptionPlan.hasMany(UserSubscription, { foreignKey: 'planId' });

Payment.belongsTo(SubscriptionPlan, { foreignKey: 'planId', as: 'plan' });
SubscriptionPlan.hasMany(Payment, { foreignKey: 'planId' });

Payment.belongsTo(UserSubscription, { foreignKey: 'subscriptionId', as: 'subscription' });
UserSubscription.hasMany(Payment, { foreignKey: 'subscriptionId' });

SubscriptionUsage.belongsTo(UserSubscription, { foreignKey: 'subscriptionId', as: 'subscription' });
UserSubscription.hasMany(SubscriptionUsage, { foreignKey: 'subscriptionId' });

SubscriptionHistory.belongsTo(UserSubscription, { foreignKey: 'subscriptionId', as: 'subscription' });
UserSubscription.hasMany(SubscriptionHistory, { foreignKey: 'subscriptionId' });

export const seedDefaultPlans = async () => {
  try {
    const defaultPlans = [
      {
        id: 'basic',
        planName: 'Basic Plan',
        description: 'Perfect for individual developers and small starter projects',
        price: 499,
        currency: 'INR',
        billingInterval: 'month',
        features: [
          '5 FRD Generations / month',
          '3 Active Projects Storage',
          'Standard Document Exports (Markdown)',
          'Basic Project History',
          'Standard Developer Hints',
          'Community Support'
        ],
        usageLimits: {
          frdGenerations: 5,
          projectStorage: 3,
          documentExports: 5,
          aiRecommendations: 10
        },
        isActive: true,
      },
      {
        id: 'pro',
        planName: 'Pro Plan',
        description: 'For fast-paced product teams needing advanced technical specs and high usage',
        price: 1999,
        currency: 'INR',
        billingInterval: 'month',
        features: [
          '50 FRD Generations / month',
          '30 Active Projects Storage',
          'Advanced PDF & Markdown Exports',
          'Full Technical Specifications & Hints',
          'Complete Requirement Traceability Matrix (RTM)',
          'Automated AI Plan Recommendations',
          'Priority Customer Support'
        ],
        usageLimits: {
          frdGenerations: 50,
          projectStorage: 30,
          documentExports: 50,
          aiRecommendations: 100
        },
        isActive: true,
      },
      {
        id: 'enterprise',
        planName: 'Enterprise Plan',
        description: 'For large organizations with complex multi-team software architectures',
        price: 7999,
        currency: 'INR',
        billingInterval: 'month',
        features: [
          '500 FRD Generations / month',
          'Unlimited Projects Storage',
          'Unlimited Document Exports',
          'Full Domain Rule Customization',
          'Custom Webhook Integrations',
          'Dedicated Account Architecture Specialist',
          'SLA & 24/7 Enterprise Support'
        ],
        usageLimits: {
          frdGenerations: 500,
          projectStorage: 9999,
          documentExports: 9999,
          aiRecommendations: 9999
        },
        isActive: true,
      }
    ];

    for (const plan of defaultPlans) {
      const existing = await SubscriptionPlan.findById(plan.id);
      if (!existing) {
        await SubscriptionPlan.create(plan);
      }
    }
  } catch (err) {
    console.error('Error seeding subscription plans:', err);
  }
};

// Auto-sync database tables once models are registered
if (process.env.DB_DIALECT === 'sqlite' || !process.env.DB_HOST) {
  sequelize.sync()
    .then(() => seedDefaultPlans())
    .catch((err: any) => console.error('DB Sync Error:', err));
}
