import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { buildSystemPrompt, type BusinessContext } from '@/lib/ai-system-prompt';
import { validateAIResponse } from '@/lib/ai-response-validator';
import type { AIReportResult } from '@/types/ai-report';

// ── Client (lazy singleton) ──────────────────────────────────────────

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      maxRetries: 3,
    });
  }
  return client;
}

// ── Route handler ────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt } = body as { prompt: string; history?: any[] };

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Please describe the report you want.' } as AIReportResult,
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'AI service not configured. Please set ANTHROPIC_API_KEY.' } as AIReportResult,
        { status: 500 }
      );
    }

    // Business context — in production, read from user session/auth.
    // For now, sourced from env vars.
    const business: BusinessContext = {
      name: process.env.BUSINESS_NAME || undefined,
      gstState: process.env.BUSINESS_GST_STATE || undefined,
      gstStateName: process.env.BUSINESS_GST_STATE_NAME || undefined,
      gstin: process.env.BUSINESS_GSTIN || undefined,
      country: process.env.BUSINESS_COUNTRY || 'IN',
    };
    const hasBusiness = business.name || business.gstState;

    const systemPrompt = buildSystemPrompt(hasBusiness ? business : undefined);

    const anthropic = getClient();
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: prompt.trim(),
        },
      ],
    });

    // Extract text from response
    const textBlock = message.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json(
        { success: false, error: 'AI returned an empty response. Please try again.' } as AIReportResult,
        { status: 500 }
      );
    }

    // Parse JSON from response (strip markdown fences if present)
    let rawJson: string = textBlock.text.trim();
    if (rawJson.startsWith('```')) {
      rawJson = rawJson.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
    }

    let parsed: any;
    try {
      parsed = JSON.parse(rawJson);
    } catch {
      console.error('[ai/generate-report] Failed to parse AI response:', rawJson);
      return NextResponse.json(
        {
          success: false,
          error: 'AI returned an unparseable response. Please try again.',
          suggestion: 'Try a simpler description like "overdue invoices this month".',
        } as AIReportResult,
        { status: 500 }
      );
    }

    // Validate and sanitize
    const { result, warnings } = validateAIResponse(parsed);

    if (warnings.length > 0) {
      console.warn('[ai/generate-report] Validation warnings:', warnings);
    }

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[ai/generate-report] Error:', err);

    // Handle Anthropic-specific errors
    if (err?.status === 429 || err?.status === 529) {
      return NextResponse.json(
        { success: false, error: 'AI is busy. Please wait a moment and try again.' } as AIReportResult,
        { status: 429 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Something went wrong. Please try again.' } as AIReportResult,
      { status: 500 }
    );
  }
}
