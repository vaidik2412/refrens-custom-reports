'use client';

import { Suspense, CSSProperties } from 'react';
import ReportsDashboard from '@/components/reports/ReportsDashboard';

const containerStyle: CSSProperties = {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '24px 24px 48px',
};

const loadingStyle: CSSProperties = {
  padding: '48px',
  textAlign: 'center',
  color: 'var(--color-text-secondary)',
  fontSize: '14px',
};

export default function ReportsPage() {
  return (
    <div style={containerStyle}>
      <Suspense fallback={<div style={loadingStyle}>Loading dashboard...</div>}>
        <ReportsDashboard />
      </Suspense>
    </div>
  );
}
