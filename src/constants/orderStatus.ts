import type { OrderLifecycleStatus } from '@/types/booking';

// ─── Order Lifecycle Status Config ───────────────────────────────────────────

export const ORDER_STATUS_CONFIG: Record<
  OrderLifecycleStatus,
  { bg: string; text: string; border: string; icon: string; label: string; step: number }
> = {
  pending: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
    border: 'border-yellow-200',
    icon: 'ClockIcon',
    label: 'Pending',
    step: 0,
  },
  processing: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    icon: 'ArrowPathIcon',
    label: 'Processing',
    step: 1,
  },
  completed: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
    icon: 'CheckCircleIcon',
    label: 'Completed',
    step: 2,
  },
  disputed: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    icon: 'ExclamationTriangleIcon',
    label: 'Disputed',
    step: 3,
  },
};

export const LIFECYCLE_STEPS: OrderLifecycleStatus[] = [
  'pending',
  'processing',
  'completed',
];

export const LIFECYCLE_ALL_STEPS: OrderLifecycleStatus[] = [
  'pending',
  'processing',
  'completed',
  'disputed',
];

export function getNextStatuses(
  current: OrderLifecycleStatus
): OrderLifecycleStatus[] {
  if (current === 'pending') return ['processing', 'disputed'];
  if (current === 'processing') return ['completed', 'disputed'];
  if (current === 'completed') return ['disputed'];
  return [];
}

// ─── Booking Status Config ────────────────────────────────────────────────────

export const BOOKING_STATUS_CONFIG: Record<
  string,
  { bg: string; text: string; icon: string }
> = {
  Selesai: { bg: 'bg-green-100', text: 'text-green-700', icon: 'CheckCircleIcon' },
  Bonus: { bg: 'bg-amber-100', text: 'text-amber-700', icon: 'GiftIcon' },
  Terkunci: { bg: 'bg-red-100', text: 'text-red-600', icon: 'LockClosedIcon' },
  'Dalam Proses': { bg: 'bg-blue-100', text: 'text-blue-600', icon: 'ClockIcon' },
  Dibatalkan: { bg: 'bg-gray-100', text: 'text-gray-500', icon: 'XCircleIcon' },
};

// ─── Default Configs ──────────────────────────────────────────────────────────

export const DEFAULT_LAST_ORDER_CONFIG = {
  popupTitle: '重要通知 / Important Notice',
  popupMessage:
    '您有一个最后订单待处理，请联系您的导师以完成订单。',
  tutorContact: 'Tutor',
};
