'use client';
import React from 'react';
import { useEffect, useState } from 'react';

type WeatherPayload = unknown;          // replace with the real shape later

export default function Home() {
  /* ───── general hello endpoint ───── */
  const [msg, setMsg] = useState('…');
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hello`)
      .then(r => r.json())
      .then(d => setMsg(d.msg))
      .catch(() => setMsg('API error'));
  }, []);

  /* ───── weather states ───── */
  const [lat, setLat]           = useState<string>('');   // controlled inputs
  const [lon, setLon]           = useState<string>('');
  const [busy, setBusy]         = useState(false);
  const [weather, setWeather]   = useState<WeatherPayload | null>(null);
  const [wError, setWError]     = useState<string | null>(null);

  /* ───── helpers ───── */
  const fetchWeather = async (latNum: number, lonNum: number) => {
    setBusy(true);
    setWError(null);
    setWeather(null);
    const r_lat = latNum.toFixed(2);
    const r_lon = lonNum.toFixed(2);
    try {
      const url = `${process.env.NEXT_PUBLIC_WEATHER_API_URL}` + 
                  `/api/weather/${r_lat}/${r_lon}`;
      const r   = await fetch(url);
      if (!r.ok) throw new Error(r.statusText);
      setWeather(await r.json());
    } catch (err) {
      setWError('Weather API error');
    } finally {
      setBusy(false);
    }
  };

  const submitManual = (e: React.FormEvent) => {
    e.preventDefault();
    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);
    if (Number.isFinite(latNum) && Number.isFinite(lonNum)) {
      fetchWeather(latNum, lonNum);
    } else {
      setWError('Please enter valid numbers.');
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setWError('Geolocation not supported');
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const latNum = +coords.latitude.toFixed(4);
        const lonNum = +coords.longitude.toFixed(4);
        setLat(String(latNum));
        setLon(String(lonNum));
        fetchWeather(latNum, lonNum);
      },
      () => {
        setBusy(false);
        setWError('Location permission denied');
      }
    );
  };

  /* ───── UI ───── */
  return (
    <main className="p-8 text-center space-y-6">
      <h1 className="text-3xl font-bold">Next × Flask starter</h1>
      <p>API says: <strong>{msg}</strong></p>

      {/* weather form */}
      <form onSubmit={submitManual} className="space-y-3 max-w-xs mx-auto">
        <div className="flex items-center gap-2">
          <label className="w-24 text-right">Latitude</label>
          <input
            type="number"
            step="any"
            value={lat}
            onChange={e => setLat(e.target.value)}
            className="flex-1 border p-1 rounded"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="w-24 text-right">Longitude</label>
          <input
            type="number"
            step="any"
            value={lon}
            onChange={e => setLon(e.target.value)}
            className="flex-1 border p-1 rounded"
          />
        </div>

        <button
          type="submit"
          disabled={busy}
          className="w-full bg-blue-600 text-white py-1 rounded disabled:opacity-50"
        >
          {busy ? 'Fetching…' : 'Fetch weather'}
        </button>
      </form>

      <button
        onClick={useMyLocation}
        disabled={busy}
        className="underline text-sm text-blue-700 disabled:opacity-50"
      >
        {busy ? 'Getting location…' : 'Use my current location'}
      </button>

      {wError && <p className="text-red-600">{wError}</p>}

      {weather && (
        <pre className="bg-gray-100 p-4 text-left whitespace-pre-wrap rounded max-w-2xl mx-auto">
{JSON.stringify(weather, null, 2)}
        </pre>
      )}
    </main>
  );
}
