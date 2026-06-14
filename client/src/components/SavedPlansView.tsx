/**
 * @file SavedPlansView.tsx
 * @description 데이터베이스(MongoDB)에 저장된 사용자 보관 일정 목록을 조회하고
 * 관리(보기, 공유, 삭제)할 수 있는 프리미엄 마이페이지 뷰 컴포넌트입니다.
 */

import React, { useEffect, useState } from 'react';
import { Bookmark, Calendar, MapPin, Trash2, Share2, ArrowLeft, Loader2 } from 'lucide-react';
import type { TravelPlan } from './TravelPlanView';

// 저장된 도큐먼트 구조 정의 (Mongoose 데이터는 _id와 createdAt을 가짐)
interface SavedTravelPlan extends TravelPlan {
  _id: string;
  createdAt: string;
}

interface SavedPlansViewProps {
  onSelectPlan: (plan: TravelPlan) => void;
  onClose: () => void;
}

/**
 * @function SavedPlansView
 * @description 저장된 일정 목록을 서버로부터 가져와 세련된 카드로 정렬 및 렌더링하고, 삭제/공유 액션을 처리합니다.
 */
export const SavedPlansView: React.FC<SavedPlansViewProps> = ({ onSelectPlan, onClose }) => {
  const [plans, setPlans] = useState<SavedTravelPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 컴포넌트 로드 시 보관된 일정 데이터 조회
  useEffect(() => {
    fetchSavedPlans();
  }, []);

  /**
   * @function fetchSavedPlans
   * @description 백엔드 API로부터 저장된 일정 리스트를 불러옵니다.
   */
  const fetchSavedPlans = async () => {
    setIsLoading(true);
    setError(null);
    
    // 1. 브라우저 로컬 데이터 가져오기
    let localPlans: SavedTravelPlan[] = [];
    try {
      const rawLocal = localStorage.getItem('voyago_local_plans') || '[]';
      localPlans = JSON.parse(rawLocal);
    } catch (localErr) {
      console.error('LocalStorage read error in SavedPlansView:', localErr);
    }

    try {
      // 2. 백엔드 API 요청 시도
      const response = await fetch('http://localhost:5001/api/plan/saved');
      if (response.ok) {
        const data = await response.json();
        const serverPlans: SavedTravelPlan[] = data.plans || [];
        
        // 백엔드 데이터와 로컬 데이터를 결합하고 최신순(createdAt) 정렬
        const mergedPlans = [...serverPlans, ...localPlans].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setPlans(mergedPlans);
      } else {
        throw new Error('Server returned error response');
      }
    } catch (err) {
      console.warn('Backend server is unreachable. Loading LocalStorage items only...', err);
      // 백엔드가 꺼져 있는 경우, 에러를 내지 않고 로컬 보관함 아이템만 정렬하여 보여줌
      const sortedLocal = [...localPlans].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setPlans(sortedLocal);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * @function handleDeletePlan
   * @description 특정 일정을 DB 보관함에서 삭제합니다.
   * @param {string} id 삭제할 일정의 고유 ID
   * @param {string} destination 알림 표시용 목적지명
   */
  const handleDeletePlan = async (id: string, destination: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 카드 선택 이벤트 전파 방지
    
    if (!confirm(`"${destination}" 여행 일정을 보관함에서 정말 삭제하시겠습니까?`)) {
      return;
    }

    // 1. 로컬 저장 아이템인 경우 로컬스토리지에서만 즉각 삭제
    if (id.startsWith('local_')) {
      try {
        const rawLocal = localStorage.getItem('voyago_local_plans') || '[]';
        const localPlans: SavedTravelPlan[] = JSON.parse(rawLocal);
        const filtered = localPlans.filter(p => p._id !== id);
        localStorage.setItem('voyago_local_plans', JSON.stringify(filtered));
        
        alert('보관함에서 삭제되었습니다.');
        setPlans(prev => prev.filter(p => p._id !== id));
        return;
      } catch (localErr) {
        console.error('LocalStorage delete error:', localErr);
        alert('로컬 저장소에서 일정을 제거하지 못했습니다.');
        return;
      }
    }

    // 2. 백엔드 데이터인 경우 API 서버를 호출해 삭제
    try {
      const response = await fetch(`http://localhost:5001/api/plan/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('성공적으로 삭제되었습니다.');
        setPlans(prev => prev.filter(p => p._id !== id));
      } else {
        throw new Error('삭제 실패');
      }
    } catch (err) {
      console.error('handleDeletePlan error:', err);
      alert('서버 연결 실패로 데이터베이스 일정을 삭제하지 못했습니다.');
    }
  };

  /**
   * @function handleSharePlan
   * @description 여행 일정을 요약 텍스트와 함께 클립보드에 링크 형식으로 복사해 공유를 구현합니다.
   * @param {SavedTravelPlan} plan 공유할 일정 데이터
   */
  const handleSharePlan = async (plan: SavedTravelPlan, e: React.MouseEvent) => {
    e.stopPropagation(); // 카드 선택 이벤트 전파 방지
    try {
      const shareText = `[Voyago AI 여행 플랜 공유]\n📍 목적지: ${plan.destination}\n👥 동행: ${plan.companion}\n📅 기간: ${plan.duration}일간\n✨ 요약: ${plan.summary}\n\nVoyago에서 나만의 맞춤 일정을 짜보세요!`;
      await navigator.clipboard.writeText(shareText);
      alert('여행 정보 요약이 클립보드에 복사되었습니다! 친구에게 공유해 보세요.');
    } catch (err) {
      console.error('Clipboard copy error:', err);
      alert('공유 텍스트 복사에 실패했습니다.');
    }
  };

  try {
    return (
      <div className="space-y-8 animate-fade-in">
        {/* 상단 네비 바 */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center text-sm font-semibold text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 mr-2" /> 메인 홈으로
          </button>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-indigo-400" />
            내 여행 보관함
          </h2>
          <div className="w-20" /> {/* 균형용 빈 블록 */}
        </div>

        {/* 로딩 뷰 */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
            <p className="text-gray-400 text-sm">보관함을 가져오고 있습니다...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16 space-y-4">
            <p className="text-red-400 font-medium">{error}</p>
            <button
              type="button"
              onClick={fetchSavedPlans}
              className="px-4 py-2 rounded-xl bg-slate-800 text-white text-sm hover:bg-slate-700 cursor-pointer"
            >
              다시 시도
            </button>
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-24 space-y-4 glassmorphism rounded-3xl p-10 border-dashed border-slate-800">
            <p className="text-gray-400 text-base">아직 보관함에 저장된 여행 일정이 없습니다.</p>
            <p className="text-xs text-gray-500">마음에 드는 일정을 짜고 "내 보관함에 저장" 버튼을 눌러보세요!</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-semibold hover:opacity-90 transition-opacity cursor-pointer text-sm"
            >
              첫 일정 기획하러 가기
            </button>
          </div>
        ) : (
          /* 보관함 카드 리스트 그리드 */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan._id}
                onClick={() => onSelectPlan(plan)}
                className="group relative flex flex-col justify-between p-6 rounded-2xl glassmorphism hover:border-indigo-500/40 hover:bg-slate-800/25 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-indigo-500/5 hover:scale-[1.02]"
              >
                {/* 상단 태그 및 타이틀 */}
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-wrap gap-1.5">
                      <span className="flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        <MapPin className="w-3 h-3 mr-0.5" /> {plan.destination}
                      </span>
                      {plan._id.startsWith('local_') && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          로컬 보관
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-500">
                      {new Date(plan.createdAt).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">
                    {plan.destination} {plan.duration}일 여정
                  </h3>
                  
                  <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed">
                    {plan.summary}
                  </p>
                </div>

                {/* 하단 제어부 및 부가 정보 */}
                <div className="flex items-center justify-between pt-5 mt-5 border-t border-slate-800/80">
                  <span className="text-xs text-cyan-400 font-medium flex items-center">
                    <Calendar className="w-3.5 h-3.5 mr-1" /> {plan.companion}
                  </span>

                  <div className="flex items-center gap-1">
                    {/* 공유 버튼 */}
                    <button
                      type="button"
                      onClick={(e) => handleSharePlan(plan, e)}
                      className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                      title="일정 공유"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    {/* 삭제 버튼 */}
                    <button
                      type="button"
                      onClick={(e) => handleDeletePlan(plan._id, plan.destination, e)}
                      className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-slate-800 transition-colors cursor-pointer"
                      title="보관함 삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('SavedPlansView Render Error:', error);
    return <div className="text-red-400">보관함 화면을 렌더링하는 중 예기치 못한 에러가 발생했습니다.</div>;
  }
};
