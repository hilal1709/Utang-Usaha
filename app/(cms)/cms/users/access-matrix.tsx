import { Check, Minus } from "lucide-react";
import { ROLE_LABEL } from "@/lib/access";
import type { Role } from "@/auth.config";

const COLS: Role[] = ["SUPERADMIN", "ADMIN", "VIEWER", "OPCO"];

/** true = penuh, string = terbatas (dengan keterangan), false = tidak. */
const ROWS: { label: string; v: Record<Role, boolean | string> }[] = [
  { label: "Dashboard & laporan", v: { SUPERADMIN: "Semua OpCo", ADMIN: "Semua OpCo", VIEWER: "Semua OpCo", OPCO: "OpCo sendiri" } },
  { label: "Ekspor PPT & Excel", v: { SUPERADMIN: "Semua OpCo", ADMIN: "Semua OpCo", VIEWER: "Semua OpCo", OPCO: "OpCo sendiri" } },
  { label: "Unggah laporan", v: { SUPERADMIN: "Semua OpCo", ADMIN: "Semua OpCo", VIEWER: false, OPCO: "OpCo sendiri" } },
  { label: "Monitoring & kunci periode", v: { SUPERADMIN: true, ADMIN: true, VIEWER: false, OPCO: false } },
  { label: "Master data OpCo & vendor", v: { SUPERADMIN: true, ADMIN: true, VIEWER: false, OPCO: false } },
  { label: "Kelola akun & hak akses", v: { SUPERADMIN: true, ADMIN: false, VIEWER: false, OPCO: false } },
];

export function AccessMatrix() {
  return (
    <section className="glass-solid overflow-x-auto rounded-2xl scroll-thin" aria-labelledby="matrix-title">
      <div className="px-5 pt-5 pb-3">
        <h2 id="matrix-title" className="font-semibold text-ink">Hak akses per peran</h2>
        <p className="mt-1 max-w-[70ch] text-sm text-ink-soft">Lingkup OpCo ditegakkan di server untuk setiap halaman, ekspor, dan unggahan — bukan sekadar menyembunyikan menu.</p>
      </div>
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="text-xs text-ink-soft">
          <tr className="border-b border-border">
            <th className="px-5 py-3 font-medium">Fitur</th>
            {COLS.map((c) => <th key={c} className="px-3 py-3 font-medium">{ROLE_LABEL[c]}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {ROWS.map((r) => (
            <tr key={r.label}>
              <th scope="row" className="px-5 py-3 font-medium text-ink">{r.label}</th>
              {COLS.map((c) => {
                const v = r.v[c];
                return (
                  <td key={c} className="px-3 py-3 text-ink">
                    {v === true ? <Check className="size-4" aria-label="Ya" />
                      : v === false ? <Minus className="size-4 text-ink-soft" aria-label="Tidak" />
                      : <span>{v}</span>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
