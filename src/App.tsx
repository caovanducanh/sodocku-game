import React, { useState, useEffect, useCallback } from 'react';
import { SudokuGrid } from './components/SudokuGrid';
import { NumberPad } from './components/NumberPad';
import { GameControls } from './components/GameControls';
import { generateSudoku, checkSolution } from './utils/sudokuGenerator';
import DifficultySelector from './components/DifficultySelector';
import Leaderboard from './components/Leaderboard';
import WinDialog from './components/WinDialog';

type User = {
  username: string;
  score: number;
  games: number;
};

type AuthMode = 'login' | 'register';

function App() {
  const [grid, setGrid] = useState<number[][]>([]);
  const [initialGrid, setInitialGrid] = useState<number[][]>([]);
  const [solution, setSolution] = useState<number[][]>([]);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [conflicts, setConflicts] = useState<boolean[][]>([]);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [showWinDialog, setShowWinDialog] = useState(false);
  const [leaderboard, setLeaderboard] = useState<{ member: string; score: number }[]>([]);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showOtpForm, setShowOtpForm] = useState(false);
  const [usernameForVerification, setUsernameForVerification] = useState('');
  
  const googleLoginUrl = `/api/auth/google`;

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setAuthError(null);
    setAuthMessage(null);
    setShowOtpForm(false);
    setUsernameForVerification('');
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const response = await fetch('/api/leaderboard');
      const data = await response.json();
      if (response.ok) {
        setLeaderboard(data);
      } else {
        console.error('Failed to fetch leaderboard:', data.error);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expirationTime = payload.exp * 1000;
        if (Date.now() < expirationTime) {
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
        } else {
          handleLogout();
        }
      } catch (error) {
        console.error("Token validation failed", error);
        handleLogout();
      }
    }
    
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    const urlUsername = params.get('username');
    const urlScore = params.get('score');
    const urlGames = params.get('games');

    if (urlToken && urlUsername) {
      const newUser: User = { 
        username: urlUsername,
        score: urlScore ? parseInt(urlScore, 10) : 0,
        games: urlGames ? parseInt(urlGames, 10) : 0
      };
      localStorage.setItem('token', urlToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      setUser(newUser);
      window.history.replaceState({}, document.title, "/");
    }
  }, [fetchLeaderboard, handleLogout]);

  const startNewGame = useCallback((newDifficulty: 'easy' | 'medium' | 'hard') => {
    const { puzzle, solution: newSolution } = generateSudoku(newDifficulty);
    setDifficulty(newDifficulty);
    setGrid(puzzle.map(row => [...row]));
    setInitialGrid(puzzle.map(row => [...row]));
    setSolution(newSolution);
    setSelectedCell(null);
    setConflicts(Array(9).fill(null).map(() => Array(9).fill(false)));
  }, []);

  useEffect(() => {
    startNewGame(difficulty);
  }, [startNewGame, difficulty]);

  const switchAuthMode = (mode: AuthMode) => {
    setAuthMode(mode);
    setAuthError(null);
    setAuthMessage(null);
  };

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAuthError(null);
    setAuthMessage(null);
    const form = e.currentTarget;
    const username = (form.elements.namedItem('username') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Đăng nhập thất bại');
      }
      localStorage.setItem('token', data.token);
      const userData = { username: data.username, score: data.score, games: data.games };
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      form.reset();
      fetchLeaderboard();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Lỗi không xác định";
      setAuthError(message);
    }
  }

  async function handleRegistrationStart(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAuthError(null);
    setAuthMessage(null);
    const form = e.currentTarget;
    const username = (form.elements.namedItem('username') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;

    try {
      const response = await fetch('/api/register/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, email }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra.');
      }

      setAuthMessage(data.message);
      setUsernameForVerification(username);
      setShowOtpForm(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Lỗi không xác định';
      setAuthError(message);
    }
  }

  async function handleRegistrationConfirm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAuthError(null);
    setAuthMessage(null);
    const form = e.currentTarget;
    const otp = (form.elements.namedItem('otp') as HTMLInputElement).value;

    try {
      const response = await fetch('/api/register/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameForVerification, otp }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra.');
      }
      
      setAuthMessage(data.message);
      setShowOtpForm(false);
      setUsernameForVerification('');
      setAuthMode('login');
      fetchLeaderboard();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Lỗi không xác định';
      setAuthError(message);
    }
  }

  const handleCellClick = (row: number, col: number) => {
    if (initialGrid[row][col] === 0) {
      if (selectedCell && selectedCell.row === row && selectedCell.col === col) {
        setSelectedCell(null);
      } else {
        setSelectedCell({ row, col });
      }
    }
  };

  const handleNumberClick = (num: number) => {
    if (!selectedCell) return;
    const { row, col } = selectedCell;
    const newGrid = grid.map(r => [...r]);
    newGrid[row][col] = num;
    setGrid(newGrid);

    const newConflicts = Array(9).fill(null).map(() => Array(9).fill(false));
    setConflicts(newConflicts);
  };

  const calculateScore = useCallback(() => {
    const basePoints = { easy: 10, medium: 20, hard: 30 };
    return basePoints[difficulty];
  }, [difficulty]);

  const updateScore = useCallback(async (scoreToAdd: number) => {
    if (!user) return;
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('/api/score', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ score: scoreToAdd }),
      });
      const data = await response.json();
      if (response.ok) {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        fetchLeaderboard();
      } else {
        console.error("Failed to update score", data.error);
      }
    } catch (error) {
      console.error("Error updating score", error);
    }
  }, [user, fetchLeaderboard]);

  const handleSolve = () => {
    const isSolved = checkSolution(grid, solution);
    if (isSolved) {
      console.log("Sudoku solved!");
      const newScore = calculateScore();
      if (user) {
        updateScore(newScore);
      }
      setShowWinDialog(true);
    }
  };
  
  const GoogleLoginButton = () => (
    <a href={googleLoginUrl} className="w-full flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
      <svg className="w-5 h-5 mr-2" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-76.2 64.5C308.6 106.5 280.2 96 248 96c-88.8 0-160.1 71.1-160.1 160s71.3 160 160.1 160c98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 26.9 3.9 41.4z"></path></svg>
      Đăng nhập với Google
    </a>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 font-sans relative">
      <WinDialog 
        isOpen={showWinDialog}
        onClose={() => {
          setShowWinDialog(false);
          startNewGame(difficulty);
        }}
        score={calculateScore()}
      />
      
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity ${showHowToPlay ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setShowHowToPlay(false)}
      ></div>

      <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-8 rounded-lg shadow-2xl z-50 w-11/12 max-w-lg transition-all ${showHowToPlay ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
        <h2 className="text-2xl font-bold mb-4 text-center">Cách chơi Sudoku</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>Mục tiêu là lấp đầy lưới 9x9 với các chữ số sao cho mỗi cột, mỗi hàng và mỗi trong số chín lưới con 3x3 tạo nên lưới chứa tất cả các chữ số từ 1 đến 9.</li>
          <li>Chọn một ô trống và sử dụng bàn phím số bên dưới để điền số.</li>
          <li>Bạn chỉ có thể điền vào các ô trống (ô màu trắng).</li>
          <li>Khi bạn giải đúng toàn bộ câu đố, bạn sẽ nhận được điểm!</li>
        </ul>
        <button onClick={() => setShowHowToPlay(false)} className="mt-6 w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition">Đã hiểu</button>
      </div>

      <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row gap-4 items-start">
        {/* Left Column: Leaderboard & Game Controls */}
        <div className="w-full md:w-1/4 lg:w-1/3 flex flex-col gap-4 items-center self-stretch">
           <GameControls 
            onNewGame={() => startNewGame(difficulty)} 
            onSolve={handleSolve} 
            onHowToPlay={() => setShowHowToPlay(true)}
          />
          <div className="flex flex-col items-center justify-start h-full w-full bg-white p-6 rounded-lg shadow-lg">
            <Leaderboard leaderboard={leaderboard} currentUser={user?.username} />
          </div>
        </div>

        {/* Center Column: Sudoku Grid */}
        <div className="w-full md:w-1/2 lg:w-1/3 flex items-start justify-center px-2">
          <div className="w-full max-w-[500px] mx-auto">
            <SudokuGrid grid={grid} initialGrid={initialGrid} onCellClick={handleCellClick} selectedCell={selectedCell} conflicts={conflicts} />
          </div>
        </div>

        {/* Right Column: NumberPad & Auth */}
        <div className="w-full md:w-1/4 lg:w-1/3 flex flex-col items-center px-2 self-stretch">
          <div className="w-full max-w-sm bg-white p-6 rounded-lg shadow-lg">
            {user ? (
              <div className="text-center">
                <h2 className="text-xl font-bold">Xin chào, {user.username}!</h2>
                <p className="text-gray-600">Điểm: {user.score}</p>
                <p className="text-gray-600">Số ván đã chơi: {user.games}</p>
                <DifficultySelector onDifficultyChange={setDifficulty} />
                <button 
                  onClick={handleLogout} 
                  className="mt-4 w-full bg-red-500 text-white py-2 rounded hover:bg-red-600 transition"
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <div>
                <div className="flex border-b border-gray-200">
                  <button onClick={() => switchAuthMode('login')} className={`flex-1 py-2 text-sm font-medium ${authMode === 'login' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
                    Đăng nhập
                  </button>
                  <button onClick={() => switchAuthMode('register')} className={`flex-1 py-2 text-sm font-medium ${authMode === 'register' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
                    Đăng ký
                  </button>
                </div>
                <div className="p-4">
                  {authError && <div className="mb-3 p-3 bg-red-100 text-red-700 text-sm rounded-md">{authError}</div>}
                  {authMessage && <div className="mb-3 p-3 bg-green-100 text-green-700 text-sm rounded-md">{authMessage}</div>}
                  
                  {authMode === 'login' && !showOtpForm && (
                     <form onSubmit={handleLogin} className="space-y-4">
                       <div>
                         <label htmlFor="login-username" className="text-sm font-medium text-gray-700 sr-only">Username</label>
                         <input id="login-username" name="username" type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="Tên đăng nhập" />
                       </div>
                       <div>
                         <label htmlFor="login-password" className="text-sm font-medium text-gray-700 sr-only">Password</label>
                         <input id="login-password" name="password" type="password" required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="Mật khẩu" />
                       </div>
                       <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Đăng nhập</button>
                        <div className="my-4 flex items-center">
                          <div className="flex-grow border-t border-gray-300"></div>
                          <span className="flex-shrink mx-2 text-gray-500 text-sm">hoặc</span>
                          <div className="flex-grow border-t border-gray-300"></div>
                        </div>
                       <GoogleLoginButton />
                     </form>
                  )}

                  {authMode === 'register' && !showOtpForm && (
                    <form onSubmit={handleRegistrationStart} className="space-y-4">
                      <div>
                        <label htmlFor="reg-username" className="text-sm font-medium text-gray-700 sr-only">Username</label>
                        <input id="reg-username" name="username" type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="Tên đăng nhập" />
                      </div>
                       <div>
                         <label htmlFor="reg-email" className="text-sm font-medium text-gray-700 sr-only">Email</label>
                         <input id="reg-email" name="email" type="email" required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="Địa chỉ email" />
                       </div>
                      <div>
                        <label htmlFor="reg-password" className="text-sm font-medium text-gray-700 sr-only">Password</label>
                        <input id="reg-password" name="password" type="password" required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="Mật khẩu" />
                      </div>
                      <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Đăng ký</button>
                       <div className="my-4 flex items-center">
                          <div className="flex-grow border-t border-gray-300"></div>
                          <span className="flex-shrink mx-2 text-gray-500 text-sm">hoặc</span>
                          <div className="flex-grow border-t border-gray-300"></div>
                        </div>
                       <GoogleLoginButton />
                    </form>
                  )}

                  {showOtpForm && (
                    <form onSubmit={handleRegistrationConfirm} className="space-y-4">
                      <p className="text-sm text-center">Một mã OTP đã được gửi tới email của bạn. Vui lòng nhập mã để xác thực.</p>
                      <div>
                        <label htmlFor="otp" className="text-sm font-medium text-gray-700 sr-only">OTP</label>
                        <input id="otp" name="otp" type="text" required maxLength={6} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="Nhập mã OTP" />
                      </div>
                      <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Xác nhận và Đăng ký</button>
                      <button type="button" onClick={() => setShowOtpForm(false)} className="w-full text-center text-sm text-gray-600 hover:text-gray-800 mt-2">Quay lại</button>
                    </form>
                  )}

                </div>
              </div>
            )}
            <div className='mt-4'>
             <NumberPad onNumberClick={handleNumberClick} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
