/* eslint-disable react-hooks/set-state-in-effect -- fetchSummary는 async 콜백에서만 setState */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const MAX_AI_TEXT_LENGTH = 420;

function limitText(text: string): string {
  if (text.length <= MAX_AI_TEXT_LENGTH) return text;
  const clipped = text.slice(0, MAX_AI_TEXT_LENGTH);
  const koreanSentenceEnd = clipped.lastIndexOf("다.");
  const punctuationEnd = Math.max(clipped.lastIndexOf("."), clipped.lastIndexOf("!"), clipped.lastIndexOf("?"));
  const sentenceEnd = koreanSentenceEnd > punctuationEnd ? koreanSentenceEnd + 1 : punctuationEnd;
  return (sentenceEnd >= 80 ? clipped.slice(0, sentenceEnd + 1) : clipped).trim();
}

function parseReview(text: string): { punchline: string; summary: string } {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const idx = lines.findIndex((l) => l.startsWith("한줄평"));
  if (idx >= 0) {
    const punchline = lines[idx].replace(/^한줄평[:：]?\s*/, "");
    const summary = lines
      .slice(idx + 1)
      .map((l) => l.replace(/^본문[:：]?\s*/, ""))
      .join(" ")
      .trim();
    return { punchline, summary: summary || punchline };
  }
  const summary = text.trim();
  return { punchline: summary.split(/[.!?]/)[0], summary };
}

export function useAIStream(
  clanId: string,
  tone: string,
  onStreamStart?: () => void,
) {
  const abortRef = useRef<AbortController | null>(null);
  const forceNextRef = useRef(false);
  const [displayedText, setDisplayedText] = useState("");
  const [thinking, setThinking] = useState(true);
  const [punchline, setPunchline] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  const fetchSummary = useCallback(
    async (t: string) => {
      const cacheKey = `ai-summary:${clanId}`;
      if (!forceNextRef.current && typeof window !== "undefined") {
        const cached = window.sessionStorage.getItem(cacheKey);
        if (cached) {
          try {
            const parsed = JSON.parse(cached) as { punchline: string; summary: string };
            setPunchline(parsed.punchline);
            setSummary(parsed.summary);
            setThinking(false);
            return;
          } catch {
            window.sessionStorage.removeItem(cacheKey);
          }
        }
      }
      forceNextRef.current = false;
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setThinking(true);
      setDisplayedText("");
      setPunchline(null);
      setSummary(null);
      setFailed(false);

      try {
        const res = await fetch(
          `/api/ai-summary?clanId=${encodeURIComponent(clanId)}&tone=${t}`,
          { signal: controller.signal },
        );
        if (!res.ok || !res.body) {
          setFailed(true);
          setThinking(false);
          onStreamStart?.();
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let contentText = "";
        let signaled = false;
        const signalStart = () => {
          if (!signaled) {
            signaled = true;
            onStreamStart?.();
          }
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done || controller.signal.aborted) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data) as {
                choices?: Array<{
                  delta?: { content?: string; reasoning_content?: string };
                }>;
              };
              const delta = parsed.choices?.[0]?.delta;
              if (!delta) continue;
              if (delta.content) {
                contentText = limitText(contentText + delta.content);
                setDisplayedText(contentText);
                setThinking(false);
                signalStart();
              }
            } catch (e) {
              console.warn("[AI] malformed SSE chunk", data, e);
              continue;
            }
          }
        }

        if (contentText) {
          const parsed = parseReview(contentText);
          setPunchline(parsed.punchline);
          setSummary(parsed.summary);
          if (typeof window !== "undefined") window.sessionStorage.setItem(cacheKey, JSON.stringify(parsed));
          setDisplayedText("");
          signalStart();
        } else {
          setFailed(true);
          signalStart();
        }
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          setFailed(true);
          onStreamStart?.();
        }
      } finally {
        if (!controller.signal.aborted) setThinking(false);
      }
    },
    [clanId, onStreamStart],
  );

  useEffect(() => {
    fetchSummary(tone);
    return () => abortRef.current?.abort();
  }, [tone, fetchSummary]);

  const refresh = useCallback(() => {
    forceNextRef.current = true;
  }, []);

  return { displayedText, thinking, punchline, summary, failed, fetchSummary, refresh };
}
