import { LeaveRequestStatusEnum } from '../../../../src/graphql/generated/graphql';

export const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: '#FFF3E0', text: '#E65100' },
  APPROVED: { bg: '#E8F5E9', text: '#2E7D32' },
  REJECTED: { bg: '#FFEBEE', text: '#C62828' },
};

export const STATUS_FILTERS: Array<{
  label: string;
  value: LeaveRequestStatusEnum | null;
}> = [
  { label: 'All', value: null },
  { label: 'Pending', value: LeaveRequestStatusEnum.Pending },
  { label: 'Approved', value: LeaveRequestStatusEnum.Approved },
  { label: 'Rejected', value: LeaveRequestStatusEnum.Rejected },
];

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
