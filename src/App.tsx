import React, { useState, useEffect, useCallback } from 'react';
import { SudokuGenerator } from './utils/sudokuGenerator';
import { GameState, SudokuCell, Difficulty } from './types/sudoku';
import SudokuGrid from './components/SudokuGrid';
import NumberPad from './components/NumberPad';
import GameControls from './components/GameControls';
import DifficultySelector from './components/DifficultySelector';
import WinDialog from './components/WinDialog';
import Leaderboard from './components/Leaderboard';

function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [showDifficultySelector, setShowDifficultySelector] = useState(true);
  const [sudokuGenerator] = useState(new SudokuGenerator());
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [points, setPoints] = useState(0);
  const [score, setScore] = useState(0);
  const [maxHints, setMaxHints] = useState(3); // số lần hint tối đa
  const [showRules, setShowRules] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [user, setUser] = useState<{ username: string; token: string } | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<{ username: string; score: number }[]>([]);
  const [userRank, setUserRank] = useState<{ rank: number; score: number } | null>(null);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);

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

  // Đọc token từ localStorage khi load app
  useEffect(() => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    if (token && username) setUser({ username, token });
  }, []);

  // Lấy bảng xếp hạng khi showDifficultySelector hoặc khi đang chơi game
  useEffect(() => {
    // Chỉ fetch khi vào màn chọn độ khó hoặc khi vừa hoàn thành game
    if (!showDifficultySelector && !(gameState && gameState.isCompleted)) return;
    setLoadingLeaderboard(true);
    const token = localStorage.getItem('token');
    fetch('/api/leaderboard', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(res => res.json())
      .then(data => {
        setLeaderboard(data.leaderboard || []);
        setUserRank(data.user || null);
      })
      .finally(() => setLoadingLeaderboard(false));
  }, [showDifficultySelector, user, gameState?.isCompleted]);

  // Gửi điểm lên server khi hoàn thành game
  useEffect(() => {
    if (!gameState?.isCompleted || !user) return;
    fetch('/api/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: user.token, score }),
    });
  }, [gameState?.isCompleted, user, score]);

  // Đăng ký
  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAuthError(null);
    const form = e.currentTarget;
    const username = (form.elements.namedItem('username') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) {
        const data = await res.json();
        setAuthError(data.error || 'Đăng ký thất bại');
        return;
      }
      setAuthMode('login');
      setAuthError('Đăng ký thành công! Đăng nhập để tiếp tục.');
    } catch {
      setAuthError('Lỗi kết nối server');
    }
  }

  // Đăng nhập
  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAuthError(null);
    const form = e.currentTarget;
    const username = (form.elements.namedItem('username') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || 'Đăng nhập thất bại');
        return;
      }
      setUser({ username: data.username, token: data.token });
      localStorage.setItem('token', data.token);
      localStorage.setItem('username', data.username);
      setShowAuth(false);
    } catch {
      setAuthError('Lỗi kết nối server');
    }
  }

  function handleLogout() {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('username');
  }

  // Nút đăng nhập/đăng xuất luôn ở góc phải trên cùng
  const renderAuthButton = () => (
    <div className="fixed top-2 right-2 z-50 flex gap-2">
      {user ? (
        <div className="flex items-center gap-2 bg-white/90 rounded-xl px-3 py-1 shadow border border-gray-200">
          <span className="font-semibold text-purple-700">{user.username}</span>
          <button onClick={handleLogout} className="text-xs text-red-500 font-bold hover:underline">Đăng xuất</button>
        </div>
      ) : (
        <button onClick={() => { setShowAuth(true); setAuthMode('login'); }} className="bg-purple-600 text-white font-bold rounded-full shadow px-4 py-2 text-sm hover:bg-purple-700 transition-all">Đăng nhập / Đăng ký</button>
      )}
      {showAuth && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-[90vw] max-w-xs relative animate-pop">
            <button className="absolute top-2 right-2 text-xl font-bold text-gray-500 hover:text-gray-700" onClick={() => setShowAuth(false)}>&times;</button>
            <div className="mb-4 flex gap-2 justify-center">
              <button onClick={() => setAuthMode('login')} className={`px-3 py-1 rounded-full font-bold text-sm ${authMode==='login' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Đăng nhập</button>
              <button onClick={() => setAuthMode('register')} className={`px-3 py-1 rounded-full font-bold text-sm ${authMode==='register' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Đăng ký</button>
            </div>
            {authMode === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-3">
                <input name="username" required placeholder="Tên đăng nhập" className="w-full border rounded px-3 py-2" />
                <input name="password" type="password" required placeholder="Mật khẩu" className="w-full border rounded px-3 py-2" />
                {authError && <div className="text-red-500 text-xs">{authError}</div>}
                <button type="submit" className="w-full bg-purple-600 text-white font-bold rounded py-2 hover:bg-purple-700 transition">Đăng nhập</button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-3">
                <input name="username" required placeholder="Tên đăng nhập" className="w-full border rounded px-3 py-2" />
                <input name="password" type="password" required placeholder="Mật khẩu" className="w-full border rounded px-3 py-2" />
                {authError && <div className="text-red-500 text-xs">{authError}</div>}
                <button type="submit" className="w-full bg-purple-600 text-white font-bold rounded py-2 hover:bg-purple-700 transition">Đăng ký</button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );

  if (showDifficultySelector) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center p-4">
        {renderAuthButton()}
        <div className="w-full max-w-2xl mx-auto flex flex-col md:flex-row gap-8 items-start justify-center">
          <div className="flex-1 w-full max-w-md">
            <DifficultySelector onStartGame={handleStartGame} />
          </div>
          <div className="flex-1 w-full max-w-md mt-8 md:mt-0">
            {loadingLeaderboard ? (
              <div className="text-center text-gray-400 py-6 min-h-[260px]">Đang tải bảng xếp hạng...</div>
            ) : (
              <Leaderboard leaderboard={leaderboard} userRank={userRank} />
            )}
          </div>
        </div>
      </div>
    );
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-1 sm:p-2">
      {renderAuthButton()}
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-2 sm:mb-4">
          <h1 className="text-3xl sm:text-5xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-1 sm:mb-2">
            Sudoku Master
          </h1>
          <p className="text-gray-300 text-base sm:text-lg">Challenge your mind with beautiful puzzles</p>
          <div className="mt-2 text-yellow-300 font-bold text-lg sm:text-xl">Liên tiếp đúng: {points}</div>
          <div className="mt-1 text-green-300 font-bold text-base sm:text-lg">Điểm: {score}</div>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-2 sm:gap-6 xl:items-start">
          {/* Left Side: Leaderboard and Game Controls */}
          <div className="xl:order-1 mb-2 xl:mb-0">
            <div className="mb-4">
              {loadingLeaderboard ? (
                <div className="text-center text-gray-400 py-6 min-h-[260px]">Đang tải bảng xếp hạng...</div>
              ) : (
                <Leaderboard leaderboard={leaderboard} userRank={userRank} />
              )}
            </div>
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
          {/* Right Side: Number Pad Only */}
          <div className="xl:order-3 h-full flex items-center justify-center">
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
      {/* Nút và popup luật chơi & Hướng dẫn */}
      <div className="fixed bottom-2 right-2 z-50 flex flex-col items-end gap-2">
        <button
          className="bg-sky-600 text-white font-bold rounded-full shadow-lg px-4 py-2 text-sm hover:bg-sky-700 transition-all"
          onClick={() => setShowHowToPlay(true)}
        >
          Hướng dẫn chơi
        </button>
        <button
          className="bg-purple-600 text-white font-bold rounded-full shadow-lg px-4 py-2 text-sm hover:bg-purple-700 transition-all"
          onClick={() => setShowRules(true)}
        >
          Luật chơi
        </button>
      </div>

      {/* Popup Hướng dẫn chơi */}
      {showHowToPlay && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-[90vw] max-w-md relative animate-pop">
            <button className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 text-xl font-bold text-gray-700 shadow" onClick={() => setShowHowToPlay(false)}>&times;</button>
            <div className="font-bold text-lg text-purple-700 mb-3 text-center">Hướng Dẫn Cho Người Mới Bắt Đầu</div>
            <div className="text-sm text-gray-800 space-y-3">
              <p>Chào mừng bạn đến với Sudoku! Đây là một trò chơi giải đố logic rất thú vị. Mục tiêu của bạn rất đơn giản: <strong>lấp đầy tất cả các ô trống bằng các số từ 1 đến 9.</strong></p>
              <div>
                <p className="font-bold mb-1">Chỉ cần nhớ 3 quy tắc VÀNG:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Số bạn điền không được trùng với bất kỳ số nào trên cùng <strong>HÀNG NGANG</strong>.</li>
                  <li>Số bạn điền không được trùng với bất kỳ số nào trên cùng <strong>CỘT DỌC</strong>.</li>
                  <li>Số bạn điền không được trùng với bất kỳ số nào trong cùng <strong>Ô VUÔNG LỚN (3x3)</strong>.</li>
                </ul>
              </div>
              <div>
                <p className="font-bold mb-1">Mẹo chơi cực dễ:</p>
                 <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Bắt đầu từ nơi dễ nhất:</strong> Tìm những hàng, cột, hoặc ô vuông lớn đã có nhiều số nhất. Việc tìm ra số còn thiếu sẽ dễ dàng hơn rất nhiều!</li>
                  <li><strong>Dùng Ghi Chú (Notes):</strong> Nếu chưa chắc chắn về một ô, hãy bật chế độ "Notes" và điền những con số bạn đang phân vân vào đó. Đây là cách các cao thủ sử dụng để loại trừ và tìm ra đáp án đúng.</li>
                </ul>
              </div>
              <p className="text-center font-semibold pt-2">Chúc bạn có những giờ phút giải đố vui vẻ!</p>
            </div>
          </div>
        </div>
      )}

      {/* Popup Luật chơi */}
      {showRules && (
         <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-[90vw] max-w-sm relative animate-pop">
            <button className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 text-xl font-bold text-gray-700 shadow" onClick={() => setShowRules(false)}>&times;</button>
            <div className="font-bold text-lg text-purple-700 mb-3">Luật chơi & Tính điểm</div>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Điền đúng: <span className="text-green-600 font-semibold">+Điểm</span> = Điểm cơ bản × chuỗi đúng liên tiếp.</li>
              <li>Điền sai: <span className="text-red-600 font-semibold">-Điểm</span> = Trừ điểm cơ bản (không âm).</li>
              <li>Dùng Hint: <span className="text-yellow-600 font-semibold">Không cộng điểm</span>, có giới hạn.</li>
            </ul>
            <div className="mt-3 font-semibold text-gray-800">Điểm cơ bản theo độ khó:</div>
            <table className="w-full text-xs mt-1 border border-gray-300 rounded overflow-hidden">
              <thead className="bg-purple-100">
                <tr>
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
        </div>
      )}
    </div>
  );
}

export default App;