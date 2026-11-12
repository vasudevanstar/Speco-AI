'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import MobileNav from '@/components/layout/MobileNav';
import { Button } from '@/components/ui/button';
import { 
  CreditCard, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ArrowUpRight, 
  FileText, 
  Layers, 
  Receipt, 
  ShieldCheck, 
  Loader2,
  RefreshCw,
  Ban,
  ArrowDownRight
} from 'lucide-react';
import { api } from '@/lib/api';

export default function SubscriptionPage() {
  const router = useRouter();
  const [subInfo, setSubInfo] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [downgrading, setDowngrading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);
      const [currentRes, payRes, histRes] = await Promise.all([
        api.get('/subscriptions/current'),
        api.get('/payments/history').catch(() => ({ data: { data: [] } })),
        api.get('/subscriptions/history').catch(() => ({ data: { data: [] } })),
      ]);

      if (currentRes.data.success) {
        setSubInfo(currentRes.data.data);
      }
      if (payRes.data.success) {
        setPayments(payRes.data.data || []);
      }
      if (histRes.data.success) {
        setHistory(histRes.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load subscription data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? Your premium access will remain active until the end of your billing cycle.')) {
      return;
    }
    try {
      setCancelling(true);
      const res = await api.post('/subscriptions/cancel', {
        reason: 'User cancelled from dashboard',
      });
      if (res.data.success) {
        setMessage('Subscription cancelled. Your paid access remains active until the expiration date.');
        await fetchSubscriptionData();
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to cancel subscription');
    } finally {
      setCancelling(false);
    }
  };

  const handleDowngrade = async (targetPlanId: string) => {
    if (!confirm(`Are you sure you want to switch to the ${targetPlanId.toUpperCase()} plan? Your existing projects and documents will be fully preserved.`)) {
      return;
    }
    try {
      setDowngrading(true);
      const res = await api.post('/subscriptions/downgrade', { targetPlanId });
      if (res.data.success) {
        setMessage(res.data.message);
        await fetchSubscriptionData();
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to downgrade plan');
    } finally {
      setDowngrading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-background items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  const plan = subInfo?.plan || { planName: 'Basic Plan', id: 'basic', price: 499 };
  const usage = subInfo?.usage || {
    frdGenerations: { used: 0, limit: 5 },
    projectStorage: { used: 0, limit: 3 },
    documentExports: { used: 0, limit: 5 },
    aiRecommendations: { used: 0, limit: 10 },
  };

  const isPro = plan.id === 'pro';
  const isEnterprise = plan.id === 'enterprise';

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <Sidebar />
      <MobileNav />

      <main className="md:ml-64 min-h-screen flex flex-col">
        <TopBar title="Subscription & Billing" />

        <div className="flex-1 p-6 md:p-12 max-w-7xl mx-auto w-full space-y-12 pt-24 animate-fade-in">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-2">
                <CreditCard className="w-4 h-4" />
                Subscription & Quota Management
              </div>
              <h1 className="text-3xl font-black text-on-background tracking-tight">
                Billing & Subscription Dashboard
              </h1>
              <p className="text-sm text-on-surface-variant">
                Manage your active plan, monitor real-time feature quotas, and view PayPal payment history.
              </p>
            </div>

            <Button
              onClick={() => router.push('/pricing')}
              className="h-11 rounded-2xl bg-gradient-to-r from-primary to-accent text-white font-bold px-6 shadow-md shadow-primary/20 hover:scale-105 transition-all"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Upgrade Plan
            </Button>
          </div>

          {message && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{message}</span>
              </div>
              <button onClick={() => setMessage(null)} className="font-bold text-xs hover:underline">Dismiss</button>
            </div>
          )}

          {/* Active Plan & Usage Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Active Plan Card (1 col) */}
            <div className="rounded-3xl border border-outline-variant bg-surface-container-lowest p-8 space-y-6 shadow-sm flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-primary">Current Plan</span>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                    subInfo?.isCancelled
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : subInfo?.isExpired
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {subInfo?.isCancelled ? 'Cancelled (Active until Expiry)' : subInfo?.isExpired ? 'Expired' : 'Active'}
                  </span>
                </div>

                <div>
                  <h3 className="text-3xl font-black text-on-background">{plan.planName}</h3>
                  <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{plan.description}</p>
                </div>

                <div className="pt-2">
                  <span className="text-3xl font-black text-on-background">
                    ₹{plan.price?.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-on-surface-variant ml-1">/ month</span>
                </div>

                <div className="space-y-2 pt-2 border-t border-outline-variant/60 text-xs">
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Billing Cycle:</span>
                    <span className="font-medium text-on-background">Monthly via PayPal</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Started On:</span>
                    <span className="font-medium text-on-background">
                      {subInfo?.startDate ? new Date(subInfo.startDate).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Next Billing / Expiry:</span>
                    <span className="font-medium text-on-background">
                      {subInfo?.expiryDate ? new Date(subInfo.expiryDate).toLocaleDateString() : 'Active'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t border-outline-variant/60 space-y-2">
                {!isEnterprise && (
                  <Button
                    onClick={() => router.push(isPro ? '/checkout/enterprise' : '/checkout/pro')}
                    className="w-full h-11 rounded-xl bg-primary text-white font-bold text-xs"
                  >
                    <ArrowUpRight className="w-4 h-4 mr-1.5" />
                    {isPro ? 'Upgrade to Enterprise' : 'Upgrade to Pro'}
                  </Button>
                )}

                {isPro && (
                  <Button
                    onClick={() => handleDowngrade('basic')}
                    disabled={downgrading}
                    variant="outline"
                    className="w-full h-10 rounded-xl text-xs font-semibold"
                  >
                    <ArrowDownRight className="w-3.5 h-3.5 mr-1" />
                    Downgrade to Basic
                  </Button>
                )}

                {!subInfo?.isCancelled && (
                  <Button
                    onClick={handleCancel}
                    disabled={cancelling}
                    variant="ghost"
                    className="w-full h-10 rounded-xl text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <Ban className="w-3.5 h-3.5 mr-1.5" />
                    Cancel Subscription
                  </Button>
                )}
              </div>
            </div>

            {/* Quota Usage Bars (2 cols) */}
            <div className="lg:col-span-2 rounded-3xl border border-outline-variant bg-surface-container-lowest p-8 space-y-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-outline-variant/60">
                <h3 className="text-lg font-black text-on-background">Current Monthly Usage</h3>
                <span className="text-xs text-on-surface-variant">Resets every billing cycle</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* FRD Generations */}
                <div className="p-5 rounded-2xl bg-surface-container-low/50 border border-outline-variant/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-on-background flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-primary" />
                      FRD Generations
                    </span>
                    <span className="text-xs font-mono font-bold text-primary">
                      {usage.frdGenerations.used} / {usage.frdGenerations.limit >= 9000 ? '∞' : usage.frdGenerations.limit}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (usage.frdGenerations.used / Math.max(1, usage.frdGenerations.limit)) * 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-on-surface-variant block">
                    {usage.frdGenerations.remaining} generations remaining this cycle
                  </span>
                </div>

                {/* Project Storage */}
                <div className="p-5 rounded-2xl bg-surface-container-low/50 border border-outline-variant/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-on-background flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-accent" />
                      Active Project Storage
                    </span>
                    <span className="text-xs font-mono font-bold text-accent">
                      {usage.projectStorage.used} / {usage.projectStorage.limit >= 9000 ? '∞' : usage.projectStorage.limit}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (usage.projectStorage.used / Math.max(1, usage.projectStorage.limit)) * 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-on-surface-variant block">
                    {usage.projectStorage.remaining >= 9000 ? 'Unlimited projects' : `${usage.projectStorage.remaining} slots available`}
                  </span>
                </div>

                {/* Document Exports */}
                <div className="p-5 rounded-2xl bg-surface-container-low/50 border border-outline-variant/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-on-background flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-emerald-500" />
                      Document Exports (PDF / MD)
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-600">
                      {usage.documentExports.used} / {usage.documentExports.limit >= 9000 ? '∞' : usage.documentExports.limit}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (usage.documentExports.used / Math.max(1, usage.documentExports.limit)) * 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-on-surface-variant block">
                    {usage.documentExports.remaining >= 9000 ? 'Unlimited exports' : `${usage.documentExports.remaining} exports remaining`}
                  </span>
                </div>

                {/* AI Recommendations */}
                <div className="p-5 rounded-2xl bg-surface-container-low/50 border border-outline-variant/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-on-background flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      AI Plan Recommendations
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-600">
                      {usage.aiRecommendations.used} / {usage.aiRecommendations.limit >= 9000 ? '∞' : usage.aiRecommendations.limit}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (usage.aiRecommendations.used / Math.max(1, usage.aiRecommendations.limit)) * 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-on-surface-variant block">
                    {usage.aiRecommendations.remaining >= 9000 ? 'Unlimited analyses' : `${usage.aiRecommendations.remaining} analyses remaining`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment History Section */}
          <div className="space-y-4">
            <h3 className="text-xl font-black text-on-background flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" />
              PayPal Payment History
            </h3>

            <div className="border border-outline-variant rounded-3xl overflow-hidden bg-surface-container-lowest shadow-sm">
              {payments.length === 0 ? (
                <div className="p-8 text-center text-sm text-on-surface-variant">
                  No payment transactions recorded yet. Completed PayPal payments will appear here.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="bg-surface-container-low/60 border-b border-outline-variant">
                        <th className="p-4 font-black uppercase tracking-wider text-on-surface-variant/80">Order Ref</th>
                        <th className="p-4 font-black uppercase tracking-wider text-on-surface-variant/80">Plan</th>
                        <th className="p-4 font-black uppercase tracking-wider text-on-surface-variant/80">Amount</th>
                        <th className="p-4 font-black uppercase tracking-wider text-on-surface-variant/80">Date</th>
                        <th className="p-4 font-black uppercase tracking-wider text-on-surface-variant/80">Payment Method</th>
                        <th className="p-4 font-black uppercase tracking-wider text-on-surface-variant/80">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/40">
                      {payments.map((p, idx) => (
                        <tr key={idx} className="hover:bg-primary/5 transition-colors">
                          <td className="p-4 font-mono font-bold text-primary">{p.paypalOrderId}</td>
                          <td className="p-4 font-bold text-on-background uppercase">{p.planId}</td>
                          <td className="p-4 font-black">
                            {p.currency === 'INR' ? `₹${p.amount}` : `$${p.amount} ${p.currency}`}
                          </td>
                          <td className="p-4 text-on-surface-variant">
                            {new Date(p.paymentDate || p.created_at).toLocaleDateString()}
                          </td>
                          <td className="p-4 text-on-surface-variant">PayPal Developer Sandbox</td>
                          <td className="p-4">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {p.paymentStatus || 'COMPLETED'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Subscription History Section */}
          {history.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-black text-on-background flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Subscription Activity Audit Trail
              </h3>

              <div className="border border-outline-variant rounded-3xl overflow-hidden bg-surface-container-lowest p-6 shadow-sm space-y-4">
                {history.map((h, idx) => (
                  <div key={idx} className="flex items-start gap-4 pb-4 border-b border-outline-variant/40 last:border-b-0 last:pb-0 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-on-background uppercase tracking-wide">
                          Action: {h.action} (Plan: {h.newPlanId})
                        </span>
                        <span className="text-[10px] text-on-surface-variant font-mono">
                          {new Date(h.effectiveDate || h.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-on-surface-variant mt-0.5">{h.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

