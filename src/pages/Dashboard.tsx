import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { DollarSign, Fuel, TrendingUp, Clock, AlertTriangle } from "lucide-react";
import { TrendsChart } from "@/components/dashboard/TrendsChart";
import { FuelPriceCard } from "@/components/dashboard/FuelPriceCard";
import { AlertBadges } from "@/components/dashboard/AlertBadges";
import { useDashboardData } from "@/hooks/useDashboardData";
import { UpgradeModal } from "@/components/dashboard/UpgradeModal";
import { useState } from "react";

export default function Dashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useDashboardData();
  const [showUpgrade, setShowUpgrade] = useState(false);

  // Determine premium restriction from API response
  const premiumRequired = !!data.premiumRequired;

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
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.name}! Here's what's happening today.
        </p>
      </div>

      {/* Alert Badges */}
      <AlertBadges alerts={data.alerts} />

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Sales Today */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales Today</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{data.todaySales.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              From fuel dispensing
            </p>
          </CardContent>
        </Card>

        {/* Total Tender */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tender</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">₹{data.todayTender.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Cash, card, UPI & credit
            </p>
          </CardContent>
        </Card>

        {/* Pending Closures */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Closures</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${data.pendingClosures > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {data.pendingClosures}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.pendingClosures > 0 ? 'Need attention' : 'All closed'}
            </p>
          </CardContent>
        </Card>

        {/* Daily Variance (Premium ONLY) */}
        <div className="relative">
          <Card className={`hover:shadow-md transition-shadow ${premiumRequired ? 'pointer-events-auto opacity-60 blur-sm' : ''}`}
            {...(premiumRequired ? lockWidgetProps : {})}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Daily Variance</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${Math.abs(variance) < 1 ? 'text-green-600' : variance > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {Math.abs(variance) < 1 ? 'Balanced' : `${variance > 0 ? '+' : '-'}₹${Math.abs(variance).toFixed(2)}`}
              </div>
              <p className="text-xs text-muted-foreground">
                {Math.abs(variance) < 1 ? 'Sales match collections' : variance > 0 ? 'Collection excess' : 'Collection shortage'}
              </p>
            </CardContent>
            {/* Add overlay only if locked */}
            {premiumRequired && lockOverlay}
          </Card>
        </div>
      </div>

      {/* Charts and Secondary Info */}
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
          {/* Fuel Prices Card */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common daily tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-3">
                <button 
                  onClick={() => window.location.href = '/upload'}
                  className="p-3 text-left border rounded-lg hover:bg-gray-50 hover:shadow-md transition-all duration-200 group"
                >
                  <div className="font-medium group-hover:text-primary">Add Reading</div>
                  <div className="text-sm text-muted-foreground">Upload or manual entry</div>
                </button>
                <button 
                  onClick={() => window.location.href = '/daily-closure'}
                  className="p-3 text-left border rounded-lg hover:bg-gray-50 hover:shadow-md transition-all duration-200 group"
                >
                  <div className="font-medium group-hover:text-primary">Daily Closure</div>
                  <div className="text-sm text-muted-foreground">End of day summary</div>
                </button>
                <button 
                  onClick={() => window.location.href = '/prices'}
                  className="p-3 text-left border rounded-lg hover:bg-gray-50 hover:shadow-md transition-all duration-200 group"
                >
                  <div className="font-medium group-hover:text-primary">Update Prices</div>
                  <div className="text-sm text-muted-foreground">Fuel price management</div>
                </button>
                <button 
                  onClick={() => window.location.href = '/reports'}
                  className="p-3 text-left border rounded-lg hover:bg-gray-50 hover:shadow-md transition-all duration-200 group"
                >
                  <div className="font-medium group-hover:text-primary">View Reports</div>
                  <div className="text-sm text-muted-foreground">Sales & analytics</div>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Readings Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fuel className="h-5 w-5" />
            Reading Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold">{data.totalReadings}</div>
            <div className="text-sm text-muted-foreground">Total Readings</div>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold">
              {data.lastReading ? new Date(data.lastReading).toLocaleTimeString() : 'None'}
            </div>
            <div className="text-sm text-muted-foreground">Last Reading</div>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold">
              {data.lastReading ? new Date(data.lastReading).toLocaleDateString() : 'No data'}
            </div>
            <div className="text-sm text-muted-foreground">Last Reading Date</div>
          </div>
        </CardContent>
      </Card>

      {/* MODAL */}
      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </div>
  );
}
