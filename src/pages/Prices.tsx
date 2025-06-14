import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { IndianRupee, Plus, TrendingUp } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useFuelPricesData } from "@/hooks/useFuelPricesData";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useAuth } from "@/hooks/useAuth";
import { FuelPriceDialog } from "@/components/prices/FuelPriceDialog";

export default function Prices() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  // Set explicit type!
  const [selectedFuelType, setSelectedFuelType] = useState<"PETROL" | "DIESEL" | "CNG" | "EV" | undefined>(undefined);
  const [selectedPrice, setSelectedPrice] = useState<string>("");
  const [editId, setEditId] = useState<number | undefined>(undefined); // To identify price entry being edited

  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: fuelPrices, isLoading } = useFuelPricesData();
  const { currentStation, isOwner, isAdmin } = useRoleAccess();

  const ALL_FUEL_TYPES = ["PETROL", "DIESEL", "CNG", "EV"];

  // Find fuel types that don't yet exist
  const presentFuelTypes = fuelPrices?.map(p => p.fuel_type) ?? [];
  const missingFuelTypes = ALL_FUEL_TYPES.filter(
    ft => !presentFuelTypes.includes(ft)
  );

  // --- DIALOG HANDLERS ---
  const [addEditLoading, setAddEditLoading] = useState(false);

  const openAddDialog = () => {
    setDialogMode("add");
    setDialogOpen(true);
    setSelectedFuelType(undefined);
    setSelectedPrice("");
    setEditId(undefined);
  };

  // openEditDialog: use the union type for fuelType
  const openEditDialog = (
    fuelType: "PETROL" | "DIESEL" | "CNG" | "EV",
    price: number,
    id: number
  ) => {
    setDialogMode("edit");
    setDialogOpen(true);
    setSelectedFuelType(fuelType); // Now correctly typed!
    setSelectedPrice(price.toString());
    setEditId(id);
  };

  // Ensure parameter type is strict union
  const handleDialogSubmit = (
    input: { fuel_type: "PETROL" | "DIESEL" | "CNG" | "EV"; price_per_litre: string }
  ) => {
    setAddEditLoading(true);

    // Validation
    if (!input.price_per_litre) {
      toast({
        title: "Missing Information",
        description: "Please enter the price per litre",
        variant: "destructive",
      });
      setAddEditLoading(false);
      return;
    }
    const price = parseFloat(input.price_per_litre);
    if (isNaN(price) || price <= 0) {
      toast({
        title: "Invalid Price",
        description: "Please enter a valid price greater than 0",
        variant: "destructive",
      });
      setAddEditLoading(false);
      return;
    }

    // Mutate (always insert, not update)
    supabase
      .from("fuel_prices")
      .insert({
        station_id: currentStation?.id,
        fuel_type: input.fuel_type,
        price_per_litre: price,
        created_by: user?.id,
        valid_from: new Date().toISOString(),
      })
      .select()
      .single()
      .then(({ data, error }) => {
        if (error) throw error;
        toast({
          title: "Success",
          description: `Fuel price ${dialogMode === "add" ? "added" : "updated"} successfully`,
        });
        setDialogOpen(false);
        setSelectedFuelType(undefined);
        setSelectedPrice("");
        setEditId(undefined);
        queryClient.invalidateQueries({ queryKey: ["fuel-prices"] });
      })
      .catch((error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to update fuel price",
          variant: "destructive",
        });
      })
      .finally(() => setAddEditLoading(false));
  };

  const getFuelTypeColor = (fuelType: string) => {
    switch (fuelType) {
      case 'PETROL': return 'bg-blue-100 text-blue-800';
      case 'DIESEL': return 'bg-orange-100 text-orange-800';
      case 'CNG': return 'bg-green-100 text-green-800';
      case 'EV': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!currentStation && !isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No station assigned to your account. Please contact your administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading fuel prices...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Fuel Prices</h1>
          <p className="text-muted-foreground">
            Manage fuel prices {currentStation ? `for ${currentStation.name}` : "across all stations"}
          </p>
        </div>
        {(isOwner || isAdmin) && (
          <Button onClick={openAddDialog} disabled={missingFuelTypes.length === 0}>
            <Plus className="w-4 h-4 mr-2" />
            Add Fuel Price
          </Button>
        )}
      </div>

      <FuelPriceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        // ensure proper typing for fuelTypes, initialFuelType
        fuelTypes={
          dialogMode === "add"
            ? (missingFuelTypes as ("PETROL" | "DIESEL" | "CNG" | "EV")[])
            : [(selectedFuelType || "PETROL") as "PETROL" | "DIESEL" | "CNG" | "EV"]
        }
        mode={dialogMode}
        initialFuelType={selectedFuelType}
        initialPrice={selectedPrice}
        loading={addEditLoading}
        onSubmit={handleDialogSubmit}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {fuelPrices?.map((price) => (
          <Card key={`${price.station_id}-${price.fuel_type}`}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <IndianRupee className="w-5 h-5" />
                    {price.fuel_type}
                  </CardTitle>
                  <CardDescription>
                    Current Price
                  </CardDescription>
                </div>
                <Badge className={getFuelTypeColor(price.fuel_type)}>
                  {price.fuel_type}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary flex items-center gap-1">
                <IndianRupee className="w-5 h-5" />
                {price.price_per_litre.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                <div>Updated: {new Date(price.valid_from).toLocaleDateString()}</div>
                <div>Valid from: {new Date(price.valid_from).toLocaleString()}</div>
              </div>
              {(isOwner || isAdmin) && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3"
                  onClick={() => openEditDialog(price.fuel_type, price.price_per_litre, price.id)}
                >
                  Edit
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {(!fuelPrices || fuelPrices.length === 0) && (
        <Card>
          <CardContent className="pt-6 text-center">
            <IndianRupee className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No fuel prices set</h3>
            <p className="text-muted-foreground mb-4">
              Get started by setting prices for different fuel types.
            </p>
            {(isOwner || isAdmin) && (
              <Button onClick={openAddDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Set First Price
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
