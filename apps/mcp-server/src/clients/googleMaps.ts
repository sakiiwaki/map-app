import { Client, Language } from '@googlemaps/google-maps-services-js';
import { config } from '../config';

const client = new Client({});

export type PlaceSearchResult = {
  place_id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  rating?: number;
  user_ratings_total?: number;
  types: string[];
};

export type PlaceDetails = PlaceSearchResult & {
  website?: string;
  phone_number?: string;
  editorial_summary?: string;
  reviews: string[]; // レビュー本文の配列
};

export async function searchNearbyPlaces(
  keyword: string,
  lat: number,
  lng: number,
  radiusMeters = 5000,
): Promise<PlaceSearchResult[]> {
  const response = await client.placesNearby({
    params: {
      location: { lat, lng },
      radius: radiusMeters,
      keyword,
      key: config.googleMapsApiKey,
      language: Language.ja,
    },
  });

  return (response.data.results ?? []).map((place) => ({
    place_id: place.place_id ?? '',
    name: place.name ?? '',
    lat: place.geometry?.location.lat ?? 0,
    lng: place.geometry?.location.lng ?? 0,
    address: place.vicinity ?? '',
    rating: place.rating,
    user_ratings_total: place.user_ratings_total,
    types: place.types ?? [],
  }));
}

/**
 * Place Details API でレビュー・公式サイト・編集サマリーを取得する
 * 取得したテキストは NLP 特徴抽出のインプットに使う
 */
export async function getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  try {
    const response = await client.placeDetails({
      params: {
        place_id: placeId,
        key: config.googleMapsApiKey,
        language: Language.ja,
        fields: [
          'place_id',
          'name',
          'geometry',
          'formatted_address',
          'rating',
          'user_ratings_total',
          'types',
          'website',
          'formatted_phone_number',
          'editorial_summary',
          'reviews',
        ] as string[],
      },
    });

    const place = response.data.result;
    if (!place) return null;

    const reviews: string[] = (place.reviews ?? [])
      .map((r) => r.text ?? '')
      .filter(Boolean);

    const editorial = (place as { editorial_summary?: { overview?: string } })
      .editorial_summary?.overview;

    return {
      place_id: place.place_id ?? placeId,
      name: place.name ?? '',
      lat: place.geometry?.location.lat ?? 0,
      lng: place.geometry?.location.lng ?? 0,
      address: place.formatted_address ?? '',
      rating: place.rating,
      user_ratings_total: place.user_ratings_total,
      types: place.types ?? [],
      website: place.website,
      phone_number: place.formatted_phone_number,
      editorial_summary: editorial,
      reviews,
    };
  } catch (err) {
    console.error(`[googleMaps] getPlaceDetails failed for ${placeId}:`, err);
    return null;
  }
}
