import React from 'react';
import SudokuGrid from './SudokuGrid';
import NumberPad from './NumberPad';
import GameControls from './GameControls';
import Leaderboard from './Leaderboard';
import WinDialog from './WinDialog';
import { GameState } from '../types/sudoku';
import LeaderboardSkeleton from './LeaderboardSkeleton';
import Footer from './Footer';

interface GameUIProps {
    gameState: GameState;
    points: number;
    score: number;
    maxHints: number;
    loadingLeaderboard: boolean;
    leaderboard: { username: string; score: number }[];
    userRank: { rank: number; score: number } | null;
    selectedNumber: number | null;
    handlePauseToggle: () => void;
    handleRestart: () => void;
    handleHint: () => void;
    handleNewGame: () => void;
    handleCellClick: (row: number, col: number) => void;
    handleNumberClick: (number: number) => void;
    handleErase: () => void;
    handleNotesToggle: () => void;
    handlePadNumberSelect: (number: number) => void;
    setShowHowToPlay: (show: boolean) => void;
    setShowRules: (show: boolean) => void;
}

const GameUI: React.FC<GameUIProps> = ({
    gameState, points, score, maxHints, loadingLeaderboard, leaderboard, userRank, selectedNumber,
    handlePauseToggle, handleRestart, handleHint, handleNewGame,
    handleCellClick, handleNumberClick, handleErase, handleNotesToggle, handlePadNumberSelect,
    setShowHowToPlay, setShowRules
}) => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-1 sm:p-2 flex flex-col">
            <main className="flex-grow">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-2 sm:mb-4">
                        <h1 className="text-3xl sm:text-5xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-1 sm:mb-2">
                            Sudoku Master
                        </h1>
                        <p className="text-gray-300 text-base sm:text-lg">Challenge your mind with beautiful puzzles</p>
                        <div className="mt-2 text-yellow-300 font-bold text-lg sm:text-xl">Liên tiếp đúng: {points}</div>
                        <div className="mt-1 text-green-300 font-bold text-base sm:text-lg">Điểm: {score}</div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 items-start">
                        {/* Left Side (or Top on Mobile): Leaderboard and Game Controls */}
                        <div className="lg:col-span-1 xl:order-1 space-y-4 sm:space-y-6">
                            {loadingLeaderboard ? (
                                <LeaderboardSkeleton />
                            ) : (
                                <Leaderboard leaderboard={leaderboard} userRank={userRank} />
                            )}
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
                        <div className="lg:col-span-2 xl:col-span-2 xl:order-2 flex items-center justify-center">
                            {gameState.isPaused ? (
                                <div className="bg-white/95 backdrop-blur-sm rounded-2xl md:rounded-3xl shadow-2xl p-6 sm:p-12 text-center border border-white/20 w-full aspect-square flex flex-col justify-center">
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
                        {/* Right Side: Number Pad. On mobile, it will be at the bottom. On LG, it will be below the grid. */}
                        <div className="w-full lg:hidden">
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
                        <div className="hidden lg:block xl:order-3">
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
            </main>
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
            <Footer />
        </div>
    );
}

export default GameUI; 