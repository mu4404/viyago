/**
 * @file planController.ts
 * @description 여행 일정 요청을 검증하고 AI 서비스를 조율하며 MongoDB CRUD를 제어하는 Express 컨트롤러입니다.
 */

import { Request, Response } from 'express';
import { generateTravelPlan } from '../services/aiService.js';
import { TravelPlanModel } from '../models/TravelPlan.js';

// 영문 동행인 아이디를 한글 텍스트로 치환하기 위한 매핑 객체
const COMPANION_MAP: Record<string, string> = {
  solo: '혼자',
  couple: '연인과 함께',
  friends: '친구들과 함께',
  family: '가족과 함께',
};

/**
 * @function createTravelPlan
 * @description 사용자의 조건(목적지, 동행자, 기간)을 받아 AI 여행 계획을 생성하는 API 핸들러입니다.
 * @param {Request} req Express Request 객체
 * @param {Response} res Express Response 객체
 */
export const createTravelPlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { destination, companion, duration } = req.body;

    // 1. 필수 파라미터 유효성 검사
    if (!destination || typeof destination !== 'string' || !destination.trim()) {
      res.status(400).json({ error: '유효한 여행지(destination)를 입력해 주세요.' });
      return;
    }

    if (!companion || typeof companion !== 'string') {
      res.status(400).json({ error: '동행자 정보(companion)가 누락되었습니다.' });
      return;
    }

    const durationNum = Number(duration);
    if (isNaN(durationNum) || durationNum < 1 || durationNum > 14) {
      res.status(400).json({ error: '여행 기간(duration)은 1일에서 14일 사이여야 합니다.' });
      return;
    }

    // 2. 파라미터 보정 (한글 변환)
    const companionKorean = COMPANION_MAP[companion] || companion;

    // 3. AI 서비스 호출
    const plan = await generateTravelPlan(destination.trim(), companionKorean, durationNum);

    // 4. 결과 응답
    res.status(200).json({
      success: true,
      plan,
    });
  } catch (error: any) {
    console.error('createTravelPlan Controller Error:', error);
    
    // API 키 부재 등 시스템 설정 오류 피드백
    if (error.message && error.message.includes('GEMINI_API_KEY')) {
      res.status(500).json({
        error: '서버의 AI API Key가 설정되지 않았습니다. 백엔드 .env 파일을 확인해 주세요.',
      });
      return;
    }

    res.status(500).json({
      error: 'AI 여행 플랜을 생성하는 동안 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
    });
  }
};

/**
 * @function saveTravelPlan
 * @description 생성된 여행 계획 데이터를 MongoDB에 보관함으로 저장합니다.
 * @param {Request} req Express Request 객체
 * @param {Response} res Express Response 객체
 */
export const saveTravelPlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { destination, companion, duration, summary, days } = req.body;

    // 값 존재 여부 검사
    if (!destination || !companion || !duration || !summary || !days) {
      res.status(400).json({ error: '저장하려는 일정이 불완전합니다. 모든 필드를 채워주세요.' });
      return;
    }

    // 새로운 Mongoose 도큐먼트 생성 및 저장
    const newPlan = new TravelPlanModel({
      destination,
      companion,
      duration,
      summary,
      days,
    });

    const saved = await newPlan.save();

    res.status(201).json({
      success: true,
      message: '여행 일정이 성공적으로 보관함에 저장되었습니다.',
      savedId: saved._id,
    });
  } catch (error) {
    console.error('saveTravelPlan Controller Error:', error);
    res.status(500).json({ error: '데이터베이스 저장 처리 중 서버 에러가 발생했습니다.' });
  }
};

/**
 * @function getSavedPlans
 * @description MongoDB에 저장된 보관함 내 모든 여행 계획 목록을 내림차순(최신순)으로 반환합니다.
 * @param {Request} req Express Request 객체
 * @param {Response} res Express Response 객체
 */
export const getSavedPlans = async (req: Request, res: Response): Promise<void> => {
  try {
    // 최신 생성일자 순으로 일정 리스트 조회
    const plans = await TravelPlanModel.find().sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: plans.length,
      plans,
    });
  } catch (error) {
    console.error('getSavedPlans Controller Error:', error);
    res.status(500).json({ error: '일정을 가져오는 중 서버 오류가 발생했습니다.' });
  }
};
