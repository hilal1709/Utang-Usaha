"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/feedback/toaster";
import { ThemedSelect } from "@/components/ui/themed-select";
import { deleteVendor, updateOpco, upsertVendor, type ActionResult } from "../actions";

const notify = (r: ActionResult) => { if (r.ok) toast.success(r.message); else toast.error(r.message); };

type OpcoRow = { code: string; name: string; cocds: string; active: boolean };

export function OpcoEditor({ rows }: { rows: OpcoRow[] }) {
  return (
    <section className="glass-solid rounded-2xl" aria-label="Master OpCo">
      <div className="px-5 pt-4">
        <h2 className="font-semibold text-ink">OpCo & Company Code</h2>
        <p className="mt-1 text-sm text-ink-soft">Kosongkan CoCd bila belum diketahui — validasi CoCd tidak dijalankan untuk OpCo tersebut.</p>
      </div>
      <ul className="mt-3 divide-y divide-border">
        {rows.map((r) => <OpcoLine key={r.code} row={r} />)}
      </ul>
    </section>
  );
}

function OpcoLine({ row }: { row: OpcoRow }) {
  const [v, setV] = useState(row);
  const [pending, start] = useTransition();
  const dirty = v.name !== row.name || v.cocds !== row.cocds || v.active !== row.active;
  return (
    <li className="grid items-center gap-3 px-5 py-3 sm:grid-cols-[4rem_1fr_11rem_auto_auto]">
      <span className="font-semibold text-ink">{row.code}</span>
      <Input aria-label={`Nama ${row.code}`} value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} className="h-9 glass-input" />
      <Input aria-label={`CoCd ${row.code}`} placeholder="mis. 2000, 7000" value={v.cocds} onChange={(e) => setV({ ...v, cocds: e.target.value })} className="h-9 glass-input" />
      <label className="flex items-center gap-2 text-sm text-ink">
        <input type="checkbox" checked={v.active} onChange={(e) => setV({ ...v, active: e.target.checked })} className="size-4 accent-[#4a5043]" /> Aktif
      </label>
      <Button size="sm" disabled={!dirty || pending} onClick={() => start(async () => notify(await updateOpco(v)))}>Simpan</Button>
    </li>
  );
}

type VendorRow = { key: string; name: string; kategori: string };

export function VendorEditor({ rows, total, term }: { rows: VendorRow[]; total: number; term: string }) {
  const router = useRouter();
  const [q, setQ] = useState(term);
  const [name, setName] = useState("");
  const [kat, setKat] = useState("Interco");
  const [pending, start] = useTransition();
  return (
    <section className="glass-solid rounded-2xl" aria-label="Master vendor">
      <div className="px-5 pt-4">
        <h2 className="font-semibold text-ink">Master vendor berelasi</h2>
        <p className="mt-1 text-sm text-ink-soft">{total.toLocaleString("id-ID")} vendor Interco/Afiliasi/BUMN. Nama disimpan tanpa “PT”; file OpCo yang berbeda kategori akan diberi peringatan.</p>
      </div>
      <form className="flex flex-wrap gap-2 px-5 pt-4" onSubmit={(e) => { e.preventDefault(); router.push(`/cms/master?q=${encodeURIComponent(q)}`); }}>
        <div className="relative min-w-[12rem] flex-1">
          <Search className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-ink-soft" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari vendor" className="h-9 glass-input pl-8" aria-label="Cari vendor" />
        </div>
        <Button type="submit" variant="outline" size="sm" className="h-9">Cari</Button>
      </form>
      <form className="flex flex-wrap gap-2 px-5 pt-3" onSubmit={(e) => {
        e.preventDefault();
        start(async () => { const r = await upsertVendor({ name, kategori: kat }); notify(r); if (r.ok) setName(""); });
      }}>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama vendor baru" className="h-9 min-w-[12rem] flex-1 glass-input" aria-label="Nama vendor baru" />
        <ThemedSelect value={kat} onChange={setKat} ariaLabel="Kategori" className="min-w-40"
          options={["Interco", "Afiliasi", "BUMN", "Third Parties"].map((k) => ({ value: k, label: k }))} />
        <Button type="submit" size="sm" className="h-9" disabled={pending || name.trim().length < 2}><Plus /> Tambah</Button>
      </form>
      <ul className="mt-3 max-h-[560px] divide-y divide-border overflow-y-auto scroll-thin">
        {rows.length === 0 && <li className="px-5 py-6 text-sm text-ink-soft">Tidak ada vendor yang cocok.</li>}
        {rows.map((r) => (
          <li key={r.key} className="flex items-center gap-3 px-5 py-2.5 text-sm">
            <span className="min-w-0 flex-1 truncate text-ink">{r.name}</span>
            <span className="shrink-0 rounded-full bg-[#9ac2c9] px-2 py-0.5 text-xs font-semibold text-[#1f3d44]">{r.kategori}</span>
            <button className="grid size-8 place-items-center rounded-md text-ink-soft hover:bg-[#ab3428]/40 hover:text-white" aria-label={`Hapus ${r.name}`}
              onClick={() => start(async () => notify(await deleteVendor(r.key)))}>
              <Trash2 className="size-4" />
            </button>
          </li>
        ))}
      </ul>
      <div className="h-3" />
    </section>
  );
}
