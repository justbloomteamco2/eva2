import { redirect } from "next/navigation";
import AdminDashboard from "../../../components/AdminDashboard";
import { getAdminSession } from "../../../lib/admin-auth";

export const metadata = { title: "Event plans — Bardapure Admin" };
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const jwtSecret = process.env.ADMIN_JWT_SECRET;
  if (!jwtSecret || jwtSecret.length < 32) redirect("/admin/login");
  if (!await getAdminSession()) redirect("/admin/login?expired=1");
  return <AdminDashboard />;
}
