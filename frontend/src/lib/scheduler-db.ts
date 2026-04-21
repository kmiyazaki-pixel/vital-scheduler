import { supabase } from "@/lib/supabase";

export async function fetchCalendars() {
  const { data, error } = await supabase
    .from("scheduler_calendars")
    .select("*")
    .eq("is_active", true)
    .order("id");

  if (error) throw error;
  return data ?? [];
}

export async function fetchEvents(calendarId: number, from: string, to: string) {
  const { data, error } = await supabase
    .from("scheduler_events")
    .select("*")
    .eq("calendar_id", calendarId)
    .is("deleted_at", null)
    .gte("start_at", from)
    .lte("end_at", to)
    .order("start_at");

  if (error) throw error;
  return data ?? [];
}

export async function createEvent(payload: {
  calendar_id: number;
  title: string;
  category: string;
  memo: string;
  start_at: string;
  end_at: string;
  is_all_day: boolean;
}) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("scheduler_events")
    .insert([
      {
        ...payload,
        created_by_auth_user_id: user?.id ?? null,
        updated_by_auth_user_id: user?.id ?? null,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateEvent(
  id: number,
  payload: {
    calendar_id: number;
    title: string;
    category: string;
    memo: string;
    start_at: string;
    end_at: string;
    is_all_day: boolean;
    updated_by_auth_user_id?: string | null;
  }
) {
  const { data, error } = await supabase
    .from("scheduler_events")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteEvent(id: number) {
  const { error } = await supabase
    .from("scheduler_events")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}

export async function fetchAuditLogs() {
  const { data, error } = await supabase
    .from("scheduler_audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;
  return data ?? [];
}
