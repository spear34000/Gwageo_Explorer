"use client";

import { useState } from "react";

interface SearchBarProps {
  defaultValue?: string;
  autoFocus?: boolean;
}

export default function SearchBar({ defaultValue, autoFocus }: SearchBarProps) {
  const [pending, setPending] = useState(false);

  return (
    <>
      <form
        method="get"
        action="/clans"
        role="search"
        className="flex gap-2"
        onSubmit={() => setPending(true)}
      >
        <label htmlFor="clan-search" className="sr-only">
          성씨 또는 본관 검색
        </label>
        <input
          id="clan-search"
          name="q"
          type="search"
          className="search-input flex-1"
          placeholder="성씨 또는 본관을 검색하세요. 예: 안동 김씨"
          defaultValue={defaultValue}
          autoFocus={autoFocus}
        />
        <button type="submit" className="btn-primary shrink-0" aria-busy={pending}>
          {pending ? "조회 중..." : "검색"}
        </button>
      </form>
      {pending && (
        <p className="mt-2 flex items-center gap-2 text-sm text-ink-3" aria-live="polite">
          <span className="size-3 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
          응답을 조회하는 중...
        </p>
      )}
    </>
  );
}
