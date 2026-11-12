import { NextRequest, NextResponse } from 'next/server';
import { paypalService } from '@/lib/services/paypal.service';
import { subscriptionService } from '@/lib/services/subscription.service';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    // Extract headers for PayPal signature verification
    const headers: Record<string, string> = {
      'paypal-auth-algo': req.headers.get('paypal-auth-algo') || '',
      'paypal-cert-url': req.headers.get('paypal-cert-url') || '',
      'paypal-transmission-id': req.headers.get('paypal-transmission-id') || '',
      'paypal-transmission-sig': req.headers.get('paypal-transmission-sig') || '',
      'paypal-transmission-time': req.headers.get('paypal-transmission-time') || '',
    };

    // Verify webhook signature
    const isValid = await paypalService.verifyWebhookSignature({
      headers,
      rawBody,
    });

    if (!isValid) {
      console.warn('Rejected unauthorized PayPal webhook notification');
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }

    // Process event idempotently
    const result = await subscriptionService.processWebhookEvent(event);

    return NextResponse.json({
      success: true,
      handled: result.handled,
      message: result.message,
    });
  } catch (error: any) {
    console.error('PayPal webhook error:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

