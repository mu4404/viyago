/**
 * @file DurationSelector.tsx
 * @description 여행 기간(일수)을 정밀 슬라이더와 퀵 증감 버튼으로 손쉽게 조절할 수 있는 프리미엄 셀렉터 컴포넌트입니다.
 */

import React from 'react';
import { CalendarRange, Minus, Plus } from 'lucide-react';

interface DurationSelectorProps {
  duration: number; // 며칠 동안 갈 것인지 (기본값 예: 3일 = 2박 3일)
  onChangeDuration: (value: number) => void;
}

/**
 * @function DurationSelector
 * @description 여행 일수를 제어하기 위한 카운터와 슬라이더 요소를 제공합니다.
 */
export const DurationSelector: React.FC<DurationSelectorProps> = ({
  duration,
  onChangeDuration,
}) => {
  /**
   * @function handleIncrement
   * @description 여행 일수를 1일 증가시킵니다. (최대 14일)
   */
  const handleIncrement = () => {
    try {
      if (duration < 14) {
        onChangeDuration(duration + 1);
      }
    } catch (error) {
      console.error('handleIncrement error:', error);
    }
  };

  /**
   * @function handleDecrement
   * @description 여행 일수를 1일 감소시킵니다. (최소 1일)
   */
  const handleDecrement = () => {
    try {
      if (duration > 1) {
        onChangeDuration(duration - 1);
      }
    } catch (error) {
      console.error('handleDecrement error:', error);
    }
  };

  try {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <label htmlFor="duration-slider" className="text-lg font-medium text-gray-200 flex items-center">
            <CalendarRange className="w-5 h-5 mr-2 text-cyan-400" />
            얼마 동안 여행을 떠나시나요?
          </label>
          {/* 며칠 며칠 표시 */}
          <span className="text-lg font-bold text-gradient">
            {duration - 1 > 0 ? `${duration - 1}박 ${duration}일` : `당일치기 (${duration}일)`}
          </span>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-6 p-6 rounded-2xl glassmorphism">
          {/* 슬라이더 컨트롤 */}
          <div className="w-full flex-1 space-y-2">
            <input
              id="duration-slider"
              type="range"
              min="1"
              max="14"
              value={duration}
              onChange={(e) => onChangeDuration(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
            />
            <div className="flex justify-between text-xs text-gray-500 px-1">
              <span>당일치기</span>
              <span>3일</span>
              <span>7일</span>
              <span>10일</span>
              <span>14일 (최대)</span>
            </div>
          </div>

          {/* 수동 조작 컨트롤 (Minus / Plus) */}
          <div className="flex items-center gap-4 border border-slate-700/60 rounded-xl p-1 bg-slate-900/60">
            <button
              type="button"
              onClick={handleDecrement}
              disabled={duration <= 1}
              className={`p-2 rounded-lg transition-colors ${
                duration <= 1
                  ? 'text-gray-600 cursor-not-allowed'
                  : 'text-gray-300 hover:bg-slate-800 hover:text-white cursor-pointer'
              }`}
            >
              <Minus className="w-5 h-5" />
            </button>
            <span className="w-12 text-center text-xl font-bold text-white">{duration}일</span>
            <button
              type="button"
              onClick={handleIncrement}
              disabled={duration >= 14}
              className={`p-2 rounded-lg transition-colors ${
                duration >= 14
                  ? 'text-gray-600 cursor-not-allowed'
                  : 'text-gray-300 hover:bg-slate-800 hover:text-white cursor-pointer'
              }`}
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('DurationSelector Error:', error);
    return <div className="text-red-400">컴포넌트 렌더링 중 오류가 발생했습니다.</div>;
  }
};
