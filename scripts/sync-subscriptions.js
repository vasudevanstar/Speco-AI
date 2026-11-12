const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '..', 'database.sqlite'),
  logging: false,
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true,
  },
});

const SubscriptionPlan = sequelize.define('SubscriptionPlan', {
  id: { type: DataTypes.STRING(50), primaryKey: true },
  planName: { type: DataTypes.STRING(100), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  price: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
  currency: { type: DataTypes.STRING(10), defaultValue: 'INR' },
  billingInterval: { type: DataTypes.STRING(20), defaultValue: 'month' },
  features: { type: DataTypes.JSON, defaultValue: [] },
  usageLimits: { type: DataTypes.JSON, defaultValue: {} },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { timestamps: true, tableName: 'subscription_plans' });

const UserSubscription = sequelize.define('UserSubscription', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false },
  planId: { type: DataTypes.STRING(50), allowNull: false },
  paypalSubscriptionId: { type: DataTypes.STRING(100), allowNull: true },
  paypalOrderId: { type: DataTypes.STRING(100), allowNull: true },
  subscriptionStatus: { type: DataTypes.STRING(50), defaultValue: 'active' },
  startDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  nextBillingDate: { type: DataTypes.DATE, allowNull: true },
  expiryDate: { type: DataTypes.DATE, allowNull: true },
  cancellationDate: { type: DataTypes.DATE, allowNull: true },
}, { timestamps: true, tableName: 'user_subscriptions' });

const Payment = sequelize.define('Payment', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false },
  subscriptionId: { type: DataTypes.UUID, allowNull: true },
  planId: { type: DataTypes.STRING(50), allowNull: false },
  paypalOrderId: { type: DataTypes.STRING(100), allowNull: false },
  paypalCaptureId: { type: DataTypes.STRING(100), allowNull: true },
  amount: { type: DataTypes.FLOAT, allowNull: false },
  currency: { type: DataTypes.STRING(10), defaultValue: 'INR' },
  paymentStatus: { type: DataTypes.STRING(50), defaultValue: 'COMPLETED' },
  paymentDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  rawDetails: { type: DataTypes.JSON, allowNull: true },
}, { timestamps: true, tableName: 'payments' });

const SubscriptionUsage = sequelize.define('SubscriptionUsage', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false },
  subscriptionId: { type: DataTypes.UUID, allowNull: true },
  featureName: { type: DataTypes.STRING(100), allowNull: false },
  usageCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  usageLimit: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 10 },
  periodStart: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  periodEnd: { type: DataTypes.DATE, allowNull: true },
}, { timestamps: true, tableName: 'subscription_usage' });

const SubscriptionHistory = sequelize.define('SubscriptionHistory', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false },
  subscriptionId: { type: DataTypes.UUID, allowNull: true },
  oldPlanId: { type: DataTypes.STRING(50), allowNull: true },
  newPlanId: { type: DataTypes.STRING(50), allowNull: false },
  action: { type: DataTypes.STRING(50), allowNull: false },
  effectiveDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  note: { type: DataTypes.TEXT, allowNull: true },
}, { timestamps: true, tableName: 'subscription_history' });

const PaypalWebhookEvent = sequelize.define('PaypalWebhookEvent', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  paypalEventId: { type: DataTypes.STRING(100), unique: true, allowNull: false },
  eventType: { type: DataTypes.STRING(100), allowNull: false },
  processingStatus: { type: DataTypes.STRING(50), defaultValue: 'processed' },
  receivedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  processedAt: { type: DataTypes.DATE, allowNull: true },
  payload: { type: DataTypes.JSON, allowNull: true },
}, { timestamps: true, tableName: 'paypal_webhook_events' });

async function run() {
  await sequelize.sync();
  console.log('Tables synced successfully!');

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
      console.log('Created plan:', plan.planName);
    } else {
      console.log('Plan exists:', plan.planName);
    }
  }

  const plans = await SubscriptionPlan.findAll();
  console.log('All DB Plans:', plans.map(p => `${p.id}: ${p.planName} - Rs.${p.price}`));
  process.exit(0);
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
