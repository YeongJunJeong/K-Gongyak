import type { Province } from "./regions";

export type CandidacyCategory =
  | "광역단체장"
  | "광역의원"
  | "기초단체장"
  | "기초의원"
  | "교육감";

export interface CandidacyOption {
  category: CandidacyCategory;
  label: string;         // 화면 표시용
  value: string;         // 내부 식별자
  scope: "광역" | "기초"; // 관할 범위
}

export const CATEGORIES: {
  value: CandidacyCategory;
  label: string;
  description: string;
  glyph: string; // 짧은 기호/약어
}[] = [
  {
    value: "광역단체장",
    label: "광역단체장",
    description: "시·도지사",
    glyph: "廣長",
  },
  {
    value: "광역의원",
    label: "광역의원",
    description: "시·도의회",
    glyph: "廣議",
  },
  {
    value: "기초단체장",
    label: "기초단체장",
    description: "구청장·시장·군수",
    glyph: "基長",
  },
  {
    value: "기초의원",
    label: "기초의원",
    description: "구·시·군의회",
    glyph: "基議",
  },
  {
    value: "교육감",
    label: "교육감",
    description: "시·도 교육감",
    glyph: "教育",
  },
];

/**
 * 선택된 광역/기초 지역과 대분류에 맞는 세부 출마유형 목록을 반환합니다.
 */
export function getSubtypes(
  category: CandidacyCategory,
  province: Province | undefined,
  subdivisionName: string | undefined
): CandidacyOption[] {
  if (!province) return [];

  switch (category) {
    case "광역단체장": {
      const label = getProvinceHeadLabel(province);
      return [
        {
          category,
          label,
          value: `광역단체장:${label}`,
          scope: "광역",
        },
      ];
    }

    case "광역의원": {
      return [
        {
          category,
          label: `${province.short} 지역구 광역의원`,
          value: "광역의원:지역구",
          scope: "광역",
        },
        {
          category,
          label: `${province.short} 비례대표 광역의원`,
          value: "광역의원:비례",
          scope: "광역",
        },
      ];
    }

    case "기초단체장": {
      if (province.subdivisions.length === 0) {
        // 세종특별자치시는 기초자치단체가 없음
        return [];
      }
      if (!subdivisionName) return [];
      const sub = province.subdivisions.find((s) => s.name === subdivisionName);
      if (!sub) return [];
      const label = subTypeToHeadLabel(sub.type, subdivisionName);
      if (!label) return [];
      return [
        {
          category,
          label,
          value: `기초단체장:${label}`,
          scope: "기초",
        },
      ];
    }

    case "기초의원": {
      if (province.subdivisions.length === 0) return [];
      if (!subdivisionName) return [];
      const sub = province.subdivisions.find((s) => s.name === subdivisionName);
      if (!sub) return [];
      if (sub.type === "행정시") return []; // 제주 행정시는 기초의회 없음
      return [
        {
          category,
          label: `${subdivisionName} 지역구 기초의원`,
          value: "기초의원:지역구",
          scope: "기초",
        },
        {
          category,
          label: `${subdivisionName} 비례대표 기초의원`,
          value: "기초의원:비례",
          scope: "기초",
        },
      ];
    }

    case "교육감": {
      return [
        {
          category,
          label: `${province.short} 교육감`,
          value: "교육감",
          scope: "광역",
        },
      ];
    }
  }
}

function getProvinceHeadLabel(p: Province): string {
  switch (p.type) {
    case "특별시":
      return `${p.name.replace(/특별시$/, "")} 특별시장`;
    case "광역시":
      return `${p.name.replace(/광역시$/, "")} 광역시장`;
    case "특별자치시":
      return `${p.name.replace(/특별자치시$/, "")} 특별자치시장`;
    case "특별자치도":
      return `${p.name.replace(/특별자치도$/, "")} 특별자치도지사`;
    case "도":
      return `${p.name.replace(/도$/, "")}도지사`;
  }
}

function subTypeToHeadLabel(
  type: "자치구" | "시" | "군" | "행정시" | "없음",
  name: string
): string | null {
  switch (type) {
    case "자치구":
      return `${name}청장`;
    case "시":
      return `${name}장`;
    case "군":
      return `${name}수`;
    case "행정시":
      // 제주의 행정시장은 임명직이라 선거 대상 아님
      return null;
    default:
      return null;
  }
}

/**
 * 카테고리가 기초자치 수준인지 (즉 시군구 선택이 필요한지) 판단
 */
export function requiresSubdivision(category: CandidacyCategory): boolean {
  return category === "기초단체장" || category === "기초의원";
}
