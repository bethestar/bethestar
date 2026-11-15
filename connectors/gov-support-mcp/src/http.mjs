// 공통 HTTP 유틸: 타임아웃, 재시도, 허용 호스트 검증, API 키 마스킹.

export class SourceError extends Error {
  constructor(source, message, { status, cause } = {}) {
    super(`[${source}] ${message}`);
    this.name = "SourceError";
    this.source = source;
    this.status = status;
    if (cause) this.cause = cause;
  }
}

/** 인증키가 잘못됐거나 활용신청이 승인되지 않은 경우. */
export class AuthError extends SourceError {
  constructor(source, message, opts) {
    super(source, `${message} — 인증키가 맞는지, 해당 API 활용신청이 승인됐는지 확인하세요. (승인 직후에는 반영까지 시간이 걸릴 수 있어요)`, opts);
    this.name = "AuthError";
  }
}

export class MissingKeyError extends SourceError {
  constructor(source, envName, howTo) {
    super(source, `API 키가 없습니다. 환경변수 ${envName} 를 설정하세요. (${howTo})`);
    this.name = "MissingKeyError";
    this.envName = envName;
  }
}

const ALLOWED_HOSTS = new Set([
  "www.bizinfo.go.kr",
  "apis.data.go.kr",
  "api.odcloud.kr",
]);

/** data.go.kr 키는 이미 URL 인코딩된 상태로 발급되기도 한다. '%'가 있으면 그대로 둔다. */
export function encodeServiceKey(key) {
  return key.includes("%") ? key : encodeURIComponent(key);
}

/** 문자열에서 API 키(원본/인코딩/디코딩 형태)를 지운다. */
export function redact(text, ...keys) {
  let out = String(text ?? "");
  for (const key of keys) {
    if (!key) continue;
    const variants = new Set([key, encodeURIComponent(key)]);
    try {
      variants.add(decodeURIComponent(key));
    } catch {
      /* ignore malformed */
    }
    for (const v of variants) {
      if (v) out = out.split(v).join("***");
    }
  }
  return out;
}

/** 쿼리 문자열을 만든다. rawPairs 는 이미 인코딩된 값 (serviceKey 등). */
export function buildUrl(base, params = {}, rawPairs = {}) {
  const parts = [];
  for (const [k, v] of Object.entries(rawPairs)) parts.push(`${k}=${v}`);
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  }
  return parts.length ? `${base}?${parts.join("&")}` : base;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * GET 후 응답 본문을 문자열로 반환. 허용 호스트만, 리다이렉트는 따르지 않음(쿼리의 키 유출 방지).
 * 429/5xx/네트워크 오류는 최대 retries 회 재시도.
 */
export async function getText(source, url, { secret, timeoutMs = 15000, retries = 2, fetchImpl = globalThis.fetch, accept = "application/json" } = {}) {
  const host = new URL(url).hostname;
  if (!ALLOWED_HOSTS.has(host)) {
    throw new SourceError(source, `허용되지 않은 호스트: ${host}`);
  }
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), timeoutMs);
    try {
      const res = await fetchImpl(url, {
        method: "GET",
        redirect: "manual",
        headers: { accept, "user-agent": "gov-support-mcp/0.1" },
        signal: ac.signal,
      });
      const body = await res.text();
      if (res.status >= 300 && res.status < 400) {
        throw new SourceError(source, `예상치 못한 리다이렉트(HTTP ${res.status}) — 요청을 중단했습니다.`, { status: res.status });
      }
      if (res.status === 401 || res.status === 403) {
        const msg = redact(serverMessage(body), secret);
        throw new AuthError(source, `인증 거부(HTTP ${res.status})${msg ? `: ${msg}` : ""}`, { status: res.status });
      }
      if (res.status === 429 || res.status >= 500) {
        lastErr = new SourceError(source, `서버 오류(HTTP ${res.status}): ${redact(body.slice(0, 200), secret)}`, { status: res.status });
        if (attempt < retries) {
          await sleep(500 * (attempt + 1));
          continue;
        }
        throw lastErr;
      }
      if (!res.ok) {
        throw new SourceError(source, `요청 실패(HTTP ${res.status}): ${redact(body.slice(0, 200), secret)}`, { status: res.status });
      }
      return body;
    } catch (err) {
      if (err instanceof SourceError) throw err;
      lastErr = new SourceError(
        source,
        err?.name === "AbortError" ? `시간 초과(${timeoutMs}ms)` : `네트워크 오류: ${redact(err?.message, secret)}`,
      );
      if (attempt < retries) {
        await sleep(500 * (attempt + 1));
        continue;
      }
      throw lastErr;
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr;
}

/** XML 오류 응답에서 메시지를 꺼낸다 (data.go.kr 계열). */
export function xmlErrorMessage(body) {
  return String(body).match(/<(returnAuthMsg|errMsg|resultMsg|reqErr|message)>\s*(?:<!\[CDATA\[)?([^<\]]*)/)?.[2]?.trim() ?? "";
}

/** JSON GET. 본문이 JSON 이 아니면 (XML 오류 응답 등) SourceError. */
export async function getJson(source, url, opts = {}) {
  const body = await getText(source, url, opts);
  try {
    return JSON.parse(body);
  } catch {
    // data.go.kr 은 키 오류 시 XML 을 돌려주는 경우가 있다.
    const msg = xmlErrorMessage(body);
    throw new SourceError(source, `JSON 이 아닌 응답${msg ? `: ${msg}` : ""} — 키 미등록·활용신청 미승인일 수 있습니다.`);
  }
}

/** JSON 또는 XML 오류 본문에서 사람이 읽을 메시지를 꺼낸다. */
export function serverMessage(body) {
  const text = String(body ?? "").trim();
  if (text.startsWith("{")) {
    try {
      const j = JSON.parse(text);
      const m = j.msg ?? j.message ?? j.reqErr ?? j.errMsg ?? j.resultMsg ?? j.error;
      if (m) return String(m).slice(0, 200);
    } catch {
      /* fall through */
    }
  }
  return xmlErrorMessage(text) || text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 120);
}
