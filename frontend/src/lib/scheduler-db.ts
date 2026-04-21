import { supabase } from "@/lib/supabase";

export async function fetchCalendars() {
  return supabase
    .from("scheduler_calendars")
    .select("*")
    .eq("is_active", true)
    .order("id");
}

export async function fetchEvents(calendarId: number, from: string, to: string) {
  return supabase
    .from("scheduler_events")
    .select("*")
    .eq("calendar_id", calendarId)
    .is("deleted_at", null)
    .gte("start_at", from)
    .lte("end_at", to)
    .order("start_at");
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

  return supabase.from("scheduler_events").insert([
    {
      ...payload,
      created_by_auth_user_id: user?.id ?? null,
      updated_by_auth_user_id: user?.id ?? null,
    },
  ]);
}

export async function updateEvent(id: number, payload: any) {
  return supabase
    .from("scheduler_events")
    .update(payload)
    .eq("id", id);
}

export async function deleteEvent(id: number) {
  return supabase
    .from("scheduler_events")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
}

export async function fetchAuditLogs() {
  return supabase
    .from("scheduler_audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
}
