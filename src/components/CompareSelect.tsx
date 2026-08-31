"use client";

import { useRouter } from "next/navigation";

export interface CompareOption {
  id: string;
  name: string;
}

interface CompareSelectProps {
  value: string;
  options: CompareOption[];
  paramName: "a" | "b";
}

const LABELS: Record<"a" | "b", string> = {
  a: "기준 본관",
  b: "비교 본관",
};

/**
 * 본관 비교 페이지의 본관 선택 select.
 * 변경 시 기존 쿼리 파라미터를 유지한 채 해당 파라미터만 교체해 이동한다.
 */
export default function CompareSelect({
  value,
  options,
  paramName,
}: CompareSelectProps) {
  const router = useRouter();

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(window.location.search);
    params.set(paramName, event.target.value);
    router.push(`/compare?${params.toString()}`);
  }

  return (
    <label className="inline-flex items-center gap-2">
      <span className="text-sm font-medium text-ink-2">{LABELS[paramName]}</span>
      <select
        value={value}
        onChange={handleChange}
        className="rounded-[2px] border border-line-strong bg-background px-2.5 py-1.5 text-sm text-foreground"
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </label>
  );
}
