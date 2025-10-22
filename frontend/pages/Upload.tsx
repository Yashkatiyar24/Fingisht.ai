import * as React from "react";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import backend from "~backend/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Upload as UploadIcon, FileSpreadsheet, CheckCircle, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const urlResponse = await backend.upload.getUploadUrl({ filename: file.name });
      
      await fetch(urlResponse.signedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
      });

      const processResponse = await backend.upload.processUpload({ uploadId: urlResponse.uploadId });
      return processResponse;
    },
    onSuccess: (data) => {
      toast({
        title: "Upload successful!",
        description: `Processed ${data.totalRows} transactions`,
      });
      navigate("/transactions");
    },
    onError: (error) => {
      console.error('Upload error:', error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message || "Failed to process the file",
      });
    },
  });

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.type === 'text/csv' || droppedFile.name.endsWith('.csv'))) {
      setFile(droppedFile);
    } else {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload a CSV file",
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleUpload = () => {
    if (file) {
      uploadMutation.mutate(file);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Upload Transactions</h1>
        <p className="text-muted-foreground">
          Upload your CSV file to import transactions automatically
        </p>
      </div>

      <Card className="bg-card/50 backdrop-blur-sm border-border/40 rounded-2xl">
        <CardHeader>
          <CardTitle>Upload File</CardTitle>
          <CardDescription>
            Supported formats: CSV. Expected columns: Date, Amount, Merchant (or Vendor), Description (optional)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div
            className={`
              border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200
              ${isDragging 
                ? 'border-cyan-400 bg-cyan-500/10' 
                : 'border-border/40 hover:border-cyan-400/50 hover:bg-cyan-500/5'
              }
            `}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            {file ? (
              <div className="space-y-4">
                <FileSpreadsheet className="w-16 h-16 mx-auto text-cyan-400" />
                <div>
                  <p className="font-medium text-lg">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFile(null)}
                  className="rounded-xl"
                >
                  Remove file
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <UploadIcon className="w-16 h-16 mx-auto text-muted-foreground" />
                <div>
                  <p className="text-lg font-medium mb-2">
                    Drag and drop your CSV file here
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">or</p>
                  <label htmlFor="file-upload">
                    <Button 
                      variant="outline" 
                      className="rounded-xl cursor-pointer"
                      asChild
                    >
                      <span>Browse files</span>
                    </Button>
                    <input
                      id="file-upload"
                      type="file"
                      accept=".csv"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>

          {file && (
            <Button
              onClick={handleUpload}
              disabled={uploadMutation.isPending}
              className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
              size="lg"
            >
              {uploadMutation.isPending ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Upload & Process
                </>
              )}
            </Button>
          )}

          <Card className="bg-background/50 border-border/40 rounded-xl">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-cyan-400" />
                Expected CSV Format
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-mono text-sm bg-muted/50 p-4 rounded-lg overflow-x-auto">
                <div className="text-cyan-400">Date,Amount,Merchant,Description</div>
                <div className="text-muted-foreground">2024-01-15,45.50,Starbucks,Coffee</div>
                <div className="text-muted-foreground">2024-01-16,125.00,Amazon,Books</div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
