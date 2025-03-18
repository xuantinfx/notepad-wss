import { useEffect } from "react";
import MenuBar from "@/components/notepad/MenuBar";
import Editor from "@/components/notepad/Editor";
import StatusBar from "@/components/notepad/StatusBar";
import SaveDialog from "@/components/notepad/SaveDialog";
import AboutDialog from "@/components/notepad/AboutDialog";
import useNotepad from "@/hooks/useNotepad";

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
      hideAboutDialog
    }
  } = useNotepad();

  // Update document title
  useEffect(() => {
    const unsavedIndicator = state.document.saved ? '' : '* ';
    document.title = `${unsavedIndicator}${state.document.filename} - Notepad`;
  }, [state.document.saved, state.document.filename]);

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
