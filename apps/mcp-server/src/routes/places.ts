import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { searchPlaces, type SearchFilter } from '../services/searchService';
import { enrichPlaceFeatures, getPlaceFeatureMap } from '../services/featureService';
import { prisma } from '../repositories/prisma';

export const placesRouter = Router();

const searchQuerySchema = z.object({
  q: z.string().min(1),
  lat: z.coerce.number().default(35.681236),
  lng: z.coerce.number().default(139.767125),
  radius: z.coerce.number().default(5000),
  filters: z
    .string()
    .optional()
    .transform((v): SearchFilter => {
      if (!v) return {};
      try {
        return JSON.parse(v) as SearchFilter;
      } catch {
        return {};
      }
    }),
});

// GET /api/places/search
placesRouter.get('/search', async (req: Request, res: Response) => {
  const parsed = searchQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { q, lat, lng, radius, filters } = parsed.data;

  try {
    const results = await searchPlaces(q, lat, lng, radius, filters);
    res.json({
      results,
      paging: { limit: results.length, offset: 0, total: results.length },
    });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Failed to search places' });
  }
});

// GET /api/places/:placeId
// 詳細取得 + NLP 特徴抽出をトリガー
placesRouter.get('/:placeId', async (req: Request, res: Response) => {
  const { placeId } = req.params;

  try {
    // Places Details + NLP 抽出を実行（キャッシュ済みなら即返る）
    await enrichPlaceFeatures(placeId);

    const place = await prisma.place.findUnique({
      where: { placeId },
    });

    if (!place) {
      res.status(404).json({ error: 'Place not found' });
      return;
    }

    const features = await getPlaceFeatureMap(placeId);

    res.json({ ...place, features });
  } catch (err) {
    console.error('Place detail error:', err);
    res.status(500).json({ error: 'Failed to fetch place' });
  }
});
