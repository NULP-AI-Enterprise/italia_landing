import { redirect } from "next/navigation";

/** The overview of all content now lives on the dashboard. */
export default function ContentIndexPage() {
  redirect("/admin");
}
