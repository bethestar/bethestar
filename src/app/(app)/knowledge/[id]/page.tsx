import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, History } from "lucide-react";
import { getSessionProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Markdown } from "@/components/markdown";
import { EditKbButton } from "@/components/kb/kb-editor";
import { KB_CATEGORY_LABEL, formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function KbDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getSessionProfile();
  if (!profile) return null;
  const supabase = await createClient();

  const { data: doc } = await supabase
    .from("kb_documents")
    .select("*, profiles:author_id(name)")
    .eq("id", id)
    .single();
  if (!doc) notFound();

  const { data: revisions } = await supabase
    .from("kb_revisions")
    .select("id, title, created_at, profiles:editor_id(name)")
    .eq("doc_id", id)
    .order("created_at", { ascending: false });

  const author = doc.profiles as unknown as { name: string } | null;

  return (
    <>
      <Link href="/knowledge" className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-base-fg">
        <ArrowLeft className="h-4 w-4" /> 지식저장소
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
        <div>
          <Card>
            <CardContent className="pt-6">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <Badge tone="primary">{KB_CATEGORY_LABEL[doc.category]}</Badge>
                    {doc.source_url && (
                      <a href={doc.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-[var(--color-primary)] hover:underline">
                        <ExternalLink className="h-3.5 w-3.5" /> 출처
                      </a>
                    )}
                  </div>
                  <h1 className="text-2xl font-bold text-base-fg">{doc.title}</h1>
                  <p className="mt-1 text-sm text-muted">작성 {author?.name} · 수정 {formatDateTime(doc.updated_at)}</p>
                </div>
                <EditKbButton doc={doc} />
              </div>

              {(doc.tags ?? []).length > 0 && (
                <div className="mb-4 flex flex-wrap gap-1">
                  {(doc.tags as string[]).map((t) => (
                    <span key={t} className="rounded bg-surface-2 px-2 py-0.5 text-xs text-muted">#{t}</span>
                  ))}
                </div>
              )}

              <div className="border-t border-base pt-4">
                <Markdown content={doc.content || "_(본문 없음)_"} />
              </div>
            </CardContent>
          </Card>
        </div>

        <aside>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-1.5"><History className="h-4 w-4" /> 개정 이력</CardTitle></CardHeader>
            <CardContent>
              {(revisions ?? []).length === 0 ? (
                <p className="text-sm text-muted">개정 이력이 없습니다.</p>
              ) : (
                <ol className="space-y-3">
                  {(revisions ?? []).map((r) => {
                    const editor = r.profiles as unknown as { name: string } | null;
                    return (
                      <li key={r.id} className="border-l-2 border-base pl-3">
                        <p className="text-sm font-medium text-base-fg">{r.title}</p>
                        <p className="text-xs text-muted">{editor?.name} · {formatDateTime(r.created_at)}</p>
                      </li>
                    );
                  })}
                </ol>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </>
  );
}
