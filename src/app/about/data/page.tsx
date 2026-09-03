export default function AboutDataPage() {
  return (
    <div>
      <h1 className="font-display mb-4 text-2xl font-bold">데이터·배포 안내</h1>
      <div className="prose-archive">
        <h2>무엇을 제공하나요?</h2>
        <p>
          과거탐색기는 한국학중앙연구원 공개 과거 합격 기록을 정규화해 본관, 인물, 시험,
          왕대와 관계를 탐색하도록 만든 비영리 연구·교육용 서비스입니다. 총 84,525건의
          기록과 2,976개 본관·성씨 조합을 다룹니다.
        </p>
        <h2>본관 지도</h2>
        <p>
          지도는 한반도 전체 범위에서 본관 발생지와 주요 거주지를 구분해 표시합니다. 각 위치에는
          현재·역사 지명, 위치 유형, 조사 상태, 근거 기관과 원문 링크가 연결됩니다. 공식 근거와
          좌표가 확인된 위치만 검증 레이어에 표시하며, 동명 후보·사용자 제보·근거 부족 자료는
          검토 상태로 분리합니다. 북한 및 역사 지명도 같은 좌표계로 포함합니다.
        </p>
        <h2>조사 상태</h2>
        <ul>
          <li><strong>verified</strong> — 공식 근거·좌표·허용 라이선스 확인</li>
          <li><strong>ambiguous</strong> — 동명 지명 또는 복수 후보</li>
          <li><strong>no_official_source</strong> — 공식 근거를 찾지 못함</li>
          <li><strong>review_required</strong> — 비공식 자료 또는 사용자 제보만 확인</li>
          <li><strong>license_blocked</strong> — 근거는 있으나 재배포 조건 불충족</li>
        </ul>
        <h2>라이선스와 출처</h2>
        <p>
          애플리케이션 코드는{' '}
          <a href="https://opensource.org/license/mit" className="text-accent underline" target="_blank" rel="noreferrer">MIT</a>
          입니다. 제3자 데이터와 OpenStreetMap 타일은 각각의 원 라이선스·귀속 조건을 따르며,
          사진이나 원문을 복제하지 않습니다. 자세한 출처와 조건은{' '}
          <a href="https://github.com/spear34000/Gwageo_Explorer/blob/main/THIRD_PARTY_NOTICES.md" className="text-accent underline" target="_blank" rel="noreferrer">THIRD_PARTY_NOTICES.md</a>
          와 <a href="https://github.com/spear34000/Gwageo_Explorer/blob/main/docs/DATA-LICENSE.md" className="text-accent underline" target="_blank" rel="noreferrer">데이터 이용 조건</a>에서 확인할 수 있습니다.
        </p>
        <h2>Android 앱</h2>
        <p>
          Android 앱은 Capacitor 기반 원격 WebView 방식이며 최신 웹 서비스에 연결됩니다. 빌드와
          설치·서명 안내는 저장소 README와 GitHub Releases를 확인하세요.
        </p>
      </div>
    </div>
  );
}
