import Database from "better-sqlite3";
import fs from "node:fs";
const db = new Database("prisma/dev.db", { readonly: true });
const rows = db.prepare("select bonGwan, count(*) as count from Person where trim(bonGwan) <> '' group by bonGwan order by count desc").all();
fs.writeFileSync(".tmp-bongwan-inventory.json", JSON.stringify(rows, null, 2), "utf8");
console.log(`exported ${rows.length} bon-gwan entries`);
