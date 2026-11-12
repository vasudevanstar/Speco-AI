import { NextRequest, NextResponse } from 'next/server';
import { paypalService } from '@/lib/services/paypal.service';
import { SubscriptionPlan } from '@/lib/db/models';
import { getAuthUser } from '@/lib/auth';
import { subscriptionService } from '@/lib/services/subscription.service';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    const effectiveUserId = await subscriptionService.getEffectiveUserId(user?.id);
    const { planId, currency } = await req.json();

    if (!planId) {
      return NextResponse.json({ success: false, error: 'Plan ID is required' }, { status: 400 });
    }

    // Server-side validation: Retrieve authentic price from database, NEVER trust frontend input
    const plan = (await SubscriptionPlan.findById(planId)) as any;
    if (!plan || !plan.isActive) {
      return NextResponse.json({ success: false, error: `Invalid or inactive plan: ${planId}` }, { status: 404 });
    }

    const order = await paypalService.createOrder({
      planId: plan.id,
      planName: plan.planName,
      amount: plan.price,
      currency: currency || plan.currency || 'INR',
      userId: effectiveUserId,
      userEmail: user?.email,
    });

    return NextResponse.json({
      success: true,
      data: {
        orderId: order.orderId,
        status: order.status,
        approveUrl: order.approveUrl,
        plan: {
          id: plan.id,
          name: plan.planName,
          price: plan.price,
          currency: plan.currency,
        },
      },
    });
  } catch (error: any) {
    console.error('Error creating PayPal order:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create PayPal order' },
      { status: 500 }
    );
  }
}

