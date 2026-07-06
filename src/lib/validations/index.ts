import { z } from "zod";

/**
 * zod 검증 스키마 (구현설계서 §6, 검증설계서 U-V-01 ~ U-V-04)
 */

/** 사업자번호: 10자리 숫자, 하이픈 허용 (U-V-01) */
export const businessNoSchema = z
  .string()
  .trim()
  .regex(/^\d{3}-?\d{2}-?\d{5}$/, "사업자번호 형식이 올바르지 않습니다 (000-00-00000)")
  .or(z.literal(""))
  .optional();

export const clientTypeEnum = z.enum(["corp", "general", "simplified", "exempt"]);
export const priorityEnum = z.enum(["low", "normal", "high", "urgent"]);
export const taskStatusEnum = z.enum(["todo", "doing", "review", "done"]);
export const kbCategoryEnum = z.enum(["tax_law", "manual", "case", "policy", "scrap"]);
export const channelEnum = z.enum(["call", "visit", "kakao", "email", "etc"]);

/** 거래처 생성/수정 */
export const clientSchema = z.object({
  name: z.string().trim().min(1, "상호를 입력하세요"),
  business_no: businessNoSchema,
  ceo_name: z.string().trim().optional().or(z.literal("")),
  client_type: clientTypeEnum,
  industry: z.string().trim().optional().or(z.literal("")),
  contact_name: z.string().trim().optional().or(z.literal("")),
  contact_phone: z.string().trim().optional().or(z.literal("")),
  contact_email: z
    .string()
    .trim()
    .email("이메일 형식이 올바르지 않습니다")
    .optional()
    .or(z.literal("")),
  assignee_id: z.string().uuid().optional().or(z.literal("")),
  // 기장료 음수 거부 (U-V-02)
  monthly_fee: z.coerce.number().int().min(0, "기장료는 0 이상이어야 합니다"),
  adjustment_fee: z.coerce.number().int().min(0, "조정료는 0 이상이어야 합니다"),
  engaged_on: z.string().optional().or(z.literal("")),
  homtax_agreed: z.coerce.boolean().optional(),
  withholding: z.coerce.boolean().optional(),
  vat_applicable: z.coerce.boolean().optional(),
  notes: z.string().optional().or(z.literal("")),
});

/** 해지: 사유 필수 (U-V-03) */
export const terminateClientSchema = z.object({
  client_id: z.string().uuid(),
  disengage_reason: z.string().trim().min(1, "해지 사유는 필수입니다"),
  disengaged_on: z.string().min(1, "해지일을 입력하세요"),
});

export const reassignSchema = z.object({
  from_assignee: z.string().uuid().optional().or(z.literal("")),
  to_assignee: z.string().uuid(),
  client_ids: z.array(z.string().uuid()).min(1, "대상 거래처를 선택하세요"),
});

/** 상담이력 */
export const clientNoteSchema = z.object({
  client_id: z.string().uuid(),
  channel: channelEnum,
  content: z.string().trim().min(1, "내용을 입력하세요"),
});

/** 업무 생성 */
export const taskSchema = z.object({
  title: z.string().trim().min(1, "제목을 입력하세요"),
  description: z.string().optional().or(z.literal("")),
  client_id: z.string().uuid().optional().or(z.literal("")),
  assignee_id: z.string().uuid().optional().or(z.literal("")),
  due_date: z.string().optional().or(z.literal("")),
  priority: priorityEnum,
});

export const taskStatusSchema = z.object({
  task_id: z.string().uuid(),
  status: taskStatusEnum,
});

/** 시즌 일괄 생성 */
export const bulkTaskSchema = z.object({
  template_id: z.string().uuid().optional().or(z.literal("")),
  title: z.string().trim().min(1, "업무 제목을 입력하세요"),
  filter: z.enum(["all", "vat", "withholding", "corp", "individual"]),
  priority: priorityEnum,
  due_date: z.string().optional().or(z.literal("")),
});

/** KB 문서: 제목 공백 거부 (U-V-04) */
export const kbSchema = z.object({
  title: z.string().trim().min(1, "제목을 입력하세요"),
  content: z.string().optional().or(z.literal("")),
  category: kbCategoryEnum,
  tags: z.string().optional().or(z.literal("")), // 쉼표 구분
  source_url: z
    .string()
    .trim()
    .url("URL 형식이 올바르지 않습니다")
    .optional()
    .or(z.literal("")),
});

/** 입금 기록 */
export const paymentSchema = z.object({
  invoice_id: z.string().uuid(),
  amount: z.coerce.number().int().min(1, "입금액은 1원 이상이어야 합니다"),
  paid_on: z.string().min(1, "입금일을 입력하세요"),
  method: z.string().optional().or(z.literal("")),
  memo: z.string().optional().or(z.literal("")),
});

/** 월 청구 생성 */
export const generateInvoicesSchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/, "기간 형식은 YYYY-MM 입니다"),
});

/** 사내 일정 */
export const eventSchema = z.object({
  title: z.string().trim().min(1, "제목을 입력하세요"),
  starts_at: z.string().min(1, "시작일을 입력하세요"),
  ends_at: z.string().optional().or(z.literal("")),
  all_day: z.coerce.boolean().optional(),
  kind: z.enum(["internal", "deadline", "leave", "training"]),
});

/** 가입 */
export const signupSchema = z.object({
  org_name: z.string().trim().min(1, "사무소명을 입력하세요"),
  name: z.string().trim().min(1, "이름을 입력하세요"),
  email: z.string().trim().email("이메일 형식이 올바르지 않습니다"),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다"),
});

export const loginSchema = z.object({
  email: z.string().trim().email("이메일 형식이 올바르지 않습니다"),
  password: z.string().min(1, "비밀번호를 입력하세요"),
});

/** 직원 초대 (프로필 생성) */
export const inviteSchema = z.object({
  email: z.string().trim().email("이메일 형식이 올바르지 않습니다"),
  name: z.string().trim().min(1, "이름을 입력하세요"),
  role: z.enum(["admin", "manager", "staff"]),
  password: z.string().min(8, "임시 비밀번호는 8자 이상이어야 합니다"),
});

export type ClientInput = z.infer<typeof clientSchema>;
export type TaskInput = z.infer<typeof taskSchema>;
export type KbInput = z.infer<typeof kbSchema>;
