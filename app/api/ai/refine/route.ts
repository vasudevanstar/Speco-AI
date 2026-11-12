import { NextResponse } from 'next/server';
import { aiService } from '@/lib/ai/ai.service';

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    const refinedText = await aiService.refineText(text);

    return NextResponse.json({
      success: true,
      refinedText,
    });
  } catch (error: any) {
    console.error('Refine text error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to refine text' },
      { status: 500 }
    );
  }
}
