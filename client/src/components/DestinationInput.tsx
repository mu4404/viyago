/**
 * @file DestinationInput.tsx
 * @description 여행지를 검색 및 입력하고, 추천 인기 여행지 태그를 원클릭으로 선택할 수 있는 프리미엄 입력 컴포넌트입니다.
 */

import React, { useState } from 'react';
import { MapPin, Search } from 'lucide-react';

interface DestinationInputProps {
  destination: string;
  onChangeDestination: (value: string) => void;
}

// 추천 인기 여행지 목록
const RECOMMENDED_DESTINATIONS = [
  { name: '제주도', type: 'domestic' },
  { name: '부산', type: 'domestic' },
  { name: '경주', type: 'domestic' },
  { name: '도쿄', type: 'international' },
  { name: '방콕', type: 'international' },
  { name: '파리', type: 'international' },
  { name: '뉴욕', type: 'international' },
];

/**
 * @function DestinationInput
 * @description 여행지 텍스트 검색창 및 추천 태그를 렌더링합니다.
 */
export const DestinationInput: React.FC<DestinationInputProps> = ({
  destination,
  onChangeDestination,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  try {
    return (
      <div className="space-y-4">
        <label htmlFor="destination-input" className="block text-lg font-medium text-gray-200">
          어디로 떠나고 싶으신가요?
        </label>
        
        {/* 검색창 */}
        <div
          className={`relative flex items-center w-full rounded-2xl glassmorphism transition-all duration-300 ${
            isFocused
              ? 'border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.2)]'
              : 'border-transparent'
          }`}
        >
          <div className="absolute left-4 text-gray-400">
            <MapPin className={`w-5 h-5 transition-colors duration-300 ${isFocused ? 'text-indigo-400' : ''}`} />
          </div>
          <input
            id="destination-input"
            type="text"
            value={destination}
            onChange={(e) => onChangeDestination(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="여행하고 싶은 도시나 나라를 입력하세요 (예: 제주도, 도쿄, 파리...)"
            className="w-full py-4 pl-12 pr-4 bg-transparent border-0 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-0 text-base"
          />
        </div>

        {/* 추천 인기 여행지 */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 mr-2 flex items-center">
            <Search className="w-3.5 h-3.5 mr-1" /> 인기 추천:
          </span>
          {RECOMMENDED_DESTINATIONS.map((dest) => (
            <button
              key={dest.name}
              type="button"
              onClick={() => onChangeDestination(dest.name)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all duration-300 cursor-pointer ${
                destination === dest.name
                  ? 'bg-indigo-500/20 border-indigo-400 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.15)]'
                  : 'bg-slate-800/40 border-slate-700/60 text-gray-400 hover:border-gray-500 hover:text-white'
              }`}
            >
              {dest.name}
            </button>
          ))}
        </div>
      </div>
    );
  } catch (error) {
    console.error('DestinationInput Error:', error);
    return <div className="text-red-400">컴포넌트 렌더링 중 오류가 발생했습니다.</div>;
  }
};
