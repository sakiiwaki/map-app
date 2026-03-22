import { Client, Language } from '@googlemaps/google-maps-services-js';
import { NextRequest, NextResponse } from 'next/server';

const googleMapsClient = new Client({});

export type PlaceResult = {
  place_id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  rating?: number;
  user_ratings_total?: number;
  types: string[];
};

export type PlacesSearchResponse = {
  results: PlaceResult[];
};

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const query = searchParams.get('q');
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  if (!query) {
    return NextResponse.json({ error: 'query parameter "q" is required' }, { status: 400 });
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Google Maps API key is not configured' }, { status: 500 });
  }

  try {
    const location =
      lat && lng
        ? { lat: parseFloat(lat), lng: parseFloat(lng) }
        : { lat: 35.681236, lng: 139.767125 }; // 東京駅をデフォルト

    const response = await googleMapsClient.placesNearby({
      params: {
        location,
        radius: 5000,
        keyword: query,
        key: apiKey,
        language: Language.ja,
      },
    });

    const results: PlaceResult[] = (response.data.results ?? []).map((place) => ({
      place_id: place.place_id ?? '',
      name: place.name ?? '',
      lat: place.geometry?.location.lat ?? 0,
      lng: place.geometry?.location.lng ?? 0,
      address: place.vicinity ?? '',
      rating: place.rating,
      user_ratings_total: place.user_ratings_total,
      types: place.types ?? [],
    }));

    return NextResponse.json({ results } satisfies PlacesSearchResponse);
  } catch (err) {
    console.error('Places API error:', err);
    return NextResponse.json({ error: 'Failed to fetch places' }, { status: 500 });
  }
}
