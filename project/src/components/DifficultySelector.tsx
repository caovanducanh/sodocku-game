import React, { useState } from 'react';
import { Difficulty, DifficultyConfig } from '../types/sudoku';
import { Play, Star } from 'lucide-react';

interface DifficultySelectorProps {
  onStartGame: (difficulty: Difficulty) => void;
}

const DifficultySelector: React.FC<DifficultySelectorProps> = ({ onStartGame }) => {
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('medium');

  const difficulties: DifficultyConfig[] = [
    { 
      name: 'easy', 
      label: 'Easy', 
      description: '35 empty cells - Perfect for beginners', 
      cellsToRemove: 35,
      color: 'text-green-600',
      gradient: 'from-green-500 to-emerald-600'
    },
    { 
      name: 'medium', 
      label: 'Medium', 
      description: '45 empty cells - Good challenge', 
      cellsToRemove: 45,
      color: 'text-blue-600',
      gradient: 'from-blue-500 to-cyan-600'
    },
    { 
      name: 'hard', 
      label: 'Hard', 
      description: '52 empty cells - For experienced players', 
      cellsToRemove: 52,
      color: 'text-orange-600',
      gradient: 'from-orange-500 to-red-500'
    },
    { 
      name: 'expert', 
      label: 'Expert', 
      description: '58 empty cells - Very challenging', 
      cellsToRemove: 58,
      color: 'text-red-600',
      gradient: 'from-red-500 to-pink-600'
    },
    { 
      name: 'master', 
      label: 'Master', 
      description: '64 empty cells - Ultimate challenge', 
      cellsToRemove: 64,
      color: 'text-purple-600',
      gradient: 'from-purple-500 to-indigo-600'
    },
  ];

  const getDifficultyStars = (difficulty: string) => {
    const starCount = difficulties.findIndex(d => d.name === difficulty) + 1;
    return Array(5).fill(0).map((_, i) => (
      <Star 
        key={i} 
        size={16} 
        className={i < starCount ? 'text-yellow-400 fill-current' : 'text-gray-300'} 
      />
    ));
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl max-w-lg w-full p-8 border border-white/20">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
            Sudoku Master
          </h1>
          <p className="text-gray-600 text-lg">Choose your challenge level</p>
        </div>
        
        <div className="space-y-3 mb-8">
          {difficulties.map((diff) => (
            <button
              key={diff.name}
              onClick={() => setSelectedDifficulty(diff.name as Difficulty)}
              className={`w-full p-4 rounded-2xl border-2 transition-all duration-300 transform hover:scale-[1.02] ${
                selectedDifficulty === diff.name
                  ? 'border-purple-500 bg-purple-50 shadow-lg shadow-purple-200'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="text-left flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-xl font-bold ${diff.color}`}>
                      {diff.label}
                    </span>
                    <div className="flex gap-1">
                      {getDifficultyStars(diff.name)}
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm">{diff.description}</p>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 transition-all ${
                  selectedDifficulty === diff.name
                    ? 'border-purple-500 bg-purple-500'
                    : 'border-gray-300'
                }`}>
                  {selectedDifficulty === diff.name && (
                    <div className="w-full h-full rounded-full bg-white transform scale-50"></div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
        
        <button
          onClick={() => onStartGame(selectedDifficulty)}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-4 rounded-2xl hover:from-purple-700 hover:to-blue-700 transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
        >
          <Play size={20} />
          Start New Game
        </button>
      </div>
    </div>
  );
};

export default DifficultySelector;