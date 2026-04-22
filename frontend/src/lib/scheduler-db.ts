import { supabase } from "@/lib/supabase";

async function getCurrentUserInfo() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  if (!user) throw new Error("ログイン情報を取得できませんでした。");

  const userName =
    (user.user_metadata?.name as string | undefined)?.trim() ||
    user.email?.split("@")[0] ||
    "ユーザー";

  return {
    user,
    userName,
  };
}

async function writeAuditLog(input: {
  action: string;
  targetType: string;
  targetId?: string | number | null;
  detail?: Record<string, unknown> | null;
}) {
  const { user, userName } = await getCurrentUserInfo();

  const { error } = await supabase.from("scheduler_audit_logs").insert([
    {
      auth_user_id: user.id,
      user_name: userName,
      action: input.action,
      target_type: input.targetType,
      target_id: input.targetId == null ? null : String(input.targetId),
      detail: input.detail ?? null,
    },
  ]);

  if (error) throw error;
}

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
  const { user, userName } = await getCurrentUserInfo();

  const { data, error } = await supabase
    .from("scheduler_events")
    .insert([
      {
        ...payload,
        owner_name: userName,
        created_by_auth_user_id: user.id,
        updated_by_auth_user_id: user.id,
      },
    ])
    .select()
    .single();

  if (error) {
    throw new Error(`予定追加エラー: ${error.message}`);
  }

  await writeAuditLog({
    action: "event_create",
    targetType: "event",
    targetId: data.id,
    detail: {
      title: payload.title,
      category: payload.category,
      calendar_id: payload.calendar_id,
      start_at: payload.start_at,
      end_at: payload.end_at,
      owner_name: userName,
    },
  });

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
  }
) {
  const { user, userName } = await getCurrentUserInfo();

  const { data, error } = await supabase
    .from("scheduler_events")
    .update({
      ...payload,
      owner_name: userName,
      updated_by_auth_user_id: user.id,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  await writeAuditLog({
    action: "event_update",
    targetType: "event",
    targetId: id,
    detail: {
      title: payload.title,
      category: payload.category,
      calendar_id: payload.calendar_id,
      start_at: payload.start_at,
      end_at: payload.end_at,
      owner_name: userName,
    },
  });

  return data;
}

export async function deleteEvent(id: number) {
  const { userName } = await getCurrentUserInfo();

  const { error } = await supabase
    .from("scheduler_events")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;

  await writeAuditLog({
    action: "event_delete",
    targetType: "event",
    targetId: id,
    detail: {
      owner_name: userName,
    },
  });
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
