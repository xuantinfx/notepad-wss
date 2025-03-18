import { FC } from 'react';
import { Button } from '@/components/ui/button';

interface AboutDialogProps {
  onClose: () => void;
}

const AboutDialog: FC<AboutDialogProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
      <div className="bg-white p-4 rounded shadow-lg w-full max-w-md">
        <div className="text-lg font-bold mb-2">About Notepad</div>
        <div className="mb-4 text-sm">
          <p className="mb-2">Notepad Web App</p>
          <p className="mb-2">A lightweight text editor for the web.</p>
          <p>© 2023 Web Notepad</p>
        </div>
        <div className="flex justify-end">
          <Button onClick={onClose}>OK</Button>
        </div>
      </div>
    </div>
  );
};

export default AboutDialog;
