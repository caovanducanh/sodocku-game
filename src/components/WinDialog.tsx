import React, { useEffect } from 'react';
import { Trophy, Clock, Target, Lightbulb, Star, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface WinDialogProps {
  elapsedTime: number;
  mistakes: number;
  hintsUsed: number;
  difficulty: string;
  onNewGame: () => void;
  onPlayAgain: () => void;
}

const WinDialog: React.FC<WinDialogProps> = ({
  elapsedTime,
  mistakes,
  hintsUsed,
  difficulty,
  onNewGame,
  onPlayAgain,
}) => {
  useEffect(() => {
    confetti({
      particleCount: 200,
      spread: 90,
      origin: { y: 0.6 },
      zIndex: 9999,
    });
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getPerformanceRating = () => {
    const baseScore = 100;
    const timeScore = Math.max(0, baseScore - Math.floor(elapsedTime / 30)); // -1 point per 30 seconds
    const mistakeScore = Math.max(0, baseScore - mistakes * 15); // -15 points per mistake
    const hintScore = Math.max(0, baseScore - hintsUsed * 10); // -10 points per hint
    
    const finalScore = Math.floor((timeScore + mistakeScore + hintScore) / 3);
    
    if (finalScore >= 85) return { rating: 'Perfect!', color: 'text-yellow-500', stars: 3, message: 'Outstanding performance!' };
    if (finalScore >= 70) return { rating: 'Excellent!', color: 'text-blue-500', stars: 3, message: 'Great job solving this puzzle!' };
    if (finalScore >= 55) return { rating: 'Good!', color: 'text-green-500', stars: 2, message: 'Well done!' };
    if (finalScore >= 40) return { rating: 'Nice!', color: 'text-orange-500', stars: 2, message: 'Keep improving!' };
    return { rating: 'Complete!', color: 'text-gray-500', stars: 1, message: 'Every completion counts!' };
  };

  const performance = getPerformanceRating();

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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center border border-gray-200 relative overflow-hidden">
        {/* Celebration Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 via-white to-blue-50 opacity-50"></div>
        
        <div className="relative z-10">
          {/* Trophy and Sparkles */}
          <div className="relative mb-6">
            <Sparkles className="absolute -top-2 -left-2 w-6 h-6 text-yellow-400 animate-pulse" />
            <Sparkles className="absolute -top-1 -right-3 w-4 h-4 text-blue-400 animate-pulse delay-300" />
            <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-4 drop-shadow-lg" />
            <Sparkles className="absolute -bottom-2 left-1 w-5 h-5 text-purple-400 animate-pulse delay-700" />
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Puzzle Solved!</h2>
          
          {/* Difficulty Badge */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-white font-bold text-sm bg-gradient-to-r ${getDifficultyColor(difficulty)} shadow-lg mb-4`}>
            {difficulty.toUpperCase()} LEVEL
          </div>
          
          {/* Performance Rating */}
          <div className={`text-2xl font-bold ${performance.color} mb-2`}>
            {performance.rating}
          </div>
          <p className="text-gray-600 mb-4">{performance.message}</p>
          
          {/* Stars */}
          <div className="flex justify-center mb-6">
            {[...Array(3)].map((_, i) => (
              <Star 
                key={i} 
                className={`w-8 h-8 mx-1 ${
                  i < performance.stars 
                    ? 'text-yellow-400 fill-current' 
                    : 'text-gray-300'
                }`} 
              />
            ))}
          </div>
          
          {/* Stats */}
          <div className="bg-gray-50 rounded-2xl p-6 mb-6 border border-gray-100">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <Clock className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                <div className="font-bold text-gray-800 text-lg">{formatTime(elapsedTime)}</div>
                <div className="text-sm text-gray-600">Time</div>
              </div>
              <div>
                <Target className="w-6 h-6 text-red-500 mx-auto mb-2" />
                <div className="font-bold text-gray-800 text-lg">{mistakes}</div>
                <div className="text-sm text-gray-600">Mistakes</div>
              </div>
              <div>
                <Lightbulb className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                <div className="font-bold text-gray-800 text-lg">{hintsUsed}</div>
                <div className="text-sm text-gray-600">Hints</div>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onPlayAgain}
              className="py-3 px-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Chơi lại
            </button>
            <button
              onClick={onNewGame}
              className="py-3 px-6 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold rounded-2xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Chọn độ khó khác
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WinDialog;