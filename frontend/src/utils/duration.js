/**
 * Convert durationDays to a human-readable label
 * 30  → Monthly
 * 60  → 2 Months
 * 90  → Quarterly
 * 180 → Half-Yearly
 * 365 → Annual
 * etc.
 */
export function formatDuration(days) {
  if (!days) return '—';
  if (days === 30)  return 'Monthly';
  if (days === 90)  return 'Quarterly';
  if (days === 180) return 'Half-Yearly';
  if (days === 365) return 'Annual';
  if (days % 30 === 0) return `${days / 30} Months`;
  return `${days} Days`;
}

/**
 * Color classes based on days
 */
export function durationColor(days) {
  if (days <= 30)  return 'bg-blue-50 text-blue-700 ring-blue-200';
  if (days <= 90)  return 'bg-purple-50 text-purple-700 ring-purple-200';
  if (days <= 180) return 'bg-orange-50 text-orange-700 ring-orange-200';
  return 'bg-green-50 text-green-700 ring-green-200';
}

export function durationColorObj(days) {
  if (days <= 30)  return { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',   active: 'border-blue-400 bg-blue-50'   };
  if (days <= 90)  return { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', active: 'border-purple-400 bg-purple-50' };
  if (days <= 180) return { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', active: 'border-orange-400 bg-orange-50' };
  return           { bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-700',  active: 'border-green-400 bg-green-50'  };
}
