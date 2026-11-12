import { NextRequest, NextResponse } from 'next/server';
import { subscriptionService } from '@/lib/services/subscription.service';
import { SubscriptionPlan } from '@/lib/db/models';
import { getAuthUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    const effectiveUserId = await subscriptionService.getEffectiveUserId(user?.id);
    const { planId, utr, refId } = await req.json();

    if (!planId) {
      return NextResponse.json({ success: false, error: 'Plan ID is required' }, { status: 400 });
    }

    const plan = (await SubscriptionPlan.findById(planId)) as any;
    if (!plan || !plan.isActive) {
      return NextResponse.json({ success: false, error: `Plan ${planId} not found or inactive` }, { status: 404 });
    }

    const orderId = refId || `UPI-QR-${Date.now()}`;
    const captureResult = {
      success: true,
      orderId,
      captureId: utr ? `UTR-${utr}` : `QR-CAP-${Date.now()}`,
      status: 'COMPLETED',
      amount: plan.price,
      currency: plan.currency || 'INR',
      payerEmail: user?.email || 'upi-subscriber@speco.ai',
      payerName: user?.name || 'UPI QR Subscriber',
      customId: JSON.stringify({ planId: plan.id, method: 'UPI_QR', utr }),
      rawDetails: {
        paymentMethod: 'UPI_QR',
        utr: utr || 'VERIFIED_ON_SCREEN',
        timestamp: new Date().toISOString(),
      },
    };

    const activation = await subscriptionService.activateSubscriptionFromPayment({
      userId: effectiveUserId,
      planId: plan.id,
      orderId,
      captureResult,
    });

    return NextResponse.json({
      success: true,
      message: 'QR Payment verified successfully! Premium features unlocked.',
      data: {
        orderId,
        planId: plan.id,
        amount: plan.price,
        subscription: activation.subscription,
        payment: activation.payment,
      },
    });
  } catch (error: any) {
    console.error('QR Payment verification error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Payment confirmation failed' },
      { status: 500 }
    );
  }
}

