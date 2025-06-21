import React, { memo } from 'react';
import { Crown } from 'lucide-react';
import { motion } from 'framer-motion';

interface LeaderboardEntry {
  username: string;
  score: number;
}

interface LeaderboardProps {
  leaderboard: LeaderboardEntry[];
  userRank?: { rank: number; score: number } | null;
}

const tableVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const rowVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 260,
      damping: 20,
    }
  },
};

const Leaderboard: React.FC<LeaderboardProps> = memo(({ leaderboard, userRank }) => {
  const getCrown = (rank: number) => {
    if (rank === 1) return <Crown size={16} className="text-yellow-400 fill-yellow-400" />;
    if (rank === 2) return <Crown size={16} className="text-gray-400 fill-gray-400" />;
    if (rank === 3) return <Crown size={16} className="text-orange-400 fill-orange-400" />;
    return null;
  };

  return (
    <div className="overflow-x-auto w-full">
      <h2 className="text-xl font-bold text-purple-700 mb-2 text-center">Bảng xếp hạng</h2>
      {userRank && (
        <div className="mb-2 text-center text-sm text-green-700 font-semibold">
          Vị trí của bạn: <span className="font-bold">#{userRank.rank}</span> với <span className="font-bold">{userRank.score}</span> điểm
        </div>
      )}
      <table className="min-w-[220px] w-full border-collapse rounded-xl overflow-hidden shadow-lg bg-white">
        <thead>
          <tr className="bg-purple-100 text-purple-700">
            <th className="py-1 px-2 text-left text-sm">#</th>
            <th className="py-1 px-2 text-left text-sm">Tên</th>
            <th className="py-1 px-2 text-left text-sm">Điểm</th>
          </tr>
        </thead>
        <motion.tbody
          variants={tableVariants}
          initial="hidden"
          animate="visible"
        >
          {leaderboard && leaderboard.length > 0 ? leaderboard.map((entry, idx) => (
            <motion.tr variants={rowVariants} key={entry.username + entry.score} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="py-1 px-2 text-sm font-bold text-purple-600">{idx + 1}</td>
              <td className="py-1 px-2 text-sm">
                <div className="flex items-center gap-2">
                  <span>{entry.username}</span>
                  {getCrown(idx + 1)}
                </div>
              </td>
              <td className="py-1 px-2 text-sm">{entry.score}</td>
            </motion.tr>
          )) : (
            <tr><td colSpan={3} className="text-center text-gray-400 py-6">Chưa có dữ liệu</td></tr>
          )}
        </motion.tbody>
      </table>
    </div>
  );
});

export default Leaderboard; 