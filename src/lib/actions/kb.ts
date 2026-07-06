"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { kbSchema } from "@/lib/validations";
import { type ActionResult, fail, ok, firstIssue, writeAudit } from "./helpers";

function parseTags(v?: string): string[] {
  if (!v) return [];
  return v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function createKbAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const profile = await requireProfile();
  const parsed = kbSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content") ?? "",
    category: formData.get("category"),
    tags: formData.get("tags") ?? "",
    source_url: formData.get("source_url") ?? "",
  });
  if (!parsed.success) return fail(firstIssue(parsed.error.issues));
  const d = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("kb_documents")
    .insert({
      org_id: profile.orgId,
      title: d.title,
      content: d.content || "",
      category: d.category,
      tags: parseTags(d.tags),
      source_url: d.source_url || null,
      author_id: profile.userId,
    })
    .select("id")
    .single();
  if (error) return fail(error.message);
  await writeAudit(profile, "create", "kb_document", data.id, { title: d.title });
  revalidatePath("/knowledge");
  return ok({ id: data.id });
}

/** 수정 시 이전 버전을 kb_revisions 에 push (I-04) */
export async function updateKbAction(
  docId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const profile = await requireProfile();
  const parsed = kbSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content") ?? "",
    category: formData.get("category"),
    tags: formData.get("tags") ?? "",
    source_url: formData.get("source_url") ?? "",
  });
  if (!parsed.success) return fail(firstIssue(parsed.error.issues));
  const d = parsed.data;

  const supabase = await createClient();
  // 현재(이전) 버전 조회 후 리비전 저장
  const { data: prev } = await supabase
    .from("kb_documents")
    .select("title, content")
    .eq("id", docId)
    .single();
  if (prev) {
    await supabase.from("kb_revisions").insert({
      doc_id: docId,
      title: prev.title,
      content: prev.content,
      editor_id: profile.userId,
    });
  }

  const { error } = await supabase
    .from("kb_documents")
    .update({
      title: d.title,
      content: d.content || "",
      category: d.category,
      tags: parseTags(d.tags),
      source_url: d.source_url || null,
    })
    .eq("id", docId)
    .eq("org_id", profile.orgId);
  if (error) return fail(error.message);
  await writeAudit(profile, "update", "kb_document", docId, { title: d.title });
  revalidatePath(`/knowledge/${docId}`);
  revalidatePath("/knowledge");
  return ok({ id: docId });
}

export async function archiveKbAction(docId: string): Promise<ActionResult> {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { error } = await supabase
    .from("kb_documents")
    .update({ is_archived: true })
    .eq("id", docId)
    .eq("org_id", profile.orgId);
  if (error) return fail(error.message);
  await writeAudit(profile, "archive", "kb_document", docId);
  revalidatePath("/knowledge");
  return ok();
}

/** 상담이력 → KB 승격 (I-07) */
export async function promoteNoteToKbAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const profile = await requireProfile();
  const noteId = formData.get("note_id") as string;
  const title = (formData.get("title") as string)?.trim();
  if (!noteId || !title) return fail("제목을 입력하세요.");

  const supabase = await createClient();
  const { data: note } = await supabase
    .from("client_notes")
    .select("id, client_id, content")
    .eq("id", noteId)
    .single();
  if (!note) return fail("상담이력을 찾을 수 없습니다.");

  const { data: doc, error } = await supabase
    .from("kb_documents")
    .insert({
      org_id: profile.orgId,
      title,
      content: note.content,
      category: "case",
      author_id: profile.userId,
    })
    .select("id")
    .single();
  if (error) return fail(error.message);

  await supabase
    .from("client_notes")
    .update({ promoted_kb_id: doc.id })
    .eq("id", noteId);

  await writeAudit(profile, "promote", "kb_document", doc.id, { from_note: noteId });
  revalidatePath("/knowledge");
  revalidatePath(`/clients/${note.client_id}`);
  return ok({ id: doc.id });
}
