'use client';

import { useState, useCallback, useRef } from 'react';
import type { AIReportResult, AIMessage } from '@/types/ai-report';

interface UseAIReportReturn {
  loading: boolean;
  result: AIReportResult | null;
  error: string | null;
  messages: AIMessage[];
  generateReport: (prompt: string) => Promise<AIReportResult | null>;
  reset: () => void;
}

export function useAIReport(): UseAIReportReturn {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIReportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const generateReport = useCallback(async (prompt: string): Promise<AIReportResult | null> => {
    // Abort any in-flight request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    setResult(null);

    // Add user message to history
    const userMsg: AIMessage = { role: 'user', content: prompt, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch('/api/ai/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
        signal: controller.signal,
      });

      const data: AIReportResult = await res.json();
      setResult(data);

      // Add assistant message to history
      const assistantMsg: AIMessage = {
        role: 'assistant',
        content: data.success ? data.explanation : data.error,
        filters: data.success ? data.filters : undefined,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      if (!data.success) {
        setError(data.error);
      }

      return data;
    } catch (err: any) {
      if (err.name === 'AbortError') return null;
      const msg = 'Connection failed. Please check your network and try again.';
      setError(msg);
      setResult({ success: false, error: msg });
      return null;
    } finally {
      setLoading(false);
      if (abortRef.current === controller) abortRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setResult(null);
    setError(null);
    setMessages([]);
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, []);

  return { loading, result, error, messages, generateReport, reset };
}
