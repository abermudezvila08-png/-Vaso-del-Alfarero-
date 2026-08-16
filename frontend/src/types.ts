export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'staff' | 'admin';
  is_verified: boolean;
}

export interface Table {
  id: number;
  name: string;
  capacity: number;
  location: string;
  is_active: boolean;
}

export interface TimeSlot {
  id: number;
  start_time: string;
  end_time: string;
  label: string;
  is_active: boolean;
}

export interface LunchPackage {
  id: number;
  name: string;
  description: string;
  price: number;
  is_active: boolean;
}

export interface ReservationTable {
  id: number;
  table_id: number;
  table?: Table;
}

export interface Reservation {
  id: number;
  user_id: number;
  date: string;
  time_slot_id: number;
  lunch_package_id: number;
  status: 'pending_payment' | 'confirmed' | 'cancelled' | 'completed';
  total_amount: number;
  paid_amount: number;
  refund_amount: number;
  penalty_percentage: number;
  guest_count: number;
  notes: string;
  created_at: string;
  confirmed_at: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  user?: User;
  time_slot?: TimeSlot;
  lunch_package?: LunchPackage;
  reservation_tables: ReservationTable[];
}

export interface CancelInfo {
  hours_remaining: number;
  penalty_percentage: number;
  refund_percentage: number;
  refund_amount: number;
  penalty_amount: number;
  can_cancel_online: boolean;
  message: string;
}
