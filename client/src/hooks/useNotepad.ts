import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '@/lib/queryClient';

interface NotepadState {
  document: {
    content: string;
    filename: string;
    saved: boolean;
  };
  editor: {
    wordWrap: boolean;
    showStatusBar: boolean;
    zoomLevel: number;
  };
  cursor: {
    line: number;
    column: number;
  };
  ui: {
    saveDialogOpen: boolean;
    aboutDialogOpen: boolean;
  };
}

const DEFAULT_TEXT = `This is a Notepad clone application.

Features:
- Text editing with auto-saving
- File operations (New, Open, Save)
- Edit functions (Cut, Copy, Paste)
- Format options
- Word wrapping
- Status bar with cursor position

Try using keyboard shortcuts:
- Ctrl+S to save
- Ctrl+C to copy
- Ctrl+V to paste
- Ctrl+Z to undo
- Ctrl+A to select all
`;

const useNotepad = () => {
  const [state, setState] = useState<NotepadState>({
    document: {
      content: DEFAULT_TEXT,
      filename: 'Untitled',
      saved: true
    },
    editor: {
      wordWrap: true,
      showStatusBar: true,
      zoomLevel: 100
    },
    cursor: {
      line: 1,
      column: 1
    },
    ui: {
      saveDialogOpen: false,
      aboutDialogOpen: false
    }
  });

  // Load auto-saved content on startup
  useEffect(() => {
    try {
      const savedContent = localStorage.getItem('notepad_content');
      const savedFilename = localStorage.getItem('notepad_filename');
      
      if (savedContent) {
        setState(prev => ({
          ...prev,
          document: {
            ...prev.document,
            content: savedContent,
            filename: savedFilename || prev.document.filename
          }
        }));
      }
    } catch (error) {
      console.error('Error loading auto-saved content', error);
    }
  }, []);

  // Auto-save content periodically
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (!state.document.saved) {
        localStorage.setItem('notepad_content', state.document.content);
        localStorage.setItem('notepad_filename', state.document.filename);
      }
    }, 5000);

    return () => clearInterval(autoSaveInterval);
  }, [state.document.content, state.document.filename, state.document.saved]);

  // Editor input handler
  const handleEditorInput = useCallback((value: string) => {
    setState(prev => ({
      ...prev,
      document: {
        ...prev.document,
        content: value,
        saved: false
      }
    }));
  }, []);

  // Update cursor position
  const handleCursorPosition = useCallback(() => {
    const editor = document.getElementById('editor') as HTMLTextAreaElement;
    if (editor) {
      const text = editor.value.substring(0, editor.selectionStart);
      const lines = text.split('\n');
      const lineCount = lines.length;
      const columnCount = lines[lines.length - 1].length + 1;
      
      setState(prev => ({
        ...prev,
        cursor: {
          line: lineCount,
          column: columnCount
        }
      }));
    }
  }, []);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Ctrl + S (Save)
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      if (state.document.filename === 'Untitled') {
        setState(prev => ({
          ...prev,
          ui: {
            ...prev.ui,
            saveDialogOpen: true
          }
        }));
      } else {
        downloadFile(state.document.filename);
      }
    }
    // Ctrl + N (New)
    else if (e.ctrlKey && e.key === 'n') {
      e.preventDefault();
      newDocument();
    }
    // Ctrl + O (Open)
    else if (e.ctrlKey && e.key === 'o') {
      e.preventDefault();
      openDocument();
    }
    // Ctrl + P (Print)
    else if (e.ctrlKey && e.key === 'p') {
      e.preventDefault();
      window.print();
    }
    // Ctrl + Plus (Zoom In)
    else if (e.ctrlKey && (e.key === '+' || e.key === '=')) {
      e.preventDefault();
      changeZoom(10);
    }
    // Ctrl + Minus (Zoom Out)
    else if (e.ctrlKey && e.key === '-') {
      e.preventDefault();
      changeZoom(-10);
    }
    // Ctrl + 0 (Reset Zoom)
    else if (e.ctrlKey && e.key === '0') {
      e.preventDefault();
      resetZoom();
    }
  }, [state.document.filename]);

  // Toggle word wrap
  const toggleWordWrap = useCallback(() => {
    setState(prev => ({
      ...prev,
      editor: {
        ...prev.editor,
        wordWrap: !prev.editor.wordWrap
      }
    }));
  }, []);

  // Toggle status bar
  const toggleStatusBar = useCallback(() => {
    setState(prev => ({
      ...prev,
      editor: {
        ...prev.editor,
        showStatusBar: !prev.editor.showStatusBar
      }
    }));
  }, []);

  // Change zoom level
  const changeZoom = useCallback((amount: number) => {
    setState(prev => ({
      ...prev,
      editor: {
        ...prev.editor,
        zoomLevel: Math.max(10, Math.min(500, prev.editor.zoomLevel + amount))
      }
    }));
  }, []);

  // Reset zoom
  const resetZoom = useCallback(() => {
    setState(prev => ({
      ...prev,
      editor: {
        ...prev.editor,
        zoomLevel: 100
      }
    }));
  }, []);

  // Create a new document
  const newDocument = useCallback(() => {
    setState(prev => ({
      ...prev,
      document: {
        content: '',
        filename: 'Untitled',
        saved: true
      }
    }));
  }, []);

  // Open a document
  const openDocument = useCallback(() => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.txt';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);
    
    fileInput.addEventListener('change', function() {
      if (fileInput.files && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const reader = new FileReader();
        
        reader.onload = function(e) {
          if (e.target && typeof e.target.result === 'string') {
            setState(prev => ({
              ...prev,
              document: {
                content: e.target?.result as string || '',
                filename: file.name,
                saved: true
              }
            }));
          }
        };
        
        reader.readAsText(file);
      }
      document.body.removeChild(fileInput);
    });
    
    fileInput.click();
  }, []);

  // Save document
  const saveDocument = useCallback(() => {
    if (state.document.filename === 'Untitled') {
      setState(prev => ({
        ...prev,
        ui: {
          ...prev.ui,
          saveDialogOpen: true
        }
      }));
    } else {
      downloadFile(state.document.filename);
    }
  }, [state.document.filename]);

  // Save As document
  const saveAsDocument = useCallback(() => {
    setState(prev => ({
      ...prev,
      ui: {
        ...prev.ui,
        saveDialogOpen: true
      }
    }));
  }, []);

  // Download file
  const downloadFile = useCallback((filename: string) => {
    const blob = new Blob([state.document.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    
    setState(prev => ({
      ...prev,
      document: {
        ...prev.document,
        filename: filename,
        saved: true
      },
      ui: {
        ...prev.ui,
        saveDialogOpen: false
      }
    }));
  }, [state.document.content]);

  // Show save dialog
  const showSaveDialog = useCallback(() => {
    setState(prev => ({
      ...prev,
      ui: {
        ...prev.ui,
        saveDialogOpen: true
      }
    }));
  }, []);

  // Hide save dialog
  const hideSaveDialog = useCallback(() => {
    setState(prev => ({
      ...prev,
      ui: {
        ...prev.ui,
        saveDialogOpen: false
      }
    }));
  }, []);

  // Show about dialog
  const showAboutDialog = useCallback(() => {
    setState(prev => ({
      ...prev,
      ui: {
        ...prev.ui,
        aboutDialogOpen: true
      }
    }));
  }, []);

  // Hide about dialog
  const hideAboutDialog = useCallback(() => {
    setState(prev => ({
      ...prev,
      ui: {
        ...prev.ui,
        aboutDialogOpen: false
      }
    }));
  }, []);

  return {
    state,
    actions: {
      handleEditorInput,
      handleCursorPosition,
      handleKeyDown,
      toggleWordWrap,
      toggleStatusBar,
      changeZoom,
      resetZoom,
      newDocument,
      openDocument,
      saveDocument,
      saveAsDocument,
      downloadFile,
      showSaveDialog,
      hideSaveDialog,
      showAboutDialog,
      hideAboutDialog
    }
  };
};

export default useNotepad;
