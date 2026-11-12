'use client';

import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import MobileNav from '@/components/layout/MobileNav';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';

export default function PaymentCancelPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <Sidebar />
      <MobileNav />

      <main className="md:ml-64 min-h-screen flex flex-col">
        <TopBar title="Payment Cancelled" />

        <div className="flex-1 p-6 md:p-12 max-w-xl mx-auto w-full flex flex-col items-center justify-center space-y-6 text-center pt-24 animate-fade-in my-auto">
          <div className="w-20 h-20 rounded-full bg-amber-500/10 border-2 border-amber-500/20 flex items-center justify-center text-amber-600 shadow-lg shadow-amber-500/10">
            <AlertCircle className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-black text-on-background">Payment Cancelled</h1>
            <p className="text-sm text-on-surface-variant max-w-sm mx-auto">
              Your checkout session was cancelled. No charges were made to your account.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/60 text-xs text-on-surface-variant leading-relaxed text-left w-full">
            💡 You can return to the pricing page anytime to select a plan and retry the payment, or continue using your existing plan limits.
          </div>

          <div className="flex items-center gap-4 pt-4">
            <Button
              onClick={() => router.push('/pricing')}
              className="h-12 rounded-2xl bg-primary text-white font-bold px-6"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Return to Pricing
            </Button>
            <Button
              onClick={() => router.push('/projects')}
              variant="outline"
              className="h-12 rounded-2xl font-bold px-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Projects
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

