import { repository } from "@/lib/data/repository";
import { formatNumber } from "@/lib/format";
import { EXAM_COLUMN_LABELS, EXAM_TYPE_ORDER } from "@/lib/data/types";
import type { ClanDetail } from "@/lib/data/types";

export const dynamic = "force-dynamic";

const BASE_URL =
  process.env.NVIDIA_BASE_URL ?? "https://integrate.api.nvidia.com/v1";
const MODEL = process.env.NVIDIA_MODEL ?? "nvidia/nemotron-3.5-lightning-30b-a3b";
const TIMEOUT_MS = 30_000;

const TONE_INSTRUCTIONS: Record<string, string> = {
  memes: "허무·병맛 평결. 진지한 감정(鑑定)처럼 시작해 엉뚱한 결론으로 떨어지는 반전",
  friend: "친구가 소개해 주듯 편한 서술체. 단 대화가 아닌 평론 문장",
  docu: "역사 다큐멘터리 나레이션 체. 장엄하게 시작해 병맛으로 귀결",
  hype: "스포츠 중계 캐스터 체. 수치를 실황 해설처럼 전달",
};

const DEFAULT_TONE = "memes";

function buildPrompt(detail: ClanDetail, tone: string): string {
  const toneInstruction =
    TONE_INSTRUCTIONS[tone] ?? TONE_INSTRUCTIONS[DEFAULT_TONE];
  const typeLine = EXAM_TYPE_ORDER.map(
    (type) => `${EXAM_COLUMN_LABELS[type]} ${formatNumber(detail[type])}`,
  ).join(" / ");
  const topKings = detail.byKing
    .filter((k) => k.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map((k) => `${k.kingName} ${formatNumber(k.count)}건`)
    .join(", ");
  const residences = detail.residences
    .slice(0, 3)
    .map((r) => `${r.residence} ${formatNumber(r.count)}건`)
    .join(", ");

  return [
    "너는 한국 인터넷 밈 문화에 능통한 개그 작가다. 조선시대 과거시험 데이터를 가지고 '본관 리뷰'를 쓴다.",
    `작성 톤: ${toneInstruction}.`,
    "문체 규칙 (엄수):",
    "- 단정적 평론 선언체로 종결 (~다, ~임, ~체). 대화체 절대 금지",
    "- 의문문·감탄사·호칭 금지. '네,', '저는', '우리', '~인데?', '~같아' 류 대화 표현 금지",
    "- 자기 소개·사고 과정·영어·전후 설명 금지. 지시된 두 줄만 출력",
    "- 실제 수치를 반드시 1개 이상 언급하되 숫자를 왜곡하지 말 것",
    "- 마케팅 광고체·'당신의 조상'류 표현·특정 인물이나 본관 비방 금지",
    "- 병맛은 악의 없는 유머로만",
    "출력 형식 (반드시 아래 두 줄 구조):",
    "한줄평: <10~20자 내외로 임팩트 있는 한 줄>",
    "본문: <2~3문장>",
    "",
    `본관: ${detail.name}`,
    `전체 합격 기록: ${formatNumber(detail.total)}건 (전체 본관 중 ${formatNumber(detail.rank)}위)`,
    `유형별: ${typeLine}`,
    `합격자가 많은 왕: ${topKings}`,
    `주요 거주지: ${residences}`,
  ].join("\n");
}

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

    const nvidiaRes = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: buildPrompt(detail, tone) }],
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
