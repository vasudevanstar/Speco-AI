'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import MobileNav from '@/components/layout/MobileNav';
import { Button } from '@/components/ui/button';
import { 
  CreditCard, 
  ShieldCheck, 
  Check, 
  ArrowLeft, 
  Lock, 
  Loader2, 
  Sparkles, 
  AlertCircle,
  QrCode,
  Smartphone,
  Copy,
  CheckCheck,
  CheckCircle2,
  Zap
} from 'lucide-react';
import { api } from '@/lib/api';

export default function CheckoutPage() {
  const router = useRouter();
  const params = useParams();
  const planId = params?.planId as string;

  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [qrProcessing, setQrProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'qr' | 'paypal'>('qr');
  const [utrNumber, setUtrNumber] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPlan();
  }, [planId]);

  const loadPlan = async () => {
    try {
      setLoading(true);
      const res = await api.get('/subscriptions/plans');
      if (res.data.success) {
        const found = res.data.data.find((p: any) => p.id === planId);
        if (found) {
          const cleaned = {
            ...found,
            features: Array.isArray(found.features)
              ? found.features
              : (typeof found.features === 'string'
                ? (() => { try { const parsed = JSON.parse(found.features); return Array.isArray(parsed) ? parsed : []; } catch { return []; } })()
                : []),
            usageLimits: typeof found.usageLimits === 'string'
              ? (() => { try { return JSON.parse(found.usageLimits); } catch { return {}; } })()
              : (found.usageLimits || {}),
          };
          setPlan(cleaned);
        } else {
          setError('Selected subscription plan not found');
        }
      }
    } catch (err: any) {
      console.error('Failed to load plan:', err);
      setError('Unable to load plan details');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUpi = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText('specoai.frd@okhdfcbank');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleQRConfirm = async () => {
    try {
      setQrProcessing(true);
      setError(null);

      const res = await api.post('/payments/qr/confirm', {
        planId: plan.id,
        utr: utrNumber.trim() || undefined,
        refId: `UPI-QR-${Date.now()}`,
      });

      if (!res.data.success) {
        throw new Error(res.data.error || 'Payment verification failed');
      }

      const orderId = res.data.data?.orderId || `UPI-QR-${Date.now()}`;
      router.push(`/payment/success?orderId=${orderId}&planId=${plan.id}&amount=${plan.price}`);
    } catch (err: any) {
      console.error('QR Payment verification error:', err);
      setError(err.response?.data?.error || err.message || 'Payment verification failed');
    } finally {
      setQrProcessing(false);
    }
  };

  const handlePayPalCheckout = async () => {
    try {
      setProcessing(true);
      setError(null);

      // Step 1: Create Order on Backend
      const orderRes = await api.post('/payments/paypal/create-order', {
        planId: plan.id,
      });

      if (!orderRes.data.success || !orderRes.data.data?.orderId) {
        throw new Error(orderRes.data.error || 'Failed to create PayPal order');
      }

      const orderId = orderRes.data.data.orderId;
      console.log('Created PayPal Order:', orderId);

      // Step 2: Capture Order on Backend
      const captureRes = await api.post('/payments/paypal/capture-order', {
        orderId,
        planId: plan.id,
      });

      if (!captureRes.data.success) {
        throw new Error(captureRes.data.error || 'Payment capture failed');
      }

      console.log('Captured Order:', captureRes.data);

      // Step 3: Redirect to Payment Success Confirmation Screen
      router.push(`/payment/success?orderId=${orderId}&planId=${plan.id}&amount=${plan.price}`);
    } catch (err: any) {
      console.error('PayPal checkout error:', err);
      setError(err.response?.data?.error || err.message || 'Payment processing failed');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-background items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  const upiId = 'specoai.frd@okhdfcbank';
  const upiPayload = `upi://pay?pa=${upiId}&pn=Speco%20AI%20Software&am=${plan?.price || 1999}&cu=INR&tn=Speco%20AI%20${encodeURIComponent(plan?.planName || 'Plan')}%20Plan`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(upiPayload)}`;

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <Sidebar />
      <MobileNav />

      <main className="md:ml-64 min-h-screen flex flex-col">
        <TopBar title="Complete Subscription" />

        <div className="flex-1 p-6 md:p-12 max-w-6xl mx-auto w-full space-y-8 pt-24 animate-fade-in">
          <button
            onClick={() => router.push('/pricing')}
            className="inline-flex items-center gap-2 text-sm font-bold text-on-surface-variant hover:text-on-background transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Pricing</span>
          </button>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
              <Zap className="w-4 h-4 text-emerald-600" />
              Instant Subscription Checkout
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-on-background tracking-tight">
              Unlock {plan?.planName}
            </h1>
            <p className="text-sm text-on-surface-variant">
              Scan the QR code with any UPI app (GPay / PhonePe / Paytm) or use PayPal Sandbox to complete your upgrade.
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {plan && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Order Summary (5 cols) */}
              <div className="lg:col-span-5 rounded-3xl border border-outline-variant bg-surface-container-lowest p-6 md:p-8 space-y-6 shadow-sm">
                <div className="flex items-center justify-between pb-6 border-b border-outline-variant/60">
                  <div>
                    <h3 className="text-2xl font-black text-on-background">{plan.planName}</h3>
                    <p className="text-xs text-on-surface-variant mt-1">{plan.description}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-primary/10 text-primary">
                    Monthly
                  </span>
                </div>

                <div className="space-y-3">
                  <span className="text-xs font-black uppercase tracking-wider text-on-surface-variant/80 block">
                    Plan Entitlements & Included Quotas:
                  </span>
                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <div className="p-3 rounded-xl bg-surface-container-low/60 border border-outline-variant/40">
                      <span className="text-on-surface-variant block text-[10px]">FRD Generations</span>
                      <span className="font-bold text-on-background">{plan.usageLimits?.frdGenerations} / month</span>
                    </div>
                    <div className="p-3 rounded-xl bg-surface-container-low/60 border border-outline-variant/40">
                      <span className="text-on-surface-variant block text-[10px]">Project Storage</span>
                      <span className="font-bold text-on-background">
                        {plan.usageLimits?.projectStorage >= 9000 ? 'Unlimited' : `${plan.usageLimits?.projectStorage} Projects`}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-surface-container-low/60 border border-outline-variant/40">
                      <span className="text-on-surface-variant block text-[10px]">Document Exports</span>
                      <span className="font-bold text-on-background">{plan.usageLimits?.documentExports} / month</span>
                    </div>
                    <div className="p-3 rounded-xl bg-surface-container-low/60 border border-outline-variant/40">
                      <span className="text-on-surface-variant block text-[10px]">AI Recommendations</span>
                      <span className="font-bold text-on-background">{plan.usageLimits?.aiRecommendations} / month</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <span className="text-xs font-black uppercase tracking-wider text-on-surface-variant/80 block">
                    Key Features Included:
                  </span>
                  <ul className="space-y-2">
                    {(Array.isArray(plan.features) ? plan.features : []).slice(0, 5).map((f: string, idx: number) => (
                      <li key={idx} className="flex items-center gap-2 text-xs text-on-surface-variant">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 border-t border-outline-variant/60 flex justify-between items-baseline">
                  <div>
                    <span className="text-xs text-on-surface-variant block">Total Due:</span>
                    <span className="text-2xl font-black text-primary">₹{plan.price.toLocaleString('en-IN')}</span>
                    <span className="text-xs text-on-surface-variant ml-1">/ month</span>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    Taxes Included
                  </span>
                </div>
              </div>

              {/* Payment Box (7 cols) */}
              <div className="lg:col-span-7 rounded-3xl border border-primary/20 bg-surface-container-lowest p-6 md:p-8 space-y-6 shadow-md">
                {/* Payment Method Selector Tabs */}
                <div className="flex rounded-2xl bg-surface-container-low p-1.5 border border-outline-variant/60 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('qr')}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all ${
                      paymentMethod === 'qr'
                        ? 'bg-primary text-white shadow-md shadow-primary/25'
                        : 'text-on-surface-variant hover:text-on-background'
                    }`}
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Scan QR to Pay (UPI)</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-400 text-slate-900 font-extrabold uppercase ml-1">
                      Instant
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('paypal')}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all ${
                      paymentMethod === 'paypal'
                        ? 'bg-[#0070BA] text-white shadow-md shadow-blue-500/25'
                        : 'text-on-surface-variant hover:text-on-background'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>PayPal Sandbox</span>
                  </button>
                </div>

                {/* TAB 1: QR CODE PAYMENT (UPI) */}
                {paymentMethod === 'qr' && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="text-center space-y-1">
                      <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>Google Pay • PhonePe • Paytm • BHIM • Cred</span>
                      </div>
                      <h4 className="text-base font-black text-on-background pt-1">
                        Scan with any UPI App to Pay ₹{plan.price.toLocaleString('en-IN')}
                      </h4>
                    </div>

                    {/* QR Code Card */}
                    <div className="flex flex-col items-center justify-center bg-gradient-to-b from-white to-slate-50 p-6 rounded-2xl border-2 border-primary/20 shadow-md">
                      <div className="relative p-2 bg-white rounded-2xl shadow-sm border border-slate-200">
                        <img
                          src={qrCodeUrl}
                          alt="Scan UPI QR Code to Pay"
                          className="w-52 h-52 object-contain rounded-xl"
                          onError={(e) => {
                            // Fallback standard QR if image service temporarily unreachable
                            (e.target as any).src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=upi://pay?pa=specoai.frd@okhdfcbank`;
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
                          <QrCode className="w-16 h-16 text-primary" />
                        </div>
                      </div>

                      <div className="mt-4 flex items-center gap-2 bg-slate-100 hover:bg-slate-200/80 transition-colors px-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-800 font-mono">
                        <span className="font-semibold text-slate-500 text-[11px]">UPI ID:</span>
                        <span className="font-bold">{upiId}</span>
                        <button
                          type="button"
                          onClick={handleCopyUpi}
                          className="ml-1 p-1 hover:bg-white rounded transition-colors text-primary"
                          title="Copy UPI ID"
                        >
                          {copied ? (
                            <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      {copied && (
                        <span className="text-[10px] text-emerald-600 font-bold mt-1">UPI ID Copied to Clipboard!</span>
                      )}
                    </div>

                    {/* UTR Input & Confirmation Button */}
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-bold text-on-surface-variant block mb-1.5">
                          12-digit UTR / UPI Transaction Reference (Optional):
                        </label>
                        <input
                          type="text"
                          value={utrNumber}
                          onChange={(e) => setUtrNumber(e.target.value)}
                          placeholder="e.g. 412389475612 or Leave empty for instant test"
                          className="w-full h-11 px-4 rounded-xl border border-outline-variant bg-surface-container-low text-xs font-mono text-on-background focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                      </div>

                      <Button
                        onClick={handleQRConfirm}
                        disabled={qrProcessing}
                        className="w-full h-14 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-primary text-white font-black text-base shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 hover:opacity-95 transition-all active:scale-95"
                      >
                        {qrProcessing ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Verifying Payment & Unlocking Plan...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                            <span>I Have Paid — Unlock {plan.planName} Now</span>
                          </>
                        )}
                      </Button>

                      <div className="text-center text-[11px] text-on-surface-variant flex items-center justify-center gap-1.5 pt-1">
                        <Lock className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Instant automated activation upon verification</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: PAYPAL SANDBOX */}
                {paymentMethod === 'paypal' && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between text-on-surface-variant">
                        <span>Plan Price:</span>
                        <span className="font-semibold text-on-background">₹{plan.price.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-on-surface-variant">
                        <span>PayPal Equivalent (USD):</span>
                        <span className="font-semibold text-on-background">≈ ${(plan.price / 83).toFixed(2)} USD</span>
                      </div>
                      <div className="flex justify-between text-on-surface-variant">
                        <span>Environment:</span>
                        <span className="font-bold text-blue-600">PayPal Developer Sandbox</span>
                      </div>
                    </div>

                    <Button
                      onClick={handlePayPalCheckout}
                      disabled={processing}
                      className="w-full h-14 rounded-2xl bg-[#0070BA] hover:bg-[#003087] text-white font-black text-base shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      {processing ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Processing PayPal Sandbox...</span>
                        </>
                      ) : (
                        <>
                          <span className="italic font-black text-lg">P</span>
                          <span className="italic font-black text-lg -ml-1 text-cyan-300">P</span>
                          <span>Pay with PayPal Sandbox</span>
                        </>
                      )}
                    </Button>

                    <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/40 text-[11px] text-on-surface-variant leading-relaxed">
                      💡 <strong>Sandbox Note:</strong> Runs in PayPal developer sandbox environment. Automatically verifies and unlocks your quota upon capture.
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}


