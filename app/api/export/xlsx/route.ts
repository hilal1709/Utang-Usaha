import { apiUser } from "@/lib/session";
import { opcoScope } from "@/lib/access";
import { json } from "@/lib/api";
import { buildReport } from "@/lib/data/report";
import { streamGabungan } from "@/lib/export/xlsx";
import { periodLabel } from "@/lib/format";

export const maxDuration = 300;

export async function GET(req: Request) {
  const user = await apiUser();
  if (!user) return json({ error: "Silakan masuk untuk mengekspor." }, 401);
  const opco = opcoScope(user);
  const period = new URL(req.url).searchParams.get("period");
  if (!period || !/^\d{4}-\d{2}-\d{2}$/.test(period)) return json({ error: "Periode tidak valid." }, 400);
  const report = await buildReport(period, { opco });
  if (!report.submissionsCount) return json({ error: "Belum ada data aktif untuk periode ini." }, 404);
  const name = `Utang Usaha ${opco ?? "Gabungan"} per ${periodLabel(period)}.xlsx`;
  return new Response(streamGabungan(report), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${name}"`,
    },
  });
}
