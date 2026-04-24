import OpenAI from "openai";
import type { BriefingResult } from "./types";
import { formatHitsForPrompt, type WebSearchHit } from "./tavily";

const BRIEFING_SYSTEM_PROMPT = `당신은 대한민국 지역 정책 분석가입니다.
주어진 지역에 대해, 공약 설계에 필요한 핵심 브리핑을 작성합니다.

원칙:
- 반드시 지정된 지역에 대해서만 작성. 다른 지역 혼동 금지.
- 웹 검색 결과가 제공된 경우, 그 내용을 최대한 반영하되 허위 정보는 배제.
- 구체 지명·숫자·기관·기업·사건명을 풍부하게 포함.
- 일반론 금지. "인구가 많다", "교통이 혼잡하다" 같은 밋밋한 표현 대신 "○○동 인구 밀집률 ○○%, ○○도로 출퇴근 혼잡" 형태로.
- 웹 검색 결과가 없는 경우에는 당신이 알고 있는 공공 정보(학습된 지식)를 활용.

응답은 반드시 다음 JSON 스키마를 따르세요:
{
  "summary": "2~3문장. 이 지역의 정체성·위상·포지션을 한 눈에 보여주는 요약",
  "demographics": "인구 규모·구성·고령화·유입유출·소득·주요 업종 등 특징. 2~3문장.",
  "keyIssues": [
    "현안 1 (구체적인 장소·사안·원인 포함, 1문장)",
    "현안 2",
    // 4~6개
  ],
  "opportunities": [
    "기회 요인 1 (성장동력·자원·인프라·사업 등, 1문장)",
    // 2~4개
  ],
  "recentNews": [
    "최근 이슈 1 (웹검색 결과 기반, 1문장)",
    // 0~5개. 웹검색 결과가 없으면 빈 배열
  ]
}`;

export async function generateBriefing(params: {
  client: OpenAI;
  model: string;
  region: string;
  candidacyLabel: string;
  webHits: WebSearchHit[];
}): Promise<BriefingResult> {
  const { client, model, region, candidacyLabel, webHits } = params;

  const userPrompt = `[지역] ${region}
[출마 직위 컨텍스트] ${candidacyLabel}

[웹 검색 결과]
${formatHitsForPrompt(webHits)}

위 지역에 대한 공약 설계용 브리핑을 JSON 형식으로 작성하세요.
"${region}"에 대해서만 작성하고, 다른 지역 내용을 섞지 마세요.`;

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.4,
    max_tokens: 1800,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: BRIEFING_SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("브리핑 응답이 비어있습니다.");

  const parsed = JSON.parse(raw) as Partial<BriefingResult>;

  return {
    summary: parsed.summary ?? "",
    demographics: parsed.demographics ?? "",
    keyIssues: Array.isArray(parsed.keyIssues) ? parsed.keyIssues : [],
    opportunities: Array.isArray(parsed.opportunities) ? parsed.opportunities : [],
    recentNews: Array.isArray(parsed.recentNews) ? parsed.recentNews : [],
    sources: webHits.map((h) => ({ title: h.title, url: h.url })),
  };
}
