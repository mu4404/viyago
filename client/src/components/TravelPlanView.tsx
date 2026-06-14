/**
 * @file TravelPlanView.tsx
 * @description AI가 추천해 준 일정을 타임라인 형식과 깔끔한 탭 뷰로 시각화해 주는 프리미엄 결과 컴포넌트입니다.
 */

import React, { useState } from 'react';
import { Calendar, MapPin, Users, Utensils, Compass, Moon, ChevronRight, RefreshCw, Bookmark } from 'lucide-react';
import { TravelMap } from './TravelMap';

// 여행 일정 관련 인터페이스들
export interface Activity {
  time: string;
  place: string;
  placeEn?: string;
  description: string;
  type: 'restaurant' | 'sightseeing' | 'transport' | 'hotel' | string;
}

export interface DayPlan {
  day: number;
  theme: string;
  activities: Activity[];
}

export interface TravelPlan {
  destination: string;
  companion: string;
  duration: number;
  summary: string;
  days: DayPlan[];
}

interface TravelPlanViewProps {
  plan: TravelPlan;
  onReset: () => void;
  onSave?: () => void;
}

/**
 * @function TravelPlanView
 * @description 생성된 여행 일정을 날짜별로 선택하여 디테일한 시간별 계획을 보여줍니다.
 */
export const TravelPlanView: React.FC<TravelPlanViewProps> = ({ plan, onReset, onSave }) => {
  const [activeDay, setActiveDay] = useState(1);

  // 현재 활성화된 날짜의 일정 필터링
  const currentDayPlan = plan.days.find((d) => d.day === activeDay) || plan.days[0];

  /**
   * @function getActivityIcon
   * @description 활동 유형에 맞는 Lucide 아이콘을 매칭하여 반환합니다.
   * @param {string} type 활동 유형
   */
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'restaurant':
        return <Utensils className="w-5 h-5 text-amber-400" />;
      case 'hotel':
        return <Moon className="w-5 h-5 text-indigo-400" />;
      case 'sightseeing':
        return <Compass className="w-5 h-5 text-emerald-400" />;
      default:
        return <ChevronRight className="w-5 h-5 text-cyan-400" />;
    }
  };

  try {
    return (
      <div className="space-y-8 animate-fade-in">
        {/* 상단 개요 카드 */}
        <div className="p-8 rounded-3xl glassmorphism border border-indigo-500/20 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative space-y-4">
            <div className="flex flex-wrap gap-3">
              <span className="flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                <MapPin className="w-3.5 h-3.5 mr-1" /> {plan.destination}
              </span>
              <span className="flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                <Users className="w-3.5 h-3.5 mr-1" /> {plan.companion}
              </span>
              <span className="flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-gray-300 border border-slate-700">
                <Calendar className="w-3.5 h-3.5 mr-1" /> {plan.duration}일간의 일정
              </span>
            </div>

            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              {plan.destination} 맞춤 일정 가이드
            </h2>
            <p className="text-gray-300 leading-relaxed text-base max-w-2xl">
              {plan.summary}
            </p>

            {/* 작업 제어 영역 */}
            <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-800/80">
              <button
                type="button"
                onClick={onReset}
                className="flex items-center px-4 py-2.5 rounded-xl border border-slate-700 text-gray-300 hover:text-white hover:border-gray-500 hover:bg-slate-800/40 transition-colors cursor-pointer text-sm font-medium"
              >
                <RefreshCw className="w-4 h-4 mr-2" /> 새 일정 짜기
              </button>
              <button
                type="button"
                onClick={onSave}
                className="flex items-center px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-lg shadow-indigo-500/20 text-sm"
              >
                <Bookmark className="w-4 h-4 mr-2" /> 내 보관함에 저장
              </button>
            </div>
          </div>
        </div>

        {/* 날짜 선택 탭 */}
        <div className="flex border-b border-slate-800 overflow-x-auto pb-px">
          {plan.days.map((dayPlan) => (
            <button
              key={dayPlan.day}
              type="button"
              onClick={() => setActiveDay(dayPlan.day)}
              className={`px-6 py-3 border-b-2 font-semibold text-sm transition-all whitespace-nowrap cursor-pointer ${
                activeDay === dayPlan.day
                  ? 'border-cyan-400 text-cyan-400 font-bold'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              Day {dayPlan.day}
            </button>
          ))}
        </div>

        {/* 선택 날짜 상세 계획 및 동선 지도 그리드 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 왼쪽: 타임라인 일정 (2/3 영역 차지) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/50">
              <p className="text-sm text-cyan-400 font-semibold uppercase tracking-wider">오늘의 테마</p>
              <h3 className="text-lg font-bold text-white mt-1">{currentDayPlan.theme}</h3>
            </div>

            {/* 타임라인 바디 */}
            <div className="relative pl-6 border-l-2 border-slate-800 space-y-8 ml-3">
              {currentDayPlan.activities.map((activity, index) => (
                <div key={index} className="relative group">
                  {/* 타임라인 도트 포인트 */}
                  <div className="absolute -left-[35px] top-1.5 flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 border border-slate-700 group-hover:border-cyan-400 transition-colors shadow">
                    {getActivityIcon(activity.type)}
                  </div>

                  <div className="space-y-1.5 pl-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-950/30 border border-cyan-800/40">
                        {activity.time}
                      </span>
                      <h4 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {activity.place}
                      </h4>
                    </div>
                    <p className="text-sm text-gray-400 leading-relaxed max-w-3xl">
                      {activity.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 오른쪽: 가상 동선 지도 (1/3 영역 차지) */}
          <div className="lg:col-span-1">
            <TravelMap activities={currentDayPlan.activities} destination={plan.destination} />
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('TravelPlanView Error:', error);
    return <div className="text-red-400">결과 렌더링 중 오류가 발생했습니다.</div>;
  }
};
