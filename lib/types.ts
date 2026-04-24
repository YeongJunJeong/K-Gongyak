import type { Customization } from "@/data/customization";

export type PledgeCategory =
  | "교통·인프라"
  | "주거"
  | "교육"
  | "복지·의료"
  | "경제·일자리"
  | "환경"
  | "안전"
  | "문화·관광"
  | "디지털·행정"
  | "기타";

export interface Pledge {
  category: PledgeCategory;
  title: string;
  summary: string;              // 1문장 핵심 요약
  rationale: string;            // 필요성 1~2문장 (지역 근거 포함)
  execution: string[];          // 실행 단계 (2~3개)
  budget: string;               // 예산 규모 추정 (문자열, 예: "약 450억원 / 임기 4년")
  kpi: string[];                // 성과 지표 1~3개
  risks: string[];              // 리스크/제약 1~2개
}

export interface GenerationRequest {
  provinceName: string;
  subdivisionName?: string;
  candidacyLabel: string;
  candidacyCategory: string;
  customization: Customization;
}

export interface BriefingResult {
  summary: string;                  // 지역 요약
  demographics: string;             // 인구·통계 특성
  keyIssues: string[];              // 핵심 현안 리스트
  opportunities: string[];          // 기회 요인
  recentNews: string[];             // 최근 뉴스/이슈 (있을 때만)
  sources: { title: string; url: string }[]; // 웹 검색 소스
}

export interface GenerationResult {
  briefing: BriefingResult;
  pledges: Pledge[];
  meta: {
    region: string;
    candidacy: string;
    category: string;
    model: string;
    webSearchUsed: boolean;
    generatedAt: string;
    customization: Customization;
  };
}
