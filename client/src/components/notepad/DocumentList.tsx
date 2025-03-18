import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileClock, FileText, RefreshCw } from 'lucide-react';
import { Document } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

interface DocumentListProps {
  open: boolean;
  onClose: () => void;
  onSelectDocument: (document: Document) => void;
}

export default function DocumentList({ open, onClose, onSelectDocument }: DocumentListProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const docs = await apiRequest<Document[]>('/api/documents');
      setDocuments(docs);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchDocuments();
    }
  }, [open]);

  const handleSelectDocument = (document: Document) => {
    onSelectDocument(document);
    onClose();
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch (e) {
      return dateString;
    }
  };

  return (
    <Dialog open={open} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileClock className="h-5 w-5" />
            Open Collaborative Document
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex justify-end mb-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchDocuments}
            disabled={loading}
            className="flex items-center gap-1"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        
        <ScrollArea className="h-72">
          {documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
              <FileText className="h-8 w-8 mb-2" />
              <p>No documents available</p>
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map(doc => (
                <Card 
                  key={doc.id} 
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => handleSelectDocument(doc)}
                >
                  <CardHeader className="p-3 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {doc.filename}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 text-xs text-muted-foreground">
                    <p className="truncate">Last modified: {formatDate(doc.lastModified)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}