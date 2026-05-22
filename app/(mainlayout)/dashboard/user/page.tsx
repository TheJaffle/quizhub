import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { getUserById, getUserDashboardData } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export const metadata = {
  title: "Mes statistiques | brainspark",
  description: "Consultez vos résultats et votre progression",
};

export default async function Dashboard() {
  const cookieStore = await cookies();
  const userId = Number(cookieStore.get("quizhub_user_id")?.value);

  if (!Number.isInteger(userId) || userId <= 0) {
    redirect("/login");
  }

  const user = await getUserById(userId);

  if (!user) {
    redirect("/login");
  }

  const dashboardData = await getUserDashboardData(user.id);

  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <DashboardPage dashboardData={dashboardData} />
    </Suspense>
  );
}
