import * as React from "react";

/**
 * 경량 마크다운 렌더러 (외부 의존 없음).
 * 지원: #~### 제목, - / * 리스트, **굵게**, `코드`, [링크](url), 문단, 수평선.
 */
function inline(text: string, keyBase: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  // 토큰: **bold**, `code`, [text](url)
  const regex = /(\*\*([^*]+)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[2] !== undefined) {
      nodes.push(<strong key={`${keyBase}-b${i}`}>{m[2]}</strong>);
    } else if (m[3] !== undefined) {
      nodes.push(
        <code
          key={`${keyBase}-c${i}`}
          className="rounded bg-surface-2 px-1 py-0.5 text-[0.85em]"
        >
          {m[3]}
        </code>,
      );
    } else if (m[4] !== undefined) {
      nodes.push(
        <a
          key={`${keyBase}-l${i}`}
          href={m[5]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--color-primary)] underline"
        >
          {m[4]}
        </a>,
      );
    }
    last = regex.lastIndex;
    i++;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function Markdown({ content }: { content: string }) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: React.ReactNode[] = [];
  let list: string[] = [];
  let key = 0;

  const flushList = () => {
    if (list.length) {
      const items = [...list];
      blocks.push(
        <ul key={`ul${key++}`} className="my-2 list-disc space-y-1 pl-5">
          {items.map((it, idx) => (
            <li key={idx}>{inline(it, `li${key}-${idx}`)}</li>
          ))}
        </ul>,
      );
      list = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (/^\s*[-*]\s+/.test(line)) {
      list.push(line.replace(/^\s*[-*]\s+/, ""));
      continue;
    }
    flushList();
    if (line.trim() === "") continue;
    if (line.startsWith("### ")) {
      blocks.push(
        <h3 key={key++} className="mt-4 mb-1 text-base font-semibold">
          {inline(line.slice(4), `h3${key}`)}
        </h3>,
      );
    } else if (line.startsWith("## ")) {
      blocks.push(
        <h2 key={key++} className="mt-5 mb-2 text-lg font-bold">
          {inline(line.slice(3), `h2${key}`)}
        </h2>,
      );
    } else if (line.startsWith("# ")) {
      blocks.push(
        <h1 key={key++} className="mt-2 mb-3 text-xl font-bold">
          {inline(line.slice(2), `h1${key}`)}
        </h1>,
      );
    } else if (/^---+$/.test(line.trim())) {
      blocks.push(<hr key={key++} className="my-4 border-base" />);
    } else {
      blocks.push(
        <p key={key++} className="my-2 leading-relaxed">
          {inline(line, `p${key}`)}
        </p>,
      );
    }
  }
  flushList();

  return <div className="text-sm text-base-fg">{blocks}</div>;
}
