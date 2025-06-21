import React, { memo } from 'react';
import { Play, Pause, Lightbulb, RotateCcw, Settings2 } from 'lucide-react';
import { Difficulty } from '../types/sudoku';
import { motion } from 'framer-motion';

interface GameControlsProps {
  elapsedTime: number;
  mistakes: number;
  hintsUsed: number;
  maxHints: number;
  isPaused: boolean;
  isCompleted: boolean;
  difficulty: Difficulty;
  onPauseToggle: () => void;
  onRestart: () => void;
  onHint: () => void;
  onNewGame: () => void;
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const GameControls: React.FC<GameControlsProps> = memo(({
  elapsedTime,
  mistakes,
  hintsUsed,
  maxHints,
  isPaused,
  difficulty,
  onPauseToggle,
  onRestart,
  onHint,
  onNewGame,
}) => {
  const buttonProps = {
    whileTap: { scale: 0.95 },
    transition: { type: "spring" as const, stiffness: 400, damping: 17 }
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-3 border border-white/20 w-full max-w-xs mx-auto">
      <div className="flex items-center justify-center mb-2">
        <div className="bg-blue-100 text-blue-700 font-bold px-3 py-1.5 rounded-full flex items-center gap-2 text-sm">
          <Play size={14} /> {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-2 text-center">
        <div className="bg-blue-50 rounded-xl p-2">
          <div className="text-xs text-gray-500">Time</div>
          <div className="text-base font-bold text-gray-800">{formatTime(elapsedTime)}</div>
        </div>
        <div className="bg-red-50 rounded-xl p-2">
          <div className="text-xs text-gray-500">Mistakes</div>
          <div className="text-base font-bold text-red-500">{mistakes}</div>
        </div>
        <div className="bg-yellow-50 rounded-xl p-2">
          <div className="text-xs text-gray-500">Hints</div>
          <div className="text-base font-bold text-yellow-600">{maxHints - hintsUsed}</div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <motion.button
          {...buttonProps}
          onClick={onPauseToggle}
          className="bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-2 px-4 rounded-xl flex items-center justify-center gap-2 transition-all text-sm"
        >
          <Pause size={16} /> {isPaused ? 'Resume' : 'Pause'}
        </motion.button>
        <motion.button
          {...buttonProps}
          onClick={onHint}
          disabled={hintsUsed >= maxHints}
          className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:bg-gray-400 text-sm"
        >
          <Lightbulb size={16} /> Hint
        </motion.button>
        <motion.button
          {...buttonProps}
          onClick={onRestart}
          className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-xl flex items-center justify-center gap-2 transition-all text-sm"
        >
          <RotateCcw size={16} /> Restart
        </motion.button>
        <motion.button
          {...buttonProps}
          onClick={onNewGame}
          className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-2 px-4 rounded-xl flex items-center justify-center gap-2 transition-all text-sm"
        >
          <Settings2 size={16} /> Chọn độ khó khác
        </motion.button>
      </div>
    </div>
  );
});

export default GameControls;