import { NextRequest, NextResponse } from 'next/server';
import { subscriptionService } from '@/lib/services/subscription.service';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    const subInfo = await subscriptionService.getUserSubscription(user?.id);

    return NextResponse.json({
      success: true,
      data: {
        plan: subInfo.plan,
        status: subInfo.status,
        usage: subInfo.usage,
      },
    });
  } catch (error: any) {
    console.error('Error fetching usage:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch usage' },
      { status: 500 }
    );
  }
}

