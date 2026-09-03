import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

interface ManifestDataset {
  id: string;
  path: string;
  licenseCode: string;
  redistributable: boolean;
  distribution?: "included" | "import-only";
  sha256: string | null;
}
interface Manifest { datasets: ManifestDataset[] }

const root = process.cwd();
const manifest = JSON.parse(fs.readFileSync(path.join(root, "prisma", "dataset-manifest.json"), "utf8")) as Manifest;
const errors: string[] = [];
const excluded: string[] = [];
for (const dataset of manifest.datasets) {
  if (dataset.path === "runtime") continue;
  if (dataset.distribution === "import-only") {
    excluded.push(dataset.id);
    continue;
  }
  const file = path.join(root, dataset.path);
  if (!fs.existsSync(file)) {
    errors.push(`${dataset.id}: missing ${dataset.path}`);
    continue;
  }
  const hash = crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
  if (dataset.sha256 !== hash) errors.push(`${dataset.id}: sha256 mismatch or pending`);
  if (!dataset.redistributable || ["PENDING_REVIEW", "UNKNOWN", ""].includes(dataset.licenseCode)) {
    errors.push(`${dataset.id}: redistribution rights are not confirmed`);
  }
  try {
    const tracked = execFileSync("git", ["ls-files", "--error-unmatch", dataset.path], { cwd: root, stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
    if (dataset.distribution === "included" && !tracked) errors.push(`${dataset.id}: included dataset is not Git-tracked`);
    if (dataset.distribution !== "included" && tracked) errors.push(`${dataset.id}: ${dataset.path} is still Git-tracked while rights are pending`);
  } catch {
    if (dataset.distribution === "included") errors.push(`${dataset.id}: included dataset is not Git-tracked`);
  }
}
console.log(JSON.stringify({ valid: errors.length === 0, errors, excluded }, null, 2));
if (errors.length) process.exitCode = 1;
