// 사용자 커스터마이징 옵션 정의

export type PartyOrientation =
  | "unspecified"
  | "progressive"
  | "center-left"
  | "center"
  | "center-right"
  | "conservative"
  | "independent";

export const PARTY_OPTIONS: { value: PartyOrientation; label: string; hint: string }[] = [
  { value: "unspecified", label: "미지정", hint: "특정 성향 없이 균형 잡힌 공약" },
  { value: "progressive", label: "진보", hint: "분배·복지·기후·인권 강조" },
  { value: "center-left", label: "중도진보", hint: "성장과 분배 병행, 실용 좌파" },
  { value: "center", label: "중도", hint: "합의 가능·실용 중심" },
  { value: "center-right", label: "중도보수", hint: "시장·안보·재정건전성 병행" },
  { value: "conservative", label: "보수", hint: "시장경제·안보·전통가치 강조" },
  { value: "independent", label: "무소속·시민후보", hint: "정당 색채 배제, 생활밀착" },
];

export const INTERESTS = [
  { value: "transport", label: "교통·도시인프라" },
  { value: "housing", label: "주거·부동산" },
  { value: "education", label: "교육·보육" },
  { value: "welfare", label: "복지·의료" },
  { value: "economy", label: "경제·일자리" },
  { value: "environment", label: "환경·기후" },
  { value: "safety", label: "안전·치안" },
  { value: "culture", label: "문화·관광" },
  { value: "digital", label: "디지털·행정혁신" },
] as const;

export type InterestKey = (typeof INTERESTS)[number]["value"];

export const DEMOGRAPHICS = [
  { value: "youth", label: "청년 (20~30대)" },
  { value: "middle", label: "중장년 (40~50대)" },
  { value: "senior", label: "노인 (60대 이상)" },
  { value: "smallbiz", label: "자영업자·소상공인" },
  { value: "parents", label: "학부모·육아세대" },
  { value: "women", label: "여성" },
] as const;

export type DemographicKey = (typeof DEMOGRAPHICS)[number]["value"];

export interface Customization {
  party: PartyOrientation;
  interests: InterestKey[];
  demographics: DemographicKey[];
  differentiator?: string;
}

export function getInterestLabels(keys: InterestKey[]): string[] {
  return keys.map((k) => INTERESTS.find((i) => i.value === k)?.label || k);
}

export function getDemographicLabels(keys: DemographicKey[]): string[] {
  return keys.map((k) => DEMOGRAPHICS.find((d) => d.value === k)?.label || k);
}

export function getPartyLabel(p: PartyOrientation): string {
  return PARTY_OPTIONS.find((o) => o.value === p)?.label || "미지정";
}
