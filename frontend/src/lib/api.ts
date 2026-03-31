import {
  AuthResponse,
  CalendarSummary,
  EventItem,
  EventPayload,
  LoginPayload,
  UserPayload,
  UserSummary,
  AuditLogItem
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080/api';

type ApiErrorPayload = {
  message?: string;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {})
      },
      credentials: 'include',
      cache: 'no-store'
    });

    if (!res.ok) {
      let message = `API Error: ${res.status}`;

      try {
        const payload = (await res.json()) as ApiErrorPayload;
        if (payload?.message) {
          message = payload.message;
        } else {
          message = defaultMessageByStatus(res.status);
        }
      } catch {
        message = defaultMessageByStatus(res.status);
      }

      throw new Error(message);
    }

    if (res.status === 204) {
      return undefined as T;
    }

    return res.json() as Promise<T>;
  } catch (error) {
    if (error instanceof Error && error.message !== 'Failed to fetch') {
      throw error;
    }
    throw new Error('通信に失敗しました。画面を再読み込みしてください');
  }
}

function defaultMessageByStatus(status: number) {
  switch (status) {
    case 400:
      return '入力内容を確認してください';
    case 401:
      return 'ログインIDまたはパスワードが違います';
    case 403:
      return 'この操作を行う権限がありません';
    case 404:
      return '対象データが見つかりません';
    default:
      return 'システムエラーが発生しました。管理者に連絡してください';
  }
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function logout(): Promise<{ message: string }> {
  return request<{ message: string }>('/auth/logout', {
    method: 'POST'
  });
}

export async function fetchMe(): Promise<UserSummary> {
  return request<UserSummary>('/users/me');
}

export async function fetchUsers(): Promise<UserSummary[]> {
  return request<UserSummary[]>('/users');
}

export async function createUser(payload: UserPayload & { password: string }): Promise<UserSummary> {
  return request<UserSummary>('/users', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function updateUser(userId: number, payload: UserPayload & { active: boolean }): Promise<UserSummary> {
  return request<UserSummary>(`/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

export async function updateUserStatus(userId: number, active: boolean): Promise<UserSummary> {
  return request<UserSummary>(`/users/${userId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ active })
  });
}

export async function changeMyPassword(payload: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ message: string }> {
  return request<{ message: string }>('/users/me/password', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function fetchAuditLogs(): Promise<AuditLogItem[]> {
  return request<AuditLogItem[]>('/audit-logs');
}

export async function fetchCalendars(): Promise<CalendarSummary[]> {
  return request<CalendarSummary[]>('/calendars');
}

export async function fetchEvents(calendarId: number, from: string, to: string): Promise<EventItem[]> {
  return request<EventItem[]>(`/calendars/${calendarId}/events?from=${from}&to=${to}`);
}

export async function createEvent(payload: EventPayload): Promise<EventItem> {
  return request<EventItem>('/events', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function updateEvent(eventId: number, payload: EventPayload): Promise<EventItem> {
  return request<EventItem>(`/events/${eventId}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

export async function deleteEvent(eventId: number): Promise<{ message: string }> {
  return request<{ message: string }>(`/events/${eventId}`, {
    method: 'DELETE'
  });
}