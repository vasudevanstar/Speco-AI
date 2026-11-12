import { NextRequest, NextResponse } from 'next/server';
import { subscriptionService } from '@/lib/services/subscription.service';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    const payments = await subscriptionService.getPaymentHistory(user?.id);

    return NextResponse.json({
      success: true,
      data: payments,
    });
  } catch (error: any) {
    console.error('Error fetching payments history:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch payment records' },
      { status: 500 }
    );
  }
}

