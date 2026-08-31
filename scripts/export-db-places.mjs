import Database from "better-sqlite3";
import fs from "node:fs";

const db = new Database("prisma/dev.db", { readonly: true });
const rows = db.prepare("select residence, count(*) as count from Person where trim(residence) <> '' group by residence order by count desc").all();
fs.writeFileSync(".tmp-db-places.json", JSON.stringify(rows, null, 2), "utf8");
console.log(`exported ${rows.length} UTF-8 residences from prisma/dev.db`);
