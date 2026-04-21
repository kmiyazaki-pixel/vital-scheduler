import { supabase } from '@/lib/supabase';
import { AuditLogItem, CalendarSummary, EventItem } from '@/lib/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const token = session?.access_token;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    let message = 'システムエラーが発生しました。管理者に連絡してください';

    try {
      const contentType = response.headers.get('content-type') ?? '';
      if (contentType.includes('application/json')) {
        const data = await response.json();
        if (typeof data?.message === 'string' && data.message.trim()) {
          message = data.message;
        } else {
          message = JSON.stringify(data);
        }
      } else {
        const text = await response.text();
        if (text?.trim()) {
          message = text;
        }
      }
    } catch {
      //
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json() as Promise<T>;
}

export type MeResponse = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  active: boolean;
  passwordChangeRequired: boolean;
};

export type LoginResponse = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  active: boolean;
  passwordChangeRequired: boolean;
};

export async function login(input: { email: string; password: string }) {
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function logout() {
  return request<{ message: string }>('/auth/logout', {
    method: 'POST',
  });
}

export async function fetchMe() {
  return request<MeResponse>('/auth/me');
}





export async function fetchCalendars() {
  return request<CalendarSummary[]>('/calendars');
}

export async function fetchEvents(calendarId: number, from: string, to: string) {
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
    body: JSON.stringify(input),
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
    body: JSON.stringify(input),
  });
}

export async function deleteEvent(eventId: number) {
  return request<null>(`/events/${eventId}`, {
    method: 'DELETE',
  });
}

export async function fetchAuditLogs() {
  return request<AuditLogItem[]>('/audit-logs');
}
