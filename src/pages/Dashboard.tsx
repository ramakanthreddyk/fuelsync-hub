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

export default function Dashboard() {
  // ACTIVITY LOGGING: Log "dashboard_view" once per visit (on mount)
  const logActivity = useActivityLogger();
  useEffect(() => {
    logActivity("dashboard_view", {
      // You can include additional info here if desired, e.g.:
      browser: window.navigator.userAgent,
      path: window.location.pathname,
    });
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { user } = useAuth();
  const { data, isLoading } = useDashboardData();
  const [showUpgrade, setShowUpgrade] = useState(false);

  // Setup checklist - check if fuel prices exist, pumps/nozzles assigned, etc.
  const { data: fuelPrices, isLoading: fuelPricesLoading } = useFuelPricesData();
  const { currentStation } = useRoleAccess();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Checklist items: You can expand these as needed, e.g. require at least one pump/nozzle assignment
  const checklist = [
    {
      key: "fuel_price_set",
      label: "Set fuel prices",
      completed: !!(fuelPrices && fuelPrices.length > 0),
      action: () => navigate("/prices"),
    },
    {
      key: "pump_assigned",
      label: "Assign pumps",
      completed: !!data && data.trendsData && data.trendsData.length > 0, // This is just an example, you may want stricter checks
      action: () => navigate("/pumps"),
    },
    // Add more items here as needed
  ];

  // Show checklist only if something is incomplete
  const incomplete = checklist.filter(item => !item.completed);

  // --- "blur" style for locked widgets
  const lockWidgetProps = {
    className: "relative cursor-pointer select-none",
    onClick: () => setShowUpgrade(true),
  };
  const lockOverlay = (
    <div className="absolute inset-0 bg-white/70 dark:bg-black/60 flex flex-col items-center justify-center z-10 rounded-[inherit] backdrop-blur-[2px]">
      <span className="text-xs font-semibold text-yellow-500">
        <span className="flex items-center gap-1"><svg width="1em" height="1em" viewBox="0 0 20 20" className="inline align-middle"><path fill="#facc15" d="M10 2a5 5 0 0 1 5 5v3h1c.6 0 1 .4 1 1v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6c0-.6.4-1 1-1h1V7a5 5 0 0 1 5-5m0 2A3 3 0 0 0 7 7v3h6V7a3 3 0 0 0-3-3m0 8a1 1 0 0 0-.99 1v2.01a1 1 0 1 0 2 0V13A1 1 0 0 0 10 12" /></svg>
        Available on Premium – Upgrade to view detailed insights.</span>
      </span>
    </div>
  );

  const premiumRequired = !!data.premiumRequired;
  const variance = data.todayTender - data.todaySales;

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
        lockWidgetProps={lockWidgetProps}
        lockOverlay={lockOverlay}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Trends Chart (Premium ONLY) */}
        <div className="lg:col-span-2 relative">
          <div className={premiumRequired ? "pointer-events-auto opacity-60 blur-sm relative" : ""} {...(premiumRequired ? lockWidgetProps : {})}>
            <TrendsChart data={data.trendsData} isLoading={isLoading} />
            {premiumRequired && lockOverlay}
          </div>
        </div>
        {/* Fuel Prices and Quick Actions */}
        <div className="space-y-6">
          <QuickActions />
        </div>
      </div>
      <ReadingSummary totalReadings={data.totalReadings} lastReading={data.lastReading} />
      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </div>
  );
}
