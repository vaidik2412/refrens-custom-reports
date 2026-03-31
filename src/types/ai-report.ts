// ── AI Report Agent Types ────────────────────────────────────────────

/** A single filter instruction the AI returns — maps 1:1 to setFilter(key, value) */
export interface AIFilterInstruction {
  key: string;
  value: any;
}

/** Successful AI response with filters to apply */
export interface AIReportResponse {
  success: true;
  filters: AIFilterInstruction[];
  /** Human-readable summary, e.g. "Showing unpaid invoices from last quarter in USD" */
  explanation: string;
  /** Suggested report name for saving */
  suggestedName?: string;
}

/** AI could not parse the request */
export interface AIReportErrorResponse {
  success: false;
  error: string;
  /** Helpful suggestion, e.g. "Try asking for 'overdue invoices this month'" */
  suggestion?: string;
}

export type AIReportResult = AIReportResponse | AIReportErrorResponse;

// ── Chat mode (future) ──────────────────────────────────────────────

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
  filters?: AIFilterInstruction[];
  timestamp: number;
}
