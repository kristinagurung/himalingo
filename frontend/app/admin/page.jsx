"use client";
import dynamic from "next/dynamic";

// This tells Next.js: NEVER run or compile this component on the server!
const AdminDashboardClient = dynamic(
  () => import("./AdminDashboard"),
  { ssr: false }
);

export default function AdminPage() {
  return <AdminDashboardClient />;
}