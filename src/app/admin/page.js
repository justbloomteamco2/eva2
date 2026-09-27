import { redirect } from "next/navigation";
import { getAdminSession } from "../../lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminIndexPage() {
  if (await getAdminSession()) redirect("/admin/dashboard");
  redirect("/admin/login");
}
