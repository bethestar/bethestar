"use client";

import { useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Layers } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  createTaskAction,
  updateTaskStatusAction,
  bulkCreateTasksAction,
} from "@/lib/actions/tasks";
import { TASK_STATUS_LABEL } from "@/lib/utils";
import type { ActionResult } from "@/lib/actions/helpers";

type Member = { id: string; name: string };
type ClientOpt = { id: string; name: string };
type Template = { id: string; name: string };

/** 카드/행의 상태 변경 셀렉트 */
export function TaskStatusSelect({ taskId, status }: { taskId: string; status: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Select
      aria-label="상태 변경"
      className="h-7 w-24 text-xs"
      value={status}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value;
        start(async () => {
          await updateTaskStatusAction(taskId, next);
          router.refresh();
        });
      }}
    >
      {Object.entries(TASK_STATUS_LABEL).map(([k, v]) => (
        <option key={k} value={k}>{v}</option>
      ))}
    </Select>
  );
}

export function NewTaskButton({ members, clients }: { members: Member[]; clients: ClientOpt[] }) {
  const router = useRouter();
  return (
    <Dialog
      title="업무 생성"
      trigger={<Button variant="outline"><Plus className="h-4 w-4" /> 업무 추가</Button>}
    >
      {(close) => <TaskForm members={members} clients={clients} onDone={() => { router.refresh(); close(); }} />}
    </Dialog>
  );
}

function TaskForm({ members, clients, onDone }: { members: Member[]; clients: ClientOpt[]; onDone: () => void }) {
  const [state, action] = useActionState(
    async (prev: ActionResult | null, fd: FormData) => {
      const res = await createTaskAction(prev, fd);
      if (res.ok) onDone();
      return res;
    },
    null,
  );
  return (
    <form action={action} className="space-y-3">
      <div>
        <Label htmlFor="title">제목 *</Label>
        <Input id="title" name="title" required />
      </div>
      <div>
        <Label htmlFor="description">설명</Label>
        <Textarea id="description" name="description" className="min-h-16" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="client_id">거래처</Label>
          <Select id="client_id" name="client_id" defaultValue="">
            <option value="">사무소 업무</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="assignee_id">담당자</Label>
          <Select id="assignee_id" name="assignee_id" defaultValue="">
            <option value="">미배정</option>
            {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="due_date">기한</Label>
          <Input id="due_date" name="due_date" type="date" />
        </div>
        <div>
          <Label htmlFor="priority">우선순위</Label>
          <Select id="priority" name="priority" defaultValue="normal">
            <option value="low">낮음</option>
            <option value="normal">보통</option>
            <option value="high">높음</option>
            <option value="urgent">긴급</option>
          </Select>
        </div>
      </div>
      {state && !state.ok && <p className="text-sm text-[var(--color-danger)]">{state.error}</p>}
      <div className="flex justify-end"><SubmitButton>생성</SubmitButton></div>
    </form>
  );
}

export function BulkCreateButton({ templates }: { templates: Template[] }) {
  const router = useRouter();
  return (
    <Dialog
      title="시즌 업무 일괄 생성"
      description="대상 필터에 해당하는 활성 거래처 전체에 업무를 생성합니다."
      trigger={<Button><Layers className="h-4 w-4" /> 시즌 일괄생성</Button>}
    >
      {(close) => <BulkForm templates={templates} onDone={() => { router.refresh(); close(); }} />}
    </Dialog>
  );
}

function BulkForm({ templates, onDone }: { templates: Template[]; onDone: () => void }) {
  const [state, action] = useActionState(
    async (prev: ActionResult | null, fd: FormData) => {
      const res = await bulkCreateTasksAction(prev, fd);
      if (res.ok) onDone();
      return res;
    },
    null,
  );
  return (
    <form action={action} className="space-y-3">
      <div>
        <Label htmlFor="bulk_title">업무 제목 *</Label>
        <Input id="bulk_title" name="title" placeholder="예: 2기 부가세 예정신고 자료수취" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="filter">대상 필터 *</Label>
          <Select id="filter" name="filter" defaultValue="vat">
            <option value="all">전체 거래처</option>
            <option value="vat">부가세 대상</option>
            <option value="withholding">원천세 대상</option>
            <option value="corp">법인</option>
            <option value="individual">개인</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="bulk_priority">우선순위</Label>
          <Select id="bulk_priority" name="priority" defaultValue="high">
            <option value="low">낮음</option>
            <option value="normal">보통</option>
            <option value="high">높음</option>
            <option value="urgent">긴급</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="bulk_due">기한</Label>
          <Input id="bulk_due" name="due_date" type="date" />
        </div>
        <div>
          <Label htmlFor="template_id">체크리스트 템플릿</Label>
          <Select id="template_id" name="template_id" defaultValue="">
            <option value="">없음</option>
            {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </Select>
        </div>
      </div>
      {state && !state.ok && <p className="text-sm text-[var(--color-danger)]">{state.error}</p>}
      {state && state.ok && <p className="text-sm text-[var(--color-success)]">생성 완료</p>}
      <div className="flex justify-end"><SubmitButton>일괄 생성</SubmitButton></div>
    </form>
  );
}
