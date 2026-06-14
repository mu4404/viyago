/**
 * @file planController.ts
 * @description 여행 일정 요청을 검증하고 AI 서비스를 조율하며 MongoDB CRUD를 제어하는 Express 컨트롤러입니다.
 * 데이터베이스 미연결 시 임시 인메모리 저장소(In-Memory Fallback)를 가동하여 무중단 테스트를 지원합니다.
 */

import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { generateTravelPlan } from '../services/aiService.js';
import { TravelPlanModel } from '../models/TravelPlan.js';

// 영문 동행인 아이디를 한글 텍스트로 치환하기 위한 매핑 객체
const COMPANION_MAP: Record<string, string> = {
  solo: '혼자',
  couple: '연인과 함께',
  friends: '친구들과 함께',
  family: '가족과 함께',
};

// MongoDB 오프라인 상태일 때 임시 보관용 인메모리 데이터베이스
interface InMemoryPlan {
  _id: string;
  destination: string;
  companion: string;
  duration: number;
  summary: string;
  days: any[];
  createdAt: string;
}
let inMemoryDatabase: InMemoryPlan[] = [];

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
 * @description 생성된 여행 계획 데이터를 MongoDB에 저장하거나, DB가 꺼져있을 시 임시 인메모리에 보관합니다.
 * @param {Request} req Express Request 객체
 * @param {Response} res Express Response 객체
 */
export const saveTravelPlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { destination, companion, duration, summary, days } = req.body;

    if (!destination || !companion || !duration || !summary || !days) {
      res.status(400).json({ error: '저장하려는 일정이 불완전합니다. 모든 필드를 채워주세요.' });
      return;
    }

    // MongoDB 연결 활성화 여부 확인 (1: connected)
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      // 1. MongoDB가 정상 작동할 때 저장
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
        message: '여행 일정이 MongoDB 보관함에 안전하게 저장되었습니다.',
        savedId: saved._id,
      });
    } else {
      // 2. MongoDB 오프라인 상태 시 임시 인메모리 폴백 저장
      console.warn('[DB WARNING] MongoDB is offline. Falling back to temporary In-Memory Database.');
      
      const inMemoryId = `mem_${Math.random().toString(36).substr(2, 9)}`;
      const newPlan: InMemoryPlan = {
        _id: inMemoryId,
        destination,
        companion,
        duration,
        summary,
        days,
        createdAt: new Date().toISOString(),
      };
      
      inMemoryDatabase.push(newPlan);
      
      res.status(201).json({
        success: true,
        message: '일시적으로 임시 메모리 보관함에 일정이 저장되었습니다. (MongoDB 연결 안 됨)',
        savedId: inMemoryId,
      });
    }
  } catch (error) {
    console.error('saveTravelPlan Controller Error:', error);
    res.status(500).json({ error: '데이터베이스 저장 처리 중 서버 에러가 발생했습니다.' });
  }
};

/**
 * @function getSavedPlans
 * @description 보관된 여행 계획 목록을 조회합니다. DB 상태에 따라 MongoDB 데이터 혹은 인메모리 데이터를 가져옵니다.
 * @param {Request} req Express Request 객체
 * @param {Response} res Express Response 객체
 */
export const getSavedPlans = async (req: Request, res: Response): Promise<void> => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      // 1. MongoDB 데이터 최신순 조회
      const plans = await TravelPlanModel.find().sort({ createdAt: -1 });
      res.status(200).json({
        success: true,
        count: plans.length,
        plans,
      });
    } else {
      // 2. 인메모리 폴백 데이터 최신순 정렬 조회
      console.warn('[DB WARNING] MongoDB is offline. Fetching from temporary In-Memory Database.');
      const sortedPlans = [...inMemoryDatabase].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      res.status(200).json({
        success: true,
        count: sortedPlans.length,
        plans: sortedPlans,
      });
    }
  } catch (error) {
    console.error('getSavedPlans Controller Error:', error);
    res.status(500).json({ error: '일정을 가져오는 중 서버 오류가 발생했습니다.' });
  }
};

/**
 * @function deleteTravelPlan
 * @description 보관함 내 특정 일정을 ID 기준 삭제합니다. (MongoDB 혹은 인메모리 매칭)
 * @param {Request} req Express Request 객체
 * @param {Response} res Express Response 객체
 */
export const deleteTravelPlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: '삭제할 일정의 식별자(ID)가 제공되지 않았습니다.' });
      return;
    }

    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      // 1. MongoDB에서 삭제
      const deleted = await TravelPlanModel.findByIdAndDelete(id);
      if (!deleted) {
        res.status(404).json({ error: '해당 식별자의 여행 계획을 찾을 수 없습니다.' });
        return;
      }
      res.status(200).json({
        success: true,
        message: '여행 계획이 MongoDB 보관함에서 삭제되었습니다.',
      });
    } else {
      // 2. 인메모리 데이터베이스에서 삭제
      console.warn('[DB WARNING] MongoDB is offline. Deleting from temporary In-Memory Database.');
      const initialLength = inMemoryDatabase.length;
      inMemoryDatabase = inMemoryDatabase.filter(p => p._id !== id);
      
      if (inMemoryDatabase.length === initialLength) {
        res.status(404).json({ error: '임시 보관함에서 해당 일정을 찾을 수 없습니다.' });
        return;
      }
      
      res.status(200).json({
        success: true,
        message: '여행 계획이 임시 보관함에서 삭제되었습니다.',
      });
    }
  } catch (error) {
    console.error('deleteTravelPlan Controller Error:', error);
    res.status(500).json({ error: '일정 삭제 처리 중 서버 오류가 발생했습니다.' });
  }
};
