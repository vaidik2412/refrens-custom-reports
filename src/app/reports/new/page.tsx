'use client';

import { Suspense, CSSProperties } from 'react';
import QueryBuilderPage from '@/components/query-builder/QueryBuilderPage';

const containerStyle: CSSProperties = {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '24px 24px 48px',
};

export default function NewReportPage() {
  return (
    <div style={containerStyle}>
      <Suspense
        fallback={
          <div
            style={{
              padding: '48px',
              textAlign: 'center',
              color: 'var(--color-text-secondary)',
              fontSize: '14px',
            }}
          >
            Loading query builder...
          </div>
        }
      >
        <QueryBuilderPage />
      </Suspense>
    </div>
  );
}
