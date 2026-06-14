/**
 * @file MockMap.tsx
 * @description 여행 일차별 주요 방문 장소들을 가상의 지도 위에 동선(노드 및 경로선)으로 시각화해 주는 프리미엄 컴포넌트입니다.
 */

import React from 'react';
import { Map, Navigation2 } from 'lucide-react';
import type { Activity } from './TravelPlanView';

interface MockMapProps {
  activities: Activity[];
  destination: string;
}

/**
 * @function MockMap
 * @description SVG 캔버스 위에 일차별 방문 장소들을 위치 노드로 변환하고, 흐르는 점선 라인으로 동선을 시각화합니다.
 */
export const MockMap: React.FC<MockMapProps> = ({ activities, destination }) => {
  // 활동 목록 중 숙소, 식당, 관광지 등을 필터링 (동선에 그릴 스팟 추출)
  const spots = activities.filter(act => act.type !== 'transport');

  // SVG 내에서 노드들의 위치(X, Y) 좌표를 생성 (장소 개수에 따라 부드러운 웨이브 곡선 배치)
  const generateCoordinates = (index: number, total: number) => {
    try {
      if (total === 1) return { x: 50, y: 50 };
      
      // 노드들이 좌우 지그재그(또는 위아래)로 자연스럽게 퍼지도록 좌표 계산
      const padding = 15;
      const rangeX = 100 - padding * 2;
      const rangeY = 100 - padding * 2;
      
      // X좌표: 순차적으로 우측으로 가되 지그재그 편차 부여
      const x = padding + (index / (total - 1)) * rangeX;
      // Y좌표: 삼각함수를 이용하여 지그재그 웨이브 연출
      const y = padding + (Math.sin((index * Math.PI) / 2) * 0.4 + 0.5) * rangeY;
      
      return { x, y };
    } catch (error) {
      console.error('generateCoordinates error:', error);
      return { x: 50, y: 50 };
    }
  };

  const totalSpots = spots.length;
  const spotCoords = spots.map((spot, idx) => ({
    spot,
    ...generateCoordinates(idx, totalSpots),
  }));

  try {
    return (
      <div className="p-6 rounded-3xl glassmorphism border border-cyan-500/10 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Map className="w-5 h-5 text-cyan-400" />
            AI 동선 시각화 가이드
          </h3>
          <span className="text-xs font-semibold text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-2.5 py-1 rounded-full flex items-center">
            <Navigation2 className="w-3 h-3 mr-1 animate-pulse" /> {destination}
          </span>
        </div>

        {/* 시각화 맵 컨테이너 */}
        <div className="relative w-full h-[260px] md:h-[320px] rounded-2xl bg-slate-950/70 border border-slate-800/60 overflow-hidden shadow-inner flex items-center justify-center">
          {/* 격자 백그라운드 무늬 */}
          <div 
            className="absolute inset-0 opacity-5" 
            style={{ 
              backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', 
              backgroundSize: '20px 20px' 
            }} 
          />

          {totalSpots === 0 ? (
            <div className="text-gray-500 text-sm">표시할 이동 장소가 없습니다.</div>
          ) : (
            <svg className="w-full h-full p-4" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* 정의 영역 (그라데이션 및 필터) */}
              <defs>
                <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.8" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              {/* 1. 이동 경로선 그리기 */}
              {spotCoords.length > 1 && (
                <path
                  d={`M ${spotCoords.map(c => `${c.x} ${c.y}`).join(' L ')}`}
                  fill="none"
                  stroke="url(#routeGradient)"
                  strokeWidth="0.8"
                  strokeDasharray="2, 2"
                  className="animate-[dash_20s_linear_infinite]"
                  style={{
                    strokeDashoffset: 100,
                  }}
                  filter="url(#glow)"
                />
              )}

              {/* 2. 장소 마커 및 라벨 렌더링 */}
              {spotCoords.map((coord, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === totalSpots - 1;
                
                return (
                  <g key={idx} className="group cursor-pointer">
                    {/* 마커 외부 펄스 링 (첫 장소와 마지막 장소만 연출) */}
                    {(isFirst || isLast) && (
                      <circle
                        cx={coord.x}
                        cy={coord.y}
                        r="3.5"
                        fill="none"
                        stroke={isFirst ? '#818cf8' : '#22d3ee'}
                        strokeWidth="0.3"
                        className="animate-ping [animation-duration:2s]"
                      />
                    )}

                    {/* 핵심 노드 도트 */}
                    <circle
                      cx={coord.x}
                      cy={coord.y}
                      r="1.8"
                      fill={isFirst ? '#6366f1' : isLast ? '#06b6d4' : '#1e293b'}
                      stroke={isFirst ? '#a5b4fc' : isLast ? '#67e8f9' : '#94a3b8'}
                      strokeWidth="0.4"
                      className="transition-all duration-300 group-hover:r-[2.5] group-hover:fill-cyan-400"
                    />

                    {/* 장소 순서 번호 표시 */}
                    <text
                      x={coord.x}
                      y={coord.y - 3.5}
                      textAnchor="middle"
                      fill="#f3f4f6"
                      fontSize="2.2"
                      fontWeight="bold"
                      className="pointer-events-none"
                    >
                      {idx + 1}
                    </text>

                    {/* 장소 이름 텍스트 */}
                    <text
                      x={coord.x}
                      y={coord.y + 4.2}
                      textAnchor="middle"
                      fill="#9ca3af"
                      fontSize="1.8"
                      className="pointer-events-none group-hover:fill-white font-semibold transition-colors"
                    >
                      {coord.spot.place.length > 8 ? `${coord.spot.place.slice(0, 7)}..` : coord.spot.place}
                    </text>
                  </g>
                );
              })}
            </svg>
          )}
        </div>
        
        {/* 설명 안내 범례 */}
        <div className="flex justify-center gap-6 text-xs text-gray-500 pt-1">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 border border-indigo-400" />
            출발지
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-500" />
            경유지
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 border border-cyan-400" />
            도착/숙소
          </span>
        </div>
      </div>
    );
  } catch (error) {
    console.error('MockMap Rendering Error:', error);
    return <div className="text-red-400">지도를 시각화하는 과정에서 에러가 발생했습니다.</div>;
  }
};
