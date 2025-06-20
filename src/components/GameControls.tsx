import React from 'react';
import { Play, Pause, RotateCcw, Lightbulb, Settings, Clock, Target, Zap } from 'lucide-react';

interface GameControlsProps {
  elapsedTime: number;
  mistakes: number;
  hintsUsed: number;
  maxHints?: number;
  isPaused: boolean;
  isCompleted: boolean;
  difficulty: string;
  onPauseToggle: () => void;
  onRestart: () => void;
  onHint: () => void;
  onNewGame: () => void;
}

const GameControls: React.FC<GameControlsProps> = ({
  elapsedTime,
  mistakes,
  hintsUsed,
  maxHints,
  isPaused,
  isCompleted,
  difficulty,
  onPauseToggle,
  onRestart,
  onHint,
  onNewGame,
}) => {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'easy': return 'from-green-500 to-emerald-600';
      case 'medium': return 'from-blue-500 to-cyan-600';
      case 'hard': return 'from-orange-500 to-red-500';
      case 'expert': return 'from-red-500 to-pink-600';
      case 'master': return 'from-purple-500 to-indigo-600';
      default: return 'from-blue-500 to-cyan-600';
    }
  };

  return (
    <div className="bg-white rounded-2xl md:rounded-3xl shadow-2xl p-2 sm:p-4 md:p-6 border border-gray-200 max-w-full">
      {/* Difficulty Badge */}
      <div className="text-center mb-4 sm:mb-6">
        <div className={`inline-flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-2 rounded-full text-white font-bold text-xs sm:text-sm bg-gradient-to-r ${getDifficultyColor(difficulty)} shadow-lg`}>
          <Zap size={16} />
          {difficulty.toUpperCase()} LEVEL
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-2 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl sm:rounded-2xl p-2 sm:p-4 text-center border border-blue-200">
          <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 mx-auto mb-1 sm:mb-2" />
          <div className="text-lg sm:text-2xl font-mono font-bold text-blue-800">
            {formatTime(elapsedTime)}
          </div>
          <div className="text-xs sm:text-sm text-blue-600 font-medium">Time</div>
        </div>
        
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl sm:rounded-2xl p-2 sm:p-4 text-center border border-red-200">
          <Target className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 mx-auto mb-1 sm:mb-2" />
          <div className="text-lg sm:text-2xl font-bold text-red-800">
            {mistakes}
          </div>
          <div className="text-xs sm:text-sm text-red-600 font-medium">Mistakes</div>
        </div>
        
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl sm:rounded-2xl p-2 sm:p-4 text-center border border-yellow-200">
          <Lightbulb className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 mx-auto mb-1 sm:mb-2" />
          <div className="text-lg sm:text-2xl font-bold text-yellow-800">
            {maxHints !== undefined ? `${maxHints - hintsUsed}` : '-'}
          </div>
          <div className="text-xs sm:text-sm text-yellow-600 font-medium">Hints Left</div>
        </div>
      </div>
      
      {/* Control Buttons */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <button
          onClick={onPauseToggle}
          disabled={isCompleted}
          className={`flex items-center justify-center gap-2 h-9 sm:h-12 rounded-xl sm:rounded-2xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-md sm:shadow-lg select-none ${
            isCompleted
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : isPaused
                ? 'bg-gradient-to-br from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 hover:shadow-xl'
                : 'bg-gradient-to-br from-yellow-500 to-yellow-600 text-white hover:from-yellow-600 hover:to-yellow-700 hover:shadow-xl'
          }`}
        >
          {isPaused ? <Play size={20} /> : <Pause size={20} />}
          {isPaused ? 'Resume' : 'Pause'}
        </button>
        
        <button
          onClick={onHint}
          disabled={isCompleted || (maxHints !== undefined && hintsUsed >= maxHints)}
          className={`flex items-center justify-center gap-2 h-9 sm:h-12 rounded-xl sm:rounded-2xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-md sm:shadow-lg select-none ${
            isCompleted
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : (maxHints !== undefined && hintsUsed >= maxHints)
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-br from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 hover:shadow-xl'
          }`}
        >
          <Lightbulb size={20} />
          Hint
        </button>
        
        <button
          onClick={onRestart}
          className="flex items-center justify-center gap-2 h-9 sm:h-12 rounded-xl sm:rounded-2xl font-semibold bg-gradient-to-br from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 transition-all duration-200 transform hover:scale-105 shadow-md sm:shadow-lg hover:shadow-xl select-none"
        >
          <RotateCcw size={20} />
          Restart
        </button>
        
        <button
          onClick={onNewGame}
          className="flex items-center justify-center gap-2 h-9 sm:h-12 rounded-xl sm:rounded-2xl font-semibold bg-gradient-to-br from-indigo-500 to-indigo-600 text-white hover:from-indigo-600 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105 shadow-md sm:shadow-lg hover:shadow-xl select-none"
        >
          <Settings size={20} />
          New Game
        </button>
      </div>
    </div>
  );
};

export default GameControls;