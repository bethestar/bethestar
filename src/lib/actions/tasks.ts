"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { taskSchema, taskStatusSchema, bulkTaskSchema } from "@/lib/validations";
import { filterClients, type ClientLite, type ClientFilter } from "@/lib/automation";
import { type ActionResult, fail, ok, firstIssue, writeAudit } from "./helpers";

export async function createTaskAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const profile = await requireProfile();
  const parsed = taskSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    client_id: formData.get("client_id") ?? "",
    assignee_id: formData.get("assignee_id") ?? "",
    due_date: formData.get("due_date") ?? "",
    priority: formData.get("priority"),
  });
  if (!parsed.success) return fail(firstIssue(parsed.error.issues));
  const d = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      org_id: profile.orgId,
      title: d.title,
      description: d.description || null,
      client_id: d.client_id || null,
      assignee_id: d.assignee_id || null,
      due_date: d.due_date || null,
      priority: d.priority,
      source: "manual",
      created_by: profile.userId,
    })
    .select("id")
    .single();
  if (error) return fail(error.message);

  // 배정 알림
  if (d.assignee_id && d.assignee_id !== profile.userId) {
    await supabase.from("notifications").insert({
      org_id: profile.orgId,
      user_id: d.assignee_id,
      type: "task_assigned",
      title: "새 업무가 배정되었습니다",
      body: d.title,
      link: "/tasks",
    });
  }
  await writeAudit(profile, "create", "task", data.id, { title: d.title });
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return ok({ id: data.id });
}

export async function updateTaskStatusAction(
  taskId: string,
  status: string,
): Promise<ActionResult> {
  const profile = await requireProfile();
  const parsed = taskStatusSchema.safeParse({ task_id: taskId, status });
  if (!parsed.success) return fail(firstIssue(parsed.error.issues));

  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({
      status: parsed.data.status,
      completed_at: parsed.data.status === "done" ? new Date().toISOString() : null,
    })
    .eq("id", taskId)
    .eq("org_id", profile.orgId);
  if (error) return fail(error.message);
  await writeAudit(profile, "update_status", "task", taskId, { status });
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return ok();
}

export async function toggleTaskItemAction(
  itemId: string,
  done: boolean,
  taskId: string,
): Promise<ActionResult> {
  await requireProfile();
  const supabase = await createClient();
  const { error } = await supabase
    .from("task_items")
    .update({ done })
    .eq("id", itemId);
  if (error) return fail(error.message);
  revalidatePath(`/tasks`);
  revalidatePath(`/clients`);
  return ok({ taskId });
}

/** 시즌 일괄 생성 (I-03): 대상 필터 → n건 태스크 + 담당자 알림 */
export async function bulkCreateTasksAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const profile = await requireProfile();
  if (profile.role === "staff") return fail("일괄 생성 권한이 없습니다.");
  const parsed = bulkTaskSchema.safeParse({
    template_id: formData.get("template_id") ?? "",
    title: formData.get("title"),
    filter: formData.get("filter"),
    priority: formData.get("priority"),
    due_date: formData.get("due_date") ?? "",
  });
  if (!parsed.success) return fail(firstIssue(parsed.error.issues));
  const d = parsed.data;

  const supabase = await createClient();
  const { data: clients, error: cErr } = await supabase
    .from("clients")
    .select("id, status, vat_applicable, withholding, client_type, assignee_id, name")
    .eq("org_id", profile.orgId);
  if (cErr) return fail(cErr.message);

  const targets = filterClients(
    (clients ?? []) as ClientLite[],
    d.filter as ClientFilter,
  );
  if (targets.length === 0) return fail("대상 거래처가 없습니다.");

  const periodKey = `bulk:${d.title}:${d.due_date || "nodue"}`;
  const rows = targets.map((c) => ({
    org_id: profile.orgId,
    title: `${d.title} - ${c.name}`,
    client_id: c.id,
    assignee_id: c.assignee_id,
    due_date: d.due_date || null,
    priority: d.priority,
    status: "todo" as const,
    source: "bulk" as const,
    template_id: d.template_id || null,
    period_key: periodKey,
    created_by: profile.userId,
  }));

  // period_key 유니크로 재실행 시 중복 무시
  const { data: inserted, error } = await supabase
    .from("tasks")
    .upsert(rows, { onConflict: "org_id,client_id,period_key", ignoreDuplicates: true })
    .select("id, assignee_id");
  if (error) return fail(error.message);

  const created = inserted ?? [];

  // 템플릿 체크리스트 복사
  if (d.template_id && created.length > 0) {
    const { data: items } = await supabase
      .from("task_template_items")
      .select("content, sort")
      .eq("template_id", d.template_id)
      .order("sort");
    if (items && items.length > 0) {
      const itemRows = created.flatMap((t) =>
        items.map((it) => ({ task_id: t.id, content: it.content, sort: it.sort })),
      );
      await supabase.from("task_items").insert(itemRows);
    }
  }

  // 담당자 알림
  const notifRows = created
    .filter((t) => t.assignee_id)
    .map((t) => ({
      org_id: profile.orgId,
      user_id: t.assignee_id as string,
      type: "task_assigned" as const,
      title: "시즌 업무가 배정되었습니다",
      body: d.title,
      link: "/tasks",
    }));
  if (notifRows.length > 0) await supabase.from("notifications").insert(notifRows);

  await writeAudit(profile, "bulk_create", "task", null, {
    title: d.title,
    filter: d.filter,
    count: created.length,
  });
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return ok({ count: created.length });
}
