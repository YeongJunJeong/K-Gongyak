"use client";

import { useState } from "react";
import type { GenerationResult, ProgressInfo } from "./PledgeForm";
import type { Pledge } from "@/lib/types";

interface Props {
  loading: boolean;
  result: GenerationResult | null;
  progress: ProgressInfo | null;
}

export default function ResultPanel({ loading, result, progress }: Props) {
  if (loading) {
    return <LoadingView progress={progress} />;
  }

  if (!result) {
    return (
      <div className="bg-white border border-gov-gray-200 shadow-sm">
        <div className="bg-gov-gray-50 border-b border-gov-gray-200 px-6 py-3 flex items-center gap-2">
          <div className="w-1 h-4 bg-gov-gray-300" />
          <h2 className="font-semibold text-gov-gray-500 tracking-tight">
            공약 생성 결과
          </h2>
        </div>
        <div className="p-12 text-center text-gov-gray-400 text-sm">
          좌측 신청서를 작성한 뒤{" "}
          <span className="text-gov-navy font-semibold">[공약 생성하기]</span>{" "}
          버튼을 눌러주세요.
        </div>
      </div>
    );
  }

  return <ResultView result={result} />;
}

// ──────────────── 로딩 뷰 ────────────────

const STEPS = [
  { key: 1, title: "지역 현안 수집", desc: "최신 뉴스·이슈 검색" },
  { key: 2, title: "지역 브리핑 작성", desc: "인구·경제·현안 분석" },
  { key: 3, title: "공약 초안 설계", desc: "8~10개 공약 생성" },
  { key: 4, title: "검증 및 정교화", desc: "권한·구체성 감수" },
];

function LoadingView({ progress }: { progress: ProgressInfo | null }) {
  const currentStep = progress?.step ?? 0;
  return (
    <div className="bg-white border border-gov-gray-200 shadow-sm">
      <div className="bg-gov-gray-50 border-b border-gov-gray-200 px-6 py-3 flex items-center gap-2">
        <div className="w-1 h-4 bg-gov-navy" />
        <h2 className="font-semibold text-gov-gray-800 tracking-tight">
          공약 생성 결과
        </h2>
      </div>

      <div className="p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 border-2 border-gov-navy border-t-transparent rounded-full animate-spin" />
          <div>
            <div className="font-semibold text-gov-gray-800">
              공약 생성 중... ({currentStep}/4 단계)
            </div>
            <div className="text-xs text-gov-gray-500 mt-0.5">
              {progress?.label || "준비 중..."}
            </div>
          </div>
        </div>

        <ol className="space-y-2">
          {STEPS.map((s) => {
            const state =
              currentStep > s.key
                ? "done"
                : currentStep === s.key
                  ? "active"
                  : "pending";
            return (
              <li
                key={s.key}
                className={`flex items-center gap-3 px-4 py-3 border transition-colors ${
                  state === "done"
                    ? "bg-gov-gray-50 border-gov-gray-200 text-gov-gray-500"
                    : state === "active"
                      ? "bg-gov-navy/5 border-gov-navy text-gov-gray-800"
                      : "bg-white border-gov-gray-200 text-gov-gray-400"
                }`}
              >
                <div
                  className={`w-6 h-6 flex items-center justify-center text-xs font-bold ${
                    state === "done"
                      ? "bg-gov-gray-400 text-white"
                      : state === "active"
                        ? "bg-gov-navy text-white"
                        : "bg-gov-gray-200 text-gov-gray-400"
                  }`}
                >
                  {state === "done" ? "✓" : s.key}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold">{s.title}</div>
                  <div className="text-[11px] text-gov-gray-500">{s.desc}</div>
                </div>
                {state === "active" && (
                  <div className="text-xs text-gov-navy font-semibold">진행 중</div>
                )}
              </li>
            );
          })}
        </ol>

        <div className="mt-6 text-[11px] text-gov-gray-400 leading-relaxed">
          · 웹 검색 + 3단계 AI 분석으로 보통 30초~90초 소요됩니다.
          <br />· 웹 검색은 TAVILY_API_KEY 환경변수가 설정된 경우에만 활성화됩니다.
        </div>
      </div>
    </div>
  );
}

// ──────────────── 결과 뷰 ────────────────

function ResultView({ result }: { result: GenerationResult }) {
  return (
    <div className="bg-white border border-gov-gray-200 shadow-sm">
      {/* 헤더 */}
      <div className="bg-gov-navy text-white px-6 py-4 flex items-center justify-between">
        <div>
          <div className="text-[11px] tracking-[0.25em] text-white/70">
            POLICY PROPOSAL · AI GENERATED
          </div>
          <div className="font-bold text-lg tracking-tight">
            {result.meta.candidacy} 공약(안)
          </div>
        </div>
        <button
          onClick={() => window.print()}
          className="no-print text-xs px-3 py-1.5 border border-white/30 hover:bg-white/10 transition"
        >
          인쇄 / PDF
        </button>
      </div>

      {/* 메타 정보 */}
      <MetaBlock result={result} />

      {/* 지역 브리핑 */}
      <BriefingBlock result={result} />

      {/* 공약 리스트 */}
      <PledgesBlock pledges={result.pledges} />

      {/* 푸터 */}
      <div className="px-6 py-3 border-t border-gov-gray-200 bg-gov-gray-50 text-[11px] text-gov-gray-500">
        ※ 본 공약안은 AI({result.meta.model})가 생성한 참고용 자료입니다.
        실제 공약 발표 전에는 현장 의견 수렴과 전문가 검토를 거치시기 바랍니다.
      </div>
    </div>
  );
}

function MetaBlock({ result }: { result: GenerationResult }) {
  const cust = result.meta.customization;
  return (
    <div className="px-6 py-4 border-b border-gov-gray-200 bg-gov-gray-50">
      <table className="w-full text-sm">
        <tbody>
          <MetaRow label="지역" value={result.meta.region} />
          <MetaRow label="출마 직위" value={result.meta.candidacy} />
          <MetaRow label="출마 구분" value={result.meta.category} />
          {cust?.party && cust.party !== "unspecified" && (
            <MetaRow label="정당 성향" value={partyKoreanLabel(cust.party)} />
          )}
          {cust?.interests?.length ? (
            <MetaRow label="핵심 관심사" value={cust.interests.map(interestLabel).join(", ")} />
          ) : null}
          {cust?.demographics?.length ? (
            <MetaRow label="타겟층" value={cust.demographics.map(demographicLabel).join(", ")} />
          ) : null}
          <MetaRow
            label="웹 검색"
            value={
              result.meta.webSearchUsed
                ? `반영됨 (${result.briefing.sources.length}건)`
                : "미반영 (TAVILY_API_KEY 미설정)"
            }
          />
          <MetaRow
            label="생성일자"
            value={new Date(result.meta.generatedAt).toLocaleString("ko-KR")}
          />
        </tbody>
      </table>
    </div>
  );
}

function BriefingBlock({ result }: { result: GenerationResult }) {
  const [expanded, setExpanded] = useState(true);
  const b = result.briefing;

  return (
    <div className="px-6 py-5 border-b border-gov-gray-200">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1 h-4 bg-gov-navy" />
        <h3 className="font-semibold text-gov-gray-800 text-sm">지역 브리핑</h3>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="ml-auto text-xs text-gov-gray-500 hover:text-gov-navy no-print"
        >
          {expanded ? "접기 ▲" : "펼치기 ▼"}
        </button>
      </div>

      {expanded && (
        <div className="space-y-3 text-sm">
          {b.summary && (
            <BriefingItem label="요약" text={b.summary} />
          )}
          {b.demographics && (
            <BriefingItem label="인구·경제 특성" text={b.demographics} />
          )}
          {b.keyIssues.length > 0 && (
            <BriefingList label="핵심 현안" items={b.keyIssues} />
          )}
          {b.opportunities.length > 0 && (
            <BriefingList label="기회 요인" items={b.opportunities} />
          )}
          {b.recentNews.length > 0 && (
            <BriefingList label="최근 이슈 (웹 검색 기반)" items={b.recentNews} />
          )}
          {b.sources.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gov-gray-600 mb-1">
                참고 출처
              </div>
              <ul className="text-[11px] space-y-0.5 pl-3 border-l-2 border-gov-gray-200">
                {b.sources.slice(0, 6).map((s, i) => (
                  <li key={i} className="truncate">
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-gov-navy hover:underline"
                    >
                      [{i + 1}] {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BriefingItem({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <div className="text-xs font-semibold text-gov-gray-600 mb-1">{label}</div>
      <p className="text-gov-gray-700 leading-relaxed pl-3 border-l-2 border-gov-gray-200">
        {text}
      </p>
    </div>
  );
}

function BriefingList({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <div className="text-xs font-semibold text-gov-gray-600 mb-1">{label}</div>
      <ul className="pl-3 border-l-2 border-gov-gray-200 space-y-1">
        {items.map((it, i) => (
          <li key={i} className="text-gov-gray-700 text-[13px] leading-relaxed">
            · {it}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PledgesBlock({ pledges }: { pledges: Pledge[] }) {
  return (
    <div className="px-6 py-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-4 bg-gov-navy" />
        <h3 className="font-semibold text-gov-gray-800 text-sm">
          제안 공약 ({pledges.length}건)
        </h3>
      </div>

      <ol className="space-y-4">
        {pledges.map((p, idx) => (
          <PledgeCard key={idx} pledge={p} index={idx + 1} />
        ))}
      </ol>
    </div>
  );
}

function PledgeCard({ pledge, index }: { pledge: Pledge; index: number }) {
  return (
    <li className="border border-gov-gray-200 bg-white">
      <div className="flex">
        <div className="bg-gov-navy text-white font-bold text-sm px-3 py-4 flex flex-col items-center justify-start min-w-[3.5rem]">
          <div>{String(index).padStart(2, "0")}</div>
          <div className="mt-1 text-[9px] font-normal tracking-tighter text-white/70 text-center leading-tight">
            {pledge.category}
          </div>
        </div>
        <div className="flex-1 px-4 py-3">
          <div className="font-bold text-gov-gray-800 text-[15px]">
            {pledge.title}
          </div>
          {pledge.summary && (
            <div className="text-sm text-gov-gray-600 mt-1 leading-relaxed">
              {pledge.summary}
            </div>
          )}

          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* 필요성 */}
            <DetailBox label="필요성" tone="navy">
              <p className="text-[13px] text-gov-gray-700 leading-relaxed">
                {pledge.rationale}
              </p>
            </DetailBox>

            {/* 예산 */}
            {pledge.budget && (
              <DetailBox label="예산 규모">
                <p className="text-[13px] text-gov-gray-700 leading-relaxed">
                  {pledge.budget}
                </p>
              </DetailBox>
            )}

            {/* 실행 단계 */}
            {pledge.execution.length > 0 && (
              <DetailBox label="실행 단계" span>
                <ul className="text-[13px] text-gov-gray-700 space-y-1">
                  {pledge.execution.map((e, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-gov-navy font-semibold">{i + 1}.</span>
                      <span className="flex-1">{e}</span>
                    </li>
                  ))}
                </ul>
              </DetailBox>
            )}

            {/* KPI */}
            {pledge.kpi.length > 0 && (
              <DetailBox label="성과 지표 (KPI)">
                <ul className="text-[13px] text-gov-gray-700 space-y-0.5">
                  {pledge.kpi.map((k, i) => (
                    <li key={i}>· {k}</li>
                  ))}
                </ul>
              </DetailBox>
            )}

            {/* 리스크 */}
            {pledge.risks.length > 0 && (
              <DetailBox label="리스크·제약">
                <ul className="text-[13px] text-gov-gray-700 space-y-0.5">
                  {pledge.risks.map((r, i) => (
                    <li key={i}>· {r}</li>
                  ))}
                </ul>
              </DetailBox>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

function DetailBox({
  label,
  children,
  tone,
  span,
}: {
  label: string;
  children: React.ReactNode;
  tone?: "navy";
  span?: boolean;
}) {
  return (
    <div
      className={`border border-gov-gray-200 bg-gov-gray-50/50 ${
        span ? "md:col-span-2" : ""
      }`}
    >
      <div
        className={`px-3 py-1 text-[10px] font-bold tracking-wider border-b border-gov-gray-200 ${
          tone === "navy"
            ? "bg-gov-navy text-white"
            : "bg-gov-gray-100 text-gov-gray-600"
        }`}
      >
        {label}
      </div>
      <div className="px-3 py-2">{children}</div>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <tr className="border-b border-gov-gray-200 last:border-0">
      <td className="py-1.5 pr-3 text-gov-gray-500 w-28 align-top">{label}</td>
      <td className="py-1.5 text-gov-gray-800 font-medium">{value}</td>
    </tr>
  );
}

// ──── 라벨 헬퍼 ────
function partyKoreanLabel(p: string): string {
  const map: Record<string, string> = {
    unspecified: "미지정",
    progressive: "진보",
    "center-left": "중도진보",
    center: "중도",
    "center-right": "중도보수",
    conservative: "보수",
    independent: "무소속·시민후보",
  };
  return map[p] || p;
}

function interestLabel(k: string): string {
  const map: Record<string, string> = {
    transport: "교통·도시인프라",
    housing: "주거·부동산",
    education: "교육·보육",
    welfare: "복지·의료",
    economy: "경제·일자리",
    environment: "환경·기후",
    safety: "안전·치안",
    culture: "문화·관광",
    digital: "디지털·행정혁신",
  };
  return map[k] || k;
}

function demographicLabel(k: string): string {
  const map: Record<string, string> = {
    youth: "청년(20~30대)",
    middle: "중장년(40~50대)",
    senior: "노인(60대+)",
    smallbiz: "자영업자·소상공인",
    parents: "학부모·육아세대",
    women: "여성",
  };
  return map[k] || k;
}
