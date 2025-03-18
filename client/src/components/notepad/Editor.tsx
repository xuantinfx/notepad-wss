import { FC, useRef, useEffect } from 'react';

interface EditorProps {
  content: string;
  wordWrap: boolean;
  zoomLevel: number;
  onInput: (value: string) => void;
  onCursorChange: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

const Editor: FC<EditorProps> = ({
  content,
  wordWrap,
  zoomLevel,
  onInput,
  onCursorChange,
  onKeyDown
}) => {
  const editorRef = useRef<HTMLTextAreaElement>(null);

  // Update editor styles on prop changes
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.style.whiteSpace = wordWrap ? 'pre-wrap' : 'pre';
      editorRef.current.style.fontSize = `${(zoomLevel / 100) * 14}px`;
    }
  }, [wordWrap, zoomLevel]);

  return (
    <textarea
      id="editor"
      ref={editorRef}
      className="flex-grow p-2 font-mono text-sm h-full w-full border-0 resize-none outline-none overflow-y-auto"
      style={{
        whiteSpace: wordWrap ? 'pre-wrap' : 'pre',
        fontSize: `${(zoomLevel / 100) * 14}px`,
      }}
      value={content}
      onChange={(e) => onInput(e.target.value)}
      onClick={onCursorChange}
      onKeyUp={onCursorChange}
      onKeyDown={onKeyDown}
      spellCheck={false}
    />
  );
};

export default Editor;
