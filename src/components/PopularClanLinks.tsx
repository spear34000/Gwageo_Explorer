import { Fragment } from "react";

interface PopularClanLinksProps {
  /** 예시 검색어 목록 (repository.popularSearches() 결과) */
  queries: string[];
}

/** 인기 검색어 예시 링크. "/clans?q=..." 로 이동하며 "·"로 구분한다. */
export default function PopularClanLinks({ queries }: PopularClanLinksProps) {
  if (queries.length === 0) return null;

  return (
    <p className="text-xs text-ink-2">
      <span className="sr-only">인기 검색어: </span>
      {queries.map((q, i) => (
        <Fragment key={q}>
          {i > 0 && <span aria-hidden="true"> · </span>}
          <a href={`/clans?q=${encodeURIComponent(q)}`} className="text-accent hover:underline">
            {q}
          </a>
        </Fragment>
      ))}
    </p>
  );
}
