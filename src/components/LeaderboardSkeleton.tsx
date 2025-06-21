import React from 'react';

const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td className="py-2 px-2">
      <div className="h-4 bg-gray-200 rounded w-4"></div>
    </td>
    <td className="py-2 px-2">
      <div className="h-4 bg-gray-200 rounded w-20"></div>
    </td>
    <td className="py-2 px-2">
      <div className="h-4 bg-gray-200 rounded w-12"></div>
    </td>
  </tr>
);

const LeaderboardSkeleton = () => {
  return (
    <div className="overflow-x-auto w-full">
      <h2 className="text-xl font-bold text-purple-700 mb-2 text-center">Bảng xếp hạng</h2>
       <div className="mb-2 text-center h-5">
          {/* Placeholder for user rank */}
      </div>
      <table className="min-w-[220px] w-full border-collapse rounded-xl overflow-hidden shadow-lg bg-white">
        <thead>
          <tr className="bg-purple-100 text-purple-700">
            <th className="py-1 px-2 text-left text-sm">#</th>
            <th className="py-1 px-2 text-left text-sm">Tên</th>
            <th className="py-1 px-2 text-left text-sm">Điểm</th>
          </tr>
        </thead>
        <tbody>
          {[...Array(10)].map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LeaderboardSkeleton; 