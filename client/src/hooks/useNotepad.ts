import { useState, useEffect, useCallback, useRef } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { v4 as uuidv4 } from 'uuid';
import { Document } from '@shared/schema';

// For typechecking WebSocket messages
type WSMessage = {
  type: 'update' | 'sync' | 'join' | 'user_info';
  documentId?: number;
  content?: string;
  filename?: string;
  userId?: string;
  username?: string;
  cursor?: { line: number; column: number };
}

interface NotepadState {
  document: {
    id?: number;
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
    documentListOpen: boolean;
  };
  collaboration: {
    connected: boolean;
    activeUsers: {
      userId: string;
      username: string;
      cursor?: { line: number; column: number };
    }[];
    currentUser: {
      userId: string;
      username: string;
    }
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
  const socketRef = useRef<WebSocket | null>(null);
  const [state, setState] = useState<NotepadState>({
    document: {
      id: undefined,
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
      aboutDialogOpen: false,
      documentListOpen: false
    },
    collaboration: {
      connected: false,
      activeUsers: [],
      currentUser: {
        userId: uuidv4(),
        username: `User-${Math.floor(Math.random() * 1000)}`
      }
    }
  });

  // Setup WebSocket connection
  useEffect(() => {
    // Initialize WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    // Connection opened
    socket.addEventListener('open', () => {
      console.log('WebSocket connection established');
      setState(prev => ({
        ...prev,
        collaboration: {
          ...prev.collaboration,
          connected: true
        }
      }));
      
      // If we already have a document ID, join that document
      if (state.document.id) {
        joinDocument(state.document.id);
      }
    });

    // Listen for messages
    socket.addEventListener('message', (event) => {
      try {
        const message: WSMessage = JSON.parse(event.data);
        
        switch (message.type) {
          case 'sync':
            // Update our document with the latest state from the server
            if (message.documentId && message.content !== undefined) {
              setState(prev => ({
                ...prev,
                document: {
                  ...prev.document,
                  id: message.documentId,
                  content: message.content || '',
                  filename: message.filename || prev.document.filename,
                  saved: true
                }
              }));
            }
            break;
            
          case 'update':
            // Another user has updated the document
            if (message.content !== undefined) {
              setState(prev => ({
                ...prev,
                document: {
                  ...prev.document,
                  content: message.content || '',
                  saved: false
                }
              }));
            }
            break;
            
          case 'user_info':
            // Update the active users list
            if (message.userId && message.username) {
              setState(prev => {
                // Check if user already exists in the list
                const userExists = prev.collaboration.activeUsers.some(
                  user => user.userId === message.userId
                );
                
                if (!userExists) {
                  return {
                    ...prev,
                    collaboration: {
                      ...prev.collaboration,
                      activeUsers: [
                        ...prev.collaboration.activeUsers,
                        {
                          userId: message.userId!,
                          username: message.username!,
                          cursor: message.cursor
                        }
                      ]
                    }
                  };
                }
                
                // Update existing user info
                return {
                  ...prev,
                  collaboration: {
                    ...prev.collaboration,
                    activeUsers: prev.collaboration.activeUsers.map(user => 
                      user.userId === message.userId
                        ? { ...user, cursor: message.cursor }
                        : user
                    )
                  }
                };
              });
            }
            break;
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });

    // Connection closed
    socket.addEventListener('close', () => {
      console.log('WebSocket connection closed');
      setState(prev => ({
        ...prev,
        collaboration: {
          ...prev.collaboration,
          connected: false
        }
      }));
    });

    // Connection error
    socket.addEventListener('error', (error) => {
      console.error('WebSocket error:', error);
      setState(prev => ({
        ...prev,
        collaboration: {
          ...prev.collaboration,
          connected: false
        }
      }));
    });

    // Cleanup function
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  // Load auto-saved content on startup
  useEffect(() => {
    try {
      const savedContent = localStorage.getItem('notepad_content');
      const savedFilename = localStorage.getItem('notepad_filename');
      const savedDocumentId = localStorage.getItem('notepad_document_id');
      
      if (savedContent) {
        setState(prev => {
          const documentId = savedDocumentId ? parseInt(savedDocumentId) : undefined;
          return {
            ...prev,
            document: {
              ...prev.document,
              id: documentId,
              content: savedContent,
              filename: savedFilename || prev.document.filename
            }
          };
        });
        
        // If we have a document ID and socket is connected, join that document
        if (savedDocumentId && socketRef.current?.readyState === WebSocket.OPEN) {
          joinDocument(parseInt(savedDocumentId));
        }
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
        if (state.document.id) {
          localStorage.setItem('notepad_document_id', state.document.id.toString());
        }
      }
    }, 5000);

    return () => clearInterval(autoSaveInterval);
  }, [state.document.content, state.document.filename, state.document.saved, state.document.id]);

  // Join a document editing session
  const joinDocument = useCallback((documentId: number) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'join',
        documentId,
        userId: state.collaboration.currentUser.userId,
        username: state.collaboration.currentUser.username
      }));
    }
  }, [state.collaboration.currentUser]);

  // Send cursor position to other users
  const sendCursorPosition = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN && state.document.id) {
      socketRef.current.send(JSON.stringify({
        type: 'user_info',
        documentId: state.document.id,
        userId: state.collaboration.currentUser.userId,
        username: state.collaboration.currentUser.username,
        cursor: state.cursor
      }));
    }
  }, [state.document.id, state.collaboration.currentUser, state.cursor]);

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
    
    // Broadcast the change to other users
    if (socketRef.current?.readyState === WebSocket.OPEN && state.document.id) {
      socketRef.current.send(JSON.stringify({
        type: 'update',
        documentId: state.document.id,
        content: value,
        userId: state.collaboration.currentUser.userId
      }));
    }
  }, [state.document.id, state.collaboration.currentUser]);

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
      
      // We don't call sendCursorPosition here because that's done in the useEffect
      // in the Notepad component to avoid excessive WebSocket traffic
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
  const newDocument = useCallback(async () => {
    // Clear the local document first
    setState(prev => ({
      ...prev,
      document: {
        id: undefined,
        content: '',
        filename: 'Untitled',
        saved: true
      }
    }));
    
    // Create a new document on the server for collaboration
    try {
      const response = await apiRequest<Document>('/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filename: 'Untitled',
          content: '',
          lastModified: new Date().toISOString()
        })
      });
      
      if (response && response.id) {
        setState(prev => ({
          ...prev,
          document: {
            ...prev.document,
            id: response.id
          }
        }));
        
        // Join the document for collaboration
        if (socketRef.current?.readyState === WebSocket.OPEN) {
          joinDocument(response.id);
        }
      }
    } catch (error) {
      console.error('Failed to create document on server:', error);
    }
  }, [joinDocument]);

  // Open a document
  const openDocument = useCallback(async () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.txt';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);
    
    fileInput.addEventListener('change', async function() {
      if (fileInput.files && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const reader = new FileReader();
        
        reader.onload = async function(e) {
          if (e.target && typeof e.target.result === 'string') {
            const fileContent = e.target.result as string;
            // First update local state
            setState(prev => ({
              ...prev,
              document: {
                id: undefined, // Clear any previous ID
                content: fileContent,
                filename: file.name,
                saved: true
              }
            }));
            
            // Create a document on the server for collaboration
            try {
              const response = await apiRequest<Document>('/api/documents', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  filename: file.name,
                  content: fileContent,
                  lastModified: new Date().toISOString()
                })
              });
              
              if (response && response.id) {
                setState(prev => ({
                  ...prev,
                  document: {
                    ...prev.document,
                    id: response.id
                  }
                }));
                
                // Join the document for collaboration
                if (socketRef.current?.readyState === WebSocket.OPEN) {
                  joinDocument(response.id);
                }
              }
            } catch (error) {
              console.error('Failed to create document on server:', error);
            }
          }
        };
        
        reader.readAsText(file);
      }
      document.body.removeChild(fileInput);
    });
    
    fileInput.click();
  }, [joinDocument]);

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
  
  // Show collaborative documents dialog
  const showCollaborativeDocuments = useCallback(() => {
    setState(prev => ({
      ...prev,
      ui: {
        ...prev.ui,
        documentListOpen: true
      }
    }));
  }, []);
  
  // Hide collaborative documents dialog
  const hideDocumentList = useCallback(() => {
    setState(prev => ({
      ...prev,
      ui: {
        ...prev.ui,
        documentListOpen: false
      }
    }));
  }, []);
  
  // Load a collaborative document
  const loadCollaborativeDocument = useCallback((document: Document) => {
    setState(prev => ({
      ...prev,
      document: {
        id: document.id,
        content: document.content,
        filename: document.filename,
        saved: true
      },
      ui: {
        ...prev.ui,
        documentListOpen: false
      }
    }));
    
    // Join the document for collaboration
    if (socketRef.current?.readyState === WebSocket.OPEN && document.id) {
      joinDocument(document.id);
    }
  }, [joinDocument]);

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
      hideAboutDialog,
      showCollaborativeDocuments,
      hideDocumentList,
      loadCollaborativeDocument,
      joinDocument,
      sendCursorPosition
    }
  };
};

export default useNotepad;
