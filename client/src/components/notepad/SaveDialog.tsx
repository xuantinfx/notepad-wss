import { FC, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface SaveDialogProps {
  filename: string;
  onSave: (filename: string) => void;
  onCancel: () => void;
}

const SaveDialog: FC<SaveDialogProps> = ({ filename, onSave, onCancel }) => {
  const [saveFilename, setSaveFilename] = useState(filename || 'Untitled.txt');
  
  const handleSave = () => {
    onSave(saveFilename);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
      <div className="bg-white p-4 rounded shadow-lg w-full max-w-md">
        <div className="text-lg font-bold mb-4">Save As</div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">File name:</label>
          <Input 
            type="text"
            value={saveFilename}
            onChange={(e) => setSaveFilename(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Save as type:</label>
          <Select defaultValue="txt">
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select file type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="txt">Text Documents (*.txt)</SelectItem>
              <SelectItem value="all">All Files (*.*)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex justify-end space-x-2">
          <Button
            variant="secondary"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SaveDialog;
