import { getRepository } from "@/lib/data/repository";

/**
 * 데모 데이터 안내 배너.
 * isDemoData가 true일 때만 노출된다.
 * 실제 데이터가 연결되면 이 배너는 자동으로 사라진다.
 */
export default function DemoBanner() {
  const repo = getRepository();
  if (!repo.isDemoData) return null;

  return (
    <div className="border-b border-line bg-subtle">
      <p className="mx-auto max-w-5xl px-4 py-1.5 text-xs text-ink-2 sm:px-6">
        현재 표시되는 모든 수치는 개발용 샘플 데이터입니다. 실제 역사 데이터
        연동 전까지 참고용으로만 사용해 주세요.
      </p>
    </div>
  );
}