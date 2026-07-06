import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TaxDesk — 세무사무소 운영 플랫폼",
  description:
    "신고 프로그램 밖의 모든 사무실 운영 업무를 하나의 채널에서. 거래처·업무·기한·지식·미수금 통합 관리.",
};

// 다크모드 플래시 방지 인라인 스크립트
const themeScript = `
(function() {
  try {
    var t = localStorage.getItem('taxdesk-theme');
    if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="bg-app text-base-fg antialiased">{children}</body>
    </html>
  );
}
