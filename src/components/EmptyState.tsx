interface EmptyStateProps {
  message: string;
}

/** 결과 없음 안내. 조용한 회색 박스로 화면 중앙에 메시지를 보여 준다. */
export default function EmptyState({ message }: EmptyStateProps) {
  return (
    <div role="status" className="border border-line bg-subtle px-4 py-10 text-center">
      <p className="text-sm text-ink-2">{message}</p>
    </div>
  );
}
