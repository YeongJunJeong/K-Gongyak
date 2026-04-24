import OpenAI from "openai";
import { searchRegion } from "@/lib/tavily";
import { generateBriefing } from "@/lib/briefing";
import { generatePledges, refinePledges } from "@/lib/pledges";
import type { GenerationRequest, GenerationResult } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // 최대 5분

type StreamEvent =
  | { type: "progress"; step: number; total: number; label: string }
  | { type: "result"; payload: GenerationResult }
  | { type: "error"; message: string };

function sseLine(event: StreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export async function POST(req: Request) {
  const body = (await req.json()) as GenerationRequest;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (ev: StreamEvent) =>
        controller.enqueue(encoder.encode(sseLine(ev)));

      try {
        if (!body.provinceName || !body.candidacyLabel || !body.candidacyCategory) {
          send({ type: "error", message: "필수 입력값이 누락되었습니다." });
          controller.close();
          return;
        }

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
          send({
            type: "error",
            message:
              "서버에 OPENAI_API_KEY가 설정되지 않았습니다. .env.local 파일을 확인해주세요.",
          });
          controller.close();
          return;
        }

        const client = new OpenAI({ apiKey });
        const model = process.env.OPENAI_MODEL || "gpt-4o";

        const region = body.subdivisionName
          ? `${body.provinceName} ${body.subdivisionName}`
          : body.provinceName;

        const customization = body.customization ?? {
          party: "unspecified",
          interests: [],
          demographics: [],
          differentiator: "",
        };

        // ── Step 1: 웹 검색 ─────────────────────────
        send({
          type: "progress",
          step: 1,
          total: 4,
          label: "최신 지역 현안 수집 중...",
        });

        const webResult = await searchRegion({
          region,
          candidacy: body.candidacyLabel,
        });

        // ── Step 2: 지역 브리핑 ──────────────────────
        send({
          type: "progress",
          step: 2,
          total: 4,
          label: webResult.used
            ? `검색 결과 ${webResult.hits.length}건 반영하여 지역 브리핑 작성 중...`
            : "지역 브리핑 작성 중... (웹 검색 미설정)",
        });

        const briefing = await generateBriefing({
          client,
          model,
          region,
          candidacyLabel: body.candidacyLabel,
          webHits: webResult.hits,
        });

        // ── Step 3: 공약 초안 생성 ──────────────────
        send({
          type: "progress",
          step: 3,
          total: 4,
          label: "공약 초안 설계 중...",
        });

        const draft = await generatePledges({
          client,
          model,
          region,
          candidacyLabel: body.candidacyLabel,
          candidacyCategory: body.candidacyCategory,
          briefing,
          customization,
        });

        // ── Step 4: 검증 및 정교화 ──────────────────
        send({
          type: "progress",
          step: 4,
          total: 4,
          label: "공약 검증 및 정교화 중...",
        });

        const refined = await refinePledges({
          client,
          model,
          region,
          candidacyLabel: body.candidacyLabel,
          candidacyCategory: body.candidacyCategory,
          draft,
        });

        const result: GenerationResult = {
          briefing,
          pledges: refined,
          meta: {
            region,
            candidacy: body.candidacyLabel,
            category: body.candidacyCategory,
            model,
            webSearchUsed: webResult.used,
            generatedAt: new Date().toISOString(),
            customization,
          },
        };

        send({ type: "result", payload: result });
        controller.close();
      } catch (err) {
        const message = err instanceof Error ? err.message : "알 수 없는 오류";
        send({ type: "error", message: `생성 실패: ${message}` });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
