import { NextRequest, NextResponse } from 'next/server';
import { paypalService } from '@/lib/services/paypal.service';
import { subscriptionService } from '@/lib/services/subscription.service';
import { getAuthUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    const effectiveUserId = await subscriptionService.getEffectiveUserId(user?.id);
    const { orderId, planId } = await req.json();

    if (!orderId || !planId) {
      return NextResponse.json({ success: false, error: 'Order ID and Plan ID are required' }, { status: 400 });
    }

    console.log(`Capturing PayPal order ${orderId} for user ${effectiveUserId} on plan ${planId}...`);

    // 1. Capture order using official PayPal API
    const captureResult = await paypalService.captureOrder(orderId);

    if (!captureResult.success) {
      return NextResponse.json({
        success: false,
        error: `Payment capture failed with status: ${captureResult.status}`,
        details: captureResult,
      }, { status: 400 });
    }

    // 2. Verified Payment! Automatically activate subscription and unlock premium features
    const activation = await subscriptionService.activateSubscriptionFromPayment({
      userId: effectiveUserId,
      planId,
      orderId,
      captureResult,
    });

    return NextResponse.json({
      success: true,
      message: 'Payment verified and captured successfully. Premium subscription activated!',
      data: {
        orderId,
        captureId: captureResult.captureId,
        status: captureResult.status,
        amount: captureResult.amount,
        currency: captureResult.currency,
        subscription: activation.subscription,
        payment: activation.payment,
      },
    });
  } catch (error: any) {
    console.error('Error capturing PayPal order:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to capture PayPal payment' },
      { status: 500 }
    );
  }
}

