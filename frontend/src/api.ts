const BASE = '/api';

function headers(): HeadersInit {
  const h: HeadersInit = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('token');
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    ...options,
    headers: { ...headers(), ...options?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: 'Error desconocido' }));
    throw new Error(body.detail || `Error ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Auth
  register: (data: { name: string; email: string; phone: string; password: string }) =>
    request<{ access_token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    request<{ access_token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  staffLogin: (data: { email: string; password: string; company_code: string }) =>
    request<{ access_token: string }>('/auth/staff-login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  me: () => request<import('./types').User>('/auth/me'),

  // Tables
  tables: () => request<import('./types').Table[]>('/tables/'),
  availableTables: (date: string, timeSlotId: number) =>
    request<import('./types').Table[]>(
      `/tables/available?reservation_date=${date}&time_slot_id=${timeSlotId}`
    ),

  // Time Slots
  timeSlots: () => request<import('./types').TimeSlot[]>('/timeslots/'),

  // Packages
  packages: () => request<import('./types').LunchPackage[]>('/packages/'),

  // Reservations
  createReservation: (data: {
    date: string;
    time_slot_id: number;
    table_ids: number[];
    lunch_package_id: number;
    guest_count: number;
    notes: string;
  }) =>
    request<import('./types').Reservation>('/reservations/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  payReservation: (id: number) =>
    request<import('./types').Reservation>(`/reservations/${id}/pay`, {
      method: 'POST',
    }),

  myReservations: () =>
    request<import('./types').Reservation[]>('/reservations/my'),

  cancelInfo: (id: number) =>
    request<import('./types').CancelInfo>(`/reservations/${id}/cancel-info`),

  cancelReservation: (id: number) =>
    request<import('./types').Reservation>(`/reservations/${id}/cancel`, {
      method: 'POST',
    }),

  allReservations: (date?: string) =>
    request<import('./types').Reservation[]>(
      `/reservations/all${date ? `?reservation_date=${date}` : ''}`
    ),

  adminCancel: (id: number, reason: string) =>
    request<import('./types').Reservation>(`/reservations/${id}/admin-cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  // Admin - Tables
  createTable: (data: { name: string; capacity: number; location: string }) =>
    request<import('./types').Table>('/tables/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteTable: (id: number) =>
    request<void>(`/tables/${id}`, { method: 'DELETE' }),

  // Admin - Time Slots
  createTimeSlot: (data: { start_time: string; end_time: string; label: string }) =>
    request<import('./types').TimeSlot>('/timeslots/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Admin - Packages
  createPackage: (data: { name: string; description: string; price: number }) =>
    request<import('./types').LunchPackage>('/packages/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
