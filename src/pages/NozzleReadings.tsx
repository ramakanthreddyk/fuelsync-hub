import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService } from '@/services/api';
import { NozzleReading } from '@/types/api';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/hooks/useAuth';

export default function NozzleReadings() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newReading, setNewReading] = useState({
    pumpSno: '',
    nozzleId: '',
    fuelType: 'Petrol',
    cumulativeVolume: '',
    readingDate: new Date().toISOString().split('T')[0],
    readingTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { user } = useAuth();
  const currentStation = user?.stations?.[0];

  const { data: readingsData, isLoading } = useQuery({
    queryKey: ['nozzle-readings', currentStation?.id],
    queryFn: async () => {
      if (!currentStation) return [];
      const response = await apiService.getNozzleReadings(currentStation.id);
      return response.data || [];
    },
    enabled: !!currentStation
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => {
      if (!currentStation) throw new Error('No station selected');
      return apiService.createManualReading(data, currentStation.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nozzle-readings'] });
      toast({
        title: "Reading Added",
        description: "Manual reading has been added successfully.",
      });
      setIsDialogOpen(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; cumulative_volume: number; fuel_type: string }) =>
      apiService.updateNozzleReading(data.id, { cumulative_volume: data.cumulative_volume, fuel_type: data.fuel_type }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nozzle-readings'] });
      toast({
        title: "Reading Updated",
        description: "Nozzle reading has been updated successfully.",
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiService.deleteNozzleReading(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nozzle-readings'] });
      toast({
        title: "Reading Deleted",
        description: "Nozzle reading has been deleted successfully.",
      });
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewReading(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setNewReading({
      pumpSno: '',
      nozzleId: '',
      fuelType: 'Petrol',
      cumulativeVolume: '',
      readingDate: new Date().toISOString().split('T')[0],
      readingTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
  };

  const handleCreateReading = () => {
    const readingData = {
      id: Date.now().toString(),
      pumpSno: newReading.pumpSno,
      nozzleId: parseInt(newReading.nozzleId),
      fuelType: newReading.fuelType,
      cumulativeVolume: parseFloat(newReading.cumulativeVolume),
      readingDate: newReading.readingDate,
      readingTime: newReading.readingTime,
      isManualEntry: true,
      userId: user?.id.toString() || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    createMutation.mutate({
      pump_sno: newReading.pumpSno,
      nozzle_id: parseInt(newReading.nozzleId),
      cumulative_volume: parseFloat(newReading.cumulativeVolume),
      reading_date: newReading.readingDate,
      reading_time: newReading.readingTime,
      fuel_type: newReading.fuelType as 'Petrol' | 'Diesel'
    });
  };

  const handleUpdateReading = (reading: NozzleReading, newVolume: number, newFuelType: string) => {
    updateMutation.mutate({
      id: reading.id,
      cumulative_volume: newVolume,
      fuel_type: newFuelType
    });
  };

  const handleDeleteReading = (id: string) => {
    deleteMutation.mutate(id);
  };

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Nozzle Readings</CardTitle>
          <CardDescription>
            Manage and monitor fuel levels for each nozzle.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Add Manual Reading</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add Manual Reading</DialogTitle>
                <DialogDescription>
                  Create a new manual reading entry
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="pumpSno" className="text-right">
                    Pump S/No
                  </Label>
                  <Input
                    type="text"
                    id="pumpSno"
                    name="pumpSno"
                    value={newReading.pumpSno}
                    onChange={handleChange}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="nozzleId" className="text-right">
                    Nozzle ID
                  </Label>
                  <Input
                    type="number"
                    id="nozzleId"
                    name="nozzleId"
                    value={newReading.nozzleId}
                    onChange={handleChange}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="fuelType" className="text-right">
                    Fuel Type
                  </Label>
                  <select
                    id="fuelType"
                    name="fuelType"
                    value={newReading.fuelType}
                    onChange={handleChange}
                    className="col-span-3 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  >
                    <option value="Petrol">Petrol</option>
                    <option value="Diesel">Diesel</option>
                  </select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="cumulativeVolume" className="text-right">
                    Cumulative Volume
                  </Label>
                  <Input
                    type="number"
                    id="cumulativeVolume"
                    name="cumulativeVolume"
                    value={newReading.cumulativeVolume}
                    onChange={handleChange}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="readingDate" className="text-right">
                    Reading Date
                  </Label>
                  <Input
                    type="date"
                    id="readingDate"
                    name="readingDate"
                    value={newReading.readingDate}
                    onChange={handleChange}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="readingTime" className="text-right">
                    Reading Time
                  </Label>
                  <Input
                    type="time"
                    id="readingTime"
                    name="readingTime"
                    value={newReading.readingTime}
                    onChange={handleChange}
                    className="col-span-3"
                  />
                </div>
              </div>
              <Button onClick={handleCreateReading}>Create Reading</Button>
            </DialogContent>
          </Dialog>

          <div className="mt-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Pump S/No</TableHead>
                  <TableHead>Nozzle ID</TableHead>
                  <TableHead>Fuel Type</TableHead>
                  <TableHead>Cumulative Volume</TableHead>
                  <TableHead>Reading Date</TableHead>
                  <TableHead>Reading Time</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">Loading...</TableCell>
                  </TableRow>
                ) : (
                  readingsData?.map((reading) => (
                    <TableRow key={reading.id}>
                      <TableCell>{reading.id}</TableCell>
                      <TableCell>{reading.pumpSno}</TableCell>
                      <TableCell>{reading.nozzleId}</TableCell>
                      <TableCell>{reading.fuelType}</TableCell>
                      <TableCell>{reading.cumulativeVolume}</TableCell>
                      <TableCell>{reading.readingDate}</TableCell>
                      <TableCell>{reading.readingTime}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newVolume = parseFloat(prompt('Enter new cumulative volume', reading.cumulativeVolume.toString()) || reading.cumulativeVolume.toString());
                              const newFuelType = prompt('Enter new fuel type', reading.fuelType) || reading.fuelType;
                              handleUpdateReading(reading, newVolume, newFuelType);
                            }}
                          >
                            Update
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteReading(reading.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
