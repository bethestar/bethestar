import { Badge, type BadgeTone } from "./badge";
import { ddayLabel, ddayTone } from "@/lib/deadlines";
import { ddayFromToday } from "@/lib/utils";
import { cn } from "@/lib/utils";

const toneMap: Record<string, BadgeTone> = {
  danger: "danger",
  warn: "warn",
  normal: "neutral",
};

/** D-day 배지 — D-7 warn, D-3 danger, 경과 danger+bold (구현설계서 §7) */
export function DdayBadge({
  target,
  today,
}: {
  target: string | Date;
  today?: Date;
}) {
  const dday = ddayFromToday(target, today ?? new Date());
  const tone = ddayTone(dday);
  return (
    <Badge tone={toneMap[tone]} className={cn(dday < 0 && "font-bold")}>
      {ddayLabel(dday)}
    </Badge>
  );
}
