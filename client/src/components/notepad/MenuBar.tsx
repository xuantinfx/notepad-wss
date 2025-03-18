import { FC } from 'react';

interface MenuBarProps {
  newDocument: () => void;
  openDocument: () => void;
  saveDocument: () => void;
  saveAsDocument: () => void;
  printDocument: () => void;
  wordWrap: boolean;
  toggleWordWrap: () => void;
  showStatusBar: boolean;
  toggleStatusBar: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  showAboutDialog: () => void;
}

const MenuBar: FC<MenuBarProps> = ({
  newDocument,
  openDocument,
  saveDocument,
  saveAsDocument,
  printDocument,
  wordWrap,
  toggleWordWrap,
  showStatusBar,
  toggleStatusBar,
  zoomIn,
  zoomOut,
  resetZoom,
  showAboutDialog
}) => {
  return (
    <div className="bg-gray-100 border-b border-gray-300 flex flex-wrap">
      {/* File Menu */}
      <div className="relative group">
        <button className="py-1 px-3 hover:bg-gray-200">File</button>
        <div className="absolute left-0 top-full bg-white shadow-md border border-gray-300 z-10 w-48 hidden group-hover:block">
          <button 
            onClick={newDocument}
            className="block w-full text-left px-4 py-1 hover:bg-blue-600 hover:text-white"
          >
            New <span className="float-right">Ctrl+N</span>
          </button>
          <button 
            onClick={openDocument}
            className="block w-full text-left px-4 py-1 hover:bg-blue-600 hover:text-white"
          >
            Open... <span className="float-right">Ctrl+O</span>
          </button>
          <button 
            onClick={saveDocument}
            className="block w-full text-left px-4 py-1 hover:bg-blue-600 hover:text-white"
          >
            Save <span className="float-right">Ctrl+S</span>
          </button>
          <button 
            onClick={saveAsDocument}
            className="block w-full text-left px-4 py-1 hover:bg-blue-600 hover:text-white"
          >
            Save As...
          </button>
          <div className="border-t border-gray-300 my-1"></div>
          <button 
            onClick={printDocument}
            className="block w-full text-left px-4 py-1 hover:bg-blue-600 hover:text-white"
          >
            Print... <span className="float-right">Ctrl+P</span>
          </button>
          <div className="border-t border-gray-300 my-1"></div>
          <button 
            onClick={() => window.close()}
            className="block w-full text-left px-4 py-1 hover:bg-blue-600 hover:text-white"
          >
            Exit
          </button>
        </div>
      </div>

      {/* Edit Menu */}
      <div className="relative group">
        <button className="py-1 px-3 hover:bg-gray-200">Edit</button>
        <div className="absolute left-0 top-full bg-white shadow-md border border-gray-300 z-10 w-48 hidden group-hover:block">
          <button 
            onClick={() => document.execCommand('undo')}
            className="block w-full text-left px-4 py-1 hover:bg-blue-600 hover:text-white"
          >
            Undo <span className="float-right">Ctrl+Z</span>
          </button>
          <div className="border-t border-gray-300 my-1"></div>
          <button 
            onClick={() => document.execCommand('cut')}
            className="block w-full text-left px-4 py-1 hover:bg-blue-600 hover:text-white"
          >
            Cut <span className="float-right">Ctrl+X</span>
          </button>
          <button 
            onClick={() => document.execCommand('copy')}
            className="block w-full text-left px-4 py-1 hover:bg-blue-600 hover:text-white"
          >
            Copy <span className="float-right">Ctrl+C</span>
          </button>
          <button 
            onClick={() => document.execCommand('paste')}
            className="block w-full text-left px-4 py-1 hover:bg-blue-600 hover:text-white"
          >
            Paste <span className="float-right">Ctrl+V</span>
          </button>
          <button 
            onClick={() => document.execCommand('delete')}
            className="block w-full text-left px-4 py-1 hover:bg-blue-600 hover:text-white"
          >
            Delete <span className="float-right">Del</span>
          </button>
          <div className="border-t border-gray-300 my-1"></div>
          <button 
            onClick={() => {
              const editor = document.getElementById('editor') as HTMLTextAreaElement;
              if (editor) editor.select();
            }}
            className="block w-full text-left px-4 py-1 hover:bg-blue-600 hover:text-white"
          >
            Select All <span className="float-right">Ctrl+A</span>
          </button>
        </div>
      </div>

      {/* Format Menu */}
      <div className="relative group">
        <button className="py-1 px-3 hover:bg-gray-200">Format</button>
        <div className="absolute left-0 top-full bg-white shadow-md border border-gray-300 z-10 w-48 hidden group-hover:block">
          <button 
            onClick={toggleWordWrap}
            className="block w-full text-left px-4 py-1 hover:bg-blue-600 hover:text-white"
          >
            <span>{wordWrap ? '✓ ' : ''}</span>Word Wrap
          </button>
          <button 
            onClick={() => alert('Font dialog would appear here')}
            className="block w-full text-left px-4 py-1 hover:bg-blue-600 hover:text-white"
          >
            Font...
          </button>
        </div>
      </div>

      {/* View Menu */}
      <div className="relative group">
        <button className="py-1 px-3 hover:bg-gray-200">View</button>
        <div className="absolute left-0 top-full bg-white shadow-md border border-gray-300 z-10 w-48 hidden group-hover:block">
          <div className="px-4 py-1 font-bold">Zoom</div>
          <button 
            onClick={zoomIn}
            className="block w-full text-left px-4 py-1 hover:bg-blue-600 hover:text-white"
          >
            Zoom In <span className="float-right">Ctrl++</span>
          </button>
          <button 
            onClick={zoomOut}
            className="block w-full text-left px-4 py-1 hover:bg-blue-600 hover:text-white"
          >
            Zoom Out <span className="float-right">Ctrl+-</span>
          </button>
          <button 
            onClick={resetZoom}
            className="block w-full text-left px-4 py-1 hover:bg-blue-600 hover:text-white"
          >
            Restore Default Zoom <span className="float-right">Ctrl+0</span>
          </button>
          <div className="border-t border-gray-300 my-1"></div>
          <button 
            onClick={toggleStatusBar}
            className="block w-full text-left px-4 py-1 hover:bg-blue-600 hover:text-white"
          >
            <span>{showStatusBar ? '✓ ' : ''}</span>Status Bar
          </button>
        </div>
      </div>

      {/* Help Menu */}
      <div className="relative group">
        <button className="py-1 px-3 hover:bg-gray-200">Help</button>
        <div className="absolute left-0 top-full bg-white shadow-md border border-gray-300 z-10 w-48 hidden group-hover:block">
          <button 
            onClick={showAboutDialog}
            className="block w-full text-left px-4 py-1 hover:bg-blue-600 hover:text-white"
          >
            About Notepad
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuBar;
