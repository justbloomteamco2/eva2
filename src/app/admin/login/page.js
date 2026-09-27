import { redirect } from "next/navigation";
import Link from "next/link";
import AdminLoginForm from "../../../components/AdminLoginForm";
import { getAdminSession } from "../../../lib/admin-auth";

export const metadata = { title: "Admin sign in — Bardapure Productions®" };
export const dynamic = "force-dynamic";

export default async function AdminLoginPage({ searchParams }) {
  const params = await searchParams;
  const jwtSecret = process.env.ADMIN_JWT_SECRET;
  const adminSessionReady = Boolean(jwtSecret && jwtSecret.length >= 32);
  const adminSetupReady = Boolean(
    adminSessionReady &&
    process.env.ADMIN_USERNAME &&
    process.env.ADMIN_PASSWORD_HASH &&
    process.env.SUPABASE_URL &&
    (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY) &&
    process.env.RATE_LIMIT_SECRET &&
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
  if (adminSessionReady && await getAdminSession()) redirect("/admin/dashboard");
  return (
    <main className="admin-login-page">
      <Link className="wordmark wordmark--footer" href="/"><span>BARDAPURE</span><span>PRODUCTIONS<sup>®</sup></span></Link>
      <AdminLoginForm configured={adminSetupReady} sessionExpired={params?.expired === "1"} />
      <Link className="admin-back" href="/">Back to the public site <span>↗</span></Link>
    </main>
  );
}
