export type Category = 'meeting' | 'work' | 'review' | 'personal' | 'other';

export type CalendarSummary = {
  id: number;
  name: string;
  type: 'personal' | 'team' | 'company';
  ownerUserId: number | null;
  active: boolean;
};

export type EventItem = {
  id: number;
  calendarId: number;
  title: string;
  category: Category;
  memo?: string;
  startAt: string;
  endAt: string;
  allDay: boolean;
};

export type EventPayload = {
  calendarId: number;
  title: string;
  category: Category;
  memo?: string;
  startAt: string;
  endAt: string;
  allDay: boolean;
};

export type UserSummary = {
  id: number;
  name: string;
  email: string;
  role: 'admin' |　'member';
  active: boolean;
  passwordChangeRequired: boolean;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type AuthResponse = {
  message: string;
  user: UserSummary;
};

export type UserPayload = {
  name: string;
  email: string;
  role: 'admin' | 'member';
};

export type AuditLogItem = {
  id: number;
  userId: number | null;
  action: string;
  entityType: string;
  entityId: number | null;
  detail: string | null;
  createdAt: string;
};
