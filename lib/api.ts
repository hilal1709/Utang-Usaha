import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { UploadError } from "@/lib/upload/server";

export const json = (data: unknown, status = 200) => NextResponse.json(data, { status });

/** Bungkus handler agar error dikembalikan sebagai JSON berbahasa Indonesia. */
export async function handle<T>(fn: () => Promise<T>) {
  try {
    return json(await fn());
  } catch (e) {
    if (e instanceof UploadError) return json({ error: e.message }, 400);
    if (e instanceof ZodError) return json({ error: "Data permintaan tidak valid.", details: e.issues }, 400);
    console.error(e);
    return json({ error: "Terjadi kesalahan di server." }, 500);
  }
}
