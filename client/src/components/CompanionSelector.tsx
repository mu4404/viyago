/**
 * @file CompanionSelector.tsx
 * @description 여행 동행인 유형을 선택하는 프리미엄 카드 셀렉터 컴포넌트입니다.
 */

import React from 'react';
import { User, Users, Heart, UsersRound } from 'lucide-react';

// 동행자 옵션 인터페이스 정의
export interface CompanionOption {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<any>;
}

// 컴포넌트 Props 정의
interface CompanionSelectorProps {
  selectedCompanion: string;
  onSelectCompanion: (id: string) => void;
}

// 지원하는 동행자 옵션 리스트
const COMPANION_OPTIONS: CompanionOption[] = [
  {
    id: 'solo',
    label: '혼자',
    description: '나만의 온전한 자유를 즐기는 여행',
    icon: User,
  },
  {
    id: 'couple',
    label: '연인과 함께',
    description: '로맨틱하고 특별한 추억을 만드는 여행',
    icon: Heart,
  },
  {
    id: 'friends',
    label: '친구들과 함께',
    description: '즐거운 웃음과 에너지가 넘치는 여행',
    icon: Users,
  },
  {
    id: 'family',
    label: '가족과 함께',
    description: '편안하고 따뜻한 유대를 나누는 여행',
    icon: UsersRound,
  },
];

/**
 * @function CompanionSelector
 * @description 동행 유형을 그리드 형태로 나열하고 카드를 선택할 수 있는 컴포넌트입니다.
 */
export const CompanionSelector: React.FC<CompanionSelectorProps> = ({
  selectedCompanion,
  onSelectCompanion,
}) => {
  try {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-200">누구와 함께 떠나시나요?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {COMPANION_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedCompanion === option.id;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onSelectCompanion(option.id)}
                className={`flex flex-col items-center justify-center p-6 rounded-2xl transition-all duration-300 glassmorphism text-center cursor-pointer ${
                  isSelected
                    ? 'border-cyan-400 bg-cyan-950/20 shadow-[0_0_20px_rgba(34,211,238,0.15)] scale-[1.03]'
                    : 'hover:border-gray-500 hover:bg-slate-800/30'
                }`}
              >
                <div
                  className={`p-3 rounded-full mb-4 transition-colors ${
                    isSelected ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-gray-400'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <h4 className="text-base font-semibold text-white mb-1">{option.label}</h4>
                <p className="text-xs text-gray-400 leading-relaxed">{option.description}</p>
              </button>
            );
          })}
        </div>
      </div>
    );
  } catch (error) {
    console.error('CompanionSelector Error:', error);
    return <div className="text-red-400">컴포넌트 렌더링 중 오류가 발생했습니다.</div>;
  }
};
