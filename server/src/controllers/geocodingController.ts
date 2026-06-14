/**
 * @file geocodingController.ts
 * @description 장소명 배열을 좌표로 변환하는 무료 지오코딩 API 핸들러입니다.
 */

import { Request, Response } from 'express';
import { geocodePlaces, GeocodeInput } from '../services/geocodingService.js';

/**
 * @function geocodeActivities
 * @description POST /api/geocode — 장소명 목록을 위도/경도로 변환합니다.
 */
export const geocodeActivities = async (req: Request, res: Response): Promise<void> => {
  try {
    const { places, destination } = req.body;

    if (!destination || typeof destination !== 'string' || !destination.trim()) {
      res.status(400).json({ error: 'destination이 필요합니다.' });
      return;
    }

    if (!Array.isArray(places) || places.length === 0) {
      res.status(400).json({ error: 'places 배열이 필요합니다.' });
      return;
    }

    const validInputs: GeocodeInput[] = places
      .filter((p) => p && typeof p.place === 'string' && p.place.trim().length > 0)
      .map((p) => ({
        place: p.place.trim(),
        placeEn: typeof p.placeEn === 'string' ? p.placeEn.trim() : undefined,
      }))
      .slice(0, 10);

    const results = await geocodePlaces(validInputs, destination.trim());

    res.status(200).json({
      success: true,
      destination: destination.trim(),
      results,
      found: results.length,
      total: validInputs.length,
    });
  } catch (error) {
    console.error('geocodeActivities Controller Error:', error);
    res.status(500).json({ error: '지오코딩 처리 중 오류가 발생했습니다.' });
  }
};
