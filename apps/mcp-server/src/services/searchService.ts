import { searchNearbyPlaces, type PlaceSearchResult } from '../clients/googleMaps';
import { prisma } from '../repositories/prisma';
import { enrichPlaceFeatures, getPlaceFeatureMap } from './featureService';

export type SearchFilter = {
  power_outlet?: boolean;
  wifi?: boolean;
  smoking?: boolean;
  parking?: boolean;
  pet?: boolean;
  min_rating?: number;
};

export type FeatureValue = {
  value: boolean | null;
  score: number | null;
  confidence: number | null;
};

export type SearchResult = PlaceSearchResult & {
  features: Record<string, FeatureValue>;
};

export async function searchPlaces(
  query: string,
  lat: number,
  lng: number,
  radius: number,
  filters: SearchFilter = {},
): Promise<SearchResult[]> {
  // 1. Google Places から候補を取得
  const googleResults = await searchNearbyPlaces(query, lat, lng, radius);

  // 2. 評価フィルタを事前適用
  const preFiltered = filters.min_rating
    ? googleResults.filter((p) => (p.rating ?? 0) >= filters.min_rating!)
    : googleResults;

  // 3. DB に places を upsert（軽量キャッシュ）
  await Promise.all(
    preFiltered.map((place) =>
      prisma.place.upsert({
        where: { placeId: place.place_id },
        update: {
          name: place.name,
          formattedAddress: place.address,
          lat: place.lat,
          lng: place.lng,
          googleRating: place.rating,
          googleUserRatingsTotal: place.user_ratings_total,
          types: place.types,
          lastGoogleSync: new Date(),
        },
        create: {
          placeId: place.place_id,
          name: place.name,
          formattedAddress: place.address,
          lat: place.lat,
          lng: place.lng,
          googleRating: place.rating,
          googleUserRatingsTotal: place.user_ratings_total,
          types: place.types,
          lastGoogleSync: new Date(),
        },
      }),
    ),
  );

  // 4. feature フィルタが指定されている場合のみ NLP 抽出を非同期トリガー
  //    （検索速度を優先し、バックグラウンドで補完）
  const featureFilterKeys = FEATURE_FILTER_KEYS.filter((k) => filters[k] != null);
  if (featureFilterKeys.length > 0) {
    // 並列で enrich（awaitしない → 非ブロッキング）
    preFiltered.forEach((p) => enrichPlaceFeatures(p.place_id).catch(console.error));
  }

  // 5. DB から既存の feature データを取得
  const placeIds = preFiltered.map((p) => p.place_id);
  const featureRows = await prisma.placeFeature.findMany({
    where: { placeId: { in: placeIds } },
  });

  const featureMap = new Map<string, Record<string, FeatureValue>>();
  for (const row of featureRows) {
    if (!featureMap.has(row.placeId)) featureMap.set(row.placeId, {});
    featureMap.get(row.placeId)![row.featureKey] = {
      value: row.valueBoolean,
      score: row.score,
      confidence: row.confidence,
    };
  }

  let results: SearchResult[] = preFiltered.map((place) => ({
    ...place,
    features: featureMap.get(place.place_id) ?? {},
  }));

  // 6. feature フィルタを適用（DB にデータがある場合のみ）
  for (const key of featureFilterKeys) {
    const expected = filters[key];
    results = results.filter((r) => {
      const feat = r.features[key];
      if (!feat || feat.value === null) return true; // データなしは通す
      return feat.value === expected;
    });
  }

  return results;
}

const FEATURE_FILTER_KEYS: (keyof SearchFilter)[] = [
  'power_outlet',
  'wifi',
  'smoking',
  'parking',
  'pet',
];
