/**
 * @file TravelPlan.ts
 * @description MongoDB에 저장될 여행 계획(TravelPlan) 데이터 스키마와 모델 정의입니다.
 */

import mongoose, { Schema, Document } from 'mongoose';

// Activity 스키마 인터페이스 정의
export interface IActivity {
  time: string;
  place: string;
  description: string;
  type: string;
}

// DayPlan 스키마 인터페이스 정의
export interface IDayPlan {
  day: number;
  theme: string;
  activities: IActivity[];
}

// TravelPlan Document 인터페이스 정의
export interface ITravelPlan extends Document {
  destination: string;
  companion: string;
  duration: number;
  summary: string;
  days: IDayPlan[];
  createdAt: Date;
}

// Activity 하위 스키마 정의
const ActivitySchema: Schema = new Schema({
  time: { type: String, required: true },
  place: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, required: true },
});

// DayPlan 하위 스키마 정의
const DayPlanSchema: Schema = new Schema({
  day: { type: Number, required: true },
  theme: { type: String, required: true },
  activities: [ActivitySchema],
});

// TravelPlan 메인 스키ма 정의
const TravelPlanSchema: Schema = new Schema(
  {
    destination: { type: String, required: true, index: true },
    companion: { type: String, required: true },
    duration: { type: Number, required: true },
    summary: { type: String, required: true },
    days: [DayPlanSchema],
  },
  {
    timestamps: true, // createdAt, updatedAt 자동 생성
  }
);

/**
 * @description Mongoose TravelPlan 모델을 생성하여 내보냅니다.
 */
export const TravelPlanModel = mongoose.model<ITravelPlan>('TravelPlan', TravelPlanSchema);
