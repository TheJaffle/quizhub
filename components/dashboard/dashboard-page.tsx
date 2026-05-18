import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import type { UserDashboardData } from "@/lib/auth";

type DashboardPageProps = {
  dashboardData: UserDashboardData;
};

export function DashboardPage({ dashboardData }: DashboardPageProps) {
  return (
    <div className="flex min-w-0 max-w-full flex-col space-y-6 overflow-x-hidden">
      <DashboardHeader activeTab="overview" />
      <DashboardOverview dashboardData={dashboardData} />
    </div>
  );
}
