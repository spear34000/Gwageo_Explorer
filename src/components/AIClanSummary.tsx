"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Capacitor } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { useAIStream } from "@/hooks/useAIStream";

const TONES = ["memes", "friend", "docu", "hype"] as const;
const EXAM_CHIPS = [
  { key: "mun", label: "문과" },
  { key: "mu", label: "무과" },
  { key: "saengwon", label: "생원" },
  { key: "jinsa", label: "진사" },
] as const;

const GOLD = "#c5a55a";
const DARK = "#141220";
const CREAM = "#e8dcc8";
const MUTED = "#a89878";
const FAINT = "#5a5478";

function pickTone(exclude?: string): string {
  const pool = TONES.filter((t) => t !== exclude);
  return pool[Math.floor(Math.random() * pool.length)];
}

function ratingFromRank(rank: number): { stars: string; label: string } {
  if (rank <= 1) return { stars: "★★★★★", label: "조선 과거의 전설" };
  if (rank <= 10) return { stars: "★★★★☆", label: "왕이 아는 집안" };
  if (rank <= 100) return { stars: "★★★★☆", label: "과거 단골손님" };
  if (rank <= 500) return { stars: "★★★☆☆", label: "꾸준히 등장하는 집안" };
  if (rank <= 2000) return { stars: "★★☆☆☆", label: "가끔 반짝이는 집안" };
  return { stars: "★☆☆☆☆", label: "희귀 기록의 집안" };
}

interface AIClanSummaryProps {
  clanId: string;
  clanName: string;
  rank: number;
  stats: { total: number; mun: number; mu: number; saengwon: number; jinsa: number };
  onStreamStart?: () => void;
}

export default function AIClanSummary({
  clanId,
  clanName,
  rank,
  stats,
  onStreamStart,
}: AIClanSummaryProps) {
  const posterRef = useRef<HTMLDivElement>(null);
  const [tone, setTone] = useState<string>(() => pickTone());
  const { displayedText, thinking, punchline, summary, failed, refresh } = useAIStream(
    clanId,
    tone,
    onStreamStart,
  );
  const [sharing, setSharing] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const rating = ratingFromRank(rank);

  const regenerate = () => {
    refresh();
    setTone(pickTone(tone));
  };

  const saveAsImage = async () => {
    if (!posterRef.current || sharing) return;
    setSharing(true);
    setShareFeedback(null);
    try {
      const dataUrl = await Promise.race([
        toPng(posterRef.current, {
          pixelRatio: 2,
          cacheBust: true,
          skipFonts: true,
          backgroundColor: DARK,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("image generation timed out")), 20_000),
        ),
      ]);
      const filename = `${clanName.replace(/[\\/:*?"<>|]/g, "-")}-ai-review.png`;
      if (Capacitor.isNativePlatform()) {
        const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
        await Filesystem.writeFile({
          path: filename,
          data: base64,
          directory: Directory.Documents,
          recursive: true,
        });
      } else {
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = filename;
        link.click();
      }
      setShareFeedback("저장 완료!");
      setTimeout(() => setShareFeedback(null), 2500);
    } catch (e) {
      console.error("[AI] toPng failed", e);
      setShareFeedback("저장 실패");
    } finally {
      setSharing(false);
    }
  };

  const showText = summary ?? displayedText;

  return (
    <section aria-label="AI 본관 리뷰">
      <div className="flex w-full justify-center">
        <div
          ref={posterRef}
          style={{ background: DARK }}
          className="flex aspect-square w-full max-w-[512px] flex-col p-3"
        >
          <div
            style={{ border: `2px solid ${GOLD}` }}
            className="relative flex flex-1 flex-col justify-center overflow-hidden px-8 py-6"
          >
            <span className="absolute top-0 left-0 block size-2 -translate-x-1 -translate-y-1 rounded-full" style={{ background: GOLD }} />
            <span className="absolute top-0 right-0 block size-2 translate-x-1 -translate-y-1 rounded-full" style={{ background: GOLD }} />
            <span className="absolute bottom-0 left-0 block size-2 -translate-x-1 translate-y-1 rounded-full" style={{ background: GOLD }} />
            <span className="absolute bottom-0 right-0 block size-2 translate-x-1 translate-y-1 rounded-full" style={{ background: GOLD }} />

            <p style={{ color: MUTED }} className="text-center text-xs tracking-[0.25em]">
              본관으로 찾는 조선 과거 기록
            </p>

            <p style={{ color: GOLD }} className="font-display mt-3 text-center text-3xl font-bold">
              {clanName}
            </p>

            <div style={{ borderColor: GOLD }} className="my-5 flex items-center gap-3">
              <div style={{ borderTop: `1px solid ${GOLD}` }} className="flex-1" />
              <span style={{ color: GOLD }} className="text-sm">{rating.stars}</span>
              <div style={{ borderTop: `1px solid ${GOLD}` }} className="flex-1" />
            </div>

            <p style={{ color: CREAM }} className="text-center text-sm">
              {rating.label} · 전체 {rank.toLocaleString("ko-KR")}위
            </p>

            {showText ? (
              <>
                {punchline && (
                  <p style={{ color: CREAM }} className="font-display mt-4 text-center text-lg font-bold leading-snug">
                    {punchline}
                  </p>
                )}
                <p style={{ color: CREAM }} className="mt-4 text-center text-sm leading-relaxed">
                  {summary ?? showText}
                  {!summary && displayedText && (
                    <span className="inline-block size-2 animate-pulse rounded-full align-middle" style={{ background: GOLD, marginLeft: 4 }} aria-hidden />
                  )}
                </p>
              </>
            ) : (
              <p style={{ color: FAINT }} className="mt-4 flex items-center justify-center gap-2 text-center text-sm">
                <span className="size-3 animate-spin rounded-full border-2 border-current border-t-transparent" style={{ borderColor: `${FAINT} transparent ${FAINT} ${FAINT}` }} aria-hidden />
                {thinking ? "응답을 조회하는 중..." : "응답을 조회하는 중..."}
              </p>
            )}

            <div className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-1">
              {EXAM_CHIPS.map((chip) => (
                <span key={chip.key} style={{ color: MUTED }} className="text-xs">
                  {chip.label}{" "}
                  <span style={{ color: CREAM }} className="font-semibold tabular-nums">
                    {stats[chip.key as keyof typeof stats].toLocaleString("ko-KR")}
                  </span>
                </span>
              ))}
            </div>
          </div>

          <p style={{ color: FAINT }} className="mt-3 text-center text-[11px]">
            과거탐색기 · AI가 재미로 쓴 요약 · 사실 확인용이 아닙니다
          </p>
        </div>
      </div>

      <div className="mx-auto mt-3 flex w-full max-w-[512px]">
        <button
          type="button"
          onClick={saveAsImage}
          disabled={sharing}
          style={{ background: sharing ? MUTED : GOLD, color: DARK, fontWeight: 700 }}
          className="w-full px-5 py-2.5 text-sm"
        >
          {sharing ? "저장 중..." : "사진으로 저장하기"}
        </button>
      </div>

      {shareFeedback && (
        <p style={{ color: GOLD }} className="mt-2 text-center text-xs">
          {shareFeedback}
        </p>
      )}

      <div className="mt-3 text-center">
        <button
          type="button"
          onClick={regenerate}
          style={{ color: MUTED, borderColor: FAINT }}
          className="border px-4 py-2 text-xs"
        >
          새 요약
        </button>
      </div>

      {failed && (
        <p style={{ color: MUTED }} className="mt-2 text-center text-xs">
          AI 리뷰를 불러오지 못했습니다. &quot;새 요약&quot;을 눌러 다시 시도해 주세요.
        </p>
      )}
    </section>
  );
}
