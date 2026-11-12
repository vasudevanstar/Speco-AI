import { NextRequest, NextResponse } from 'next/server';
import { subscriptionService } from '@/lib/services/subscription.service';
import { getAuthUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    const body = await req.json().catch(() => ({}));

    const cancelled = await subscriptionService.cancelSubscription(user.id, body.reason);

    return NextResponse.json({
      success: true,
      message: 'Subscription has been cancelled. Your premium access remains active until the end of your billing cycle.',
      data: cancelled,
    });
  } catch (error: any) {
    console.error('Error cancelling subscription:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}

