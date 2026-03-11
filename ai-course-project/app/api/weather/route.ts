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

interface IpapiResponse {
  city: string;
  latitude: number;
  longitude: number;
  error?: boolean;
  reason?: string;
}

interface OpenMeteoResponse {
  daily: {
    time: string[];
    weathercode: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
  };
}

const LOOPBACK = new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1"]);
const DEV_FALLBACK = { city: "London", latitude: 51.5074, longitude: -0.1278 };

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // Step 1: resolve IP
    const forwarded = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    const ip = forwarded
      ? forwarded.split(",")[0].trim()
      : (realIp?.trim() ?? "");

    // Step 2: geolocate
    let city: string;
    let latitude: number;
    let longitude: number;

    if (!ip || LOOPBACK.has(ip)) {
      ({ city, latitude, longitude } = DEV_FALLBACK);
    } else {
      const geoRes = await fetch(`https://ipapi.co/${ip}/json/`, {
        cache: "no-store",
      });
      if (!geoRes.ok) {
        return NextResponse.json({ error: "Geolocation failed" }, { status: 500 });
      }
      const geo = (await geoRes.json()) as IpapiResponse;
      if (geo.error) {
        return NextResponse.json(
          { error: geo.reason ?? "Geolocation error" },
          { status: 500 }
        );
      }
      city = geo.city;
      latitude = geo.latitude;
      longitude = geo.longitude;
    }

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
      return NextResponse.json({ error: "Weather fetch failed" }, { status: 500 });
    }
    const weather = (await weatherRes.json()) as OpenMeteoResponse;

    // Step 4: validate response and shape data
    if (
      !weather.daily?.time?.length ||
      weather.daily.time.length !== weather.daily.weathercode?.length
    ) {
      return NextResponse.json({ error: "Invalid weather data" }, { status: 500 });
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
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
