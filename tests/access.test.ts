import { describe, expect, it } from "vitest";
import { canSeeOpco, homeFor, isAdmin, opcoScope, roleAllowed } from "@/lib/access";

describe("hak akses", () => {
  it("SUPERADMIN mewarisi hak ADMIN, tapi ADMIN tidak mewarisi SUPERADMIN", () => {
    expect(roleAllowed("SUPERADMIN", ["ADMIN"])).toBe(true);
    expect(roleAllowed("ADMIN", ["SUPERADMIN"])).toBe(false);
    expect(roleAllowed("OPCO", ["ADMIN", "OPCO"])).toBe(true);
    expect(roleAllowed("VIEWER", ["ADMIN", "OPCO"])).toBe(false);
    expect(roleAllowed("VIEWER")).toBe(true);
    expect(isAdmin("SUPERADMIN") && isAdmin("ADMIN") && !isAdmin("OPCO") && !isAdmin("VIEWER")).toBe(true);
  });

  it("akun OpCo hanya melihat OpCo sendiri", () => {
    const sp = { role: "OPCO" as const, opcoCode: "SP" };
    expect(opcoScope(sp)).toBe("SP");
    expect(canSeeOpco(sp, "SP")).toBe(true);
    expect(canSeeOpco(sp, "SG")).toBe(false);
  });

  it("peran global melihat semua OpCo", () => {
    for (const role of ["SUPERADMIN", "ADMIN", "VIEWER"] as const) {
      expect(opcoScope({ role, opcoCode: null })).toBeNull();
      expect(canSeeOpco({ role, opcoCode: null }, "SG")).toBe(true);
    }
  });

  it("akun OpCo tanpa OpCo ditolak, bukan dianggap global", () => {
    expect(() => opcoScope({ role: "OPCO", opcoCode: null })).toThrow();
  });

  it("halaman awal per peran", () => {
    expect(homeFor("SUPERADMIN")).toBe("/cms/monitoring");
    expect(homeFor("OPCO")).toBe("/cms/upload");
    expect(homeFor("VIEWER")).toBe("/dashboard");
  });
});
