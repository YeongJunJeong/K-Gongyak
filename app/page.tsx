"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PledgeForm, {
  type GenerationResult,
  type ProgressInfo,
} from "@/components/PledgeForm";
import ResultPanel from "@/components/ResultPanel";

export default function HomePage() {
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<ProgressInfo | null>(null);

  return (
    <>
      <Header />

      <section className="bg-white border-b border-gov-gray-200 no-print">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-6">
          <div className="flex items-center gap-3 text-sm text-gov-gray-500 mb-1">
            <span className="px-2 py-0.5 bg-gov-navy text-white text-xs font-semibold">
              공고
            </span>
            <span>2026. 6. 3. 실시 · 제9회 전국동시지방선거</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gov-gray-800 tracking-tight">
            지역 맞춤형 <span className="text-gov-navy">공약 생성</span> 서비스
          </h1>
          <p className="text-sm text-gov-gray-600 mt-2 leading-relaxed">
            출마하실 지역·직위·후보자 프로필을 입력하시면, 웹 검색으로 최신 지역
            현안을 수집한 뒤 3단계 AI 분석으로 차별화된 공약안을 생성해드립니다.
          </p>
        </div>
      </section>

      <main className="flex-1 bg-gov-gray-50">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 sm:py-8 grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
          <div className="lg:col-span-2">
            <PledgeForm
              onResult={setResult}
              onLoadingChange={setLoading}
              onProgress={setProgress}
            />

            <aside className="mt-4 bg-white border border-gov-gray-200 p-4 text-xs text-gov-gray-600 leading-relaxed no-print">
              <div className="font-semibold text-gov-gray-800 mb-1">
                · 이용 안내
              </div>
              <ul className="list-disc list-inside space-y-1 text-gov-gray-600">
                <li>
                  <b>웹 검색 + 3단계 AI 분석</b>으로 지역 맞춤 공약을 생성합니다.
                </li>
                <li>
                  후보자 프로필(정당성향·관심사·타겟층)을 입력하면 더
                  차별화됩니다.
                </li>
                <li>
                  생성에는 보통 30~90초가 소요되며, 각 공약마다 예산·실행
                  단계·KPI·리스크가 포함됩니다.
                </li>
                <li>
                  생성 결과는 참고용이며 사실관계·실현가능성을 별도 검토해주세요.
                </li>
              </ul>
            </aside>
          </div>

          <div className="lg:col-span-3">
            <ResultPanel loading={loading} result={result} progress={progress} />
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
