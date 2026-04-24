import OpenAI from "openai";
import type { BriefingResult, Pledge } from "./types";
import {
  type Customization,
  getDemographicLabels,
  getInterestLabels,
  getPartyLabel,
} from "@/data/customization";

const PLEDGE_SYSTEM_PROMPT = `당신은 대한민국 지방선거 전략 컨설턴트입니다.
주어진 지역 브리핑·직위·후보자 성향을 바탕으로, **타 지역에 복사 불가능한** 차별화된 공약을 설계합니다.

==================== 절대 원칙 ====================

[A] 지역 고정 & 구체성
- 지정된 지역에 대해서만 공약 작성. 다른 지역명 등장 금지.
- 각 공약의 title 또는 rationale에 **해당 지역 고유명사(동·역·하천·공원·시장·대학·기업·축제·학교·도로 등) 최소 1개** 포함.
- 구체 수치(호수·명·억원·km·%·년도)를 적극 활용.

[B] 금지 표현 (어느 지역에나 통용되는 일반 슬로건 금지)
- "일자리 창출", "복지 확대", "교통 개선", "스마트시티 조성", "지역 경제 활성화",
  "주거 안정", "교육 환경 개선", "문화·관광 활성화", "시민 참여 확대" — 이런 밋밋한 제목 금지.
- 반드시 특정 장소·대상·방식을 명시해 차별화할 것.

[C] 직위 권한 범위 준수
- 광역단체장: 광역 교통망·도시계획·광역경제·재정·환경. 기초 단위 미시 정책 금지.
- 광역의원: 조례 제정·예산 심의·광역 감시. 집행 공약(신설·공급) 금지.
- 기초단체장: 구·시·군 생활밀착(동 단위 시설, 가로정비, 주차, 공원 등).
- 기초의원: 기초 조례·예산 심의·마을 단위 민원. 거대 인프라 금지.
- 교육감: 초·중·고 교육 행정·시설·교직원·방과후. 대학/치안/주택/교통 언급 금지.

[D] 후보자 성향 반영
- 정당 성향·핵심 관심사·타겟 유권자층·차별화 포인트를 공약 선정과 프레이밍에 반영.
- 단, 지역의 실제 필요를 벗어난 "성향 전시성" 공약은 지양.

[E] 공약 구조 (각 공약마다 아래 필드 전부)
- category: 교통·인프라 / 주거 / 교육 / 복지·의료 / 경제·일자리 / 환경 / 안전 / 문화·관광 / 디지털·행정 / 기타 중 택 1
- title: 20자 내외, 동사형·결론형. "[구체 장소·대상] [구체 행동·수치]"
- summary: 1문장. 공약의 핵심을 독자가 바로 이해 가능하게.
- rationale: 1~2문장. 이 지역의 구체 현황(브리핑 기반)을 근거로 필요성 제시.
- execution: 2~3개의 실행 단계 (각각 "시점: 행동" 형태, 예: "2026~2027: 타당성 조사 및 기본계획 수립")
- budget: 총 예산 추정 (예: "총 약 450억원 / 임기 4년" 또는 "연간 약 30억원")
- kpi: 1~3개 성과 지표 (정량)
- risks: 1~2개 리스크 또는 제약 요인

[F] 다양성
- 총 8~10개 공약. 카테고리가 한쪽에 쏠리지 않게 분배.
- 대형 정책(임팩트 큰) 3~4개 + 중형 2~3개 + 소형(생활밀착) 2~3개로 구성.

==================== 응답 형식 ====================

반드시 다음 JSON 스키마를 따르세요:
{
  "pledges": [
    {
      "category": "교통·인프라",
      "title": "...",
      "summary": "...",
      "rationale": "...",
      "execution": ["1단계: ...", "2단계: ..."],
      "budget": "...",
      "kpi": ["..."],
      "risks": ["..."]
    }
  ]
}`;

export async function generatePledges(params: {
  client: OpenAI;
  model: string;
  region: string;
  candidacyLabel: string;
  candidacyCategory: string;
  briefing: BriefingResult;
  customization: Customization;
}): Promise<Pledge[]> {
  const { client, model, region, candidacyLabel, candidacyCategory, briefing, customization } = params;

  const interests = customization.interests.length
    ? getInterestLabels(customization.interests).join(", ")
    : "(지정 없음 — 균형 배분)";
  const demographics = customization.demographics.length
    ? getDemographicLabels(customization.demographics).join(", ")
    : "(지정 없음 — 전 세대 균형)";
  const party = getPartyLabel(customization.party);
  const differentiator = customization.differentiator?.trim()
    ? customization.differentiator.trim()
    : "(없음)";

  const userPrompt = `[지역] ${region}
[출마 직위] ${candidacyLabel}
[대분류] ${candidacyCategory}
[선거] 제9회 전국동시지방선거 (2026년 6월 3일)

[후보자 프로필]
- 정당 성향: ${party}
- 핵심 관심사: ${interests}
- 타겟 유권자층: ${demographics}
- 차별화 포인트: ${differentiator}

[지역 브리핑]
요약: ${briefing.summary}
인구·경제 특성: ${briefing.demographics}
핵심 현안:
${briefing.keyIssues.map((i, idx) => `  ${idx + 1}. ${i}`).join("\n")}
기회 요인:
${briefing.opportunities.map((o, idx) => `  ${idx + 1}. ${o}`).join("\n")}
${
  briefing.recentNews.length
    ? `최근 이슈:\n${briefing.recentNews.map((n, idx) => `  ${idx + 1}. ${n}`).join("\n")}`
    : ""
}

위 브리핑과 후보자 프로필을 바탕으로, ${region}의 ${candidacyLabel}에게 **정말로 필요한** 공약 8~10개를 설계하세요.
- 타 지역에 복붙 불가능하도록 ${region}의 고유명사를 적극 활용
- 직위 권한 범위 준수
- 후보자 성향과 관심사 반영
- 각 공약에 예산·실행단계·KPI·리스크 전부 포함`;

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.65,
    max_tokens: 4000,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: PLEDGE_SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("공약 응답이 비어있습니다.");

  const parsed = JSON.parse(raw) as { pledges?: Pledge[] };
  if (!Array.isArray(parsed.pledges)) {
    throw new Error("공약 응답 형식이 올바르지 않습니다.");
  }

  return parsed.pledges.map((p) => ({
    category: p.category ?? "기타",
    title: p.title ?? "",
    summary: p.summary ?? "",
    rationale: p.rationale ?? "",
    execution: Array.isArray(p.execution) ? p.execution : [],
    budget: p.budget ?? "",
    kpi: Array.isArray(p.kpi) ? p.kpi : [],
    risks: Array.isArray(p.risks) ? p.risks : [],
  }));
}

// ==================== Stage 3: 검증/정교화 ====================

const REFINE_SYSTEM_PROMPT = `당신은 대한민국 지방선거 공약 감수관입니다.
주어진 공약 초안을 검토하고, 다음 기준으로 재작성합니다:

[검증 체크리스트]
1. 해당 지역 고유명사가 포함되어 있는가? (없으면 지역 고유명사로 교체)
2. "일자리 창출", "복지 확대" 같은 일반 슬로건이 아닌가? (있으면 구체화)
3. 출마 직위의 권한 범위 안인가? (벗어난 공약은 범위 내로 축소·재설계)
4. 예산·KPI·리스크가 현실적인가? (부풀려진 수치는 조정)
5. 카테고리가 한쪽에 쏠려 있진 않은가? (그렇다면 재분배)
6. 8~10개 유지. 부실하거나 중복되는 공약은 교체 또는 통합.

[원칙]
- 초안의 좋은 부분은 유지하되, 밋밋한 부분을 날카롭게 다듬는다.
- 지역 고유명사와 구체 수치를 최대한 강화한다.
- 출력 형식은 초안과 동일 (category, title, summary, rationale, execution, budget, kpi, risks).

반드시 다음 JSON 스키마를 따르세요:
{ "pledges": [ ... 8~10개 ] }`;

export async function refinePledges(params: {
  client: OpenAI;
  model: string;
  region: string;
  candidacyLabel: string;
  candidacyCategory: string;
  draft: Pledge[];
}): Promise<Pledge[]> {
  const { client, model, region, candidacyLabel, candidacyCategory, draft } = params;

  const userPrompt = `[지역] ${region}
[직위] ${candidacyLabel} (${candidacyCategory})

[공약 초안]
${JSON.stringify({ pledges: draft }, null, 2)}

위 초안을 감수 원칙에 따라 정교화하여 JSON으로 반환하세요.
- 밋밋한 제목은 ${region} 고유명사·수치로 구체화
- 직위 권한 벗어난 공약은 축소/재설계
- 카테고리 분포가 편중되면 재배치
- 8~10개 유지`;

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.4,
    max_tokens: 4000,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: REFINE_SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("검증 응답이 비어있습니다.");

  const parsed = JSON.parse(raw) as { pledges?: Pledge[] };
  if (!Array.isArray(parsed.pledges) || parsed.pledges.length === 0) {
    // 검증 실패 시 초안 그대로 반환
    return draft;
  }

  return parsed.pledges.map((p) => ({
    category: p.category ?? "기타",
    title: p.title ?? "",
    summary: p.summary ?? "",
    rationale: p.rationale ?? "",
    execution: Array.isArray(p.execution) ? p.execution : [],
    budget: p.budget ?? "",
    kpi: Array.isArray(p.kpi) ? p.kpi : [],
    risks: Array.isArray(p.risks) ? p.risks : [],
  }));
}
