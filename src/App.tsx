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
  const [points, setPoints] = useState(0);
  const [score, setScore] = useState(0);
  const [maxHints, setMaxHints] = useState(3); // số lần hint tối đa
  const [showRules, setShowRules] = useState(false);

  const getBasePoint = (difficulty: Difficulty) => {
    switch (difficulty) {
      case 'easy': return 10;
      case 'medium': return 20;
      case 'hard': return 30;
      case 'expert': return 40;
      case 'master': return 50;
      default: return 10;
    }
  };

  const getMaxHints = (difficulty: Difficulty) => {
    switch (difficulty) {
      case 'easy': return 5;
      case 'medium': return 4;
      case 'hard': return 3;
      case 'expert': return 2;
      case 'master': return 1;
      default: return 3;
    }
  };

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
        isShaking: false,
        isCorrect: false,
      }))
    );

    setMaxHints(getMaxHints(difficulty));
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

    const newGrid = gameState.grid.map(rowArr => rowArr.map(cell => ({ ...cell, isShaking: false, isCorrect: false })));
    if (gameState.isNotesMode) {
      // Toggle note
      const newNotes = new Set(cell.notes);
      if (newNotes.has(number)) {
        newNotes.delete(number);
      } else {
        newNotes.add(number);
      }
      newGrid[row][col] = { ...cell, notes: newNotes, isShaking: false, isCorrect: false };
      setGameState(prev => prev ? { ...prev, grid: newGrid } : null);
      return;
    }
    // Place number
    const isValid = sudokuGenerator.isValidMove(newGrid, row, col, number);
    const isCorrect = gameState.solution[row][col] === number;
    let newMistakes = gameState.mistakes;
    if (!isValid || !isCorrect) {
      newMistakes++;
      newGrid[row][col] = {
        ...cell,
        value: number,
        notes: new Set(),
        isError: true,
        isShaking: true,
        isCorrect: false
      };
      setPoints(0); // reset chuỗi đúng liên tiếp khi sai
      setScore(s => Math.max(0, s - getBasePoint(gameState.difficulty))); // trừ điểm khi sai, không để < 0
      setGameState(prev => prev ? {
        ...prev,
        grid: updateHighlighting(newGrid, row, col),
        mistakes: newMistakes,
        isCompleted: checkCompletion(newGrid.map(row => row.map(cell => cell.value)))
      } : null);
      setTimeout(() => {
        setGameState(prev => {
          if (!prev) return prev;
          const gridCopy = prev.grid.map(r => r.map(c => ({ ...c })));
          gridCopy[row][col].isShaking = false;
          return { ...prev, grid: gridCopy };
        });
      }, 400);
      return;
    } else {
      newGrid[row][col] = {
        ...cell,
        value: number,
        notes: new Set(),
        isError: false,
        isShaking: false,
        isCorrect: true
      };
      setPoints(p => p + 1); // tăng chuỗi đúng liên tiếp
      setScore(s => s + getBasePoint(gameState.difficulty) * (points + 1)); // cộng điểm theo chuỗi
      setGameState(prev => prev ? {
        ...prev,
        grid: updateHighlighting(newGrid, row, col),
        isCompleted: checkCompletion(newGrid.map(row => row.map(cell => cell.value)))
      } : null);
      setTimeout(() => {
        setGameState(prev => {
          if (!prev) return prev;
          const gridCopy = prev.grid.map(r => r.map(c => ({ ...c })));
          gridCopy[row][col].isCorrect = false;
          return { ...prev, grid: gridCopy };
        });
      }, 300);
      return;
    }
  }, [gameState, sudokuGenerator, checkCompletion, updateHighlighting, points]);

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
    if (gameState.hintsUsed >= maxHints) return; // hết lượt hint
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
      isShaking: false,
      isCorrect: true
    };
    const isCompleted = checkCompletion(newGrid.map(row => row.map(cell => cell.value)));
    setGameState(prev => prev ? {
      ...prev,
      grid: updateHighlighting(newGrid, row, col),
      hintsUsed: prev.hintsUsed + 1,
      isCompleted
    } : null);
    setTimeout(() => {
      setGameState(prev => {
        if (!prev) return prev;
        const gridCopy = prev.grid.map(r => r.map(c => ({ ...c })));
        gridCopy[row][col].isCorrect = false;
        return { ...prev, grid: gridCopy };
      });
    }, 300);
  }, [gameState, checkCompletion, updateHighlighting, maxHints]);

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
          <div className="mt-2 text-yellow-300 font-bold text-lg sm:text-xl">Liên tiếp đúng: {points}</div>
          <div className="mt-1 text-green-300 font-bold text-base sm:text-lg">Điểm: {score}</div>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-2 sm:gap-8">
          {/* Game Controls - Left Side */}
          <div className="xl:order-1 mb-2 xl:mb-0">
            <GameControls
              elapsedTime={gameState.elapsedTime}
              mistakes={gameState.mistakes}
              hintsUsed={gameState.hintsUsed}
              maxHints={maxHints}
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
      {/* Nút và popup luật chơi */}
      <div className="fixed bottom-2 right-2 z-50">
        {!showRules ? (
          <button
            className="bg-purple-600 text-white font-bold rounded-full shadow-lg px-4 py-2 text-sm hover:bg-purple-700 transition-all"
            onClick={() => setShowRules(true)}
          >
            Luật chơi
          </button>
        ) : (
          <div className="max-w-xs w-[90vw] sm:w-80 bg-white/95 rounded-2xl shadow-2xl border border-gray-200 p-4 text-sm text-gray-700 select-none backdrop-blur-md relative animate-pop">
            <button
              className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 text-xl font-bold text-gray-700 shadow"
              onClick={() => setShowRules(false)}
              title="Thu nhỏ"
            >
              –
            </button>
            <div className="font-bold text-base text-purple-700 mb-2">Luật chơi & Tính điểm</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Điền đúng: <span className="text-green-600 font-semibold">+Điểm</span> = Điểm cơ bản × chuỗi đúng liên tiếp.</li>
              <li>Điền sai: <span className="text-red-600 font-semibold">-Điểm</span> = Trừ điểm cơ bản (không âm).</li>
              <li>Dùng Hint: <span className="text-yellow-600 font-semibold">Không cộng điểm</span>, số lần hint giới hạn theo độ khó.</li>
            </ul>
            <div className="mt-2 font-semibold text-gray-800">Điểm cơ bản theo độ khó:</div>
            <table className="w-full text-xs mt-1 border border-gray-300 rounded overflow-hidden">
              <thead>
                <tr className="bg-purple-100">
                  <th className="py-1 px-2 font-bold">Độ khó</th>
                  <th className="py-1 px-2 font-bold">Điểm</th>
                  <th className="py-1 px-2 font-bold">Hint</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="py-1 px-2">Easy</td><td className="py-1 px-2">10</td><td className="py-1 px-2">5</td></tr>
                <tr><td className="py-1 px-2">Medium</td><td className="py-1 px-2">20</td><td className="py-1 px-2">4</td></tr>
                <tr><td className="py-1 px-2">Hard</td><td className="py-1 px-2">30</td><td className="py-1 px-2">3</td></tr>
                <tr><td className="py-1 px-2">Expert</td><td className="py-1 px-2">40</td><td className="py-1 px-2">2</td></tr>
                <tr><td className="py-1 px-2">Master</td><td className="py-1 px-2">50</td><td className="py-1 px-2">1</td></tr>
              </tbody>
            </table>
            <div className="mt-2 text-xs text-gray-500">* Chuỗi đúng liên tiếp càng dài, điểm càng cao!</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;