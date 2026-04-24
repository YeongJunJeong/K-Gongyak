// Tavily 웹 검색 API 래퍼
// 키가 없으면 자동으로 빈 결과를 반환하여 웹검색 단계를 스킵합니다.

export interface WebSearchHit {
  title: string;
  url: string;
  content: string;           // 스니펫
  publishedDate?: string;
}

export interface WebSearchResult {
  hits: WebSearchHit[];
  used: boolean;             // 실제로 검색을 수행했는지
  reason?: string;           // 미수행 시 사유
}

const TAVILY_ENDPOINT = "https://api.tavily.com/search";

export async function searchRegion(params: {
  region: string;
  candidacy: string;
}): Promise<WebSearchResult> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    return {
      hits: [],
      used: false,
      reason: "TAVILY_API_KEY 미설정 (웹검색 비활성화)",
    };
  }

  // 다양한 각도로 한 번에 묶어 질의
  const query = `${params.region} 주요 현안 및 이슈 2025 2026 (${params.candidacy} 관점) 지역 문제점 인구 경제 교통 부동산 교육`;

  try {
    const res = await fetch(TAVILY_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: "advanced",
        include_answer: false,
        max_results: 8,
        topic: "general",
      }),
      // Next.js 엣지/노드 fetch 캐시 방지
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      return {
        hits: [],
        used: false,
        reason: `Tavily API 오류 (${res.status}): ${text.slice(0, 200)}`,
      };
    }

    const data = (await res.json()) as {
      results?: {
        title?: string;
        url?: string;
        content?: string;
        published_date?: string;
      }[];
    };

    const hits: WebSearchHit[] = (data.results || [])
      .filter((r) => r.title && r.url)
      .slice(0, 8)
      .map((r) => ({
        title: r.title || "",
        url: r.url || "",
        content: (r.content || "").slice(0, 600),
        publishedDate: r.published_date,
      }));

    return { hits, used: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    return {
      hits: [],
      used: false,
      reason: `Tavily 호출 실패: ${message}`,
    };
  }
}

export function formatHitsForPrompt(hits: WebSearchHit[]): string {
  if (hits.length === 0) return "(웹 검색 결과 없음)";
  return hits
    .map(
      (h, i) =>
        `[${i + 1}] ${h.title}${h.publishedDate ? ` (${h.publishedDate})` : ""}\n   URL: ${h.url}\n   ${h.content}`
    )
    .join("\n\n");
}
