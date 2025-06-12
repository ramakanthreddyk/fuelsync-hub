import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useMutation } from "@tanstack/react-query";
import { apiService } from '@/services/api';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";

const Reports = () => {
  const { user } = useAuth();
  const currentStation = user?.stations?.[0];

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['reports', currentStation?.id],
    queryFn: async () => {
      if (!currentStation) return { data: [] };
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const endDate = new Date();
      
      return await apiService.generateReport(
        currentStation.id,
        startDate.toISOString(),
        endDate.toISOString()
      );
    },
    enabled: !!currentStation
  });

  const [reportType, setReportType] = useState('daily');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const { toast } = useToast();

  const generateReportMutation = useMutation({
    mutationFn: () => apiService.generateReport(reportType, startDate, endDate),
    onSuccess: (response) => {
      toast({
        title: "Report Generated",
        description: "Your report has been generated successfully and is ready for download.",
      });
      console.log('Report data:', response.data);
    },
    onError: () => {
      toast({
        title: "Report Generation Failed",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleGenerateReport = () => {
    if (!startDate || !endDate) {
      toast({
        title: "Invalid Date Range",
        description: "Please select both start and end dates.",
        variant: "destructive",
      });
      return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
      toast({
        title: "Invalid Date Range",
        description: "Start date must be before end date.",
        variant: "destructive",
      });
      return;
    }

    generateReportMutation.mutate();
  };

  const reportTypes = [
    { value: 'daily', label: 'Daily Sales Report', description: 'Daily breakdown of sales and transactions' },
    { value: 'weekly', label: 'Weekly Summary', description: 'Weekly sales performance and trends' },
    { value: 'monthly', label: 'Monthly Report', description: 'Comprehensive monthly business report' },
    { value: 'pump', label: 'Pump Performance', description: 'Individual pump performance analysis' },
    { value: 'fuel', label: 'Fuel Type Analysis', description: 'Sales breakdown by fuel type' }
  ];

  const recentReports = [
    {
      id: '1',
      name: 'Daily Sales Report - June 1, 2024',
      type: 'daily',
      generatedAt: '2024-06-01T18:30:00Z',
      size: '2.4 MB',
      status: 'completed'
    },
    {
      id: '2',
      name: 'Weekly Summary - May 26-31, 2024',
      type: 'weekly',
      generatedAt: '2024-06-01T09:15:00Z',
      size: '5.1 MB',
      status: 'completed'
    },
    {
      id: '3',
      name: 'Monthly Report - May 2024',
      type: 'monthly',
      generatedAt: '2024-05-31T23:45:00Z',
      size: '12.8 MB',
      status: 'completed'
    }
  ];

  const getReportIcon = (type: string) => {
    switch (type) {
      case 'daily':
        return '📊';
      case 'weekly':
        return '📈';
      case 'monthly':
        return '📋';
      case 'pump':
        return '⛽';
      case 'fuel':
        return '🚛';
      default:
        return '📄';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Generate detailed reports and export your business data.
        </p>
      </div>

      {/* Report Generation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>📋</span>
            Generate New Report
          </CardTitle>
          <CardDescription>
            Create custom reports for your specified date range and requirements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Report Type */}
            <div className="space-y-2">
              <Label htmlFor="report-type">Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {getReportIcon(type.value)} {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            {/* Generate Button */}
            <div className="flex items-end">
              <Button 
                onClick={handleGenerateReport}
                disabled={generateReportMutation.isPending}
                className="w-full"
              >
                {generateReportMutation.isPending ? (
                  <>
                    <span className="mr-2">⏳</span>
                    Generating...
                  </>
                ) : (
                  <>
                    <span className="mr-2">🔄</span>
                    Generate
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Selected Report Type Description */}
          {reportType && (
            <div className="p-4 border border-primary/20 rounded-lg bg-primary/5">
              <h4 className="font-medium text-primary mb-1">
                {reportTypes.find(t => t.value === reportType)?.label}
              </h4>
              <p className="text-sm text-muted-foreground">
                {reportTypes.find(t => t.value === reportType)?.description}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Reports */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>📊</span>
              Today's Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Generate today's sales summary
            </p>
            <Button variant="outline" className="w-full">
              Generate Now
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>📈</span>
              This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Weekly performance report
            </p>
            <Button variant="outline" className="w-full">
              Generate Now
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>📋</span>
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Complete monthly analysis
            </p>
            <Button variant="outline" className="w-full">
              Generate Now
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>📂</span>
            Recent Reports
          </CardTitle>
          <CardDescription>
            Download and manage your previously generated reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentReports.map((report) => (
              <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getReportIcon(report.type)}</span>
                  <div>
                    <p className="font-medium">{report.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Generated on {new Date(report.generatedAt).toLocaleDateString()} • {report.size}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">
                    {report.status}
                  </Badge>
                  <Button size="sm" variant="outline">
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>📤</span>
            Export Options
          </CardTitle>
          <CardDescription>
            Available export formats and data options
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-primary/20 rounded-lg">
              <h4 className="font-medium mb-2">📄 PDF Reports</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Professional formatted reports with charts and summaries
              </p>
              <Badge variant="secondary">Most Popular</Badge>
            </div>
            
            <div className="p-4 border border-primary/20 rounded-lg">
              <h4 className="font-medium mb-2">📊 Excel Spreadsheets</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Raw data exports for further analysis and processing
              </p>
              <Badge variant="outline">Data Analysis</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
