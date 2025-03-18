import { FC } from 'react';

interface StatusBarProps {
  line: number;
  column: number;
  wordWrap: boolean;
  zoomLevel: number;
}

const StatusBar: FC<StatusBarProps> = ({ line, column, wordWrap, zoomLevel }) => {
  return (
    <div className="bg-gray-100 border-t border-gray-300 px-3 py-1 text-xs flex justify-between">
      <div>Ln {line}, Col {column}</div>
      <div className="flex space-x-4">
        <div>UTF-8</div>
        <div>Word Wrap: {wordWrap ? 'On' : 'Off'}</div>
        <div>{zoomLevel}%</div>
      </div>
    </div>
  );
};

export default StatusBar;
