
import { useNavigate } from "react-router-dom";
import { useFuelPricesData } from "@/hooks/useFuelPricesData";
import { useDashboardData } from "@/hooks/useDashboardData";

export function useSetupChecklist() {
  const navigate = useNavigate();
  const { data: fuelPrices } = useFuelPricesData();
  const { data } = useDashboardData();

  // Expand/modify checklist items as needed
  return [
    {
      key: "fuel_price_set",
      label: "Set fuel prices",
      completed: !!(fuelPrices && fuelPrices.length > 0),
      action: () => navigate("/prices"),
    },
    {
      key: "pump_assigned",
      label: "Assign pumps",
      completed: !!data && data.trendsData && data.trendsData.length > 0,
      action: () => navigate("/pumps"),
    },
    // Add more as needed
  ];
}

