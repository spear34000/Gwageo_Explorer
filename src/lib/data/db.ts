import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@db/client";

/**
 * Prisma 클라이언트 싱글턴.
 * dev 핫 리로드 시 클라이언트가 중복 생성되는 것을 막기 위해 globalThis에 캐시한다.
 * (DataRepository 구현이 DB를 쓸 때 사용)
 */

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaBetterSqlite3({ url: "file:./prisma/dev.db" }),
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}