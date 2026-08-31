import { notFound } from "next/navigation";
import { repository } from "@/lib/data/repository";
import { EXAM_TYPE_LABELS, type RelationInfo } from "@/lib/data/types";
import { kingYearLabel } from "@/lib/data/kings";
import PersonTable from "@/components/PersonTable";

export default async function PersonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const person = await repository.getPerson(id);
  if (!person) notFound();

  const firstExam = person.exams[0];

  const lifespan =
    person.birthYear !== undefined || person.deathYear !== undefined
      ? `${person.birthYear ?? "?"}-${person.deathYear ?? "?"}`
      : null;

  return (
    <div>
      <h1 className="font-display mb-4 text-2xl font-bold">{person.name}</h1>

      <dl className="stat-grid mb-8">
        <div>
          <dt className="mb-1 text-xs text-ink-3">본관</dt>
          <dd className="text-sm">
            <a href={`/clans/${person.clanId}`}>{person.clanName}</a>
          </dd>
        </div>
        <div>
          <dt className="mb-1 text-xs text-ink-3">거주지</dt>
          <dd className="text-sm">{person.residence || "기록 없음"}</dd>
        </div>
        {firstExam && (
          <>
            <div>
              <dt className="mb-1 text-xs text-ink-3">시험</dt>
              <dd className="text-sm">{EXAM_TYPE_LABELS[firstExam.type]}</dd>
            </div>
            <div>
              <dt className="mb-1 text-xs text-ink-3">합격</dt>
              <dd className="text-sm">
                {kingYearLabel(firstExam.kingId, firstExam.year)}
              </dd>
            </div>
            <div>
              <dt className="mb-1 text-xs text-ink-3">합격 등급</dt>
              <dd className="text-sm">{firstExam.grade}</dd>
            </div>
          </>
        )}
        {lifespan && (
          <div>
            <dt className="mb-1 text-xs text-ink-3">생몰</dt>
            <dd className="text-sm">{lifespan}</dd>
          </div>
        )}
      </dl>

      <section aria-label="합격 기록">
        <h2 className="mb-3 mt-10 text-lg font-bold">합격 기록</h2>
        <PersonTable rows={person.exams} />
      </section>

      <section aria-label="관련 인물">
        <h2 className="mb-3 mt-10 text-lg font-bold">관련 인물</h2>
        <Relations relations={person.relations} relatedBy={person.relatedBy} />
      </section>
    </div>
  );
}

function Relations({
  relations,
  relatedBy,
}: {
  relations: RelationInfo[];
  relatedBy: RelationInfo[];
}) {
  const groups = groupByLabel(relations);
  const reverseGroups = groupByLabel(relatedBy);

  if (groups.size === 0 && reverseGroups.size === 0) {
    return (
      <p className="text-sm text-ink-3">원본 데이터에 기록된 관계가 없습니다.</p>
    );
  }

  return (
    <dl className="divide-y divide-line border-y border-line">
      {[...groups.entries()].map(([label, people]) => (
        <RelationRow key={`out-${label}`} label={label} people={people} />
      ))}
      {[...reverseGroups.entries()].map(([label, people]) => (
        <RelationRow key={`in-${label}`} label={label} people={people} />
      ))}
    </dl>
  );
}

function RelationRow({
  label,
  people,
}: {
  label: string;
  people: RelationInfo[];
}) {
  return (
    <div className="grid grid-cols-[6rem_1fr] gap-3 py-2.5">
      <dt className="text-sm text-ink-3">{label}</dt>
      <dd className="text-sm">
        {people.map((person, index) => (
          <span key={person.personId}>
            {index > 0 && <span className="mx-1.5 text-ink-3">·</span>}
            <a href={`/people/${person.personId}`}>{person.personName}</a>
          </span>
        ))}
      </dd>
    </div>
  );
}

function groupByLabel(relations: RelationInfo[]): Map<string, RelationInfo[]> {
  const groups = new Map<string, RelationInfo[]>();
  for (const relation of relations) {
    const list = groups.get(relation.relationLabel) ?? [];
    list.push(relation);
    groups.set(relation.relationLabel, list);
  }
  return groups;
}