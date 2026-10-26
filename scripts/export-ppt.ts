/** Ekspor PPT dari CLI: npx tsx --env-file=.env.local scripts/export-ppt.ts 2026-08-31 out.pptx */
import { writeFileSync } from "node:fs";
import { buildReport } from "@/lib/data/report";
import { buildPpt } from "@/lib/export/ppt";

(async () => {
  const [period = "2026-08-31", out = "laporan.pptx"] = process.argv.slice(2);
  const report = await buildReport(period);
  writeFileSync(out, await buildPpt(report));
  console.log("wrote", out, "slides OpCo:", report.opcoOrder.join(","));
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
