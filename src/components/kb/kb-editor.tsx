"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { createKbAction, updateKbAction } from "@/lib/actions/kb";
import { KB_CATEGORY_LABEL } from "@/lib/utils";

type KbInit = {
  id?: string;
  title?: string;
  content?: string;
  category?: string;
  tags?: string[];
  source_url?: string | null;
};

function Fields({ initial }: { initial?: KbInit }) {
  return (
    <>
      <div>
        <Label htmlFor="title">제목 *</Label>
        <Input id="title" name="title" defaultValue={initial?.title} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="category">카테고리</Label>
          <Select id="category" name="category" defaultValue={initial?.category ?? "manual"}>
            {Object.entries(KB_CATEGORY_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="tags">태그 (쉼표 구분)</Label>
          <Input id="tags" name="tags" defaultValue={initial?.tags?.join(", ")} placeholder="부가세, 실무" />
        </div>
      </div>
      <div>
        <Label htmlFor="source_url">출처 URL</Label>
        <Input id="source_url" name="source_url" type="url" defaultValue={initial?.source_url ?? ""} placeholder="https://www.nts.go.kr" />
      </div>
      <div>
        <Label htmlFor="content">본문 (마크다운)</Label>
        <Textarea id="content" name="content" defaultValue={initial?.content} className="min-h-56 font-mono text-xs" placeholder={"# 제목\n\n- 항목\n**굵게**"} />
      </div>
    </>
  );
}

export function NewKbButton() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  return (
    <Dialog
      title="새 문서 작성"
      className="max-w-2xl"
      trigger={<Button><Plus className="h-4 w-4" /> 문서 작성</Button>}
    >
      {(close) => (
        <form
          action={async (fd) => {
            const res = await createKbAction(null, fd);
            if (res.ok) {
              close();
              router.push(`/knowledge/${res.data && (res.data as { id: string }).id}`);
            } else setError(res.error);
          }}
          className="space-y-3"
        >
          <Fields />
          {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}
          <div className="flex justify-end"><SubmitButton>저장</SubmitButton></div>
        </form>
      )}
    </Dialog>
  );
}

export function EditKbButton({ doc }: { doc: KbInit & { id: string } }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  return (
    <Dialog
      title="문서 수정"
      description="저장 시 이전 버전이 개정 이력에 보관됩니다."
      className="max-w-2xl"
      trigger={<Button variant="outline" size="sm"><Pencil className="h-4 w-4" /> 수정</Button>}
    >
      {(close) => (
        <form
          action={async (fd) => {
            const res = await updateKbAction(doc.id, null, fd);
            if (res.ok) { close(); router.refresh(); }
            else setError(res.error);
          }}
          className="space-y-3"
        >
          <Fields initial={doc} />
          {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}
          <div className="flex justify-end"><SubmitButton>저장</SubmitButton></div>
        </form>
      )}
    </Dialog>
  );
}
