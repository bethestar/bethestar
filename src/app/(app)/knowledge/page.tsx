import Link from "next/link";
import { Search, BookOpen, ExternalLink } from "lucide-react";
import { getSessionProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { NewKbButton } from "@/components/kb/kb-editor";
import { KB_CATEGORY_LABEL, formatDate, cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function KnowledgePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const sp = await searchParams;
  const profile = await getSessionProfile();
  if (!profile) return null;
  const supabase = await createClient();

  let query = supabase
    .from("kb_documents")
    .select("id, title, content, category, tags, source_url, updated_at, profiles:author_id(name)")
    .eq("org_id", profile.orgId)
    .eq("is_archived", false)
    .order("updated_at", { ascending: false });

  // 전문검색: 제목·본문 대상 (pg_trgm 인덱스 활용)
  if (sp.q) query = query.or(`title.ilike.%${sp.q}%,content.ilike.%${sp.q}%`);
  if (sp.category) query = query.eq("category", sp.category);

  const { data: docs } = await query;
  const rows = docs ?? [];

  const categories = Object.entries(KB_CATEGORY_LABEL);

  return (
    <>
      <PageHeader
        title="지식저장소"
        description="세법 노하우·예규·상담 사례를 조직 자산으로 축적합니다."
        action={<NewKbButton />}
      />

      <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
        {/* 카테고리 필터 */}
        <aside className="space-y-1">
          <Link href="/knowledge" className={cn("block rounded-[var(--radius)] px-3 py-2 text-sm", !sp.category ? "bg-surface-2 font-medium text-base-fg" : "text-muted hover:bg-surface-2")}>
            전체
          </Link>
          {categories.map(([k, v]) => (
            <Link
              key={k}
              href={`/knowledge?category=${k}`}
              className={cn("block rounded-[var(--radius)] px-3 py-2 text-sm", sp.category === k ? "bg-surface-2 font-medium text-base-fg" : "text-muted hover:bg-surface-2")}
            >
              {v}
            </Link>
          ))}
        </aside>

        <div>
          <Card className="mb-4 p-3">
            <form method="get" className="flex gap-2">
              {sp.category && <input type="hidden" name="category" value={sp.category} />}
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <Input name="q" placeholder="제목·본문 검색" defaultValue={sp.q} className="pl-8" />
              </div>
              <Button type="submit" variant="secondary">검색</Button>
            </form>
          </Card>

          {rows.length === 0 ? (
            <EmptyState
              icon={<BookOpen className="h-8 w-8" />}
              title={sp.q ? "검색 결과가 없습니다" : "문서가 없습니다"}
              description={sp.q ? "다른 검색어를 시도하세요." : "첫 문서를 작성해 지식을 축적하세요."}
              action={!sp.q ? <NewKbButton /> : undefined}
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {rows.map((d) => {
                const author = d.profiles as unknown as { name: string } | null;
                const excerpt = (d.content ?? "").replace(/[#*`>-]/g, "").slice(0, 90);
                return (
                  <Link key={d.id} href={`/knowledge/${d.id}`}>
                    <Card className="h-full transition-colors hover:border-[var(--color-primary)]">
                      <CardContent className="pt-4">
                        <div className="mb-2 flex items-center gap-2">
                          <Badge tone="primary">{KB_CATEGORY_LABEL[d.category]}</Badge>
                          {d.source_url && <ExternalLink className="h-3.5 w-3.5 text-muted" />}
                        </div>
                        <p className="font-semibold text-base-fg">{d.title}</p>
                        <p className="mt-1 line-clamp-2 text-sm text-muted">{excerpt}</p>
                        <div className="mt-3 flex flex-wrap gap-1">
                          {(d.tags ?? []).slice(0, 4).map((t: string) => (
                            <span key={t} className="rounded bg-surface-2 px-1.5 py-0.5 text-[11px] text-muted">#{t}</span>
                          ))}
                        </div>
                        <p className="mt-3 text-xs text-muted">{author?.name} · {formatDate(d.updated_at)}</p>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
