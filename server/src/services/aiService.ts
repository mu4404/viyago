/**
 * @file aiService.ts
 * @description Google Gemini API를 활용하여 사용자가 입력한 조건에 부합하는
 * 고품질의 맞춤형 여행 일정을 생성하는 서비스 모듈입니다.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// ESM 모드에서 __dirname 구현
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 실행 디렉토리(Cwd)에 관계없이 server/.env 파일을 항상 올바르게 로드하도록 절대경로를 설정합니다.
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

/**
 * @interface Activity
 * @description AI가 추천하는 특정 시점의 활동(관광, 식사, 이동 등) 구조입니다.
 */
interface Activity {
  time: string;
  place: string;
  description: string;
  type: "restaurant" | "sightseeing" | "transport" | "hotel" | string;
}

/**
 * @interface DayPlan
 * @description 특정 일차(day)에 대한 테마와 활동 목록 구조입니다.
 */
interface DayPlan {
  day: number;
  theme: string;
  activities: Activity[];
}

/**
 * @interface TravelPlanResult
 * @description AI가 최종적으로 반환해야 할 전체 여행 일정의 JSON 스키마 구조입니다.
 */
export interface TravelPlanResult {
  destination: string;
  companion: string;
  duration: number;
  summary: string;
  days: DayPlan[];
}

/**
 * @function generateTravelPlan
 * @description Gemini 1.5 Flash 모델을 호출하여 맞춤형 여행 계획 JSON을 생성합니다.
 * @param {string} destination 여행 도시/국가
 * @param {string} companion 동행자 정보 (예: 친구, 연인, 가족, 혼자)
 * @param {number} duration 여행 기간 (일수)
 * @returns {Promise<TravelPlanResult>} 파싱 완료된 여행 계획 객체
 */
export const generateTravelPlan = async (
  destination: string,
  companion: string,
  duration: number,
): Promise<TravelPlanResult> => {
  try {
    const currentApiKey = process.env.GEMINI_API_KEY || "";

    if (!currentApiKey || currentApiKey === "your_gemini_api_key_here") {
      throw new Error(
        "Valid GEMINI_API_KEY is not configured in environmental variables. Please check your server/.env file.",
      );
    }

    // GoogleGenerativeAI 인스턴스 초기화
    const genAI = new GoogleGenerativeAI(currentApiKey);

    // 구조화된 JSON 데이터 반환을 위해 Gemini 모델 설정
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    // 프롬프트 가이드라인 설계
    const prompt = `
      You are a professional travel planner. Create a highly detailed, realistic, and optimized travel itinerary based on the following requirements:
      - Destination: ${destination}
      - Companion: ${companion}
      - Duration: ${duration} Days (Days must start from 1 to ${duration})
      
      Requirements for the content:
      1. Provide a beautiful overall "summary" (in Korean) explaining the theme of this itinerary for this companion.
      2. Provide a unique "theme" (in Korean) for each day (e.g., "Day 1: 설레는 첫 만남, 핵심 도심 투어", "Day 2: 로컬 감성 골목 탐방").
      3. For each day, include 4 to 5 "activities" with realistic "time" (e.g., "10:00 AM", "01:00 PM"), place name ("place" in Korean), brief description of what to do ("description" in Korean), and "type" of activity.
      4. Valid activity types are: "restaurant" (for eating), "sightseeing" (for attractions), "transport" (for moving), and "hotel" (for checking in/resting).
      5. Make sure each day has completely different, unique themes, locations, restaurants, and activities. DO NOT repeat the same places or descriptions across different days.
      6. Provide a natural travel progression: Day 1 should focus on arrival/check-in/landmark introduction; the last day should focus on souvenir shopping, relaxed cafes, and departure.
      7. The output MUST be in Korean except for JSON keys and time formats.
      8. The output must strictly conform to the following JSON structure:
      
      {
        "destination": "${destination}",
        "companion": "${companion}",
        "duration": ${duration},
        "summary": "overall Korean summary here...",
        "days": [
          {
            "day": 1,
            "theme": "Day 1 Theme...",
            "activities": [
              {
                "time": "10:00 AM",
                "place": "Place Name",
                "description": "Activity description in Korean...",
                "type": "sightseeing"
              }
            ]
          }
        ]
      }
    `;

    console.log(
      `[AI Service] Requesting plan for ${destination} (${duration} days, companion: ${companion})...`,
    );

    const geminiResult = await model.generateContent(prompt);

    const responseText = geminiResult.response.text();
    if (!responseText) {
      throw new Error("Empty response received from Gemini API");
    }

    // JSON 문자열 파싱
    const parsedPlan: TravelPlanResult = JSON.parse(responseText);
    return parsedPlan;
  } catch (error) {
    console.error("generateTravelPlan error:", error);
    throw error;
  }
};
