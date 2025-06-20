import React, { useState, useEffect, useCallback } from 'react';
import { SudokuGenerator } from './utils/sudokuGenerator';
import { GameState, SudokuCell, Difficulty } from './types/sudoku';
import SudokuGrid from './components/SudokuGrid';
import NumberPad from './components/NumberPad';
import GameControls from './components/GameControls';
import DifficultySelector from './components/DifficultySelector';
import WinDialog from './components/WinDialog';

function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [showDifficultySelector, setShowDifficultySelector] = useState(true);
  const [sudokuGenerator] = useState(new SudokuGenerator());
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);

  // Initialize a new game with random puzzle generation
  const initializeGame = useCallback((difficulty: Difficulty) => {
    const solution = sudokuGenerator.generateComplete();
    const puzzle = sudokuGenerator.createPuzzle(solution, difficulty);
    
    const grid: SudokuCell[][] = puzzle.map(row =>
      row.map(cell => ({
        value: cell,
        isGiven: cell !== 0,
        notes: new Set<number>(),
        isHighlighted: false,
        isError: false,
        isSelected: false,
      }))
    );

    setGameState({
      grid,
      solution,
      selectedCell: null,
      difficulty,
      startTime: Date.now(),
      elapsedTime: 0,
      mistakes: 0,
      hintsUsed: 0,
      isCompleted: false,
      isPaused: false,
      isNotesMode: false,
    });
  }, [sudokuGenerator]);

  // Update elapsed time
  useEffect(() => {
    if (!gameState || gameState.isCompleted || gameState.isPaused) return;

    const timer = setInterval(() => {
      setGameState(prev => prev ? {
        ...prev,
        elapsedTime: Math.floor((Date.now() - prev.startTime) / 1000)
      } : null);
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState?.isCompleted, gameState?.isPaused, gameState?.startTime]);

  // Check if puzzle is completed
  const checkCompletion = useCallback((grid: number[][]) => {
    return grid.every(row => 
      row.every(cell => cell !== 0)
    );
  }, []);

  // Update cell highlighting for better UX
  const updateHighlighting = useCallback((grid: SudokuCell[][], selectedRow: number, selectedCol: number) => {
    const selectedValue = grid[selectedRow][selectedCol].value;
    
    const newGrid = grid.map((row, rowIndex) =>
      row.map((cell, colIndex) => ({
        ...cell,
        isHighlighted: 
          rowIndex === selectedRow || 
          colIndex === selectedCol || 
          (Math.floor(rowIndex / 3) === Math.floor(selectedRow / 3) && 
           Math.floor(colIndex / 3) === Math.floor(selectedCol / 3)) ||
          (selectedValue !== 0 && cell.value === selectedValue),
        isSelected: rowIndex === selectedRow && colIndex === selectedCol,
      }))
    );
    return newGrid;
  }, []);

  // Handle cell click
  const handleCellClick = useCallback((row: number, col: number) => {
    if (!gameState || gameState.isCompleted || gameState.isPaused) return;

    const clickedValue = gameState.grid[row][col].value;
    let newGrid;
    if (clickedValue !== 0) {
      // Highlight tất cả cell có value === clickedValue
      newGrid = gameState.grid.map(rowArr =>
        rowArr.map(cell => ({
          ...cell,
          isHighlighted: cell.value === clickedValue
        }))
      );
      setSelectedNumber(null); // reset selectedNumber khi click vào cell
    } else {
      // Nếu là ô trống thì dùng highlight mặc định
      newGrid = updateHighlighting(gameState.grid, row, col);
    }

    setGameState(prev => prev ? {
      ...prev,
      grid: newGrid,
      selectedCell: { row, col },
      isCompleted: checkCompletion(newGrid.map(row => row.map(cell => cell.value)))
    } : null);
  }, [gameState, updateHighlighting, checkCompletion]);

  // Handle number input with validation
  const handleNumberClick = useCallback((number: number) => {
    setSelectedNumber(null);
    if (!gameState || !gameState.selectedCell || gameState.isCompleted || gameState.isPaused) return;

    const { row, col } = gameState.selectedCell;
    const cell = gameState.grid[row][col];
    
    if (cell.isGiven) return;

    const newGrid = [...gameState.grid];
    
    if (gameState.isNotesMode) {
      // Toggle note
      const newNotes = new Set(cell.notes);
      if (newNotes.has(number)) {
        newNotes.delete(number);
      } else {
        newNotes.add(number);
      }
      newGrid[row][col] = { ...cell, notes: newNotes };
    } else {
      // Place number
      const isValid = sudokuGenerator.isValidMove(newGrid, row, col, number);
      const isCorrect = gameState.solution[row][col] === number;
      
      newGrid[row][col] = {
        ...cell,
        value: number,
        notes: new Set(),
        isError: !isValid || !isCorrect
      };

      let newMistakes = gameState.mistakes;
      if (!isValid || !isCorrect) {
        newMistakes++;
      }

      const isCompleted = checkCompletion(newGrid.map(row => row.map(cell => cell.value)));
      
      setGameState(prev => prev ? {
        ...prev,
        grid: updateHighlighting(newGrid, row, col),
        mistakes: newMistakes,
        isCompleted
      } : null);
      
      return;
    }

    setGameState(prev => prev ? {
      ...prev,
      grid: newGrid
    } : null);
  }, [gameState, sudokuGenerator, checkCompletion, updateHighlighting]);

  // Handle erase
  const handleErase = useCallback(() => {
    if (!gameState || !gameState.selectedCell || gameState.isCompleted || gameState.isPaused) return;

    const { row, col } = gameState.selectedCell;
    const cell = gameState.grid[row][col];
    
    if (cell.isGiven) return;

    const newGrid = [...gameState.grid];
    newGrid[row][col] = {
      ...cell,
      value: 0,
      notes: new Set(),
      isError: false,
    };

    setGameState(prev => prev ? {
      ...prev,
      grid: updateHighlighting(newGrid, row, col)
    } : null);
  }, [gameState, updateHighlighting]);

  // Handle notes toggle
  const handleNotesToggle = useCallback(() => {
    if (!gameState || gameState.isCompleted || gameState.isPaused) return;

    setGameState(prev => prev ? {
      ...prev,
      isNotesMode: !prev.isNotesMode
    } : null);
  }, [gameState]);

  // Handle hint
  const handleHint = useCallback(() => {
    if (!gameState || !gameState.selectedCell || gameState.isCompleted || gameState.isPaused) return;

    const { row, col } = gameState.selectedCell;
    const cell = gameState.grid[row][col];
    
    if (cell.isGiven || cell.value !== 0) return;

    const correctValue = gameState.solution[row][col];
    const newGrid = [...gameState.grid];
    newGrid[row][col] = {
      ...cell,
      value: correctValue,
      notes: new Set(),
      isError: false,
    };

    const isCompleted = checkCompletion(newGrid.map(row => row.map(cell => cell.value)));

    setGameState(prev => prev ? {
      ...prev,
      grid: updateHighlighting(newGrid, row, col),
      hintsUsed: prev.hintsUsed + 1,
      isCompleted
    } : null);
  }, [gameState, checkCompletion, updateHighlighting]);

  // Handle pause toggle
  const handlePauseToggle = useCallback(() => {
    if (!gameState || gameState.isCompleted) return;

    setGameState(prev => prev ? {
      ...prev,
      isPaused: !prev.isPaused,
      startTime: prev.isPaused ? Date.now() - prev.elapsedTime * 1000 : prev.startTime
    } : null);
  }, [gameState]);

  // Handle restart
  const handleRestart = useCallback(() => {
    if (!gameState) return;
    initializeGame(gameState.difficulty);
  }, [gameState, initializeGame]);

  // Handle new game
  const handleNewGame = useCallback(() => {
    setShowDifficultySelector(true);
    setGameState(null);
  }, []);

  // Start game with selected difficulty
  const handleStartGame = useCallback((difficulty: Difficulty) => {
    initializeGame(difficulty);
    setShowDifficultySelector(false);
  }, [initializeGame]);

  // Hàm mới: highlight các số giống nhau khi click NumberPad
  const handlePadNumberSelect = useCallback((number: number) => {
    setSelectedNumber(number);
    if (!gameState) return;
    // Highlight tất cả cell có value === number
    const newGrid = gameState.grid.map(row =>
      row.map(cell => ({
        ...cell,
        isHighlighted: cell.value === number && number !== 0
      }))
    );
    setGameState(prev => prev ? {
      ...prev,
      grid: newGrid
    } : null);
  }, [gameState]);

  if (showDifficultySelector) {
    return <DifficultySelector onStartGame={handleStartGame} />;
  }

  if (!gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-white text-lg">Generating puzzle...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-1 sm:p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-4 sm:mb-8">
          <h1 className="text-3xl sm:text-5xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-1 sm:mb-2">
            Sudoku Master
          </h1>
          <p className="text-gray-300 text-base sm:text-lg">Challenge your mind with beautiful puzzles</p>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-2 sm:gap-8">
          {/* Game Controls - Left Side */}
          <div className="xl:order-1 mb-2 xl:mb-0">
            <GameControls
              elapsedTime={gameState.elapsedTime}
              mistakes={gameState.mistakes}
              hintsUsed={gameState.hintsUsed}
              isPaused={gameState.isPaused}
              isCompleted={gameState.isCompleted}
              difficulty={gameState.difficulty}
              onPauseToggle={handlePauseToggle}
              onRestart={handleRestart}
              onHint={handleHint}
              onNewGame={handleNewGame}
            />
          </div>
          {/* Sudoku Grid - Center */}
          <div className="xl:col-span-2 xl:order-2 mb-2 xl:mb-0 flex items-center justify-center">
            {gameState.isPaused ? (
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl md:rounded-3xl shadow-2xl p-6 sm:p-12 text-center border border-white/20">
                <h2 className="text-xl sm:text-3xl font-bold text-gray-800 mb-2 sm:mb-4">Game Paused</h2>
                <p className="text-gray-600 mb-4 sm:mb-8 text-base sm:text-lg">Take a break and come back when you're ready!</p>
                <button
                  onClick={handlePauseToggle}
                  className="bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-2 sm:py-4 px-4 sm:px-8 rounded-xl sm:rounded-2xl hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  Resume Game
                </button>
              </div>
            ) : (
              <SudokuGrid
                grid={gameState.grid}
                selectedCell={gameState.selectedCell}
                onCellClick={handleCellClick}
                selectedNumber={selectedNumber}
              />
            )}
          </div>
          {/* Number Pad - Right Side */}
          <div className="xl:order-3">
            {!gameState.isPaused && (
              <NumberPad
                onNumberClick={handleNumberClick}
                onEraseClick={handleErase}
                onNotesToggle={handleNotesToggle}
                isNotesMode={gameState.isNotesMode}
                selectedCell={gameState.selectedCell}
                onPadNumberSelect={handlePadNumberSelect}
              />
            )}
          </div>
        </div>
      </div>
      {gameState.isCompleted && (
        <WinDialog
          elapsedTime={gameState.elapsedTime}
          mistakes={gameState.mistakes}
          hintsUsed={gameState.hintsUsed}
          difficulty={gameState.difficulty}
          onNewGame={handleNewGame}
          onPlayAgain={handleRestart}
        />
      )}
    </div>
  );
}

export default App;