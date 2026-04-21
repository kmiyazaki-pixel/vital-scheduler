export type Category = 'meeting' | 'work' | 'review' | 'personal' | 'other' | 'holiday' | 'visit';

export type CalendarSummary = {
  id: number;
  name: string;
  type: 'personal' | 'team' | 'company';
  ownerUserId?: number | null;
  owner_auth_user_id?: string | null;
  active?: boolean;
  is_active?: boolean;
};

export type EventItem = {
  id: number;
  calendarId?: number;
  calendar_id: number;
  title: string;
  category: Category;
  memo?: string | null;
  startAt?: string;
  endAt?: string;
  allDay?: boolean;
  start_at: string;
  end_at: string;
  is_all_day: boolean;
  owner_name?: string | null;
};

export type EventPayload = {
  calendar_id: number;
  title: string;
  category: Category;
  memo?: string;
  start_at: string;
  end_at: string;
  is_all_day: boolean;
};

export type AuditLogItem = {
  id: number;
  auth_user_id?: string | null;
  user_name?: string | null;
  action: string;
  target_type?: string | null;
  target_id?: string | null;
  detail?: Record<string, unknown> | string | null;
  created_at?: string;
};
