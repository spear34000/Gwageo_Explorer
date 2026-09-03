import Database from "better-sqlite3";

const db = new Database("prisma/dev.db");
const columns = new Set(db.prepare("PRAGMA table_info('ClanLocation')").all().map((column) => column.name));
if (!columns.has("modernArea")) db.exec("ALTER TABLE ClanLocation ADD COLUMN modernArea TEXT NOT NULL DEFAULT ''");
if (!columns.has("status")) db.exec("ALTER TABLE ClanLocation ADD COLUMN status TEXT NOT NULL DEFAULT 'review_required'");

db.exec(`
  CREATE TABLE IF NOT EXISTS ClanResearch (
    clanId TEXT NOT NULL PRIMARY KEY,
    bonGwan TEXT NOT NULL,
    surname TEXT NOT NULL,
    status TEXT NOT NULL,
    note TEXT,
    reviewedAt DATETIME
  );
  CREATE INDEX IF NOT EXISTS ClanResearch_bonGwan_surname_idx ON ClanResearch (bonGwan, surname);
  CREATE INDEX IF NOT EXISTS ClanResearch_status_idx ON ClanResearch (status);
  CREATE TABLE IF NOT EXISTS ClanLocationEvidence (
    id TEXT NOT NULL PRIMARY KEY,
    clanId TEXT NOT NULL,
    locationId TEXT,
    provider TEXT NOT NULL,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    licenseCode TEXT NOT NULL,
    licenseUrl TEXT NOT NULL,
    retrievedAt DATETIME NOT NULL,
    evidenceSummary TEXT NOT NULL,
    contentHash TEXT NOT NULL,
    CONSTRAINT ClanLocationEvidence_clanId_fkey FOREIGN KEY (clanId) REFERENCES ClanResearch (clanId) ON DELETE CASCADE,
    CONSTRAINT ClanLocationEvidence_locationId_fkey FOREIGN KEY (locationId) REFERENCES ClanLocation (id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS ClanLocationEvidence_clanId_idx ON ClanLocationEvidence (clanId);
  CREATE INDEX IF NOT EXISTS ClanLocationEvidence_locationId_idx ON ClanLocationEvidence (locationId);
`);
db.close();
console.log("clan research schema ready");
