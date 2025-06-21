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
  let className = 'w-9 h-9 sm:w-12 sm:h-12 md:w-14 md:h-14 flex items-center justify-center text-base sm:text-lg md:text-xl font-bold cursor-pointer transition-colors duration-150 relative select-none';

  // --- Background Color & Effects ---
  if (cell.isError) {
    className += ' bg-red-300 text-white';
  } else if (selectedCell?.row === row && selectedCell?.col === col) {
    className += ' bg-blue-400 rounded-sm'; // Selected cell is blue
  } else if ((selectedNumber && cell.value === selectedNumber && cell.value !== 0) || cell.isHighlighted) {
    className += ' bg-yellow-200'; // Highlighted cells are yellow
  } else {
    className += ' bg-white hover:bg-slate-100';
    // Subtle inset shadow for 3D effect on default cells
    className += ' shadow-[inset_0_1px_3px_rgba(0,0,0,0.15)]';
  }

  // --- Font Style ---
  if (cell.isGiven) {
    className += ' text-slate-700';
  } else if (!cell.isError) {
    className += ' text-blue-600';
  }
  
  // --- Border Logic ---
  // Thin borders separating cells
  className += ' border-b border-r border-slate-200';
  // Thick borders for 3x3 boxes
  if (row % 3 === 0) className += ' border-t-2 border-slate-700';
  if (col % 3 === 0) className += ' border-l-2 border-slate-700';
  if (row === 8) className += ' border-b-2 border-slate-700';
  if (col === 8) className += ' border-r-2 border-slate-700';
  
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
    <div className="bg-slate-700 rounded-lg shadow-2xl p-1 sm:p-2 border border-purple-300/20">
      <div className="grid grid-cols-9">
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