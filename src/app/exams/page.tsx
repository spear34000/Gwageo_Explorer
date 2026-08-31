import { repository } from "@/lib/data/repository";
import { EXAM_COLUMN_LABELS, type ExamType } from "@/lib/data/types";
import { formatNumber } from "@/lib/format";

const EXAM_TYPES: { type: ExamType; description: string }[] = [
  {
    type: "mun",
    description:
      "대과. 관리 등용을 위한 시험으로, 초시·복시·전시의 3단계로 치러지며 등급은 갑과·을과·병과로 나뉜다.",
  },
  {
    type: "mu",
    description:
      "대과. 무관 등용을 위한 시험으로, 무예와 병서(兵書)를 시험했다.",
  },
  {
    type: "saengwon",
    description:
      "소과. 성리학 경학(經學)에 대한 이해를 중심으로 평가했다. 합격자는 생원이라 불렸다.",
  },
  {
    type: "jinsa",
    description:
      "소과. 시(詩)·부(賦)·표(表) 등 문장 능력을 중심으로 평가했다. 합격자는 진사라 불렸다.",
  },
];

export default async function ExamsPage() {
  const totalsByType: Record<string, number> = {};
  for (const { type } of EXAM_TYPES) {
    totalsByType[type] = (await repository.listExamRecords({ examType: type }, 1, 1)).total;
  }

  return (
    <div>
      <h1 className="font-display mb-4 text-2xl font-bold">과거시험</h1>

      <div className="prose-archive mb-8">
        <p>
          조선시대 과거는 문과·무과(대과)와 생원시·진사시(소과)로 나뉜다.
          대과는 관리 등용을 위한 본시험이고, 소과는 성균관 입학 자격을 얻기
          위한 예비 시험 성격을 띠었다. 본 사이트는 네 종류의 합격 기록을
          본관별로 집계해 보여준다.
        </p>
      </div>

      <div className="table-scroll">
        <table className="data-table">
          <caption className="sr-only">과거시험 종류별 설명과 합격 기록 수</caption>
          <thead>
            <tr>
              <th scope="col">시험 종류</th>
              <th scope="col">설명</th>
              <th scope="col" className="num">
                합격 기록 수
              </th>
            </tr>
          </thead>
          <tbody>
            {EXAM_TYPES.map(({ type, description }) => (
              <tr key={type}>
                <td>
                  <a href={`/rankings?sort=${type}`}>
                    {EXAM_COLUMN_LABELS[type]}
                  </a>
                </td>
                <td>{description}</td>
                <td className="num">
                  {formatNumber(totalsByType[type])}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-ink-3">
        갑오개혁(1894)으로 문과·무과가 폐지되었습니다.
      </p>
    </div>
  );
}