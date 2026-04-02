/**
 * Shared utilities for exam screens.
 */

export function formatExamDate(
  dateStr: string | null | undefined,
  includeTime = false,
): string {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  };
  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }
  return d.toLocaleDateString(undefined, options);
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: '#4CAF50',
  DRAFT: '#FF9800',
  CLOSED: '#9E9E9E',
  SUBMITTED: '#2196F3',
  GRADED: '#4CAF50',
  IN_PROGRESS: '#FF9800',
  NOT_STARTED: '#9E9E9E',
};

export function examStatusColor(status: string): string {
  return STATUS_COLORS[status] ?? '#666';
}

export function formatExamType(examType: string): string {
  return examType.replaceAll('_', ' ');
}
