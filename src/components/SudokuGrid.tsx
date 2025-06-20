import React from 'react';
import { SudokuCell } from '../types/sudoku';

interface SudokuGridProps {
  grid: SudokuCell[][];
  selectedCell: { row: number; col: number } | null;
  onCellClick: (row: number, col: number) => void;
  selectedNumber?: number | null;
}

const SudokuGrid: React.FC<SudokuGridProps> = ({ grid, selectedCell, onCellClick, selectedNumber }) => {
  const getCellClassName = (row: number, col: number, cell: SudokuCell) => {
    let className = 'w-9 h-9 sm:w-12 sm:h-12 md:w-14 md:h-14 border border-gray-300 flex items-center justify-center text-base sm:text-lg md:text-xl font-bold cursor-pointer transition-all duration-200 relative select-none rounded-lg md:rounded-2xl shadow-sm md:shadow-lg';
    
    // Thick borders for 3x3 boxes
    if (row % 3 === 0) className += ' border-t-4 border-t-gray-800';
    if (col % 3 === 0) className += ' border-l-4 border-l-gray-800';
    if (row === 8) className += ' border-b-4 border-b-gray-800';
    if (col === 8) className += ' border-r-4 border-r-gray-800';
    
    // Cell states with beautiful colors
    if (selectedCell?.row === row && selectedCell?.col === col) {
      className += ' bg-gradient-to-br from-blue-400 to-blue-500 text-white shadow-xl scale-105 z-10 border-blue-600';
    } else if ((selectedNumber && cell.value === selectedNumber) || cell.isHighlighted) {
      className += ' bg-gradient-to-br from-yellow-100 to-yellow-200 border-yellow-400 shadow-md';
    } else if (cell.isError) {
      className += ' bg-gradient-to-br from-red-100 to-red-200 text-red-700 border-red-300';
    } else if (cell.isGiven) {
      className += ' bg-gradient-to-br from-gray-100 to-gray-200 text-gray-800 font-extrabold';
    } else {
      className += ' bg-white text-blue-600 hover:bg-gradient-to-br hover:from-blue-50 hover:to-blue-100 hover:border-blue-200';
    }
    
    return className;
  };

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

  return (
    <div className="bg-white rounded-2xl md:rounded-3xl shadow-2xl p-2 sm:p-4 md:p-6 border border-gray-200 max-w-full overflow-x-auto">
      <div className="grid grid-cols-9 gap-[2px] border-4 border-gray-800 rounded-xl md:rounded-2xl overflow-hidden shadow-inner">
        {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <button
              key={`${rowIndex}-${colIndex}`}
              className={getCellClassName(rowIndex, colIndex, cell)}
              onClick={() => onCellClick(rowIndex, colIndex)}
            >
              {cell.value !== 0 ? (
                <span className={`${cell.isGiven ? 'font-black' : 'font-bold'} drop-shadow-sm select-none`}>
                  {cell.value}
                </span>
              ) : (
                renderNotes(cell.notes)
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default SudokuGrid;