import React from 'react';

interface LeaderboardEntry {
  username: string;
  score: number;
  difficulty: string;
  time: number;
}

interface LeaderboardProps {
  leaderboard: LeaderboardEntry[];
}

const Leaderboard: React.FC<LeaderboardProps> = ({ leaderboard }) => {
  if (!leaderboard || leaderboard.length === 0) {
    return <div className="text-center text-gray-400 py-6">Chưa có dữ liệu</div>;
  }
  return (
    <div className="overflow-x-auto w-full">
      <table className="min-w-[320px] w-full border-collapse rounded-xl overflow-hidden shadow-lg bg-white">
        <thead>
          <tr className="bg-purple-100 text-purple-700">
            <th className="py-2 px-3 text-left">#</th>
            <th className="py-2 px-3 text-left">Tên</th>
            <th className="py-2 px-3 text-left">Điểm</th>
            <th className="py-2 px-3 text-left">Độ khó</th>
            <th className="py-2 px-3 text-left">Thời gian</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.map((entry, idx) => (
            <tr key={entry.username + entry.score + entry.time} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="py-2 px-3 font-bold text-purple-600">{idx + 1}</td>
              <td className="py-2 px-3">{entry.username}</td>
              <td className="py-2 px-3">{entry.score}</td>
              <td className="py-2 px-3 capitalize">{entry.difficulty}</td>
              <td className="py-2 px-3">{Math.floor(entry.time / 60)}:{(entry.time % 60).toString().padStart(2, '0')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Leaderboard; 