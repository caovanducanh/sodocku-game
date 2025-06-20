import React from 'react';

interface LeaderboardEntry {
  username: string;
  score: number;
}

interface LeaderboardProps {
  leaderboard: LeaderboardEntry[];
  userRank?: { rank: number; score: number } | null;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ leaderboard, userRank }) => {
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
            <th className="py-2 px-3 text-left">#</th>
            <th className="py-2 px-3 text-left">Tên</th>
            <th className="py-2 px-3 text-left">Điểm</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard && leaderboard.length > 0 ? leaderboard.map((entry, idx) => (
            <tr key={entry.username + entry.score} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="py-2 px-3 font-bold text-purple-600">{idx + 1}</td>
              <td className="py-2 px-3">{entry.username}</td>
              <td className="py-2 px-3">{entry.score}</td>
            </tr>
          )) : (
            <tr><td colSpan={3} className="text-center text-gray-400 py-6">Chưa có dữ liệu</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Leaderboard; 