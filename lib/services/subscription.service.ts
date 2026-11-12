// @ts-nocheck
import { 
  UserSubscription, 
  SubscriptionPlan, 
  Payment, 
  SubscriptionUsage, 
  SubscriptionHistory, 
  PaypalWebhookEvent, 
  Project, 
  User 
} from '../db/models';
import { PayPalCaptureResult } from './paypal.service';

export interface SubscriptionStatusInfo {
  subscription: any;
  plan: any;
  status: string;
  usage: {
    frdGenerations: { used: number; limit: number; remaining: number };
    projectStorage: { used: number; limit: number; remaining: number };
    documentExports: { used: number; limit: number; remaining: number };
    aiRecommendations: { used: number; limit: number; remaining: number };
  };
  isActive: boolean;
  isCancelled: boolean;
  isExpired: boolean;
  startDate: string;
  nextBillingDate?: string;
  expiryDate?: string;
}

export class SubscriptionService {
  private static instance: SubscriptionService;

  public static getInstance(): SubscriptionService {
    if (!SubscriptionService.instance) {
      SubscriptionService.instance = new SubscriptionService();
    }
    return SubscriptionService.instance;
  }

  /**
   * Resolves or provisions a valid user ID for operations
   */
  public async getEffectiveUserId(userId?: string | null): Promise<string> {
    if (userId && /^[0-9a-f-]{36}$/i.test(userId)) {
      return userId;
    }
    // Default to first user or demo user
    const firstUser = (await User.findOne()) as any;
    if (firstUser) {
      return firstUser.id;
    }
    // Create demo user
    const demo = (await User.create({
      name: 'Demo User',
      email: 'demo@speco.ai',
      password: 'password123',
      role: 'user',
    })) as any;
    return demo.id;
  }

  /**
   * Retrieves the user's active subscription, or initializes a default Basic plan
   */
  public async getUserSubscription(rawUserId?: string | null): Promise<SubscriptionStatusInfo> {
    const userId = await this.getEffectiveUserId(rawUserId);

    let sub = (await UserSubscription.findOne({
      where: { userId },
      order: [['created_at', 'DESC']],
    })) as any;

    if (!sub) {
      // Provision default basic starter subscription
      const now = new Date();
      const expiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      sub = await UserSubscription.create({
        userId,
        planId: 'basic',
        subscriptionStatus: 'active',
        startDate: now,
        nextBillingDate: expiry,
        expiryDate: expiry,
      });

      await SubscriptionHistory.create({
        userId,
        subscriptionId: sub.id,
        newPlanId: 'basic',
        action: 'purchased',
        note: 'Default Basic plan provisioned',
      });
    }

    // Load Plan definition from DB
    const plan = (await SubscriptionPlan.findById(sub.planId)) as any;
    const planObj = plan?.toJSON ? plan.toJSON() : (plan ? { ...plan } : null);
    if (planObj) {
      if (typeof planObj.features === 'string') {
        try { planObj.features = JSON.parse(planObj.features); } catch { planObj.features = []; }
      }
      if (typeof planObj.usageLimits === 'string') {
        try { planObj.usageLimits = JSON.parse(planObj.usageLimits); } catch { planObj.usageLimits = {}; }
      }
    }
    const rawLimits = planObj?.usageLimits || (typeof plan?.usageLimits === 'string' ? JSON.parse(plan.usageLimits) : plan?.usageLimits);
    const planLimits = rawLimits || { frdGenerations: 5, projectStorage: 3, documentExports: 5, aiRecommendations: 10 };

    // Get live usage statistics
    const usageList = (await SubscriptionUsage.findAll({
      where: { userId, subscriptionId: sub.id },
    })) as any[];

    const usageMap: Record<string, number> = {};
    usageList.forEach((u: any) => {
      usageMap[u.featureName] = u.usageCount || 0;
    });

    // Count actual projects in database for accurate storage quota
    let actualProjectsCount = 0;
    try {
      actualProjectsCount = await Project.count({ where: { userId } });
    } catch (e) {
      actualProjectsCount = usageMap['project_storage'] || 0;
    }

    const frdUsed = usageMap['frd_generation'] || 0;
    const exportUsed = usageMap['document_export'] || 0;
    const aiUsed = usageMap['ai_recommendation'] || 0;

    const frdLimit = planLimits.frdGenerations ?? 5;
    const storageLimit = planLimits.projectStorage ?? 3;
    const exportLimit = planLimits.documentExports ?? 5;
    const aiLimit = planLimits.aiRecommendations ?? 10;

    const isCancelled = sub.subscriptionStatus === 'cancelled';
    const isExpired = sub.expiryDate ? new Date(sub.expiryDate) < new Date() : false;
    const isActive = sub.subscriptionStatus === 'active' && !isExpired;

    return {
      subscription: sub.toJSON ? sub.toJSON() : sub,
      plan: planObj,
      status: isExpired ? 'expired' : sub.subscriptionStatus,
      usage: {
        frdGenerations: { used: frdUsed, limit: frdLimit, remaining: Math.max(0, frdLimit - frdUsed) },
        projectStorage: { used: actualProjectsCount, limit: storageLimit, remaining: Math.max(0, storageLimit - actualProjectsCount) },
        documentExports: { used: exportUsed, limit: exportLimit, remaining: Math.max(0, exportLimit - exportUsed) },
        aiRecommendations: { used: aiUsed, limit: aiLimit, remaining: Math.max(0, aiLimit - aiUsed) },
      },
      isActive,
      isCancelled,
      isExpired,
      startDate: sub.startDate,
      nextBillingDate: sub.nextBillingDate,
      expiryDate: sub.expiryDate,
    };
  }

  /**
   * Checks whether the user is authorized to perform a premium feature
   */
  public async checkAccess(rawUserId: string | null | undefined, feature: 'frd_generation' | 'project_storage' | 'document_export' | 'ai_recommendation'): Promise<{
    allowed: boolean;
    reason?: string;
    currentUsage?: number;
    limit?: number;
    planId?: string;
    upgradeRequired?: boolean;
  }> {
    const subInfo = await this.getUserSubscription(rawUserId);

    if (subInfo.isExpired) {
      return {
        allowed: false,
        reason: 'Your subscription has expired. Please renew or upgrade to continue using premium features.',
        upgradeRequired: true,
        planId: subInfo.plan?.id,
      };
    }

    let quota: { used: number; limit: number; remaining: number };
    let featureLabel = 'feature';

    switch (feature) {
      case 'frd_generation':
        quota = subInfo.usage.frdGenerations;
        featureLabel = 'FRD Generations';
        break;
      case 'project_storage':
        quota = subInfo.usage.projectStorage;
        featureLabel = 'Project Storage';
        break;
      case 'document_export':
        quota = subInfo.usage.documentExports;
        featureLabel = 'Document Exports';
        break;
      case 'ai_recommendation':
        quota = subInfo.usage.aiRecommendations;
        featureLabel = 'AI Plan Recommendations';
        break;
      default:
        return { allowed: true };
    }

    if (quota.used >= quota.limit && quota.limit < 9000) {
      return {
        allowed: false,
        reason: `Monthly quota exceeded for ${featureLabel} (${quota.used}/${quota.limit}). Upgrade your plan to increase limits.`,
        currentUsage: quota.used,
        limit: quota.limit,
        planId: subInfo.plan?.id,
        upgradeRequired: true,
      };
    }

    return {
      allowed: true,
      currentUsage: quota.used,
      limit: quota.limit,
      planId: subInfo.plan?.id,
    };
  }

  /**
   * Increments feature usage for tracking and billing
   */
  public async recordUsage(rawUserId: string | null | undefined, feature: 'frd_generation' | 'project_storage' | 'document_export' | 'ai_recommendation', amount = 1): Promise<void> {
    const userId = await this.getEffectiveUserId(rawUserId);
    const sub = (await UserSubscription.findOne({ where: { userId } })) as any;
    if (!sub) return;

    let usage = (await SubscriptionUsage.findOne({
      where: { userId, subscriptionId: sub.id, featureName: feature },
    })) as any;

    if (!usage) {
      const plan = (await SubscriptionPlan.findById(sub.planId)) as any;
      const limits = plan?.usageLimits || {};
      const limitVal = limits[feature === 'frd_generation' ? 'frdGenerations' : feature === 'project_storage' ? 'projectStorage' : feature === 'document_export' ? 'documentExports' : 'aiRecommendations'] || 10;

      await SubscriptionUsage.create({
        userId,
        subscriptionId: sub.id,
        featureName: feature,
        usageCount: amount,
        usageLimit: limitVal,
        periodStart: sub.startDate,
        periodEnd: sub.expiryDate,
      });
    } else {
      await usage.increment('usageCount', { by: amount });
    }
  }

  /**
   * Activates or upgrades a subscription upon verified PayPal payment capture
   */
  public async activateSubscriptionFromPayment(params: {
    userId: string;
    planId: string;
    orderId: string;
    captureResult: PayPalCaptureResult;
  }): Promise<{ success: boolean; subscription: any; payment: any }> {
    const userId = await this.getEffectiveUserId(params.userId);

    // 1. Validate plan exists in DB
    const plan = (await SubscriptionPlan.findById(params.planId)) as any;
    if (!plan) {
      throw new Error(`Invalid plan ID: ${params.planId}`);
    }

    // 2. Prevent duplicate transaction capture recording
    const existingPayment = (await Payment.findOne({
      where: { paypalOrderId: params.orderId },
    })) as any;

    if (existingPayment) {
      console.log(`Payment already processed for order ${params.orderId}`);
      const sub = await UserSubscription.findById(existingPayment.subscriptionId);
      return { success: true, subscription: sub, payment: existingPayment };
    }

    const now = new Date();
    const expiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // 3. Find or update user subscription
    let sub = (await UserSubscription.findOne({ where: { userId } })) as any;
    const oldPlanId = sub ? sub.planId : null;

    if (sub) {
      await sub.update({
        planId: params.planId,
        paypalOrderId: params.orderId,
        paypalSubscriptionId: params.captureResult.captureId,
        subscriptionStatus: 'active',
        startDate: now,
        nextBillingDate: expiry,
        expiryDate: expiry,
        cancellationDate: null,
      });
    } else {
      sub = await UserSubscription.create({
        userId,
        planId: params.planId,
        paypalOrderId: params.orderId,
        paypalSubscriptionId: params.captureResult.captureId,
        subscriptionStatus: 'active',
        startDate: now,
        nextBillingDate: expiry,
        expiryDate: expiry,
      });
    }

    // 4. Record Payment in payments ledger
    const payment = await Payment.create({
      userId,
      subscriptionId: sub.id,
      planId: params.planId,
      paypalOrderId: params.orderId,
      paypalCaptureId: params.captureResult.captureId,
      amount: params.captureResult.amount,
      currency: params.captureResult.currency,
      paymentStatus: params.captureResult.status || 'COMPLETED',
      paymentDate: now,
      rawDetails: params.captureResult.rawDetails,
    });

    // 5. Record Subscription History audit log
    await SubscriptionHistory.create({
      userId,
      subscriptionId: sub.id,
      oldPlanId,
      newPlanId: params.planId,
      action: oldPlanId && oldPlanId !== params.planId ? 'upgraded' : 'purchased',
      effectiveDate: now,
      note: `Verified PayPal capture (${params.captureResult.captureId || params.orderId}) for Rs.${plan.price} / $${params.captureResult.amount}`,
    });

    // 6. Reset usage counters for the upgraded plan
    await SubscriptionUsage.destroy({ where: { userId, subscriptionId: sub.id } });

    console.log(`Successfully activated ${plan.planName} for user ${userId} via PayPal order ${params.orderId}`);
    return { success: true, subscription: sub, payment };
  }

  /**
   * Upgrades subscription to a higher tier
   */
  public async upgradeSubscription(userId: string, newPlanId: string, orderId: string, capture: PayPalCaptureResult) {
    return await this.activateSubscriptionFromPayment({
      userId,
      planId: newPlanId,
      orderId,
      captureResult: capture,
    });
  }

  /**
   * Downgrades subscription to a lower tier
   */
  public async downgradeSubscription(rawUserId: string, targetPlanId: string): Promise<any> {
    const userId = await this.getEffectiveUserId(rawUserId);
    const sub = (await UserSubscription.findOne({ where: { userId } })) as any;
    if (!sub) throw new Error('No active subscription found');

    const targetPlan = (await SubscriptionPlan.findById(targetPlanId)) as any;
    if (!targetPlan) throw new Error(`Target plan ${targetPlanId} not found`);

    const oldPlanId = sub.planId;

    // Apply downgrade effective immediately while preserving existing user data
    await sub.update({
      planId: targetPlanId,
      cancellationDate: null,
    });

    await SubscriptionHistory.create({
      userId,
      subscriptionId: sub.id,
      oldPlanId,
      newPlanId: targetPlanId,
      action: 'downgraded',
      effectiveDate: new Date(),
      note: `Downgraded from ${oldPlanId} to ${targetPlanId}. Existing documents and projects preserved.`,
    });

    return sub;
  }

  /**
   * Cancels active subscription with access preserved until expiry
   */
  public async cancelSubscription(rawUserId: string, reason?: string): Promise<any> {
    const userId = await this.getEffectiveUserId(rawUserId);
    const sub = (await UserSubscription.findOne({ where: { userId } })) as any;
    if (!sub) throw new Error('No active subscription found');

    const now = new Date();
    await sub.update({
      subscriptionStatus: 'cancelled',
      cancellationDate: now,
    });

    await SubscriptionHistory.create({
      userId,
      subscriptionId: sub.id,
      oldPlanId: sub.planId,
      newPlanId: sub.planId,
      action: 'cancelled',
      effectiveDate: now,
      note: reason || 'User requested cancellation. Access preserved through billing cycle.',
    });

    return sub;
  }

  /**
   * Retrieves subscription history log
   */
  public async getSubscriptionHistory(rawUserId: string): Promise<any[]> {
    const userId = await this.getEffectiveUserId(rawUserId);
    return (await SubscriptionHistory.findAll({
      where: { userId },
      order: [['created_at', 'DESC']],
    })) as any[];
  }

  /**
   * Retrieves user payment history
   */
  public async getPaymentHistory(rawUserId: string): Promise<any[]> {
    const userId = await this.getEffectiveUserId(rawUserId);
    return (await Payment.findAll({
      where: { userId },
      order: [['created_at', 'DESC']],
    })) as any[];
  }

  /**
   * Handles incoming PayPal Webhooks idempotently
   */
  public async processWebhookEvent(event: any): Promise<{ handled: boolean; message: string }> {
    const eventId = event.id;
    const eventType = event.event_type;

    if (!eventId) {
      return { handled: false, message: 'Missing event ID' };
    }

    // Idempotency check: prevent processing identical webhook multiple times
    const existing = (await PaypalWebhookEvent.findOne({ where: { paypalEventId: eventId } })) as any;
    if (existing) {
      return { handled: true, message: `Event ${eventId} was already processed at ${existing.processedAt}` };
    }

    const webhookRecord = await PaypalWebhookEvent.create({
      paypalEventId: eventId,
      eventType: eventType || 'UNKNOWN',
      processingStatus: 'processed',
      receivedAt: new Date(),
      processedAt: new Date(),
      payload: event,
    });

    console.log(`Processing PayPal Webhook: ${eventType} (${eventId})`);

    try {
      if (eventType === 'PAYMENT.CAPTURE.COMPLETED' || eventType === 'CHECKOUT.ORDER.APPROVED') {
        const resource = event.resource;
        const customIdRaw = resource.custom_id || resource.purchase_units?.[0]?.custom_id;
        if (customIdRaw) {
          try {
            const parsed = typeof customIdRaw === 'string' ? JSON.parse(customIdRaw) : customIdRaw;
            if (parsed.userId && parsed.planId) {
              await this.activateSubscriptionFromPayment({
                userId: parsed.userId,
                planId: parsed.planId,
                orderId: resource.id || eventId,
                captureResult: {
                  success: true,
                  orderId: resource.id || eventId,
                  captureId: resource.id,
                  status: resource.status || 'COMPLETED',
                  amount: parseFloat(resource.amount?.value || '0'),
                  currency: resource.amount?.currency_code || 'USD',
                  rawDetails: resource,
                },
              });
            }
          } catch (e) {
            console.error('Failed to parse webhook custom_id:', e);
          }
        }
      } else if (eventType === 'BILLING.SUBSCRIPTION.CANCELLED') {
        const subId = event.resource?.id;
        if (subId) {
          const userSub = (await UserSubscription.findOne({ where: { paypalSubscriptionId: subId } })) as any;
          if (userSub) {
            await userSub.update({ subscriptionStatus: 'cancelled', cancellationDate: new Date() });
          }
        }
      }

      await webhookRecord.update({ processingStatus: 'processed', processedAt: new Date() });
      return { handled: true, message: `Event ${eventType} handled successfully.` };
    } catch (err: any) {
      console.error(`Error processing webhook ${eventId}:`, err);
      await webhookRecord.update({ processingStatus: 'failed' });
      return { handled: false, message: err.message };
    }
  }
}

export const subscriptionService = SubscriptionService.getInstance();
