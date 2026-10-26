import { buildReport, latestPeriod, listPeriods } from "@/lib/data/report";
import { opcoScope } from "@/lib/access";
import { requireUser } from "@/lib/session";

type SP = Promise<Record<string, string | string[] | undefined>>;

/** Periode dari ?period= (jika valid) atau periode terbaru yang punya detail dalam lingkup OpCo. */
export async function resolvePeriod(searchParams: SP, opco: string | null = null) {
  const sp = await searchParams;
  const periods = await listPeriods({ opco });
  const wanted = typeof sp.period === "string" ? sp.period : null;
  const period = (wanted && periods.some((p) => p.period === wanted) ? wanted : null) ?? (await latestPeriod({ opco })) ?? periods[0]?.period ?? null;
  return { period, periods };
}

/** Laporan untuk pengguna yang login — akun OpCo otomatis dibatasi ke OpCo-nya sendiri. */
export async function loadReport(searchParams: SP) {
  const user = await requireUser();
  const opco = opcoScope(user);
  const { period, periods } = await resolvePeriod(searchParams, opco);
  if (!period) return { user, period: null, periods, report: null };
  return { user, period, periods, report: await buildReport(period, { opco }) };
}
