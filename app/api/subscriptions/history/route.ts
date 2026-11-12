import { NextRequest, NextResponse } from 'next/server';
import { subscriptionService } from '@/lib/services/subscription.service';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    const history = await subscriptionService.getSubscriptionHistory(user?.id);

    return NextResponse.json({
      success: true,
      data: history,
    });
  } catch (error: any) {
    console.error('Error fetching subscription history:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch subscription history' },
      { status: 500 }
    );
  }
}

