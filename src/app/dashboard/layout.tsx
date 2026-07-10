import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  // Admins can also access the user dashboard, but let's keep it accessible
  return (
    <>
      <Navbar />
      <div className="flex-1">
        {children}
      </div>
    </>
  );
}
