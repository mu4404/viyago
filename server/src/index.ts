/**
 * @file index.ts
 * @description Voyago Express 백엔드 서버의 진입점(Entry Point)입니다.
 * MongoDB 연결을 수립하고, API 라우터들을 대기 포트에 연결합니다.
 */

import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';
import { createTravelPlan, saveTravelPlan, getSavedPlans, deleteTravelPlan } from './controllers/planController.js';
import { geocodeActivities } from './controllers/geocodingController.js';

// 환경 변수 설정 (.env 파일 로드)
import path from 'path';
import { fileURLToPath } from 'url';

// ESM 모드에서 __dirname 구현
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 실행 디렉토리(Cwd)에 관계없이 server/.env 파일을 항상 올바르게 로드하도록 절대경로를 설정합니다.
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/voyago';

// 미들웨어 설정
app.use(cors()); // CORS 허용
app.use(express.json()); // JSON 요청 바디 파싱

/**
 * @function connectDatabase
 * @description Mongoose를 활용하여 MongoDB 데이터베이스에 비동기식으로 연결합니다.
 */
const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('[DB] MongoDB connected successfully to Voyago.');
  } catch (error) {
    console.error('[DB] MongoDB connection failed:', error);
  }
};

/**
 * @function healthCheck
 * @description 서버 상태 확인을 위한 헬스체크 라우터 핸들러입니다.
 * @param {Request} req Express 요청 객체
 * @param {Response} res Express 응답 객체
 */
const healthCheck = (req: Request, res: Response): void => {
  try {
    res.status(200).json({ status: 'ok', message: 'Voyago API Server is running' });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// API 엔드포인트 라우팅 매핑
app.get('/api/health', healthCheck);
app.post('/api/plan', createTravelPlan);
app.post('/api/plan/save', saveTravelPlan);
app.get('/api/plan/saved', getSavedPlans);
app.delete('/api/plan/:id', deleteTravelPlan);
app.post('/api/geocode', geocodeActivities);

/**
 * @function startServer
 * @description 데이터베이스 연결을 트리거하고 Express 서버를 구동시킵니다.
 */
const startServer = async (): Promise<void> => {
  try {
    // DB 연결 실행
    await connectDatabase();
    
    // 포트 리스닝 시작
    app.listen(PORT, () => {
      console.log(`[Server] Voyago API server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('[Server] Failed to start server:', error);
  }
};

startServer();
