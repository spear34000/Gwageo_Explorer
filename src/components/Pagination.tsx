interface PaginationProps {
  /** 현재 페이지 (1부터) */
  page: number;
  totalPages: number;
  /** 이전/다음 링크의 기준 경로. 이미 쿼리 파라미터(?exam=... 등)를 포함할 수 있다 */
  baseHref: string;
}

/** baseHref에 page 파라미터를 안전하게 병합한다 (page 1이면 파라미터 제거) */
function withPageParam(baseHref: string, page: number): string {
  const [path, query = ""] = baseHref.split("?");
  const params = new URLSearchParams(query);
  if (page <= 1) {
    params.delete("page");
  } else {
    params.set("page", String(page));
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

/** 이전/다음 링크 + "N / M" 표시. 경계(첫/마지막 페이지)에서는 링크를 비활성화한다. */
export default function Pagination({ page, totalPages, baseHref }: PaginationProps) {
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <nav
      aria-label="페이지 내비게이션"
      className="flex items-center justify-between gap-4 border-t border-line pt-3"
    >
      {hasPrev ? (
        <a href={withPageParam(baseHref, page - 1)} className="btn-secondary hover:no-underline">
          이전
        </a>
      ) : (
        <span className="btn-secondary text-ink-3" aria-disabled="true">
          이전
        </span>
      )}

      <span className="text-sm text-ink-2 tabular-nums">
        {page} / {totalPages}
      </span>

      {hasNext ? (
        <a href={withPageParam(baseHref, page + 1)} className="btn-secondary hover:no-underline">
          다음
        </a>
      ) : (
        <span className="btn-secondary text-ink-3" aria-disabled="true">
          다음
        </span>
      )}
    </nav>
  );
}
