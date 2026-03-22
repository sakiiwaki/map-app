import { extractFeatures } from '@favorite-map/nlp';
import { prisma } from '../repositories/prisma';
import { getPlaceDetails } from '../clients/googleMaps';

const FEATURE_DISPLAY_NAMES: Record<string, string> = {
  power_outlet: 'コンセント',
  wifi: 'Wi-Fi',
  smoking: '喫煙',
  parking: '駐車場',
  pet: 'ペット可',
};

/**
 * place_features が空 or 古い場合に Places Details API + NLP で補完する
 * 1回/週程度の再取得を想定
 */
export async function enrichPlaceFeatures(placeId: string): Promise<void> {
  // 直近1週間以内に抽出済みならスキップ
  const recent = await prisma.placeFeature.findFirst({
    where: {
      placeId,
      extractedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    },
  });
  if (recent) return;

  const details = await getPlaceDetails(placeId);
  if (!details) return;

  // DB の places を最新情報で更新
  await prisma.place.upsert({
    where: { placeId },
    update: {
      name: details.name,
      formattedAddress: details.address,
      lat: details.lat,
      lng: details.lng,
      googleRating: details.rating,
      googleUserRatingsTotal: details.user_ratings_total,
      types: details.types,
      website: details.website,
      phoneNumber: details.phone_number,
      lastGoogleSync: new Date(),
    },
    create: {
      placeId,
      name: details.name,
      formattedAddress: details.address,
      lat: details.lat,
      lng: details.lng,
      googleRating: details.rating,
      googleUserRatingsTotal: details.user_ratings_total,
      types: details.types,
      website: details.website,
      phoneNumber: details.phone_number,
      lastGoogleSync: new Date(),
    },
  });

  // レビュー + editorialSummary を結合してNLP解析
  const textParts = [
    ...(details.reviews ?? []),
    details.editorial_summary ?? '',
  ].filter(Boolean);

  if (textParts.length === 0) return;

  const combinedText = textParts.join('\n');
  const features = extractFeatures(combinedText);

  // features マスタに未登録キーを追加
  for (const featureKey of Object.keys(features)) {
    await prisma.feature.upsert({
      where: { featureKey },
      update: {},
      create: {
        featureKey,
        displayName: FEATURE_DISPLAY_NAMES[featureKey] ?? featureKey,
        valueType: 'boolean',
      },
    });
  }

  // place_features を upsert（value=null のものはスキップ）
  for (const [featureKey, result] of Object.entries(features)) {
    if (result.value === null) continue;

    await prisma.placeFeature.upsert({
      where: { placeId_featureKey: { placeId, featureKey } },
      update: {
        valueBoolean: result.value,
        score: result.score,
        confidence: result.confidence,
        extractedAt: new Date(),
        sourceSummary: `レビュー${details.reviews.length}件から自動抽出`,
      },
      create: {
        placeId,
        featureKey,
        valueBoolean: result.value,
        score: result.score,
        confidence: result.confidence,
        sourceSummary: `レビュー${details.reviews.length}件から自動抽出`,
      },
    });
  }

  console.log(`[featureService] Enriched place ${placeId} with ${Object.keys(features).length} features`);
}

/**
 * place_features を取得して Map 形式で返す
 */
export async function getPlaceFeatureMap(
  placeId: string,
): Promise<Record<string, { value: boolean | null; score: number | null; confidence: number | null }>> {
  const rows = await prisma.placeFeature.findMany({ where: { placeId } });
  return Object.fromEntries(
    rows.map((r: { featureKey: string; valueBoolean: boolean | null; score: number | null; confidence: number | null }) => [
      r.featureKey,
      { value: r.valueBoolean, score: r.score, confidence: r.confidence },
    ]),
  );
}
