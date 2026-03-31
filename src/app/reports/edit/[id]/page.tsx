'use client';

import { Suspense, CSSProperties, use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import QueryBuilderPage from '@/components/query-builder/QueryBuilderPage';
import type { SavedQuery } from '@/types';
import { normalizeDateFields } from '@/lib/saved-query-contract';

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

const errorStyle: CSSProperties = {
  padding: '24px',
  textAlign: 'center',
  color: 'var(--color-error-banner-text)',
  background: 'var(--color-error-banner-bg)',
  border: '1px solid var(--color-error-banner-border)',
  borderRadius: 'var(--radius-input)',
  fontSize: '14px',
};

function EditReportLoader({ id }: { id: string }) {
  const router = useRouter();
  const [report, setReport] = useState<SavedQuery | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReport() {
      try {
        const res = await fetch('/api/saved-queries/find', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serviceName: 'invoices',
            _id: id,
            $limit: 1,
          }),
        });

        if (!res.ok) throw new Error(`Failed to fetch report (${res.status})`);

        const result = await res.json();
        const found = result.data?.[0];

        if (!found) {
          setError('Report not found');
          return;
        }

        setReport({
          ...found,
          dateFields: normalizeDateFields(found.dateFields),
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load report');
      } finally {
        setLoading(false);
      }
    }

    fetchReport();
  }, [id]);

  if (loading) return <div style={loadingStyle}>Loading report...</div>;

  if (error || !report) {
    return (
      <div style={errorStyle}>
        <div>{error || 'Report not found'}</div>
        <button
          type="button"
          onClick={() => router.push('/reports')}
          style={{
            marginTop: '12px',
            padding: '6px 16px',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-input)',
            background: 'var(--color-bg-card)',
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          Back to Reports
        </button>
      </div>
    );
  }

  return <QueryBuilderPage existingReport={report} />;
}

export default function EditReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <div style={containerStyle}>
      <Suspense fallback={<div style={loadingStyle}>Loading report...</div>}>
        <EditReportLoader id={id} />
      </Suspense>
    </div>
  );
}
