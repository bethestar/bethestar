"use client";

import { Plus, Pencil } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ClientForm } from "./client-form";
import { createClientAction, updateClientAction } from "@/lib/actions/clients";
import type { ActionResult } from "@/lib/actions/helpers";

type Member = { id: string; name: string };

export function NewClientButton({ members }: { members: Member[] }) {
  return (
    <Dialog
      title="거래처 등록"
      description="새 수임처 정보를 입력하세요."
      trigger={
        <Button>
          <Plus className="h-4 w-4" /> 거래처 등록
        </Button>
      }
    >
      {(close) => (
        <ClientForm action={createClientAction} members={members} onDone={close} submitLabel="등록" />
      )}
    </Dialog>
  );
}

export function EditClientButton({
  members,
  client,
}: {
  members: Member[];
  client: Parameters<typeof ClientForm>[0]["initial"] & { id: string };
}) {
  const boundAction = (prev: ActionResult | null, fd: FormData) =>
    updateClientAction(client.id, prev, fd);
  return (
    <Dialog
      title="거래처 수정"
      trigger={
        <Button variant="outline" size="sm">
          <Pencil className="h-4 w-4" /> 수정
        </Button>
      }
    >
      {(close) => (
        <ClientForm action={boundAction} members={members} initial={client} onDone={close} submitLabel="저장" />
      )}
    </Dialog>
  );
}
