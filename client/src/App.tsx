/**
 * @file App.tsx
 * @description Voyago AI 여행 플래너 애플리케이션의 메인 컨트롤 컴포넌트입니다.
 * 전체 상태(여행지, 동행자, 기간, 결과 플랜 및 로딩 상태)를 관리하고 API와 통신합니다.
 */

import { useState } from 'react';
import { Sparkles, Send } from 'lucide-react';
import { DestinationInput } from './components/DestinationInput';
import { CompanionSelector } from './components/CompanionSelector';
import { DurationSelector } from './components/DurationSelector';
import { LoadingScreen } from './components/LoadingScreen';
import { TravelPlanView } from './components/TravelPlanView';
import { SavedPlansView } from './components/SavedPlansView';
import type { TravelPlan } from './components/TravelPlanView';

/**
 * @function App
 * @description Voyago의 UI 상태 전환 및 API 요청 흐름을 관리합니다.
 */
function App() {
  // 입력 상태 값
  const [destination, setDestination] = useState('');
  const [selectedCompanion, setSelectedCompanion] = useState('solo');
  const [duration, setDuration] = useState(3);

  // 뷰 컨트롤러 상태 ('home' | 'saved')
  const [viewMode, setViewMode] = useState<'home' | 'saved'>('home');

  // 로딩 및 결과 상태 값
  const [isLoading, setIsLoading] = useState(false);
  const [travelPlan, setTravelPlan] = useState<TravelPlan | null>(null);

  /**
   * @function handleGeneratePlan
   * @description 백엔드 API에 사용자가 선택한 정보를 전송하고 AI 일정을 수신합니다.
   * API 서버가 구동 중이지 않거나 실패하는 경우 로컬 Mock 데이터를 생성하여 원활한 테스트를 지원합니다.
   */
  const handleGeneratePlan = async () => {
    if (!destination.trim()) {
      alert('여행지를 입력하거나 추천 태그를 선택해 주세요!');
      return;
    }

    setIsLoading(true);
    setTravelPlan(null);

    try {
      // API 호출 시도 (Express 백엔드로 전송)
      const response = await fetch('http://localhost:5001/api/plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          destination,
          companion: selectedCompanion,
          duration,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTravelPlan(data.plan);
      } else {
        throw new Error('API server returned error or offline');
      }
    } catch (error) {
      console.warn('Backend API connection failed. Using high-quality Mock Data...', error);
      
      // API 서버가 준비 중일 때 원활한 UI 개발 검증을 위한 지연(Delay) 및 모의 데이터(Mock Data) 로직 실행
      await new Promise((resolve) => setTimeout(resolve, 4000));
      
      const companionLabelMap: Record<string, string> = {
        solo: '혼자',
        couple: '연인과 함께',
        friends: '친구들과 함께',
        family: '가족과 함께',
      };

      const mockPlan: TravelPlan = {
        destination,
        companion: companionLabelMap[selectedCompanion] || '혼자',
        duration,
        summary: `이곳은 ${destination}에서 ${companionLabelMap[selectedCompanion]} 떠나는 ${duration}일간의 맞춤 코스입니다. 동선을 효율적으로 설계하고, 필수 스팟들을 엄선해 보았습니다. 멋진 여행이 되기를 바랍니다!`,
        days: Array.from({ length: duration }, (_, i) => {
          const dayNum = i + 1;
          let theme = `${destination}에서의 설레는 ${dayNum}일차 여정`;
          let activities = [];

          if (dayNum === 1) {
            theme = `설레는 첫 걸음, ${destination} 핵심 탐방`;
            activities = [
              {
                time: '10:00 AM',
                place: `${destination} 공항/역 도착`,
                description: '설렘을 가득 안고 도착하여 숙소로 이동하고 짐을 맡깁니다.',
                type: 'transport',
              },
              {
                time: '12:30 PM',
                place: '로컬 시그니처 맛집',
                description: `현지에서 가장 평점이 높은 대표 음식점에서 든든한 점심 식사를 즐깁니다.`,
                type: 'restaurant',
              },
              {
                time: '02:30 PM',
                place: '가장 핫한 대표 랜드마크',
                description: '랜드마크를 산책하며 인생 사진을 남기고 시내 분위기에 적응합니다.',
                type: 'sightseeing',
              },
              {
                time: '06:30 PM',
                place: '전망대 및 시티 야경 감상',
                description: '아름다운 야경이나 일몰을 내려다보며 첫날 밤의 감성을 채웁니다.',
                type: 'sightseeing',
              },
              {
                time: '09:00 PM',
                place: '엄선된 베스트 숙소 입실',
                description: '내일 여정을 위해 아늑한 숙소에서 편안하게 휴식을 취합니다.',
                type: 'hotel',
              },
            ];
          } else if (dayNum === duration) {
            theme = `아쉬움을 뒤로하고, 마지막 감성 힐링`;
            activities = [
              {
                time: '09:30 AM',
                place: '감성 브런치 카페',
                description: '여유롭게 일어나 현지에서 인기 있는 감성 카페의 브런치와 커피를 즐깁니다.',
                type: 'restaurant',
              },
              {
                time: '11:30 AM',
                place: '로컬 기념품 및 쇼핑 스트리트',
                description: '여행을 기억할 아기자기한 소품이나 지인들을 위한 선물을 쇼핑합니다.',
                type: 'sightseeing',
              },
              {
                time: '02:30 PM',
                place: '평화로운 로컬 공원',
                description: '돌아가기 전 공원을 한가로이 거닐며 여행의 마지막 여운을 정리합니다.',
                type: 'sightseeing',
              },
              {
                time: '05:30 PM',
                place: '귀가를 위한 공항/역 출발',
                description: '모든 추억을 품고 안전하게 집으로 향하는 귀가길에 오릅니다.',
                type: 'transport',
              },
            ];
          } else {
            theme = `완벽한 몰입, 로컬 라이프 즐기기`;
            activities = [
              {
                time: '09:00 AM',
                place: '한적한 자연 명소 또는 미술관',
                description: '복잡한 도심을 벗어나 아침의 맑은 공기와 조용한 예술 작품을 감상합니다.',
                type: 'sightseeing',
              },
              {
                time: '12:00 PM',
                place: '숨겨진 노포 맛집',
                description: '현지인들 사이에서 유명한 숨은 식당을 찾아 독특한 미식을 맛봅니다.',
                type: 'restaurant',
              },
              {
                time: '02:00 PM',
                place: '현지 문화/액티비티 체험',
                description: '원데이 클래스나 대표적인 액티비티를 통해 몸으로 직접 지역을 경험해 봅니다.',
                type: 'sightseeing',
              },
              {
                time: '05:30 PM',
                place: '젊음의 거리 & 소품숍 탐방',
                description: '최신 트렌드를 엿볼 수 있는 편집숍과 인디 갤러리들을 구경합니다.',
                type: 'sightseeing',
              },
              {
                time: '08:00 PM',
                place: '로컬 펍 또는 재즈바',
                description: '동행자와 함께 시원한 맥주나 와인 한 잔을 기울이며 깊은 대화를 나눕니다.',
                type: 'restaurant',
              },
            ];
          }

          return {
            day: dayNum,
            theme,
            activities,
          };
        }),
      };

      setTravelPlan(mockPlan);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * @function handleReset
   * @description 여행 계획 상태를 초기화하고 입력 화면으로 돌아갑니다.
   */
  const handleReset = () => {
    try {
      setTravelPlan(null);
      setDestination('');
      setSelectedCompanion('solo');
      setDuration(3);
      setViewMode('home');
    } catch (error) {
      console.error('handleReset error:', error);
    }
  };

  /**
   * @function handleSavePlan
   * @description 현재 생성된 여행 계획을 백엔드 데이터베이스(MongoDB)에 저장합니다.
   * 네트워크 에러 또는 오프라인 상태일 시 브라우저의 LocalStorage에 안전하게 저장합니다.
   */
  const handleSavePlan = async () => {
    if (!travelPlan) return;

    try {
      const response = await fetch('http://localhost:5001/api/plan/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          destination: travelPlan.destination,
          companion: travelPlan.companion,
          duration: travelPlan.duration,
          summary: travelPlan.summary,
          days: travelPlan.days,
        }),
      });

      if (response.ok) {
        alert(`${travelPlan.destination} 여행 계획이 데이터베이스 보관함에 안전하게 저장되었습니다!`);
      } else {
        const errorData = await response.json();
        alert(`저장 실패: ${errorData.error || '알 수 없는 서버 에러'}`);
      }
    } catch (error) {
      console.warn('Backend connection failed. Saving plan to browser LocalStorage...', error);
      
      try {
        // 브라우저 LocalStorage에 임시 저장 처리
        const rawLocalPlans = localStorage.getItem('voyago_local_plans') || '[]';
        const localPlans = JSON.parse(rawLocalPlans);
        
        const newLocalPlan = {
          _id: `local_${Date.now()}`,
          destination: travelPlan.destination,
          companion: travelPlan.companion,
          duration: travelPlan.duration,
          summary: travelPlan.summary,
          days: travelPlan.days,
          createdAt: new Date().toISOString(),
          isLocal: true,
        };
        
        localPlans.push(newLocalPlan);
        localStorage.setItem('voyago_local_plans', JSON.stringify(localPlans));
        
        alert(`서버가 오프라인 상태여서, 브라우저 보관함(LocalStorage)에 일정이 임시 저장되었습니다!`);
      } catch (localError) {
        console.error('LocalStorage write error:', localError);
        alert('로컬 브라우저 저장소 쓰기 실패로 일정을 저장하지 못했습니다.');
      }
    }
  };

  try {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-[#F9FAFB] flex flex-col">
        {/* 상단 네비게이션 헤더 */}
        <header className="border-b border-slate-800/80 bg-slate-950/45 backdrop-filter backdrop-blur-md sticky top-0 z-50 transition-all">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={handleReset}>
              <div className="p-2 bg-gradient-to-tr from-indigo-500 to-cyan-400 rounded-xl">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">Voyago</span>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => {
                  setViewMode(viewMode === 'saved' ? 'home' : 'saved');
                }}
                className="px-4 py-2 rounded-xl border border-slate-700/60 bg-slate-900/40 text-sm font-semibold text-gray-300 hover:text-white hover:border-gray-500 transition-colors cursor-pointer"
              >
                {viewMode === 'saved' ? '일정 기획' : '내 보관함'}
              </button>
              <span className="hidden sm:inline-block text-xs font-semibold text-gray-500 uppercase tracking-widest bg-slate-900 border border-slate-800 px-3 py-1 rounded-full">
                AI Travel Planner
              </span>
            </div>
          </div>
        </header>

        {/* 메인 컨텐츠 영역 */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10 md:py-16">
          {viewMode === 'saved' ? (
            <SavedPlansView
              onSelectPlan={(plan) => {
                setTravelPlan(plan);
                setViewMode('home');
              }}
              onClose={() => setViewMode('home')}
            />
          ) : isLoading ? (
            <LoadingScreen destination={destination} />
          ) : travelPlan ? (
            <TravelPlanView plan={travelPlan} onReset={handleReset} onSave={handleSavePlan} />
          ) : (
            // 입력 양식 폼
            <div className="space-y-12 max-w-4xl mx-auto">
              {/* 타이틀 및 소개 */}
              <div className="text-center space-y-4">
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
                  어디로든 떠나보세요, <br className="md:hidden" />
                  <span className="text-gradient">AI가 완벽히 기획해 드립니다.</span>
                </h1>
                <p className="text-gray-400 max-w-xl mx-auto text-base">
                  여행지와 일정, 동행인만 정해주세요. <br />
                  시간대별 효율적인 동선과 엄선된 코스를 스마트하게 추천합니다.
                </p>
              </div>

              {/* 입력 카드 컴포넌트들 */}
              <div className="p-8 md:p-10 rounded-3xl glassmorphism space-y-10 shadow-2xl relative overflow-hidden">
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-cyan-400/10 rounded-full blur-3xl" />

                {/* 1. 여행지 */}
                <DestinationInput destination={destination} onChangeDestination={setDestination} />

                <hr className="border-slate-800/80" />

                {/* 2. 동행자 */}
                <CompanionSelector
                  selectedCompanion={selectedCompanion}
                  onSelectCompanion={setSelectedCompanion}
                />

                <hr className="border-slate-800/80" />

                {/* 3. 기간 */}
                <DurationSelector duration={duration} onChangeDuration={setDuration} />

                {/* 생성 버튼 */}
                <div className="pt-4 flex justify-center">
                  <button
                    type="button"
                    onClick={handleGeneratePlan}
                    className="group flex items-center justify-center w-full md:w-auto px-10 py-4.5 rounded-2xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-cyan-500 text-white font-bold text-lg hover:opacity-95 shadow-xl shadow-indigo-600/25 transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                  >
                    AI 여행 플랜 생성하기
                    <Send className="w-5 h-5 ml-2.5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* 푸터 */}
        <footer className="border-t border-slate-900 bg-slate-950/80 py-8 text-center text-xs text-gray-500">
          <p>© {new Date().getFullYear()} Voyago AI. All rights reserved.</p>
        </footer>
      </div>
    );
  } catch (error) {
    console.error('App Render Error:', error);
    return <div className="text-red-400 p-8 text-center">앱 렌더링 도중 예기치 못한 치명적 오류가 발생했습니다.</div>;
  }
}

export default App;
