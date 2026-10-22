import AdminOnly from "@/components/layout/AdminOnly";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AdminOnly>{children}</AdminOnly>;
}
