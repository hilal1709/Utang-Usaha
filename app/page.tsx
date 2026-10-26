import { redirect } from "next/navigation";

/** Halaman depan = dashboard publik. */
export default function Home() {
  redirect("/dashboard");
}
