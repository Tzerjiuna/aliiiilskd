// ─── Booking Types ────────────────────────────────────────────────────────────

export type OrderLifecycleStatus = 'pending' | 'processing' | 'completed' | 'disputed';

export type BookingStatus =
  | 'Selesai' |'Bonus' |'Terkunci' |'Dalam Proses' |'Dibatalkan';

export type FilterStatus =
  | 'Semua' |'Selesai' |'Bonus' |'Terkunci' |'Dalam Proses' |'Dibatalkan' |'Pending';

export interface Booking {
  id: string;
  hotel: string;
  location: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  amountPaid: number;
  commission: number;
  status: BookingStatus;
  isBonus: boolean;
  orderDate: string;
  lifecycleStatus?: OrderLifecycleStatus;
}

export interface PendingBonusOrder {
  id: string;
  hotel: string;
  location: string;
  amount: number;
  commission: number;
  matchedAt: string;
  bonusHotelId: string;
}

export interface RecentOrder {
  id: string;
  hotel: string;
  amount: number;
  commission: number;
  status: string;
  date: string;
}

export interface OrderStatusHistory {
  status: OrderLifecycleStatus;
  changedAt: string;
  note?: string;
}

export interface ManagedOrder {
  id: string;
  userId: string;
  userName: string;
  hotel: string;
  amount: number;
  status: OrderLifecycleStatus;
  orderDate: string;
  statusHistory: OrderStatusHistory[];
}

export interface ActiveBooking {
  userId: string;
  hotel: string;
  amount: number;
  startedAt: Date;
}

export interface LastOrderConfig {
  popupTitle: string;
  popupMessage: string;
  tutorContact: string;
}
