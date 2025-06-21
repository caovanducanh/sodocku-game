import React from 'react';

interface PopupProps {
  onClose: () => void;
}

export const HowToPlayPopup: React.FC<PopupProps> = ({ onClose }) => (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100]" onClick={onClose}>
    <div className="bg-white rounded-2xl shadow-2xl p-6 w-[90vw] max-w-md relative animate-pop" onClick={(e) => e.stopPropagation()}>
      <button className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 text-xl font-bold text-gray-700 shadow" onClick={onClose}>&times;</button>
      <div className="font-bold text-lg text-purple-700 mb-3 text-center">Hướng Dẫn Cho Người Mới Bắt Đầu</div>
      <div className="text-sm text-gray-800 space-y-3">
        <p>Chào mừng bạn đến với Sudoku! Đây là một trò chơi giải đố logic rất thú vị. Mục tiêu của bạn rất đơn giản: <strong>lấp đầy tất cả các ô trống bằng các số từ 1 đến 9.</strong></p>
        <div>
          <p className="font-bold mb-1">Chỉ cần nhớ 3 quy tắc VÀNG:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Số bạn điền không được trùng với bất kỳ số nào trên cùng <strong>HÀNG NGANG</strong>.</li>
            <li>Số bạn điền không được trùng với bất kỳ số nào trên cùng <strong>CỘT DỌC</strong>.</li>
            <li>Số bạn điền không được trùng với bất kỳ số nào trong cùng <strong>Ô VUÔNG LỚN (3x3)</strong>.</li>
          </ul>
        </div>
        <div>
          <p className="font-bold mb-1">Mẹo chơi cực dễ:</p>
           <ul className="list-disc pl-5 space-y-1">
            <li><strong>Bắt đầu từ nơi dễ nhất:</strong> Tìm những hàng, cột, hoặc ô vuông lớn đã có nhiều số nhất. Việc tìm ra số còn thiếu sẽ dễ dàng hơn rất nhiều!</li>
            <li><strong>Dùng Ghi Chú (Notes):</strong> Nếu chưa chắc chắn về một ô, hãy bật chế độ "Notes" và điền những con số bạn đang phân vân vào đó. Đây là cách các cao thủ sử dụng để loại trừ và tìm ra đáp án đúng.</li>
          </ul>
        </div>
        <p className="text-center font-semibold pt-2">Chúc bạn có những giờ phút giải đố vui vẻ!</p>
      </div>
    </div>
  </div>
);

export const RulesPopup: React.FC<PopupProps> = ({ onClose }) => (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100]" onClick={onClose}>
    <div className="bg-white rounded-2xl shadow-2xl p-6 w-[90vw] max-w-sm relative animate-pop" onClick={(e) => e.stopPropagation()}>
      <button className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 text-xl font-bold text-gray-700 shadow" onClick={onClose}>&times;</button>
      <div className="font-bold text-lg text-purple-700 mb-3 text-center">Quy Tắc Tính Điểm</div>
      <div className="text-sm text-gray-800 space-y-3">
        <div>
          <p className="font-semibold text-green-600 mb-1">⭐ Điểm Thưởng:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Mỗi lần bạn điền đúng một số, bạn sẽ nhận được điểm.</li>
            <li><strong>Combo Thưởng:</strong> Điền đúng liên tiếp nhiều số sẽ giúp bạn nhận được điểm thưởng nhân lên, càng về sau điểm càng cao!</li>
          </ul>
        </div>
         <div>
          <p className="font-semibold text-red-600 mb-1">💔 Mất Điểm:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Mỗi lần điền sai, bạn sẽ bị trừ một chút điểm. Đừng lo, điểm của bạn sẽ không bao giờ bị âm.</li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-yellow-600 mb-1">💡 Dùng Gợi Ý (Hint):</p>
          <ul className="list-disc pl-5 space-y-1">
              <li>Sử dụng "Hint" sẽ không được cộng điểm cho ô đó.</li>
              <li>Số lượt "Hint" là có hạn tùy theo độ khó bạn chọn.</li>
          </ul>
        </div>
        <p className="text-center font-semibold pt-2">Hãy chơi thật chiến lược để đạt điểm cao nhất nhé!</p>
      </div>
    </div>
  </div>
); 