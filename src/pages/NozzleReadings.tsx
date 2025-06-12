
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { apiService } from '@/services/api';
import { NozzleReading } from '@/types/api';
import { Plus, Edit, Trash2 } from 'lucide-react';

const NozzleReadings = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingReading, setEditingReading] = useState<NozzleReading | null>(null);
  const [formData, setFormData] = useState({
    pump_sno: '',
    nozzle_id: 1,
    cumulative_volume: 0,
    reading_date: new Date().toISOString().split('T')[0],
    reading_time: new Date().toTimeString().slice(0, 5),
    fuel_type: 'Petrol' as 'Petrol' | 'Diesel'
  });

  const queryClient = useQueryClient();

  const { data: readings, isLoading } = useQuery({
    queryKey: ['nozzle-readings'],
    queryFn: () => apiService.getNozzleReadings()
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => apiService.createManualReading({
      pump_sno: data.pump_sno,
      nozzle_id: data.nozzle_id,
      cumulative_volume: data.cumulative_volume,
      reading_date: data.reading_date,
      reading_time: data.reading_time,
      fuel_type: data.fuel_type
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nozzle-readings'] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast.success('Reading created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create reading');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { cumulative_volume: number; fuel_type: 'Petrol' | 'Diesel' } }) =>
      apiService.updateNozzleReading(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nozzle-readings'] });
      setEditingReading(null);
      toast.success('Reading updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update reading');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiService.deleteNozzleReading(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nozzle-readings'] });
      toast.success('Reading deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete reading');
    }
  });

  const resetForm = () => {
    setFormData({
      pump_sno: '',
      nozzle_id: 1,
      cumulative_volume: 0,
      reading_date: new Date().toISOString().split('T')[0],
      reading_time: new Date().toTimeString().slice(0, 5),
      fuel_type: 'Petrol'
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleEdit = (reading: NozzleReading) => {
    setEditingReading(reading);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReading) return;

    updateMutation.mutate({
      id: editingReading.id,
      data: {
        cumulative_volume: editingReading.cumulativeVolume,
        fuel_type: editingReading.fuelType
      }
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this reading?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Nozzle Readings</h1>
          <p className="text-muted-foreground">Manage fuel pump meter readings</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Reading
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Manual Reading</DialogTitle>
              <DialogDescription>
                Enter a manual fuel meter reading
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="pump_sno">Pump Serial Number</Label>
                <Input
                  id="pump_sno"
                  value={formData.pump_sno}
                  onChange={(e) => setFormData({ ...formData, pump_sno: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="nozzle_id">Nozzle ID</Label>
                <Select value={formData.nozzle_id.toString()} onValueChange={(value) => setFormData({ ...formData, nozzle_id: parseInt(value) })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                      <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="fuel_type">Fuel Type</Label>
                <Select value={formData.fuel_type} onValueChange={(value: 'Petrol' | 'Diesel') => setFormData({ ...formData, fuel_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Petrol">Petrol</SelectItem>
                    <SelectItem value="Diesel">Diesel</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="cumulative_volume">Cumulative Volume (L)</Label>
                <Input
                  id="cumulative_volume"
                  type="number"
                  step="0.001"
                  value={formData.cumulative_volume}
                  onChange={(e) => setFormData({ ...formData, cumulative_volume: parseFloat(e.target.value) })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="reading_date">Date</Label>
                  <Input
                    id="reading_date"
                    type="date"
                    value={formData.reading_date}
                    onChange={(e) => setFormData({ ...formData, reading_date: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="reading_time">Time</Label>
                  <Input
                    id="reading_time"
                    type="time"
                    value={formData.reading_time}
                    onChange={(e) => setFormData({ ...formData, reading_time: e.target.value })}
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Reading'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Readings</CardTitle>
          <CardDescription>Latest fuel meter readings from all pumps</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pump</TableHead>
                <TableHead>Nozzle</TableHead>
                <TableHead>Fuel Type</TableHead>
                <TableHead>Volume (L)</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {readings?.data?.map((reading) => (
                <TableRow key={reading.id}>
                  <TableCell className="font-medium">{reading.pumpSno}</TableCell>
                  <TableCell>{reading.nozzleId}</TableCell>
                  <TableCell>
                    <Badge variant={reading.fuelType === 'Petrol' ? 'default' : 'secondary'}>
                      {reading.fuelType}
                    </Badge>
                  </TableCell>
                  <TableCell>{reading.cumulativeVolume.toLocaleString()}</TableCell>
                  <TableCell>{reading.readingDate}</TableCell>
                  <TableCell>{reading.readingTime || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge variant={reading.isManualEntry ? 'outline' : 'default'}>
                      {reading.isManualEntry ? 'Manual' : 'OCR'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(reading)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(reading.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingReading} onOpenChange={() => setEditingReading(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Reading</DialogTitle>
            <DialogDescription>
              Update the reading values
            </DialogDescription>
          </DialogHeader>
          {editingReading && (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <Label htmlFor="edit_volume">Cumulative Volume (L)</Label>
                <Input
                  id="edit_volume"
                  type="number"
                  step="0.001"
                  value={editingReading.cumulativeVolume}
                  onChange={(e) => setEditingReading({
                    ...editingReading,
                    cumulativeVolume: parseFloat(e.target.value)
                  })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="edit_fuel_type">Fuel Type</Label>
                <Select 
                  value={editingReading.fuelType} 
                  onValueChange={(value: 'Petrol' | 'Diesel') => setEditingReading({
                    ...editingReading,
                    fuelType: value
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Petrol">Petrol</SelectItem>
                    <SelectItem value="Diesel">Diesel</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Updating...' : 'Update Reading'}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NozzleReadings;
