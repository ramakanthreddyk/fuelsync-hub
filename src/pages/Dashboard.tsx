import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { DollarSign, Fuel, TrendingUp, Clock, AlertTriangle, ListChecks } from "lucide-react";
import { TrendsChart } from "@/components/dashboard/TrendsChart";
import { FuelPriceCard } from "@/components/dashboard/FuelPriceCard";
import { AlertBadges } from "@/components/dashboard/AlertBadges";
import { useDashboardData } from "@/hooks/useDashboardData";
import { UpgradeModal } from "@/components/dashboard/UpgradeModal";
import { useState } from "react";
import { useEffect } from "react";
import { useActivityLogger } from "@/hooks/useActivityLogger";
import { useFuelPricesData } from "@/hooks/useFuelPricesData";
import { Button } from "@/components/ui/button";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { SetupChecklist } from "@/components/dashboard/SetupChecklist";
import { KeyMetricsCards } from "@/components/dashboard/KeyMetricsCards";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { ReadingSummary } from "@/components/dashboard/ReadingSummary";
import { useSetupChecklist } from "@/hooks/useSetupChecklist";
import { LockWidget } from "@/components/dashboard/LockWidget";

export default function Dashboard() {
  const logActivity = useActivityLogger();
  useEffect(() => {
    logActivity("dashboard_view", {
      browser: window.navigator.userAgent,
      path: window.location.pathname,
    });
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { user } = useAuth();
  const { data, isLoading } = useDashboardData();
  const { data: fuelPricesList, isLoading: isPricesLoading } = useFuelPricesData();
  const { currentStation } = useRoleAccess();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const checklist = useSetupChecklist();

  const premiumRequired = !!data.premiumRequired;
  const variance = data.todayTender - data.todaySales;

  // --- Lock overlay click handler
  const onLockUpgradeClick = () => setShowUpgrade(true);

  // Build fuel price object for FuelPriceCard
  const fuelPricesObj = data.fuelPrices
    ? data.fuelPrices
    : (fuelPricesList && fuelPricesList.reduce((acc, cur) => {
        acc[cur.fuel_type] = cur.price_per_litre;
        return acc;
      }, {} as Record<string, number>));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <SetupChecklist checklist={checklist} />
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.name}! Here's what's happening today.
        </p>
      </div>
      <AlertBadges alerts={data.alerts} />
      <KeyMetricsCards
        todaySales={data.todaySales}
        todayTender={data.todayTender}
        pendingClosures={data.pendingClosures}
        premiumRequired={premiumRequired}
        variance={variance}
        lockWidgetProps={{
          className: "relative cursor-pointer select-none",
          onClick: onLockUpgradeClick,
        }}
        lockOverlay={
          <LockWidget onClick={onLockUpgradeClick}>
            <></>
          </LockWidget>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Trends Chart (Premium ONLY) */}
        <div className="lg:col-span-2 relative">
          {premiumRequired ? (
            <LockWidget onClick={onLockUpgradeClick}>
              <TrendsChart data={data.trendsData} isLoading={isLoading} />
            </LockWidget>
          ) : (
            <TrendsChart data={data.trendsData} isLoading={isLoading} />
          )}
        </div>
        {/* Fuel Prices and Quick Actions */}
        <div className="space-y-6">
          <FuelPriceCard prices={fuelPricesObj || {}} isLoading={isPricesLoading} />
          <QuickActions />
        </div>
      </div>
      <ReadingSummary totalReadings={data.totalReadings} lastReading={data.lastReading} />
      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </div>
  );
}
