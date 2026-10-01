import type { WeatherForecastDay } from '../engine/types';

interface OpenMeteoResponse {
  daily?: {
    time?: string[];
    weather_code?: number[];
    precipitation_sum?: number[];
    precipitation_probability_max?: number[];
    wind_speed_10m_max?: number[];
  };
}

export async function fetchProjectWeatherForecast(latitude: number, longitude: number): Promise<WeatherForecastDay[]> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    daily: 'weather_code,precipitation_sum,precipitation_probability_max,wind_speed_10m_max',
    forecast_days: '14',
    timezone: 'Asia/Kolkata',
  });
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
  if (!response.ok) throw new Error('Weather forecast could not be loaded.');

  const payload = await response.json() as OpenMeteoResponse;
  const daily = payload.daily;
  if (!daily?.time?.length) throw new Error('Weather forecast returned no daily data.');

  return daily.time.map((date, index) => ({
    date,
    weatherCode: daily.weather_code?.[index] ?? 0,
    precipitationMm: daily.precipitation_sum?.[index] ?? 0,
    precipitationProbability: daily.precipitation_probability_max?.[index] ?? 0,
    maxWindKmh: daily.wind_speed_10m_max?.[index] ?? 0,
  }));
}
