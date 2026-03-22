import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT ?? 3001),
  databaseUrl: process.env.DATABASE_URL ?? '',
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY ?? '',
} as const;
