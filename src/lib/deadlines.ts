/**
 * 기한 계산 로직 (구현설계서 §3.3)
 *  - 신고기한 규칙 + 주말·공휴일 순연
 *  - 검증설계서 U-D-01 ~ U-D-09 충족
 *
 * TZ 안정성을 위해 모든 날짜 연산은 UTC 자정 기준으로 수행한다.
 * (날짜만 다루므로 TZ 영향 없음)
 */

export type Frequency = "monthly" | "quarterly" | "half" | "yearly";

export interface DeadlineRule {
  code: string;
  name: string;
  month: number | null;
  day: number;
  frequency: Frequency;
  rollover: boolean;
  applies_to?: string;
}

export interface DeadlineOccurrence {
  code: string;
  name: string;
  date: Date;
  /** 순연 전 원래 기준일 (주말/공휴일이었는지 표시용) */
  baseDate: Date;
  rolled: boolean;
}

const MS_PER_DAY = 86_400_000;

/** UTC 자정 Date 생성 */
export function utcDate(year: number, month1to12: number, day: number): Date {
  return new Date(Date.UTC(year, month1to12 - 1, day));
}

/** 'YYYY-MM-DD' 포맷 (UTC 기준) */
export function toISODate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** 토요일(6) 또는 일요일(0) */
export function isWeekend(d: Date): boolean {
  const wd = d.getUTCDay();
  return wd === 0 || wd === 6;
}

export function isHoliday(d: Date, holidays: Set<string>): boolean {
  return holidays.has(toISODate(d));
}

/** 주말·공휴일이면 다음 영업일로 순연 (연휴도 연속 처리) */
export function rollForward(d: Date, holidays: Set<string>): Date {
  const result = new Date(d.getTime());
  while (isWeekend(result) || isHoliday(result, holidays)) {
    result.setTime(result.getTime() + MS_PER_DAY);
  }
  return result;
}

/** 규칙이 해당 연도에 발생하는 월(1~12) 목록 */
export function monthsForRule(rule: DeadlineRule): number[] {
  switch (rule.frequency) {
    case "monthly":
      return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    case "quarterly":
      return [1, 4, 7, 10];
    case "half":
      return [1, 7];
    case "yearly":
      return [rule.month ?? 1];
  }
}

/**
 * 특정 월의 기한일 계산 (순연 포함).
 * rollover=false 이면 주말이어도 순연하지 않는다 (U-D-08).
 */
export function computeDeadline(
  rule: DeadlineRule,
  year: number,
  month: number,
  holidays: Set<string> = new Set(),
): Date {
  const base = utcDate(year, month, rule.day);
  if (!rule.rollover) return base;
  return rollForward(base, holidays);
}

/** 연간 모든 발생 기한을 생성 (캘린더 표시용). U-D-06/07 */
export function generateYearDeadlines(
  rules: DeadlineRule[],
  year: number,
  holidays: Set<string> = new Set(),
): DeadlineOccurrence[] {
  const out: DeadlineOccurrence[] = [];
  for (const rule of rules) {
    for (const month of monthsForRule(rule)) {
      const base = utcDate(year, month, rule.day);
      const date = rule.rollover ? rollForward(base, holidays) : base;
      out.push({
        code: rule.code,
        name: rule.name,
        date,
        baseDate: base,
        rolled: date.getTime() !== base.getTime(),
      });
    }
  }
  out.sort((a, b) => a.date.getTime() - b.date.getTime());
  return out;
}

/**
 * 오늘(from) 기준 다음 기한. 자동화 deadline 트리거 평가에 사용.
 * 올해와 내년 발생분을 모두 생성해 from 이후 가장 이른 기한을 반환.
 */
export function nextDeadline(
  rule: DeadlineRule,
  from: Date,
  holidays: Set<string> = new Set(),
): Date | null {
  const year = from.getUTCFullYear();
  const candidates = [
    ...generateYearDeadlines([rule], year, holidays),
    ...generateYearDeadlines([rule], year + 1, holidays),
  ];
  for (const c of candidates) {
    if (computeDday(c.date, from) >= 0) return c.date;
  }
  return null;
}

/**
 * D-day 계산 (U-D-09). target - today (일 단위 정수).
 * 음수=경과, 0=당일, 양수=남은 일수. 시간 요소는 제거.
 */
export function computeDday(target: Date, today: Date): number {
  const t = Date.UTC(
    target.getUTCFullYear(),
    target.getUTCMonth(),
    target.getUTCDate(),
  );
  const n = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate(),
  );
  return Math.round((t - n) / MS_PER_DAY);
}

/** D-day 배지 표기 문자열 */
export function ddayLabel(dday: number): string {
  if (dday === 0) return "D-DAY";
  if (dday > 0) return `D-${dday}`;
  return `D+${Math.abs(dday)}`;
}

export type DdayTone = "danger" | "warn" | "normal";

/** D-day 색상 규칙 (구현설계서 §7): 경과/D-3 danger, D-7 warn */
export function ddayTone(dday: number): DdayTone {
  if (dday < 0) return "danger";
  if (dday <= 3) return "danger";
  if (dday <= 7) return "warn";
  return "normal";
}
