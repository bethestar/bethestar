import { describe, it, expect } from "vitest";
import {
  computeDeadline,
  generateYearDeadlines,
  computeDday,
  toISODate,
  ddayTone,
  ddayLabel,
  type DeadlineRule,
} from "@/lib/deadlines";

const WHT: DeadlineRule = {
  code: "WHT_MONTHLY",
  name: "원천세",
  month: null,
  day: 10,
  frequency: "monthly",
  rollover: true,
};
const VAT: DeadlineRule = {
  code: "VAT",
  name: "부가세",
  month: null,
  day: 25,
  frequency: "quarterly",
  rollover: true,
};
const CORP: DeadlineRule = {
  code: "CORP_TAX",
  name: "법인세",
  month: 3,
  day: 31,
  frequency: "yearly",
  rollover: true,
};

// 2026 공휴일 발췌
const HOLIDAYS = new Set([
  "2026-05-05", // 어린이날(화)
  "2026-02-16",
  "2026-02-17",
  "2026-02-18", // 설날 연휴
]);

describe("deadlines", () => {
  it("U-D-01 원천세 매월 10일, 평일이면 해당 월 10일", () => {
    // 2026-07-10 = 금요일(평일)
    const d = computeDeadline(WHT, 2026, 7, HOLIDAYS);
    expect(toISODate(d)).toBe("2026-07-10");
  });

  it("U-D-02 기한일이 토요일이면 다음 월요일로 순연", () => {
    // 2026-01-10 = 토요일
    const d = computeDeadline(WHT, 2026, 1, HOLIDAYS);
    expect(toISODate(d)).toBe("2026-01-12");
  });

  it("U-D-03 기한일이 일요일이면 다음 월요일로 순연", () => {
    // 2026-05-10 = 일요일
    const d = computeDeadline(WHT, 2026, 5, HOLIDAYS);
    expect(toISODate(d)).toBe("2026-05-11");
  });

  it("U-D-04 기한일이 공휴일이면 다음 영업일로 순연", () => {
    // day=5, 2026-05-05 = 어린이날(화, 공휴일) → 05-06
    const rule: DeadlineRule = { ...WHT, day: 5 };
    const d = computeDeadline(rule, 2026, 5, HOLIDAYS);
    expect(toISODate(d)).toBe("2026-05-06");
  });

  it("U-D-05 연휴(연속 공휴일)면 연휴 종료 후 첫 영업일", () => {
    // day=16, 2026-02-16(월)~18(수) 설날 연휴 → 02-19(목)
    const rule: DeadlineRule = { ...WHT, day: 16 };
    const d = computeDeadline(rule, 2026, 2, HOLIDAYS);
    expect(toISODate(d)).toBe("2026-02-19");
  });

  it("U-D-06 부가세 확정 quarterly → 연 4회(1·4·7·10월) 생성", () => {
    const occ = generateYearDeadlines([VAT], 2026, HOLIDAYS);
    expect(occ.length).toBe(4);
    const months = occ.map((o) => o.baseDate.getUTCMonth() + 1);
    expect(months).toEqual([1, 4, 7, 10]);
  });

  it("U-D-07 연간 규칙(법인세 3/31)은 연 1회 생성", () => {
    const occ = generateYearDeadlines([CORP], 2026, HOLIDAYS);
    expect(occ.length).toBe(1);
    // 2026-03-31 = 화요일 → 순연 없음
    expect(toISODate(occ[0].date)).toBe("2026-03-31");
  });

  it("U-D-08 rollover=false 규칙은 주말이어도 순연하지 않음", () => {
    const rule: DeadlineRule = { ...WHT, rollover: false };
    // 2026-01-10 토요일이지만 그대로
    const d = computeDeadline(rule, 2026, 1, HOLIDAYS);
    expect(toISODate(d)).toBe("2026-01-10");
  });

  it("U-D-09 D-day 계산: 경과(음수)/당일(0)/남음(양수)", () => {
    const today = new Date(Date.UTC(2026, 6, 7)); // 2026-07-07
    expect(computeDday(new Date(Date.UTC(2026, 6, 10)), today)).toBe(3);
    expect(computeDday(new Date(Date.UTC(2026, 6, 7)), today)).toBe(0);
    expect(computeDday(new Date(Date.UTC(2026, 6, 1)), today)).toBe(-6);
  });

  it("D-day 배지 톤/라벨 규칙", () => {
    expect(ddayTone(-1)).toBe("danger");
    expect(ddayTone(2)).toBe("danger");
    expect(ddayTone(5)).toBe("warn");
    expect(ddayTone(10)).toBe("normal");
    expect(ddayLabel(0)).toBe("D-DAY");
    expect(ddayLabel(5)).toBe("D-5");
    expect(ddayLabel(-2)).toBe("D+2");
  });
});
