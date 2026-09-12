import type { Metadata } from "next";
import "./admin.css";
export const metadata: Metadata = {
  title: "Sukoona Admin",
  robots: { index: false, follow: false },
  alternates: { canonical: "/admin" },
};
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
