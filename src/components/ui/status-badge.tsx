import { Badge, type BadgeTone } from "./badge";
import {
  TASK_STATUS_LABEL,
  PRIORITY_LABEL,
  INVOICE_STATUS_LABEL,
  CLIENT_TYPE_LABEL,
} from "@/lib/utils";

const taskTone: Record<string, BadgeTone> = {
  todo: "neutral",
  doing: "info",
  review: "warn",
  done: "success",
};
const priorityTone: Record<string, BadgeTone> = {
  low: "neutral",
  normal: "neutral",
  high: "warn",
  urgent: "danger",
};
const invoiceTone: Record<string, BadgeTone> = {
  draft: "neutral",
  issued: "info",
  paid: "success",
  overdue: "danger",
};

export function TaskStatusBadge({ status }: { status: string }) {
  return <Badge tone={taskTone[status] ?? "neutral"}>{TASK_STATUS_LABEL[status] ?? status}</Badge>;
}
export function PriorityBadge({ priority }: { priority: string }) {
  return <Badge tone={priorityTone[priority] ?? "neutral"}>{PRIORITY_LABEL[priority] ?? priority}</Badge>;
}
export function InvoiceStatusBadge({ status }: { status: string }) {
  return <Badge tone={invoiceTone[status] ?? "neutral"}>{INVOICE_STATUS_LABEL[status] ?? status}</Badge>;
}
export function ClientTypeBadge({ type }: { type: string }) {
  return <Badge tone="primary">{CLIENT_TYPE_LABEL[type] ?? type}</Badge>;
}
