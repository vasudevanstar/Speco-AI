'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import MobileNav from '@/components/layout/MobileNav';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Check,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Zap,
  Building,
  User,
  CreditCard,
  HelpCircle,
  Loader2,
  CheckCircle2,
  Layers,
  FileText,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { api } from '@/lib/api';

interface Plan {
  id: string;
  planName: string;
  description: string;
  price: number;
  currency: string;
  billingInterval: string;
  features: string[];
  usageLimits: {
    frdGenerations: number;
    projectStorage: number;
    documentExports: number;
    aiRecommendations: number;
  };
}

export default function PricingPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentPlanId, setCurrentPlanId] = useState<string>('basic');
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  // AI Recommendation modal state
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [recommending, setRecommending] = useState(false);
  const [recommendation, setRecommendation] = useState<any | null>(null);
  const [showRecomModal, setShowRecomModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [plansRes, currentRes, projectsRes] = await Promise.all([
        api.get('/subscriptions/plans'),
        api.get('/subscriptions/current').catch(() => ({ data: { data: { plan: { id: 'basic' } } } })),
        api.get('/projects').catch(() => ({ data: { data: [] } })),
      ]);

      if (plansRes.data.data) {
        const cleanedPlans = plansRes.data.data.map((p: any) => ({
          ...p,
          features: Array.isArray(p.features)
            ? p.features
            : (typeof p.features === 'string'
              ? (() => { try { const parsed = JSON.parse(p.features); return Array.isArray(parsed) ? parsed : []; } catch { return []; } })()
              : []),
          usageLimits: typeof p.usageLimits === 'string'
            ? (() => { try { return JSON.parse(p.usageLimits); } catch { return {}; } })()
            : (p.usageLimits || {}),
        }));
        setPlans(cleanedPlans);
      }
      if (currentRes.data.data?.plan?.id) {
        setCurrentPlanId(currentRes.data.data.plan.id);
      }
      if (projectsRes.data.data) {
        setProjects(projectsRes.data.data);
        if (projectsRes.data.data.length > 0) {
          setSelectedProjectId(projectsRes.data.data[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching pricing data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGetRecommendation = async () => {
    if (!selectedProjectId && projects.length === 0) return;
    try {
      setRecommending(true);
      const res = await api.post('/subscriptions/recommend', {
        projectId: selectedProjectId,
      });
      if (res.data.success) {
        setRecommendation(res.data.data);
      }
    } catch (err) {
      console.error('Failed to get recommendation:', err);
    } finally {
      setRecommending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <Sidebar />
      <MobileNav />

      <main className="md:ml-64 min-h-screen flex flex-col">
        <TopBar title="Pricing & Plans" />

        <div className="flex-1 p-6 md:p-12 max-w-7xl mx-auto w-full space-y-16 pt-24 animate-fade-in">
          {/* Hero Section */}
          <div className="text-center space-y-5 max-w-3xl mx-auto pt-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold tracking-wide uppercase">
              <Sparkles className="w-4 h-4 text-primary" />
              PayPal AI Hackathon 2026 SaaS Edition
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-on-background tracking-tight">
              Flexible, Transparent Plans for Every Team
            </h1>
            <p className="text-lg text-on-surface-variant leading-relaxed">
              Supercharge your requirements engineering with AI-driven discovery, smart developer hints, and instant PayPal Sandbox checkout.
            </p>

            {/* AI Recommendation CTA Banner */}
            <div className="pt-2">
              <button
                onClick={() => {
                  setShowRecomModal(true);
                  if (selectedProjectId && !recommendation) {
                    handleGetRecommendation();
                  }
                }}
                className="inline-flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-primary to-accent text-white font-bold text-sm shadow-lg shadow-primary/25 hover:shadow-xl hover:scale-105 transition-all"
              >
                <Sparkles className="w-5 h-5 text-amber-300 animate-spin" style={{ animationDuration: '4s' }} />
                <span>AI Recommend Plan for My Project</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Pricing Cards Grid */}
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
              {plans.map((plan) => {
                const isCurrent = currentPlanId === plan.id;
                const isPro = plan.id === 'pro';
                const isEnterprise = plan.id === 'enterprise';

                return (
                  <div
                    key={plan.id}
                    className={`rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 relative overflow-hidden border ${isPro
                        ? 'border-primary ring-2 ring-primary/30 bg-surface-container-lowest shadow-2xl shadow-primary/10 scale-105 z-10'
                        : 'border-outline-variant bg-surface-container-lowest/80 hover:shadow-lg'
                      }`}
                  >
                    {isPro && (
                      <div className="absolute top-0 right-0 bg-gradient-to-l from-primary to-accent text-white text-[11px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-2xl">
                        Most Popular
                      </div>
                    )}

                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          {isEnterprise ? (
                            <Building className="w-6 h-6 text-primary" />
                          ) : isPro ? (
                            <Zap className="w-6 h-6 text-amber-500" />
                          ) : (
                            <User className="w-6 h-6 text-slate-500" />
                          )}
                          <h3 className="text-2xl font-black text-on-background">{plan.planName}</h3>
                        </div>
                        {isCurrent && (
                          <span className="px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">
                            Active Plan
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-on-surface-variant min-h-[40px] leading-relaxed">
                        {plan.description}
                      </p>

                      <div className="pt-2 pb-4 border-b border-outline-variant/60">
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-black text-on-background tracking-tight">
                            ₹{plan.price.toLocaleString('en-IN')}
                          </span>
                          <span className="text-sm text-on-surface-variant font-medium">
                            / {plan.billingInterval}
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant/70 mt-1">
                          ≈ ${(plan.price / 83).toFixed(2)} USD via PayPal
                        </p>
                      </div>

                      {/* Quota Limits Highlights */}
                      <div className="space-y-2.5 py-2">
                        <p className="text-xs font-black uppercase tracking-wider text-primary">Monthly Quotas</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-surface-container-low/60 p-2.5 rounded-xl border border-outline-variant/40">
                            <span className="text-on-surface-variant block text-[10px]">FRDs / Mo</span>
                            <span className="font-black text-on-background">{plan.usageLimits?.frdGenerations || 5}</span>
                          </div>
                          <div className="bg-surface-container-low/60 p-2.5 rounded-xl border border-outline-variant/40">
                            <span className="text-on-surface-variant block text-[10px]">Project Storage</span>
                            <span className="font-black text-on-background">
                              {plan.usageLimits?.projectStorage >= 9000 ? 'Unlimited' : plan.usageLimits?.projectStorage}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Features List */}
                      <div className="space-y-3 pt-2">
                        <p className="text-xs font-black uppercase tracking-wider text-on-surface-variant/80">Included Capabilities</p>
                        <ul className="space-y-2.5">
                          {(Array.isArray(plan.features) ? plan.features : []).map((feat, fIdx) => (
                            <li key={fIdx} className="flex items-start gap-2.5 text-xs text-on-surface-variant">
                              <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                              <span className="font-medium text-on-background">{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-8">
                      {isCurrent ? (
                        <Button
                          disabled
                          variant="outline"
                          className="w-full h-12 rounded-2xl font-bold border-emerald-500/30 text-emerald-600 bg-emerald-50/50"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" /> Current Plan
                        </Button>
                      ) : (
                        <Button
                          onClick={() => router.push(`/checkout/${plan.id}`)}
                          className={`w-full h-12 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${isPro
                              ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/30 hover:scale-105'
                              : 'bg-on-background text-background hover:bg-on-background/90'
                            }`}
                        >
                          <CreditCard className="w-4 h-4" />
                          <span>{isPro ? 'Upgrade to Pro with PayPal' : `Choose ${plan.planName}`}</span>
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Feature Comparison Matrix */}
          <div className="space-y-8 pt-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-black text-on-background">Feature Comparison Matrix</h2>
              <p className="text-sm text-on-surface-variant">Deep-dive comparison across all tiers and capabilities</p>
            </div>

            <div className="border border-outline-variant rounded-3xl overflow-hidden bg-surface-container-lowest shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="bg-surface-container-low/70 border-b border-outline-variant">
                      <th className="p-5 font-black uppercase text-xs tracking-wider text-on-surface-variant/80">Capability</th>
                      <th className="p-5 font-black uppercase text-xs tracking-wider text-on-surface-variant/80">Basic</th>
                      <th className="p-5 font-black uppercase text-xs tracking-wider text-primary">Pro</th>
                      <th className="p-5 font-black uppercase text-xs tracking-wider text-on-surface-variant/80">Enterprise</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/50 text-xs">
                    <tr>
                      <td className="p-5 font-bold text-on-background">Monthly FRD Generations</td>
                      <td className="p-5">5 / month</td>
                      <td className="p-5 font-bold text-primary">50 / month</td>
                      <td className="p-5 font-bold">500 / month</td>
                    </tr>
                    <tr>
                      <td className="p-5 font-bold text-on-background">Active Project Storage</td>
                      <td className="p-5">3 Projects</td>
                      <td className="p-5 font-bold text-primary">30 Projects</td>
                      <td className="p-5 font-bold">Unlimited</td>
                    </tr>
                    <tr>
                      <td className="p-5 font-bold text-on-background">Developer Implementation Hints</td>
                      <td className="p-5 text-on-surface-variant/60">Standard</td>
                      <td className="p-5 font-bold text-primary">Full Domain AI Engine</td>
                      <td className="p-5 font-bold">Custom Rules Engine</td>
                    </tr>
                    <tr>
                      <td className="p-5 font-bold text-on-background">Requirement Traceability Matrix (RTM)</td>
                      <td className="p-5 text-on-surface-variant/60">Basic</td>
                      <td className="p-5 font-bold text-primary">Interactive + Full Export</td>
                      <td className="p-5 font-bold">Multi-team RTM Sync</td>
                    </tr>
                    <tr>
                      <td className="p-5 font-bold text-on-background">Document Export Formats</td>
                      <td className="p-5">Markdown</td>
                      <td className="p-5 font-bold text-primary">PDF & Markdown</td>
                      <td className="p-5 font-bold">PDF, Markdown & API</td>
                    </tr>
                    <tr>
                      <td className="p-5 font-bold text-on-background">AI Subscription Recommendations</td>
                      <td className="p-5">10 analyses / mo</td>
                      <td className="p-5 font-bold text-primary">100 analyses / mo</td>
                      <td className="p-5 font-bold">Unlimited</td>
                    </tr>
                    <tr>
                      <td className="p-5 font-bold text-on-background">Payment Gateway</td>
                      <td className="p-5">PayPal Sandbox</td>
                      <td className="p-5 font-bold text-primary">PayPal Sandbox / Live</td>
                      <td className="p-5 font-bold">PayPal + Custom Invoicing</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* AI Recommendation Modal */}
      {showRecomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl max-w-2xl w-full p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-on-background">AI Plan Recommendation</h3>
                  <p className="text-xs text-on-surface-variant">Automated architectural complexity analysis</p>
                </div>
              </div>
              <button
                onClick={() => setShowRecomModal(false)}
                className="text-on-surface-variant hover:text-on-background p-2"
              >
                ✕
              </button>
            </div>

            {/* Select project */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">
                Select Project to Analyze
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => {
                  setSelectedProjectId(e.target.value);
                  setRecommendation(null);
                }}
                className="w-full p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant text-sm font-medium text-on-background"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.industry || 'General'})
                  </option>
                ))}
              </select>
            </div>

            <Button
              onClick={handleGetRecommendation}
              disabled={recommending || !selectedProjectId}
              className="w-full h-12 rounded-2xl bg-gradient-to-r from-primary to-accent text-white font-bold"
            >
              {recommending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing Project Architecture with Claude...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Analyze & Generate Plan Recommendation
                </>
              )}
            </Button>

            {/* Recommendation Result Card */}
            {recommendation && (
              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 space-y-4 animate-scale-up">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-primary">
                    Recommended Plan:
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-primary text-white">
                    {recommendation.recommendedPlanName} (₹{recommendation.recommendedPrice}/mo)
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-on-background">Complexity Assessment:</span>
                  <span className="px-2 py-0.5 rounded bg-surface-container font-mono font-bold text-primary">
                    {recommendation.complexityScore}
                  </span>
                </div>

                <p className="text-xs text-on-surface-variant leading-relaxed bg-surface-container-lowest/80 p-4 rounded-xl border border-outline-variant/60 font-medium">
                  {recommendation.reason}
                </p>

                {Array.isArray(recommendation.expectedFeaturesNeeded) && recommendation.expectedFeaturesNeeded.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
                      Target Features Required:
                    </span>
                    <ul className="space-y-1">
                      {recommendation.expectedFeaturesNeeded.slice(0, 4).map((f: string, idx: number) => (
                        <li key={idx} className="text-xs text-on-surface-variant flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="pt-2">
                  <Button
                    onClick={() => {
                      setShowRecomModal(false);
                      router.push(`/checkout/${recommendation.recommendedPlanId}`);
                    }}
                    className="w-full h-12 rounded-xl bg-primary text-white font-bold flex items-center justify-center gap-2"
                  >
                    <span>Proceed with {recommendation.recommendedPlanName}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

