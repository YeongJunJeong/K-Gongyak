import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "제9회 전국동시지방선거 공약생성기",
  description:
    "2026년 대한민국 지방선거 출마자를 위한 지역 맞춤형 공약 생성 서비스",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
