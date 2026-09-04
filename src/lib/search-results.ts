export const SEARCH_RESULT_COLUMNS = [
  { key: "name", label: "본관", numeric: false },
  { key: "matchLabel", label: "일치", numeric: false },
  { key: "total", label: "전체", numeric: true },
  { key: "mun", label: "문과", numeric: true },
  { key: "mu", label: "무과", numeric: true },
  { key: "saengwon", label: "생원", numeric: true },
  { key: "jinsa", label: "진사", numeric: true },
] as const;
