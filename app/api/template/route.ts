import { readFile } from "node:fs/promises";
import path from "node:path";
import { apiUser } from "@/lib/session";

/** Template resmi hanya untuk pengguna yang login (berisi daftar vendor berelasi). */
export async function GET() {
  if (!(await apiUser())) return new Response("Unauthorized", { status: 401 });
  const file = await readFile(path.join(process.cwd(), "assets/templates/Template-Utang-Usaha.xlsx"));
  return new Response(new Uint8Array(file), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="Template Utang Usaha.xlsx"',
    },
  });
}
