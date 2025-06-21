import React, { memo } from 'react';
import { SudokuCell } from '../types/sudoku';

interface CellProps {
  cell: SudokuCell;
  row: number;
  col: number;
  selectedCell: { row: number; col: number } | null;
  selectedNumber?: number | null;
  onCellClick: (row: number, col: number) => void;
}

const renderNotes = (notes: Set<number>) => {
  if (notes.size === 0) return null;
  return (
    <div className="absolute inset-0 grid grid-cols-3 gap-0 text-xs text-gray-500 p-1">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
        <div key={num} className="flex items-center justify-center h-3 text-[10px] font-medium">
          {notes.has(num) ? num : ''}
        </div>
      ))}
    </div>
  );
};

const getCellClassName = (row: number, col: number, cell: SudokuCell, selectedCell: { row: number; col: number } | null, selectedNumber?: number | null) => {
  let className = 'w-10 sm:w-14 md:w-16 aspect-square border border-white/80 flex items-center justify-center text-base sm:text-lg md:text-xl font-bold cursor-pointer transition-all duration-200 relative select-none rounded-md shadow-sm';

  if (cell.isError) {
    className += ' bg-gradient-to-br from-red-100 to-red-200 text-red-700 border-red-300';
  } else if (selectedCell?.row === row && selectedCell?.col === col) {
    className += ' bg-gradient-to-br from-blue-400 to-blue-500 text-white shadow-xl scale-105 z-10 border-blue-600';
  } else if ((selectedNumber && cell.value === selectedNumber) || cell.isHighlighted) {
    className += ' bg-gradient-to-br from-yellow-100 to-yellow-200 border-yellow-400 shadow-md';
  } else if (cell.isGiven) {
    className += ' bg-gradient-to-br from-gray-100 to-gray-200 text-gray-800 font-extrabold';
  } else {
    className += ' bg-white text-blue-600 hover:bg-gradient-to-br hover:from-blue-50 hover:to-blue-100 hover:border-blue-200';
  }
  return className;
};

const Cell: React.FC<CellProps> = memo(({ cell, row, col, selectedCell, selectedNumber, onCellClick }) => {
  const className = getCellClassName(row, col, cell, selectedCell, selectedNumber) +
                    (cell.isShaking ? ' animate-shake' : '') +
                    (cell.isCorrect ? ' animate-pop' : '');

  return (
    <button
      className={className}
      onClick={() => onCellClick(row, col)}
    >
      {cell.value !== 0 ? (
        <span className={
          `${cell.isGiven ? 'font-black' : 'font-bold'} drop-shadow-sm select-none ` +
          (cell.isError ? 'text-red-700' : '')
        }>
          {cell.value}
        </span>
      ) : (
        renderNotes(cell.notes)
      )}
    </button>
  );
});

interface SudokuGridProps {
  grid: SudokuCell[][];
  selectedCell: { row: number; col: number } | null;
  onCellClick: (row: number, col: number) => void;
  selectedNumber?: number | null;
}

const SudokuGrid: React.FC<SudokuGridProps> = memo(({ grid, selectedCell, onCellClick, selectedNumber }) => {
  return (
    <div className="bg-gradient-to-br from-slate-900 to-purple-900 rounded-2xl md:rounded-3xl shadow-2xl p-2 sm:p-4 md:p-6 border border-gray-900/30 max-w-full overflow-x-auto">
      <div className="grid grid-cols-9 gap-2 sm:gap-2.5 md:gap-3 rounded-2xl md:rounded-3xl overflow-visible">
        {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <Cell
              key={`${rowIndex}-${colIndex}`}
              cell={cell}
              row={rowIndex}
              col={colIndex}
              selectedCell={selectedCell}
              selectedNumber={selectedNumber}
              onCellClick={onCellClick}
            />
          ))
        )}
      </div>
    </div>
  );
});

export default SudokuGrid;