
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService } from '@/services/api';
import { Upload as UploadType } from '@/types/api';
import { useToast } from "@/hooks/use-toast";

const Upload = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: uploadsData, isLoading } = useQuery({
    queryKey: ['uploads'],
    queryFn: async () => {
      const response = await apiService.getUploads();
      return response.data || [];
    }
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => apiService.uploadReceipt(file),
    onSuccess: () => {
      toast({
        title: "Upload Successful",
        description: "Your receipt has been uploaded for OCR processing.",
      });
      setSelectedFile(null);
      setUploadProgress(0);
      queryClient.invalidateQueries({ queryKey: ['uploads'] });
    },
    onError: () => {
      toast({
        title: "Upload Failed",
        description: "There was an error uploading your receipt. Please try again.",
        variant: "destructive",
      });
      setUploadProgress(0);
    }
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setSelectedFile(file);
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please select an image file (JPG, PNG, etc.)",
          variant: "destructive",
        });
      }
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            uploadMutation.mutate(selectedFile);
            return 100;
          }
          return prev + 10;
        });
      }, 200);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'processing':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'failed':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Upload Receipt</h1>
        <p className="text-muted-foreground mt-1">
          Upload fuel receipts for automatic OCR processing and data extraction.
        </p>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>📤</span>
            Upload New Receipt
          </CardTitle>
          <CardDescription>
            Upload an image of your fuel receipt for automatic processing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div>
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Supported formats: JPG, PNG, JPEG (Max 10MB)
              </p>
            </div>

            {selectedFile && (
              <div className="p-4 border border-dashed border-primary/20 rounded-lg bg-primary/5">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📄</span>
                  <div className="flex-1">
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>

                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="mt-3">
                    <Progress value={uploadProgress} className="w-full" />
                    <p className="text-sm text-muted-foreground mt-1">
                      Uploading... {uploadProgress}%
                    </p>
                  </div>
                )}
              </div>
            )}

            <Button 
              onClick={handleUpload} 
              disabled={!selectedFile || uploadMutation.isPending || uploadProgress > 0}
              className="w-full"
            >
              {uploadMutation.isPending || uploadProgress > 0 ? (
                <>
                  <span className="mr-2">⏳</span>
                  Processing...
                </>
              ) : (
                <>
                  <span className="mr-2">📤</span>
                  Upload Receipt
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Uploads */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>📋</span>
            Recent Uploads
          </CardTitle>
          <CardDescription>
            Track the status of your uploaded receipts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <span className="text-2xl">⏳</span>
              <p className="text-muted-foreground mt-2">Loading uploads...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {uploadsData?.map((upload: UploadType) => (
                <div key={upload.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📄</span>
                    <div>
                      <p className="font-medium">{upload.filename}</p>
                      <p className="text-sm text-muted-foreground">
                        Uploaded {new Date(upload.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {upload.status === 'success' && upload.ocrData && (
                      <div className="text-right">
                        <p className="font-medium">₹{upload.amount}</p>
                        <p className="text-sm text-muted-foreground">{upload.litres}L</p>
                      </div>
                    )}
                    <Badge variant="outline" className={getStatusColor(upload.status)}>
                      {upload.status}
                    </Badge>
                  </div>
                </div>
              ))}
              
              {!uploadsData?.length && (
                <div className="text-center py-8">
                  <span className="text-4xl">📄</span>
                  <p className="text-muted-foreground mt-2">No uploads yet</p>
                  <p className="text-sm text-muted-foreground">Upload your first receipt to get started</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Upload;
