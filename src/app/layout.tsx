import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SY.ai - AI 투자 플랫폼",
  description: "AI 자동매매, 암호화폐 시그널, 스포츠 예측 — SYC 코인으로 결제 시 최대 30% 할인",
  keywords: "AI투자, 자동매매, 주식, 한국투자증권, SYC코인",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
