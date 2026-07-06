import { computeDday } from "./deadlines";

/** className 병합 (경량 clsx 대체) */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

/** 원화 표기 (₩ 천단위) */
export function formatKRW(amount: number | null | undefined): string {
  const v = amount ?? 0;
  return "₩" + v.toLocaleString("ko-KR");
}

/** 날짜 YYYY.MM.DD */
export function formatDate(input: string | Date | null | undefined): string {
  if (!input) return "-";
  const d = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return "-";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

/** 날짜+시간 */
export function formatDateTime(input: string | Date | null | undefined): string {
  if (!input) return "-";
  const d = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return "-";
  return (
    formatDate(d) +
    " " +
    String(d.getHours()).padStart(2, "0") +
    ":" +
    String(d.getMinutes()).padStart(2, "0")
  );
}

/** 상대 시간 (간단) */
export function timeAgo(input: string | Date): string {
  const d = typeof input === "string" ? new Date(input) : input;
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "방금 전";
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}일 전`;
  return formatDate(d);
}

/** 오늘 기준 D-day (문자열 날짜) */
export function ddayFromToday(target: string | Date, today = new Date()): number {
  const t = typeof target === "string" ? new Date(target) : target;
  return computeDday(t, today);
}

export const CLIENT_TYPE_LABEL: Record<string, string> = {
  corp: "법인",
  general: "일반",
  simplified: "간이",
  exempt: "면세",
};

export const TASK_STATUS_LABEL: Record<string, string> = {
  todo: "대기",
  doing: "진행",
  review: "검토",
  done: "완료",
};

export const PRIORITY_LABEL: Record<string, string> = {
  low: "낮음",
  normal: "보통",
  high: "높음",
  urgent: "긴급",
};

export const KB_CATEGORY_LABEL: Record<string, string> = {
  tax_law: "세법/예규",
  manual: "업무 매뉴얼",
  case: "상담 사례",
  policy: "사무소 규정",
  scrap: "스크랩",
};

export const CHANNEL_LABEL: Record<string, string> = {
  call: "전화",
  visit: "방문",
  kakao: "카카오",
  email: "이메일",
  etc: "기타",
};

export const INVOICE_STATUS_LABEL: Record<string, string> = {
  draft: "임시",
  issued: "청구됨",
  paid: "완납",
  overdue: "연체",
};

export const ROLE_LABEL: Record<string, string> = {
  admin: "대표",
  manager: "실장",
  staff: "직원",
};

export const NOTIFICATION_TYPE_LABEL: Record<string, string> = {
  deadline: "기한",
  task_assigned: "업무배정",
  task_overdue: "지연",
  mention: "멘션",
  billing: "청구",
  system: "시스템",
};
