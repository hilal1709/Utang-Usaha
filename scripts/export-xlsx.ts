/** Ekspor Excel Gabungan dari CLI: npx tsx --env-file=.env.local scripts/export-xlsx.ts 2026-08-31 out.xlsx */
import { createWriteStream } from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { buildReport } from "@/lib/data/report";
import { streamGabungan } from "@/lib/export/xlsx";

(async () => {
  const [period = "2026-08-31", out = "gabungan.xlsx"] = process.argv.slice(2);
  const t = Date.now();
  const web = streamGabungan(await buildReport(period));
  await pipeline(Readable.fromWeb(web as never), createWriteStream(out));
  console.log("wrote", out, `${((Date.now() - t) / 1000).toFixed(0)}s`);
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
