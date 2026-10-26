import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { homeFor } from "@/lib/access";

export default async function CmsHome() {
  const user = await requireUser();
  redirect(homeFor(user.role));
}
