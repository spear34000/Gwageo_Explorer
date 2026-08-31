import { repository } from "@/lib/data/repository";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const results = q.trim() ? await repository.searchClans(q) : [];
  return Response.json({ demo: repository.isDemoData, results });
}
