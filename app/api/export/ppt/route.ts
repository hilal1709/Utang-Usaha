import { apiUser } from "@/lib/session";
import { opcoScope } from "@/lib/access";
import { json } from "@/lib/api";
import { buildReport } from "@/lib/data/report";
import { buildPpt } from "@/lib/export/ppt";
import { periodLabel } from "@/lib/format";

export const maxDuration = 60;

export async function GET(req: Request) {
  const user = await apiUser();
  if (!user) return json({ error: "Silakan masuk untuk mengekspor." }, 401);
  const opco = opcoScope(user);
  const period = new URL(req.url).searchParams.get("period");
  if (!period || !/^\d{4}-\d{2}-\d{2}$/.test(period)) return json({ error: "Periode tidak valid." }, 400);
  const report = await buildReport(period, { opco });
  if (!report.konsolidasi.total && !report.interco.total) return json({ error: "Belum ada data aktif untuk periode ini." }, 404);
  const buf = await buildPpt(report);
  const name = `Laporan Utang Usaha ${opco ?? "Group"} AP Management per ${periodLabel(period)}.pptx`;
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "Content-Disposition": `attachment; filename="${name}"`,
    },
  });
}
