'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import MobileNav from '@/components/layout/MobileNav';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  Download, 
  FileText, 
  ShieldCheck, 
  Receipt,
  Layers,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams?.get('orderId') || 'ORDER-SANDBOX-VERIFIED';
  const planId = searchParams?.get('planId') || 'pro';
  const amount = searchParams?.get('amount') || '1999';

  const isUpi = orderId.startsWith('UPI-') || orderId.startsWith('QR-');
  const planName = planId === 'enterprise' ? 'Enterprise Plan' : planId === 'basic' ? 'Basic Plan' : 'Pro Plan';

  return (
    <main className="flex-1 p-6 md:p-12 max-w-3xl mx-auto w-full flex flex-col items-center justify-center space-y-8 text-center my-auto">
      {/* Success Badge & Animation */}
      <div className="relative">
        <div className="w-24 h-24 rounded-full bg-emerald-500/10 border-2 border-emerald-500/20 flex items-center justify-center text-emerald-600 shadow-xl shadow-emerald-500/10 animate-bounce" style={{ animationDuration: '2s' }}>
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-amber-400 text-slate-900 flex items-center justify-center shadow">
          <Sparkles className="w-4 h-4" />
        </div>
      </div>

      <div className="space-y-3">
        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
          {isUpi ? 'UPI / QR Code Verified Payment' : 'PayPal Verified Payment'}
        </span>
        <h1 className="text-3xl md:text-4xl font-black text-on-background tracking-tight">
          Payment Successful & Premium Unlocked!
        </h1>
        <p className="text-sm text-on-surface-variant max-w-md mx-auto">
          Your payment transaction was verified and captured on the backend. Your <strong>{planName}</strong> features are now active.
        </p>
      </div>

      {/* Transaction Receipt Card */}
      <div className="w-full rounded-3xl border border-outline-variant bg-surface-container-lowest p-6 md:p-8 space-y-4 text-left shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-outline-variant/60">
          <span className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
            <Receipt className="w-4 h-4" />
            Transaction Receipt
          </span>
          <span className="text-xs font-mono bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
            COMPLETED
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-on-surface-variant block">{isUpi ? 'Transaction / Reference ID:' : 'PayPal Order ID:'}</span>
            <span className="font-mono font-bold text-on-background">{orderId}</span>
          </div>
          <div>
            <span className="text-on-surface-variant block">Payment Method:</span>
            <span className="font-bold text-on-background">{isUpi ? 'UPI Scan & Pay (GPay/PhonePe)' : 'PayPal Sandbox'}</span>
          </div>
          <div>
            <span className="text-on-surface-variant block">Active Plan:</span>
            <span className="font-bold text-on-background">{planName}</span>
          </div>
          <div>
            <span className="text-on-surface-variant block">Amount Billed:</span>
            <span className="font-black text-primary">₹{parseInt(amount).toLocaleString('en-IN')} / month</span>
          </div>
        </div>

        <div className="pt-4 border-t border-outline-variant/60 space-y-2">
          <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">
            Unlocked Premium Capabilities:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2 text-on-background font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Full Developer Implementation Hints</span>
            </div>
            <div className="flex items-center gap-2 text-on-background font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>High-capacity FRD Generations</span>
            </div>
            <div className="flex items-center gap-2 text-on-background font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Executive PDF & Markdown Exports</span>
            </div>
            <div className="flex items-center gap-2 text-on-background font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Traceability Matrix (RTM) Engine</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center pt-2">
        <Button
          onClick={() => router.push('/subscription')}
          variant="outline"
          className="w-full sm:w-auto h-12 rounded-2xl font-bold px-6"
        >
          View Subscription & Usage
        </Button>
        <Button
          onClick={() => router.push('/projects')}
          className="w-full sm:w-auto h-12 rounded-2xl font-bold bg-gradient-to-r from-primary to-accent text-white px-8 shadow-lg shadow-primary/20"
        >
          <span>Continue to FRD Generator</span>
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </main>
  );
}

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen bg-background text-on-surface">
      <Sidebar />
      <MobileNav />

      <main className="md:ml-64 min-h-screen flex flex-col">
        <TopBar title="Payment Confirmation" />

        <div className="flex-1 p-6 md:p-12 max-w-4xl mx-auto w-full pt-24 animate-fade-in flex flex-col justify-center">
          <Suspense fallback={<div className="p-12 text-center text-sm">Loading confirmation...</div>}>
            <PaymentSuccessContent />
          </Suspense>
        </div>
      </main>
    </div>
  );
}

