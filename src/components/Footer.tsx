import { getRepository } from "@/lib/data/repository";

export default function Footer() {
  const repo = getRepository();
  return (
    <footer className="mt-12 border-t border-line bg-subtle">
      <div className="mx-auto max-w-5xl px-4 py-6 text-xs leading-relaxed text-ink-2 sm:px-6">
        <p className="font-semibold text-foreground">과거탐색기</p>
        <p className="mt-1.5">
          조선시대 과거시험 데이터를 기반으로 성씨·본관별 합격 기록을 탐색하는
          자료 서비스입니다.
        </p>
        <p className="mt-1.5">
          본 서비스는 같은 본관의 역사적 과거 합격 기록을 보여주는 자료
          아카이브입니다. 개인의 직계 조상을 판별하거나 특정 인물이 사용자의
          조상임을 주장하지 않습니다.
        </p>
        <p className="mt-1.5 text-ink-3">
          데이터 출처: 한국학중앙연구원 한국역대인물종합정보시스템(과거·취재
          데이터) {repo.isDemoData && "· 현재는 개발용 샘플 데이터"}
        </p>
        <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
          <a href="/about/data" className="text-accent underline underline-offset-2">데이터 이용 조건</a>
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="text-accent underline underline-offset-2">지도 저작권</a>
          <a href="https://encykorea.aks.ac.kr/Guide/ContentUse" target="_blank" rel="noreferrer" className="text-accent underline underline-offset-2">AKS 콘텐츠 이용 안내</a>
        </p>
      </div>
    </footer>
  );
}
