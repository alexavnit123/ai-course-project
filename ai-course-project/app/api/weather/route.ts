import { NextRequest, NextResponse } from "next/server";

interface WeatherDay {
  date: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
}

interface WeatherResponse {
  city: string;
  daily: WeatherDay[];
}

interface GeoResult {
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
}

interface GeocodingResponse {
  results?: GeoResult[];
}

interface OpenMeteoResponse {
  daily: {
    time: string[];
    weathercode: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
  };
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // Step 1: get city from query param
    const { searchParams } = new URL(req.url);
    const cityParam = searchParams.get("city")?.trim();

    if (!cityParam) {
      return NextResponse.json({ error: "no_city" }, { status: 200 });
    }

    // Step 2: geocode city name → lat/lon
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityParam)}&count=1&language=en&format=json`;
    const geoRes = await fetch(geoUrl, { cache: "no-store" });
    if (!geoRes.ok) {
      return NextResponse.json({ error: "geocoding_failed" }, { status: 200 });
    }
    const geoData = (await geoRes.json()) as GeocodingResponse;
    if (!geoData.results?.length) {
      return NextResponse.json({ error: "city_not_found" }, { status: 200 });
    }

    const result = geoData.results[0];
    const { latitude, longitude } = result;
    const city = result.name +
      (result.admin1 ? `, ${result.admin1}` : "") +
      `, ${result.country}`;

    // Step 3: fetch forecast
    const params = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      daily: "temperature_2m_max,temperature_2m_min,weathercode",
      timezone: "auto",
      forecast_days: "7",
      temperature_unit: "celsius",
    });
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?${params}`,
      { cache: "no-store" }
    );
    if (!weatherRes.ok) {
      return NextResponse.json({ error: "weather_fetch_failed" }, { status: 200 });
    }
    const weather = (await weatherRes.json()) as OpenMeteoResponse;

    // Step 4: validate and shape
    if (
      !weather.daily?.time?.length ||
      weather.daily.time.length !== weather.daily.weathercode?.length
    ) {
      return NextResponse.json({ error: "invalid_weather_data" }, { status: 200 });
    }

    const daily: WeatherDay[] = weather.daily.time.map((date, i) => ({
      date,
      weatherCode: weather.daily.weathercode[i],
      tempMax: Math.round(weather.daily.temperature_2m_max[i]),
      tempMin: Math.round(weather.daily.temperature_2m_min[i]),
    }));

    const body: WeatherResponse = { city, daily };
    return NextResponse.json(body, {
      headers: { "Cache-Control": "private, max-age=3600" },
    });
  } catch {
    return NextResponse.json({ error: "unexpected_error" }, { status: 200 });
  }
}
