import Link from "next/link";
import { Lottie } from "@/components/motion/lottie";

export default function NotFound() {
  return (
    <main data-theme="dash" className="ground-fields grid min-h-dvh place-items-center px-6 text-center">
      <div className="max-w-md">
        <Lottie name="empty" className="mx-auto h-44 w-44" />
        <h1 className="mt-4 text-xl font-semibold text-ink">Halaman tidak ditemukan</h1>
        <p className="mt-2 text-sm text-ink-soft">Alamat mungkin salah ketik atau OpCo tersebut tidak punya data pada periode ini.</p>
        <Link href="/dashboard" className="mt-5 inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/85">Kembali ke dashboard</Link>
      </div>
    </main>
  );
}
