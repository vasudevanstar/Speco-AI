import { SubscriptionPlan } from '../db/models';
import { aiService } from '../ai/ai.service';

export interface ProjectAnalysisInput {
  title: string;
  description: string;
  industry?: string;
  scale?: string; // small, medium, large
  projectTypes?: string[];
  userVolume?: number;
  userVolumeType?: string;
  constraints?: string;
  modulesCount?: number;
  requirementsCount?: number;
}

export interface PlanRecommendation {
  recommendedPlanId: 'basic' | 'pro' | 'enterprise';
  recommendedPlanName: string;
  recommendedPrice: number;
  currency: string;
  billingInterval: string;
  complexityScore: 'Low' | 'Medium' | 'High' | 'Enterprise';
  complexityDetails: string;
  reason: string;
  expectedFeaturesNeeded: string[];
  suggestedUsageLevel: string;
  alternativePlan: {
    planId: string;
    planName: string;
    price: number;
    comparison: string;
  };
  featuresIncluded: string[];
  isAIAnalyzed: boolean;
}

export class SubscriptionRecommendationService {
  private static instance: SubscriptionRecommendationService;

  public static getInstance(): SubscriptionRecommendationService {
    if (!SubscriptionRecommendationService.instance) {
      SubscriptionRecommendationService.instance = new SubscriptionRecommendationService();
    }
    return SubscriptionRecommendationService.instance;
  }

  /**
   * Generates a context-aware plan recommendation for a project
   */
  public async recommendPlan(project: ProjectAnalysisInput): Promise<PlanRecommendation> {
    // 1. Fetch available plans from the database so prices and features are 100% authentic
    const allPlans = (await SubscriptionPlan.findAll({ where: { isActive: true } })) as any[];
    const planMap = new Map<string, any>();
    allPlans.forEach(p => {
      const pData = p.toJSON ? p.toJSON() : p;
      planMap.set(pData.id, pData);
    });

    const basicPlan = planMap.get('basic') || { id: 'basic', planName: 'Basic Plan', price: 499, currency: 'INR', billingInterval: 'month', features: [] };
    const proPlan = planMap.get('pro') || { id: 'pro', planName: 'Pro Plan', price: 1999, currency: 'INR', billingInterval: 'month', features: [] };
    const enterprisePlan = planMap.get('enterprise') || { id: 'enterprise', planName: 'Enterprise Plan', price: 7999, currency: 'INR', billingInterval: 'month', features: [] };

    // 2. Assess project metrics
    const modulesCount = project.modulesCount || 0;
    const reqsCount = project.requirementsCount || 0;
    const scale = (project.scale || 'medium').toLowerCase();
    const volume = project.userVolume || 0;
    const industry = (project.industry || 'general').toLowerCase();
    const highComplianceDomains = ['health', 'hospital', 'bank', 'fintech', 'insurance', 'ecommerce', 'payment', 'telecom'];
    const isHighCompliance = highComplianceDomains.some(d => industry.includes(d));

    // 3. Determine base recommendation logic
    let targetPlanId: 'basic' | 'pro' | 'enterprise' = 'pro';
    let complexity: 'Low' | 'Medium' | 'High' | 'Enterprise' = 'Medium';
    let complexityText = '';

    if (scale === 'large' || volume >= 50000 || modulesCount >= 10 || reqsCount >= 40) {
      targetPlanId = 'enterprise';
      complexity = 'Enterprise';
      complexityText = `High architectural scale (${modulesCount} modules, ${volume > 0 ? `${volume} expected users` : 'multi-tenant architecture'}) requiring enterprise-grade throughput and compliance.`;
    } else if (scale === 'small' && modulesCount <= 4 && reqsCount <= 10 && !isHighCompliance) {
      targetPlanId = 'basic';
      complexity = 'Low';
      complexityText = `Standard starter architecture (${modulesCount} modules, straightforward functional scope) ideal for MVP validation.`;
    } else {
      targetPlanId = 'pro';
      complexity = isHighCompliance ? 'High' : 'Medium';
      complexityText = `Mid-to-large business workflow (${modulesCount} modules, ${isHighCompliance ? 'regulated domain compliance' : 'standard commercial features'}) requiring technical specs, developer hints, and PDF exports.`;
    }

    // 4. Try AI-powered reasoning with Anthropic Claude / Gemini
    let aiReasoning: string | null = null;
    let expectedFeatures: string[] = [];

    try {
      const prompt = `You are a Senior SaaS Solutions Architect analyzing a software project to recommend the best subscription tier.
Project: "${project.title}"
Description: "${project.description}"
Domain/Industry: "${project.industry || 'Technology'}"
Architecture Scale: "${scale}"
Modules Count: ${modulesCount}
Requirements Count: ${reqsCount}
Target Recommended Tier: "${targetPlanId.toUpperCase()}"

Write a concise, high-value justification (2-3 sentences) explaining why this project needs the ${targetPlanId.toUpperCase()} tier. Focus on architectural complexity, validation rules, export needs, and developer implementation requirements.
Return JSON ONLY:
{
  "reason": "Clear technical justification...",
  "expectedFeaturesNeeded": ["Feature 1", "Feature 2", "Feature 3"]
}`;

      if (process.env.ANTHROPIC_API_KEY) {
        const raw = await (aiService as any).callAnthropic(prompt, 'You are a SaaS architecture analyst. Output pure JSON only.');
        const parsed = JSON.parse(raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
        if (parsed.reason) aiReasoning = parsed.reason;
        if (Array.isArray(parsed.expectedFeaturesNeeded)) expectedFeatures = parsed.expectedFeaturesNeeded;
      }
    } catch (e) {
      // AI call fallback handled gracefully below
    }

    // Fallback reasons if AI is offline
    if (!aiReasoning) {
      if (targetPlanId === 'enterprise') {
        aiReasoning = `Your project "${project.title}" encompasses an enterprise-scale architecture with ${modulesCount} modules and critical business logic. The Enterprise plan provides unlimited active project storage, dedicated SLA support, and high-frequency FRD generation quotas.`;
        expectedFeatures = [
          'Unlimited document exports with custom compliance branding',
          'Enterprise multi-module Requirement Traceability Matrix',
          'Dedicated account architect and custom webhook integrations'
        ];
      } else if (targetPlanId === 'basic') {
        aiReasoning = `Your project "${project.title}" is structured as an MVP or focused starter project with ${modulesCount} modules. The Basic plan provides standard markdown exports and adequate monthly generation quota at an accessible price.`;
        expectedFeatures = [
          'Standard FRD generation for core modules',
          'Markdown export for developer handoff',
          '3 active projects storage'
        ];
      } else {
        aiReasoning = `Your project "${project.title}" features ${modulesCount} modules and specialized functional specifications. The Pro plan is strongly recommended because it unlocks comprehensive Developer Implementation Hints, full PDF export, and Requirement Traceability Matrices.`;
        expectedFeatures = [
          'Full Developer Implementation Hints & Validation Rules',
          'Professional PDF & Markdown document exports',
          'Bi-directional Requirement Traceability Matrix (RTM)',
          '50 FRD generations per month'
        ];
      }
    }

    // Chosen plan object
    const selectedPlan = targetPlanId === 'enterprise' ? enterprisePlan : targetPlanId === 'basic' ? basicPlan : proPlan;

    // Alternative plan comparison
    let alternativePlan: any;
    if (targetPlanId === 'pro') {
      alternativePlan = {
        planId: basicPlan.id,
        planName: basicPlan.planName,
        price: basicPlan.price,
        comparison: `Choose ${basicPlan.planName} if you only require basic Markdown exports and fewer than 5 document generations monthly.`,
      };
    } else if (targetPlanId === 'enterprise') {
      alternativePlan = {
        planId: proPlan.id,
        planName: proPlan.planName,
        price: proPlan.price,
        comparison: `Choose ${proPlan.planName} if your team does not need dedicated account support or custom webhook integrations.`,
      };
    } else {
      alternativePlan = {
        planId: proPlan.id,
        planName: proPlan.planName,
        price: proPlan.price,
        comparison: `Upgrade to ${proPlan.planName} if you need executive PDF exports, developer hints, and Requirement Traceability.`,
      };
    }

    return {
      recommendedPlanId: targetPlanId,
      recommendedPlanName: selectedPlan.planName,
      recommendedPrice: selectedPlan.price,
      currency: selectedPlan.currency || 'INR',
      billingInterval: selectedPlan.billingInterval || 'month',
      complexityScore: complexity,
      complexityDetails: complexityText,
      reason: aiReasoning,
      expectedFeaturesNeeded: expectedFeatures,
      suggestedUsageLevel: targetPlanId === 'enterprise' ? 'High Volume (Team/Enterprise)' : targetPlanId === 'pro' ? 'Regular Professional Use' : 'Occasional Starter Use',
      alternativePlan,
      featuresIncluded: typeof selectedPlan.features === 'string' 
        ? (() => { try { return JSON.parse(selectedPlan.features); } catch { return []; } })()
        : (selectedPlan.features || []),
      isAIAnalyzed: Boolean(aiReasoning),
    };
  }
}

export const subscriptionRecommendationService = SubscriptionRecommendationService.getInstance();

