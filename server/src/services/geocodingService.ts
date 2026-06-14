/**
 * @file geocodingService.ts
 * @description OpenStreetMap Nominatim API를 활용한 무료 지오코딩 서비스입니다.
 * Google Maps API 없이 장소명을 위도/경도로 변환합니다.
 */

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'Voyago/1.0 (travel-planner; educational)';
const REQUEST_INTERVAL_MS = 1100;

export interface GeocodeInput {
  place: string;
  placeEn?: string;
}

export interface GeocodedPlace {
  place: string;
  lat: number;
  lng: number;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

const DESTINATION_EN: Record<string, string> = {
  도쿄: 'Tokyo, Japan',
  오사카: 'Osaka, Japan',
  교토: 'Kyoto, Japan',
  삿포로: 'Sapporo, Japan',
  후쿠오카: 'Fukuoka, Japan',
  나고야: 'Nagoya, Japan',
  오키나와: 'Okinawa, Japan',
  서울: 'Seoul, South Korea',
  부산: 'Busan, South Korea',
  제주: 'Jeju, South Korea',
  파리: 'Paris, France',
  런던: 'London, UK',
  뉴욕: 'New York, USA',
  방콕: 'Bangkok, Thailand',
  싱가포르: 'Singapore',
  타이베이: 'Taipei, Taiwan',
  홍콩: 'Hong Kong',
  하노이: 'Hanoi, Vietnam',
  다낭: 'Da Nang, Vietnam',
};

const cache = new Map<string, GeocodedPlace | null>();
let lastRequestAt = 0;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForRateLimit = async (): Promise<void> => {
  const elapsed = Date.now() - lastRequestAt;
  if (elapsed < REQUEST_INTERVAL_MS) {
    await sleep(REQUEST_INTERVAL_MS - elapsed);
  }
  lastRequestAt = Date.now();
};

const searchNominatim = async (query: string): Promise<GeocodedPlace | null> => {
  const cacheKey = query.toLowerCase();
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey) ?? null;
  }

  try {
    await waitForRateLimit();

    const params = new URLSearchParams({
      q: query,
      format: 'json',
      limit: '1',
      addressdetails: '0',
    });

    const response = await fetch(`${NOMINATIM_BASE}?${params}`, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      cache.set(cacheKey, null);
      return null;
    }

    const results = (await response.json()) as NominatimResult[];
    if (!results.length) {
      cache.set(cacheKey, null);
      return null;
    }

    const result: GeocodedPlace = {
      place: query,
      lat: parseFloat(results[0].lat),
      lng: parseFloat(results[0].lon),
    };

    cache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error(`[Geocoding] Failed for "${query}":`, error);
    cache.set(cacheKey, null);
    return null;
  }
};

const resolveDestinationEn = (destination: string): string => {
  const trimmed = destination.trim();
  for (const [key, value] of Object.entries(DESTINATION_EN)) {
    if (trimmed.includes(key)) return value;
  }
  return trimmed;
};

/**
 * @function geocodePlace
 * @description 단일 장소를 여러 쿼리 전략으로 지오코딩합니다.
 */
export const geocodePlace = async (
  input: GeocodeInput,
  destination: string,
): Promise<GeocodedPlace | null> => {
  const destEn = resolveDestinationEn(destination);
  const queries = [
    input.placeEn ? `${input.placeEn}, ${destEn}` : null,
    input.placeEn ? input.placeEn : null,
    `${input.place}, ${destEn}`,
    `${input.place}, ${destination}`,
    input.place,
  ].filter((q): q is string => Boolean(q));

  for (const query of queries) {
    const result = await searchNominatim(query);
    if (result) {
      return { ...result, place: input.place };
    }
  }

  console.warn(`[Geocoding] No result for "${input.place}" (${destination})`);
  return null;
};

/**
 * @function geocodePlaces
 * @description 여러 장소를 순차적으로 지오코딩합니다 (Nominatim 1req/s 정책 준수).
 */
export const geocodePlaces = async (
  inputs: GeocodeInput[],
  destination: string,
): Promise<GeocodedPlace[]> => {
  const seen = new Set<string>();
  const uniqueInputs = inputs.filter((input) => {
    const key = input.place;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const results: GeocodedPlace[] = [];

  for (const input of uniqueInputs) {
    const geocoded = await geocodePlace(input, destination);
    if (geocoded) {
      results.push(geocoded);
    }
  }

  return results;
};
