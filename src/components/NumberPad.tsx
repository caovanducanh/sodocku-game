import React, { memo } from 'react';
import { Edit3, Eraser } from 'lucide-react';

interface NumberPadProps {
  onNumberClick: (number: number) => void;
  onEraseClick: () => void;
  onNotesToggle: () => void;
  isNotesMode: boolean;
  selectedCell: { row: number; col: number } | null;
  onPadNumberSelect?: (number: number) => void;
}

const NumberPad: React.FC<NumberPadProps> = memo(({
  onNumberClick,
  onEraseClick,
  onNotesToggle,
  isNotesMode,
  selectedCell,
  onPadNumberSelect
}) => {
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  return (
    <div className="bg-white rounded-2xl md:rounded-3xl shadow-2xl p-2 sm:p-4 md:p-6 border border-gray-200 max-w-full">
      <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-2 sm:mb-4 text-center">Number Pad</h3>
      
      {/* Number Grid */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-6">
        {numbers.map((number) => (
          <button
            key={number}
            onClick={(e) => {
              if (onPadNumberSelect && (e.type === 'contextmenu' || e.shiftKey)) {
                e.preventDefault();
                onPadNumberSelect(number);
              } else {
                onNumberClick(number);
              }
            }}
            onContextMenu={onPadNumberSelect ? (e) => { e.preventDefault(); onPadNumberSelect(number); } : undefined}
            disabled={!selectedCell}
            className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl font-bold text-xl sm:text-2xl transition-all duration-200 transform hover:scale-105 shadow-md sm:shadow-lg select-none ${
              selectedCell
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 hover:shadow-xl active:scale-95'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {number}
          </button>
        ))}
      </div>
      
      {/* Control Buttons */}
      <div className="space-y-2 sm:space-y-3">
        <button
          onClick={onEraseClick}
          disabled={!selectedCell}
          className={`w-full flex items-center justify-center gap-2 h-10 sm:h-12 rounded-xl sm:rounded-2xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-md sm:shadow-lg select-none ${
            selectedCell
              ? 'bg-gradient-to-br from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 hover:shadow-xl active:scale-95'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          <Eraser size={20} />
          Erase
        </button>
        
        <button
          onClick={onNotesToggle}
          className={`w-full flex items-center justify-center gap-2 h-10 sm:h-12 rounded-xl sm:rounded-2xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-md sm:shadow-lg select-none ${
            isNotesMode
              ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-xl'
              : 'bg-gradient-to-br from-gray-500 to-gray-600 text-white hover:from-gray-600 hover:to-gray-700 hover:shadow-xl active:scale-95'
          }`}
        >
          <Edit3 size={20} />
          {isNotesMode ? 'Notes ON' : 'Notes OFF'}
        </button>
      </div>
      
      {/* Mode Indicator */}
      <div className="mt-2 sm:mt-4 text-center">
        <div className={`inline-flex items-center gap-2 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium select-none ${
          isNotesMode 
            ? 'bg-purple-100 text-purple-700' 
            : 'bg-gray-100 text-gray-600'
        }`}>
          <Edit3 size={14} />
          {isNotesMode ? 'Notes Mode Active' : 'Number Mode Active'}
        </div>
      </div>
    </div>
  );
});

export default NumberPad;