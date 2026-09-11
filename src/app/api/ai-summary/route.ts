import { repository } from "@/lib/data/repository";
import { buildPrompt, DEFAULT_TONE, pickFeaturedFamous } from "@/lib/famous";

export const dynamic = "force-dynamic";

const BASE_URL =
  process.env.NVIDIA_BASE_URL ?? "https://integrate.api.nvidia.com/v1";
const MODEL = process.env.NVIDIA_MODEL ?? "nvidia/nemotron-3.5-lightning-30b-a3b";
const TIMEOUT_MS = 30_000;

export async function GET(request: Request) {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "NVIDIA_API_KEY가 설정되지 않았습니다." },
      { status: 503 },
    );
  }

  const url = new URL(request.url);
  const clanId = url.searchParams.get("clanId");
  if (!clanId) {
    return Response.json({ error: "clanId가 필요합니다." }, { status: 400 });
  }
  const tone = url.searchParams.get("tone") ?? DEFAULT_TONE;

  try {
    const detail = await repository.getClan(decodeURIComponent(clanId));
    if (!detail) {
      return Response.json({ error: "본관을 찾을 수 없습니다." }, { status: 404 });
    }
    const featuredName = pickFeaturedFamous(detail.id);

    const nvidiaRes = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: buildPrompt(detail, tone, [], featuredName) }],
      temperature: 0.9,
      top_p: 0.95,
      max_tokens: 300,
      stream: true,
      chat_template_kwargs: { thinking: false },
    }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!nvidiaRes.ok) {
      return Response.json(
        { error: `NVIDIA API 오류 (${nvidiaRes.status})` },
        { status: 502 },
      );
    }

    return new Response(nvidiaRes.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (e) {
    const name = (e as Error).name;
    if (name === "TimeoutError" || name === "AbortError") {
      return Response.json({ error: "AI 응답 시간 초과" }, { status: 504 });
    }
    return Response.json(
      { error: "AI 요약 생성에 실패했습니다." },
      { status: 502 },
    );
  }
}
