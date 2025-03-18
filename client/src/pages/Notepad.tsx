import { useEffect } from "react";
import MenuBar from "@/components/notepad/MenuBar";
import Editor from "@/components/notepad/Editor";
import StatusBar from "@/components/notepad/StatusBar";
import SaveDialog from "@/components/notepad/SaveDialog";
import AboutDialog from "@/components/notepad/AboutDialog";
import useNotepad from "@/hooks/useNotepad";
import { Badge } from "@/components/ui/badge";
import { UserIcon, Users, Wifi, WifiOff } from "lucide-react";

export default function Notepad() {
  const {
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
      showAboutDialog,
      hideSaveDialog,
      hideAboutDialog,
      joinDocument,
      sendCursorPosition
    }
  } = useNotepad();

  // Update document title
  useEffect(() => {
    const unsavedIndicator = state.document.saved ? '' : '* ';
    document.title = `${unsavedIndicator}${state.document.filename} - Notepad`;
  }, [state.document.saved, state.document.filename]);

  // Send cursor position when it changes
  useEffect(() => {
    sendCursorPosition();
  }, [state.cursor, sendCursorPosition]);

  return (
    <div className="font-sans bg-white text-neutral-900 h-screen flex flex-col">
      <MenuBar 
        newDocument={newDocument}
        openDocument={openDocument}
        saveDocument={saveDocument}
        saveAsDocument={showSaveDialog}
        printDocument={() => window.print()}
        wordWrap={state.editor.wordWrap}
        toggleWordWrap={toggleWordWrap}
        showStatusBar={state.editor.showStatusBar}
        toggleStatusBar={toggleStatusBar}
        zoomIn={() => changeZoom(10)}
        zoomOut={() => changeZoom(-10)}
        resetZoom={resetZoom}
        showAboutDialog={showAboutDialog}
      />
      
      {/* Collaboration status */}
      <div className="bg-gray-100 border-b px-3 py-1 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {state.collaboration.connected ? (
            <Badge variant="outline" className="flex items-center gap-1 bg-green-100 text-green-800 border-green-300">
              <Wifi className="h-3 w-3" />
              <span>Connected</span>
            </Badge>
          ) : (
            <Badge variant="destructive" className="flex items-center gap-1">
              <WifiOff className="h-3 w-3" />
              <span>Disconnected</span>
            </Badge>
          )}
          
          <div className="flex items-center gap-1">
            <UserIcon className="h-3 w-3" />
            <span>{state.collaboration.currentUser.username}</span>
          </div>
        </div>
        
        {state.collaboration.activeUsers.length > 0 && (
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>{state.collaboration.activeUsers.length} users collaborating</span>
          </div>
        )}
      </div>
      
      <Editor 
        content={state.document.content}
        wordWrap={state.editor.wordWrap}
        zoomLevel={state.editor.zoomLevel}
        onInput={handleEditorInput}
        onCursorChange={handleCursorPosition}
        onKeyDown={handleKeyDown}
      />
      
      {state.editor.showStatusBar && (
        <StatusBar 
          line={state.cursor.line} 
          column={state.cursor.column}
          wordWrap={state.editor.wordWrap}
          zoomLevel={state.editor.zoomLevel}
        />
      )}
      
      {state.ui.saveDialogOpen && (
        <SaveDialog 
          filename={state.document.filename}
          onSave={downloadFile}
          onCancel={hideSaveDialog}
        />
      )}
      
      {state.ui.aboutDialogOpen && (
        <AboutDialog onClose={hideAboutDialog} />
      )}
    </div>
  );
}
