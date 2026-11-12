import { NextRequest, NextResponse } from 'next/server';
import { subscriptionService } from '@/lib/services/subscription.service';
import { getAuthUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    const { targetPlanId } = await req.json();

    if (!targetPlanId) {
      return NextResponse.json({ success: false, error: 'Target plan ID is required' }, { status: 400 });
    }

    const updated = await subscriptionService.downgradeSubscription(user.id, targetPlanId);

    return NextResponse.json({
      success: true,
      message: `Successfully downgraded to ${targetPlanId}. Existing documents and projects are preserved.`,
      data: updated,
    });
  } catch (error: any) {
    console.error('Error downgrading subscription:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to downgrade subscription' },
      { status: 500 }
    );
  }
}

