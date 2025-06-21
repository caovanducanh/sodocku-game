import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { SudokuGenerator } from './utils/sudokuGenerator';
import { GameState, SudokuCell, Difficulty } from './types/sudoku';
import DifficultySelector from './components/DifficultySelector';
import Leaderboard from './components/Leaderboard';
import { Auth } from './components/Auth';
import { HowToPlayPopup, RulesPopup } from './components/Popups';

const GameUI = lazy(() => import('./components/GameUI'));

const LoadingSpinner: React.FC = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-purple-500 mx-auto"></div>
            <p className="mt-4 text-white text-lg">Loading Game...</p>
        </div>
    </div>
);

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
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);

  // Anti F5-spam
  useEffect(() => {
    const F5_SPAM_THRESHOLD_MS = 2000; // 2 seconds between refreshes
    const F5_SPAM_MAX_ATTEMPTS = 5; // after 5 quick refreshes, block
    const F5_BLOCK_DURATION_MS = 10000; // block for 10 seconds

    const now = Date.now();
    const lastRefreshStr = localStorage.getItem('sudoku-last-refresh');
    const refreshCountStr = localStorage.getItem('sudoku-refresh-count');

    const lastRefresh = lastRefreshStr ? parseInt(lastRefreshStr, 10) : 0;
    let refreshCount = refreshCountStr ? parseInt(refreshCountStr, 10) : 1;

    if (now - lastRefresh < F5_SPAM_THRESHOLD_MS) {
      // It's a quick refresh
      refreshCount++;
    } else {
      // It's a normal refresh or first visit, reset the counter
      refreshCount = 1;
    }

    localStorage.setItem('sudoku-last-refresh', now.toString());
    localStorage.setItem('sudoku-refresh-count', refreshCount.toString());

    if (refreshCount >= F5_SPAM_MAX_ATTEMPTS) {
      console.warn(`Rapid refresh detected. Blocking for ${F5_BLOCK_DURATION_MS / 1000} seconds.`);
      setIsBlocked(true);
      // After the block duration, unblock and reset the counter.
      setTimeout(() => {
        setIsBlocked(false);
        localStorage.removeItem('sudoku-refresh-count');
      }, F5_BLOCK_DURATION_MS);
    }
  }, []);

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

    setPoints(0);
    setScore(0);
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

  // Load game from localStorage on initial load
  useEffect(() => {
    const savedStateJSON = localStorage.getItem('sudoku-game-state');
    if (savedStateJSON) {
      try {
        const savedData = JSON.parse(savedStateJSON);
        if (savedData && savedData.gameState && !savedData.gameState.isCompleted) {
          const { gameState: savedGameState, points: savedPoints, score: savedScore } = savedData;
          
          const loadedGrid = savedGameState.grid.map((row: SudokuCell[]) => 
            row.map((cell: SudokuCell) => ({
              ...cell,
              notes: new Set((cell.notes as unknown as number[]))
            }))
          );

          setGameState({
            ...savedGameState,
            grid: loadedGrid,
            startTime: Date.now() - savedGameState.elapsedTime * 1000,
            isPaused: false, // Always resume in a non-paused state
          });
          setPoints(savedPoints || 0);
          setScore(savedScore || 0);
          setShowDifficultySelector(false);
        } else {
          localStorage.removeItem('sudoku-game-state');
        }
      } catch (e) {
        console.error("Error loading game state:", e);
        localStorage.removeItem('sudoku-game-state');
      }
    }
  }, []);

  // Save game state to localStorage whenever it changes
  useEffect(() => {
    if (gameState && !gameState.isCompleted) {
      const stateToSave = {
        gameState: {
          ...gameState,
          grid: gameState.grid.map(row => 
            row.map(cell => ({ ...cell, notes: Array.from(cell.notes) }))
          ),
        },
        points,
        score
      };
      localStorage.setItem('sudoku-game-state', JSON.stringify(stateToSave));
    } else {
      // Clear storage if game is completed or state is null
      localStorage.removeItem('sudoku-game-state');
    }
  }, [gameState, points, score]);

  // Update elapsed time
  useEffect(() => {
    if (!gameState || gameState.isCompleted || gameState.isPaused) return;

    let animationFrameId: number;

    const updateTimer = () => {
        setGameState(prev => {
            if (!prev || prev.isPaused || prev.isCompleted) return prev;
            // Ensure startTime is valid
            if (typeof prev.startTime !== 'number' || prev.startTime <= 0) return prev;

            const newElapsedTime = Math.floor((Date.now() - prev.startTime) / 1000);

            // Only update state if the second has changed to avoid unnecessary re-renders
            if (newElapsedTime > prev.elapsedTime) {
                return { ...prev, elapsedTime: newElapsedTime };
            }
            return prev;
        });
        animationFrameId = requestAnimationFrame(updateTimer);
    };

    animationFrameId = requestAnimationFrame(updateTimer);

    return () => cancelAnimationFrame(animationFrameId);
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

    setSelectedNumber(null); // ALWAYS clear number selection from pad

    // If the same cell is clicked again, deselect it
    if (gameState.selectedCell && gameState.selectedCell.row === row && gameState.selectedCell.col === col) {
      const gridWithoutHighlight = gameState.grid.map(r => r.map(c => ({...c, isHighlighted: false, isSelected: false})));
      setGameState(prev => prev ? {...prev, grid: gridWithoutHighlight, selectedCell: null} : null);
      return;
    }

    const newGrid = updateHighlighting(gameState.grid, row, col);

    setGameState(prev => prev ? {
      ...prev,
      grid: newGrid,
      selectedCell: { row, col },
    } : null);
  }, [gameState, updateHighlighting]);

  // Handle number input with validation
  const handleNumberClick = useCallback((number: number) => {
    if (!gameState || !gameState.selectedCell || gameState.isCompleted || gameState.isPaused) return;

    const { row, col } = gameState.selectedCell;
    const originalCell = gameState.grid[row][col];
    if (originalCell.isGiven) return;

    const newGrid = gameState.grid.map(rowArr => rowArr.map(cell => ({ ...cell, isShaking: false, isCorrect: false })));
    const cellToModify = newGrid[row][col];

    if (gameState.isNotesMode) {
      const newNotes = new Set(cellToModify.notes);
      if (newNotes.has(number)) {
        newNotes.delete(number);
      } else {
        newNotes.add(number);
      }
      cellToModify.notes = newNotes;
      setGameState(prev => prev ? { ...prev, grid: newGrid } : null);
      return;
    }

    // Place number
    const isCorrect = gameState.solution[row][col] === number;
    let newMistakes = gameState.mistakes;
    let newCorrectStreak = points;
    let newScore = score;
    
    cellToModify.value = number;
    cellToModify.notes = new Set();

    if (!isCorrect) {
      newMistakes++;
      newCorrectStreak = 0;
      newScore = Math.max(0, score - getBasePoint(gameState.difficulty));
      cellToModify.isError = true;
      cellToModify.isShaking = true;
    } else {
      newCorrectStreak++;
      newScore = score + getBasePoint(gameState.difficulty) * newCorrectStreak;
      cellToModify.isCorrect = true;
      cellToModify.isError = false;
    }
    
    setPoints(newCorrectStreak);
    setScore(newScore);

    const isCompleted = checkCompletion(newGrid.map(r => r.map(c => c.value)));

    setGameState(prev => prev ? {
        ...prev,
        grid: newGrid,
        mistakes: newMistakes,
        isCompleted: isCompleted
    } : null);

    if (!isCorrect) {
        setTimeout(() => {
            setGameState(prev => {
                if (!prev) return prev;
                const gridCopy = prev.grid.map(r => r.map(c => ({ ...c })));
                gridCopy[row][col].isShaking = false;
                return { ...prev, grid: gridCopy };
            });
        }, 400);
    } else {
         setTimeout(() => {
            setGameState(prev => {
                if (!prev) return prev;
                const gridCopy = prev.grid.map(r => r.map(c => ({ ...c })));
                gridCopy[row][col].isCorrect = false;
                return { ...prev, grid: updateHighlighting(gridCopy, row, col) };
            });
        }, 300);
    }
  }, [gameState, points, score, sudokuGenerator, checkCompletion, updateHighlighting]);

  // Handle erase
  const handleErase = useCallback(() => {
    if (!gameState || !gameState.selectedCell || gameState.isCompleted || gameState.isPaused) return;

    const { row, col } = gameState.selectedCell;
    const cell = gameState.grid[row][col];
    if (cell.isGiven) return;

    const newGrid = [...gameState.grid];
    newGrid[row][col] = { ...cell, value: 0, notes: new Set(), isError: false, isCorrect: false };
    
    setGameState(prev => prev ? {
      ...prev,
      grid: updateHighlighting(newGrid, row, col),
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
    if (!gameState || gameState.isCompleted || gameState.isPaused) return;
    if (gameState.hintsUsed >= maxHints) return;

    let emptyCell: {row: number, col: number} | null = null;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (gameState.grid[r][c].value === 0) {
          emptyCell = { row: r, col: c };
          break;
        }
      }
      if (emptyCell) break;
    }

    if (!emptyCell) return;

    const { row, col } = emptyCell;
    const correctValue = gameState.solution[row][col];

    const newGrid = [...gameState.grid];
    newGrid[row][col] = { ...newGrid[row][col], value: correctValue, isCorrect: true, notes: new Set() };
    
    const newHintsUsed = gameState.hintsUsed + 1;
    const isCompleted = checkCompletion(newGrid.map(r => r.map(c => c.value)));

    setGameState(prev => prev ? {
        ...prev,
        grid: newGrid,
        hintsUsed: newHintsUsed,
        isCompleted: isCompleted,
    } : null);

    setTimeout(() => {
        setGameState(prev => {
            if (!prev) return prev;
            const gridCopy = prev.grid.map(r => r.map(c => ({ ...c })));
            gridCopy[row][col].isCorrect = false;
            return { ...prev, grid: updateHighlighting(gridCopy, row, col), selectedCell: {row, col} };
        });
    }, 300);
  }, [gameState, maxHints, checkCompletion, updateHighlighting]);

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
    if (window.confirm('Bạn có chắc chắn muốn bắt đầu lại? Mọi tiến trình sẽ bị mất.')) {
        initializeGame(gameState.difficulty);
    }
  }, [gameState, initializeGame]);

  // Handle new game
  const handleNewGame = useCallback(() => {
    if (window.confirm('Bạn có chắc chắn muốn tạo ván mới? Mọi tiến trình sẽ bị mất.')) {
        setShowDifficultySelector(true);
        setGameState(null);
    }
  }, []);

  // Start game with selected difficulty
  const handleStartGame = useCallback((difficulty: Difficulty) => {
    initializeGame(difficulty);
    setShowDifficultySelector(false);
  }, [initializeGame]);

  // Handle number pad click for highlighting
  const handlePadNumberSelect = useCallback((number: number) => {
    if (!gameState) return;

    // Toggle off if same number is clicked
    if (selectedNumber === number) {
      setSelectedNumber(null);
      const gridWithoutHighlight = gameState.grid.map(r => r.map(c => ({...c, isHighlighted: false})));
      setGameState(prev => prev ? {...prev, grid: gridWithoutHighlight} : null);
      return;
    }

    setSelectedNumber(number);
    const newGrid = gameState.grid.map(row =>
      row.map(cell => ({
        ...cell,
        isHighlighted: cell.value === number && number !== 0
      }))
    );
    // Clear selected cell when highlighting from number pad
    setGameState(prev => prev ? {
      ...prev,
      grid: newGrid,
      selectedCell: null
    } : null);
  }, [gameState, selectedNumber]);

  // Đọc token từ localStorage khi load app
  useEffect(() => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    if (token && username) setUser({ username, token });
  }, []);

  // Xử lý callback từ Google OAuth
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const username = urlParams.get('username');
    
    if (token && username) {
      setUser({ username, token });
      localStorage.setItem('token', token);
      localStorage.setItem('username', username);
      // Clean up the URL
      window.history.replaceState({}, document.title, "/");
    }
  }, []);

  // Lấy bảng xếp hạng khi showDifficultySelector hoặc khi đang chơi game
  useEffect(() => {
    // Chỉ fetch khi vào màn chọn độ khó hoặc khi vừa hoàn thành game
    if (!showDifficultySelector && !(gameState && gameState.isCompleted)) return;

    const CACHE_DURATION_MIN = 5;
    const cacheKey = 'sudoku-leaderboard-cache';

    const fetchLeaderboard = () => {
      setLoadingLeaderboard(true);
      const token = localStorage.getItem('token');
      fetch('/api/leaderboard', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
        .then(res => res.json())
        .then(data => {
          const cacheData = {
            leaderboard: data.leaderboard || [],
            userRank: data.user || null,
            timestamp: Date.now(),
          };
          sessionStorage.setItem(cacheKey, JSON.stringify(cacheData));
          setLeaderboard(cacheData.leaderboard);
          setUserRank(cacheData.userRank);
        })
        .finally(() => setLoadingLeaderboard(false));
    };

    try {
      const cachedItem = sessionStorage.getItem(cacheKey);
      if (cachedItem) {
        const { leaderboard, userRank, timestamp } = JSON.parse(cachedItem);
        const ageMinutes = (Date.now() - timestamp) / (1000 * 60);

        if (ageMinutes < CACHE_DURATION_MIN) {
          setLeaderboard(leaderboard);
          setUserRank(userRank);
          return; 
        }
      }
    } catch (e) {
      console.error("Error reading leaderboard cache", e);
    }
    
    fetchLeaderboard();
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

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpCooldown > 0) {
      timer = setTimeout(() => setOtpCooldown(otpCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [otpCooldown]);

  // Đăng ký
  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAuthError(null);
    setAuthMessage(null);
    const form = e.currentTarget;
    const username = (form.elements.namedItem('username') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const otp = (form.elements.namedItem('otp') as HTMLInputElement)?.value;

    if (!otp) {
      setAuthError("Vui lòng lấy và nhập mã OTP.");
      return;
    }

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, email, otp })
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || 'Đăng ký thất bại');
        return;
      }
      setAuthMode('login');
      setAuthMessage(data.message);
      setOtpSent(false);
    } catch {
      setAuthError('Lỗi kết nối server');
    }
  }

  async function handleSendOtp() {
    const emailInput = document.getElementById('reg-email') as HTMLInputElement;
    const email = emailInput?.value;
    
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setAuthError('Vui lòng nhập một địa chỉ email hợp lệ.');
      return;
    }
    setAuthError(null);
    setAuthMessage(null);

    try {
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAuthError(data.error || 'Không thể gửi OTP.');
        return;
      }

      setAuthMessage(data.message);
      setOtpSent(true);
      setOtpCooldown(60); // 60 seconds cooldown
    } catch {
      setAuthError('Lỗi kết nối server.');
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
    </div>
  );

  if (isBlocked) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-red-800 via-red-900 to-black flex flex-col items-center justify-center p-4 text-white text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 mb-4 text-yellow-300 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h1 className="text-3xl sm:text-4xl font-bold mb-4">Bạn đang tải lại trang quá nhanh!</h1>
            <p className="text-base sm:text-lg">Hệ thống đã tạm thời giới hạn quyền truy cập của bạn để đảm bảo ổn định.</p>
            <p className="text-base sm:text-lg">Vui lòng đợi một lát trước khi thử lại.</p>
        </div>
    );
  }

  if (showDifficultySelector) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center p-4">
        {renderAuthButton()}
        {showAuth && (
            <Auth
                authMode={authMode}
                setAuthMode={(mode) => { setAuthMode(mode); setAuthError(null); setAuthMessage(null); if (mode === 'register') setOtpSent(false); }}
                authMessage={authMessage}
                authError={authError}
                handleLogin={handleLogin}
                handleRegister={handleRegister}
                handleSendOtp={handleSendOtp}
                otpSent={otpSent}
                otpCooldown={otpCooldown}
                onClose={() => { setShowAuth(false); setOtpSent(false); setAuthError(null); setAuthMessage(null); }}
            />
        )}
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
     return <LoadingSpinner />;
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      {renderAuthButton()}
       {showAuth && (
            <Auth
                authMode={authMode}
                setAuthMode={(mode) => { setAuthMode(mode); setAuthError(null); setAuthMessage(null); if (mode === 'register') setOtpSent(false); }}
                authMessage={authMessage}
                authError={authError}
                handleLogin={handleLogin}
                handleRegister={handleRegister}
                handleSendOtp={handleSendOtp}
                otpSent={otpSent}
                otpCooldown={otpCooldown}
                onClose={() => { setShowAuth(false); setOtpSent(false); setAuthError(null); setAuthMessage(null); }}
            />
        )}
      <GameUI
        gameState={gameState}
        points={points}
        score={score}
        maxHints={maxHints}
        loadingLeaderboard={loadingLeaderboard}
        leaderboard={leaderboard}
        userRank={userRank}
        selectedNumber={selectedNumber}
        handlePauseToggle={handlePauseToggle}
        handleRestart={handleRestart}
        handleHint={handleHint}
        handleNewGame={handleNewGame}
        handleCellClick={handleCellClick}
        handleNumberClick={handleNumberClick}
        handleErase={handleErase}
        handleNotesToggle={handleNotesToggle}
        handlePadNumberSelect={handlePadNumberSelect}
        setShowHowToPlay={setShowHowToPlay}
        setShowRules={setShowRules}
      />
      {showHowToPlay && <HowToPlayPopup onClose={() => setShowHowToPlay(false)} />}
      {showRules && <RulesPopup onClose={() => setShowRules(false)} />}
    </Suspense>
  );
}

export default App;
