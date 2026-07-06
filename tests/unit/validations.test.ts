import { describe, it, expect } from "vitest";
import {
  clientSchema,
  terminateClientSchema,
  kbSchema,
  businessNoSchema,
} from "@/lib/validations";

describe("validations", () => {
  it("U-V-01 사업자번호 형식(10자리, 하이픈 허용) 유효/무효", () => {
    expect(businessNoSchema.safeParse("123-45-67890").success).toBe(true);
    expect(businessNoSchema.safeParse("1234567890").success).toBe(true);
    expect(businessNoSchema.safeParse("").success).toBe(true); // 선택 입력
    expect(businessNoSchema.safeParse("123-45-678").success).toBe(false);
    expect(businessNoSchema.safeParse("abc-de-fghij").success).toBe(false);
  });

  it("U-V-02 기장료 음수 거부", () => {
    const base = {
      name: "테스트상사",
      client_type: "general",
      monthly_fee: -1,
      adjustment_fee: 0,
    };
    expect(clientSchema.safeParse(base).success).toBe(false);
    expect(clientSchema.safeParse({ ...base, monthly_fee: 100000 }).success).toBe(true);
  });

  it("U-V-03 해지 시 사유 필수", () => {
    const ok = terminateClientSchema.safeParse({
      client_id: "11111111-1111-1111-1111-111111111111",
      disengage_reason: "폐업",
      disengaged_on: "2026-07-01",
    });
    expect(ok.success).toBe(true);
    const bad = terminateClientSchema.safeParse({
      client_id: "11111111-1111-1111-1111-111111111111",
      disengage_reason: "   ",
      disengaged_on: "2026-07-01",
    });
    expect(bad.success).toBe(false);
  });

  it("U-V-04 KB 문서 제목 공백 거부", () => {
    expect(kbSchema.safeParse({ title: "제목", category: "manual" }).success).toBe(true);
    expect(kbSchema.safeParse({ title: "   ", category: "manual" }).success).toBe(false);
  });
});
