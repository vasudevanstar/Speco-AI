import { NextResponse } from 'next/server';
import { SubscriptionPlan } from '@/lib/db/models';

export async function GET() {
  try {
    const plans = await SubscriptionPlan.findAll({
      where: { isActive: true },
      order: [['price', 'ASC']],
    });

    const formattedPlans = plans.map((p: any) => {
      const item = p.toJSON ? p.toJSON() : { ...p };
      if (typeof item.features === 'string') {
        try {
          item.features = JSON.parse(item.features);
        } catch {
          item.features = [];
        }
      }
      if (typeof item.usageLimits === 'string') {
        try {
          item.usageLimits = JSON.parse(item.usageLimits);
        } catch {
          item.usageLimits = {};
        }
      }
      return item;
    });

    return NextResponse.json({
      success: true,
      data: formattedPlans,
    });
  } catch (error: any) {
    console.error('Error fetching subscription plans:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch subscription plans' },
      { status: 500 }
    );
  }
}

