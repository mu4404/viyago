/**
 * @file LoadingScreen.tsx
 * @description AI 일정을 설계하는 동안 대기 시간을 지루하지 않게 채워줄 프리미엄 로딩 스크린 컴포넌트입니다.
 */

import React, { useEffect, useState } from 'react';
import { Compass, Sparkles } from 'lucide-react';

interface LoadingScreenProps {
  destination: string;
}

// 로딩 프로세스에 따라 노출할 문구 리스트
const LOADING_MESSAGES = [
  '지도를 펼치고 여행지를 파악하고 있어요...',
  '현지 날씨와 위치를 파악하는 중입니다...',
  '동선을 고려한 가장 효율적인 루트를 설계하고 있어요...',
  '숨겨진 로컬 맛집과 랜드마크 정보를 가져오는 중...',
  '당신을 위한 가장 완벽한 하루하루를 편집하는 중...',
  '거의 다 완성되었어요! 일정을 정리하고 있습니다...',
];

/**
 * @function LoadingScreen
 * @description 화려한 컴퍼스 회전 애니메이션과 실시간 메시지 롤링을 제공합니다.
 */
export const LoadingScreen: React.FC<LoadingScreenProps> = ({ destination }) => {
  const [messageIndex, setMessageIndex] = useState(0);

  // 메시지를 일정 시간 간격으로 순환 변경
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2800);

    return () => clearInterval(interval);
  }, []);

  try {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50svh] px-4 text-center">
        {/* 컴퍼스/스파클링 로딩 애니메이션 */}
        <div className="relative mb-8 flex items-center justify-center">
          {/* 퍼지는 네온 아우라 백그라운드 */}
          <div className="absolute w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl animate-pulse" />
          <div className="absolute w-24 h-24 bg-cyan-400/10 rounded-full blur-xl animate-ping" />
          
          {/* 회전 컴퍼스 아이콘 */}
          <div className="relative p-6 bg-slate-900/80 rounded-full border border-indigo-500/30 shadow-[0_0_30px_rgba(99,102,241,0.25)] animate-spin [animation-duration:8s]">
            <Compass className="w-16 h-16 text-cyan-400" />
          </div>
          
          {/* 보조 스파클스 아이콘 */}
          <div className="absolute -top-1 -right-1 p-2 bg-indigo-950/60 rounded-full border border-indigo-400/50 animate-bounce">
            <Sparkles className="w-5 h-5 text-indigo-400" />
          </div>
        </div>

        {/* 로딩 텍스트 정보 */}
        <div className="space-y-3 max-w-md">
          <h2 className="text-2xl font-bold text-white tracking-tight">
            <span className="text-gradient font-extrabold">{destination}</span>(으)로 떠나는 여행 계획 중
          </h2>
          <p className="text-sm text-cyan-300 font-medium tracking-wide animate-pulse">
            AI Planner가 맞춤 일정을 짜고 있습니다
          </p>
          <div className="h-6 overflow-hidden mt-6">
            <p className="text-gray-400 text-sm animate-fade-in transition-all duration-500">
              {LOADING_MESSAGES[messageIndex]}
            </p>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('LoadingScreen Error:', error);
    return <div className="text-red-400">로딩 화면 구성 중 오류가 발생했습니다.</div>;
  }
};
