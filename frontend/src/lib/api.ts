import { AuditLogItem, CalendarSummary, EventItem, UserSummary } from '@/lib/types';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {})
    },
    credentials: 'include',
    cache: 'no-store'
  });

  if (!response.ok) {
    let message = 'システムエラーが発生しました。管理者に連絡してください';
    try {
      const text = await response.text();
      if (text) {
        message = text;
      }
    } catch {
      //
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

export type MeResponse = {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'member';
  active: boolean;
  passwordChangeRequired: boolean;
};

export async function login(input: { email: string; password: string }) {
  return request<MeResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

export async function logout() {
  return request<void>('/auth/logout', {
    method: 'POST'
  });
}

export async function fetchMe() {
  return request<MeResponse>('/auth/me');
}

export async function changeMyPassword(input: {
  currentPassword: string;
  newPassword: string;
}) {
  return request<void>('/users/me/password', {
    method: 'PUT',
    body: JSON.stringify(input)
  });
}

export async function fetchUsers() {
  return request<UserSummary[]>('/users');
}

export async function createUser(input: {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'member';
}) {
  return request<UserSummary>('/users', {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

export async function updateUser(input: {
  userId: number;
  name: string;
  email: string;
  role: 'admin' | 'member';
  active: boolean;
}) {
  return request<UserSummary>(`/users/${input.userId}`, {
    method: 'PUT',
    body: JSON.stringify({
      name: input.name,
      email: input.email,
      role: input.role,
      active: input.active
    })
  });
}

export async function updateUserStatus(userId: number, active: boolean) {
  return request<UserSummary>(`/users/${userId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ active })
  });
}

export async function fetchCalendars() {
  return request<CalendarSummary[]>('/calendars');
}

export async function fetchEvents(
  calendarId: number,
  from: string,
  to: string
) {
  return request<EventItem[]>(
    `/calendars/${calendarId}/events?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
  );
}

export async function createEvent(input: {
  calendarId: number;
  title: string;
  category: string;
  memo: string;
  startAt: string;
  endAt: string;
  allDay: boolean;
}) {
  return request<EventItem>('/events', {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

export async function updateEvent(
  eventId: number,
  input: {
    calendarId: number;
    title: string;
    category: string;
    memo: string;
    startAt: string;
    endAt: string;
    allDay: boolean;
  }
) {
  return request<EventItem>(`/events/${eventId}`, {
    method: 'PUT',
    body: JSON.stringify(input)
  });
}

export async function deleteEvent(eventId: number) {
  return request<void>(`/events/${eventId}`, {
    method: 'DELETE'
  });
}

export async function fetchAuditLogs() {
  return request<AuditLogItem[]>('/audit-logs');
}
