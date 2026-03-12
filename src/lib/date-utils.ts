import type { DynamicPreset, DateFieldConfig } from '@/types';

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function resolveDynamicPreset(preset: DynamicPreset): { $gte: string; $lte: string } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case 'today':
      return { $gte: formatDate(today), $lte: formatDate(today) };

    case 'yesterday': {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      return { $gte: formatDate(y), $lte: formatDate(y) };
    }

    case 'last_7_days': {
      const start = new Date(today);
      start.setDate(start.getDate() - 6);
      return { $gte: formatDate(start), $lte: formatDate(today) };
    }

    case 'last_15_days': {
      const start = new Date(today);
      start.setDate(start.getDate() - 14);
      return { $gte: formatDate(start), $lte: formatDate(today) };
    }

    case 'last_30_days': {
      const start = new Date(today);
      start.setDate(start.getDate() - 29);
      return { $gte: formatDate(start), $lte: formatDate(today) };
    }

    case 'last_45_days': {
      const start = new Date(today);
      start.setDate(start.getDate() - 44);
      return { $gte: formatDate(start), $lte: formatDate(today) };
    }

    case 'this_month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { $gte: formatDate(start), $lte: formatDate(end) };
    }

    case 'last_month': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { $gte: formatDate(start), $lte: formatDate(end) };
    }

    case 'this_quarter': {
      const qMonth = Math.floor(now.getMonth() / 3) * 3;
      const start = new Date(now.getFullYear(), qMonth, 1);
      const end = new Date(now.getFullYear(), qMonth + 3, 0);
      return { $gte: formatDate(start), $lte: formatDate(end) };
    }

    case 'last_quarter': {
      const qMonth = Math.floor(now.getMonth() / 3) * 3 - 3;
      const year = qMonth < 0 ? now.getFullYear() - 1 : now.getFullYear();
      const adjustedMonth = qMonth < 0 ? qMonth + 12 : qMonth;
      const start = new Date(year, adjustedMonth, 1);
      const end = new Date(year, adjustedMonth + 3, 0);
      return { $gte: formatDate(start), $lte: formatDate(end) };
    }

    case 'this_year': {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31);
      return { $gte: formatDate(start), $lte: formatDate(end) };
    }

    case 'last_year': {
      const start = new Date(now.getFullYear() - 1, 0, 1);
      const end = new Date(now.getFullYear() - 1, 11, 31);
      return { $gte: formatDate(start), $lte: formatDate(end) };
    }

    case 'tomorrow': {
      const t = new Date(today);
      t.setDate(t.getDate() + 1);
      return { $gte: formatDate(t), $lte: formatDate(t) };
    }

    case 'next_7_days': {
      const end = new Date(today);
      end.setDate(end.getDate() + 6);
      return { $gte: formatDate(today), $lte: formatDate(end) };
    }

    case 'next_15_days': {
      const end = new Date(today);
      end.setDate(end.getDate() + 14);
      return { $gte: formatDate(today), $lte: formatDate(end) };
    }

    case 'next_30_days': {
      const end = new Date(today);
      end.setDate(end.getDate() + 29);
      return { $gte: formatDate(today), $lte: formatDate(end) };
    }

    case 'next_month': {
      const start = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 2, 0);
      return { $gte: formatDate(start), $lte: formatDate(end) };
    }

    case 'next_quarter': {
      const qMonth = Math.floor(now.getMonth() / 3) * 3 + 3;
      const year = qMonth >= 12 ? now.getFullYear() + 1 : now.getFullYear();
      const adjustedMonth = qMonth >= 12 ? qMonth - 12 : qMonth;
      const start = new Date(year, adjustedMonth, 1);
      const end = new Date(year, adjustedMonth + 3, 0);
      return { $gte: formatDate(start), $lte: formatDate(end) };
    }

    case 'next_year': {
      const start = new Date(now.getFullYear() + 1, 0, 1);
      const end = new Date(now.getFullYear() + 1, 11, 31);
      return { $gte: formatDate(start), $lte: formatDate(end) };
    }

    case 'custom_period':
    default:
      return { $gte: formatDate(today), $lte: formatDate(today) };
  }
}

function resolveCustomPeriod(config: DateFieldConfig): { $gte: string; $lte: string } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = config.customNumber || 7;

  if (config.customDirection === 'next') {
    const end = new Date(today);
    end.setDate(end.getDate() + days - 1);
    return { $gte: formatDate(today), $lte: formatDate(end) };
  } else {
    // 'this' = past N days including today
    const start = new Date(today);
    start.setDate(start.getDate() - (days - 1));
    return { $gte: formatDate(start), $lte: formatDate(today) };
  }
}

export function resolveDateField(config: DateFieldConfig): { $gte: string; $lte: string } {
  if (config.dateBehaviour === 'fixed' && config.fixedDateRange) {
    return config.fixedDateRange;
  }
  if (config.dateBehaviour === 'dynamic' && config.dynamicPreset) {
    if (config.dynamicPreset === 'custom_period') {
      return resolveCustomPeriod(config);
    }
    return resolveDynamicPreset(config.dynamicPreset);
  }
  return resolveDynamicPreset('today');
}

export function formatDateDisplay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { month: 'short', day: '2-digit', year: '2-digit' });
}

export const DYNAMIC_PRESET_LABELS: Record<DynamicPreset, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  last_7_days: 'Last 7 Days',
  last_15_days: 'Last 15 Days',
  last_30_days: 'Last 30 Days',
  last_45_days: 'Last 45 Days',
  this_month: 'This Month',
  last_month: 'Last Month',
  this_quarter: 'This Quarter',
  last_quarter: 'Last Quarter',
  this_year: 'This Year',
  last_year: 'Last Year',
  tomorrow: 'Tomorrow',
  next_7_days: 'Next 7 Days',
  next_15_days: 'Next 15 Days',
  next_30_days: 'Next 30 Days',
  next_month: 'Next Month',
  next_quarter: 'Next Quarter',
  next_year: 'Next Year',
  custom_period: 'Custom Period',
};

export const PRESET_GROUPS: { label: string; presets: DynamicPreset[] }[] = [
  {
    label: 'Past',
    presets: ['today', 'yesterday', 'last_7_days', 'last_15_days', 'last_30_days', 'last_45_days',
              'this_month', 'last_month', 'this_quarter', 'last_quarter', 'this_year', 'last_year'],
  },
  {
    label: 'Future',
    presets: ['tomorrow', 'next_7_days', 'next_15_days', 'next_30_days',
              'next_month', 'next_quarter', 'next_year'],
  },
  {
    label: 'Custom',
    presets: ['custom_period'],
  },
];
