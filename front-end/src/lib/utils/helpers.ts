/**
 * Format a date string (YYYY-MM-DD or ISO8601) to a readable format.
 */
export function formatDate(dateStr: string): string {
  // If it's just a date (YYYY-MM-DD), add time to avoid timezone issues
  const date = dateStr.includes('T') ? new Date(dateStr) : new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Format a score (0-100) with color indication.
 */
export function scoreLevel(score: number): 'low' | 'medium' | 'high' | 'excellent' {
  if (score < 40) return 'low';
  if (score < 60) return 'medium';
  if (score < 80) return 'high';
  return 'excellent';
}

export const SCORE_LEVEL_COLORS = {
  low: 'text-red-500',
  medium: 'text-amber-500',
  high: 'text-blue-500',
  excellent: 'text-emerald-500'
};

/**
 * Get today's date as YYYY-MM-DD.
 */
export function today(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Capitalize first letter.
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
