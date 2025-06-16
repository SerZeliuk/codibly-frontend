'use client';
import React, { JSX, useState } from 'react';
import {
  FaSun, FaCloud, FaCloudSun, FaCloudShowersHeavy,
  FaSnowflake, FaSmog
} from 'react-icons/fa';
import clsx from 'clsx';

/* ---------- icon map ---------- */
const codeToIcon: Record<number, JSX.Element> = {
  0: <FaSun />, 1: <FaCloudSun />, 2: <FaCloudSun />, 3: <FaCloud />,
  45: <FaSmog />, 48: <FaSmog />,
  51: <FaCloudShowersHeavy />, 53: <FaCloudShowersHeavy />, 55: <FaCloudShowersHeavy />,
  61: <FaCloudShowersHeavy />, 63: <FaCloudShowersHeavy />, 65: <FaCloudShowersHeavy />,
  71: <FaSnowflake />, 73: <FaSnowflake />, 75: <FaSnowflake />,
  85: <FaSnowflake />, 86: <FaSnowflake />
};

/* ---------- date helpers ---------- */
const today   = new Date();
const DAY_MS  = 86_400_000;
const EARLIEST = new Date(today.getTime() - 70 * DAY_MS);
const LATEST   = new Date(today.getTime() + 16 * DAY_MS);

const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const weekday = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { weekday: 'short' });

function windowForOffset(offsetWeeks: number) {
  const rawStart = new Date(EARLIEST.getTime() + offsetWeeks * 7 * DAY_MS);
  let start = rawStart, end = new Date(start.getTime() + 6 * DAY_MS);
  if (end > LATEST) { end = new Date(LATEST); start = new Date(end.getTime() - 6 * DAY_MS); }
  if (start < EARLIEST) { start = new Date(EARLIEST); end = new Date(start.getTime() + 6 * DAY_MS); }
  return { start, end };
}

const MAX_OFFSET = Math.floor((LATEST.getTime() - EARLIEST.getTime() - 6 * DAY_MS) / (7 * DAY_MS));
const INITIAL_OFFSET = Math.min(
  Math.floor((today.getTime() - EARLIEST.getTime()) / (7 * DAY_MS)),
  MAX_OFFSET
);

/* ---------- types ---------- */
type WeatherJSON = {
  daily: {
    time: string[];
    sunshine_duration: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weather_code: number[];
  };
  daily_units: {
    sunshine_duration: string;
    temperature_2m_max: string;
    temperature_2m_min: string;
  };
};

/* ---------- component ---------- */
export default function WeatherExplorer() {
  const [latInput, setLatInput] = useState('');
  const [lonInput, setLonInput] = useState('');
  const [solarPower, setSolarPower] = useState(2.5);
  const [solarEff, setSolarEff]     = useState(0.2);

  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [offset, setOffset] = useState(INITIAL_OFFSET);
  const [data,   setData]   = useState<WeatherJSON | null>(null);
  const [busy,   setBusy]   = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  /* ---------- validation helpers ---------- */
  const latNum = parseFloat(latInput);
  const lonNum = parseFloat(lonInput);
  const effVal = solarEff;

  const latErr  = latInput && (!Number.isFinite(latNum) || latNum < -90 || latNum > 90);
  const lonErr  = lonInput && (!Number.isFinite(lonNum) || lonNum < -180 || lonNum > 180);
  const effErr  = effVal < 0 || effVal > 1;

  const inputsValid = !latErr && !lonErr && !effErr && latInput && lonInput;

  /* ---------- fetch ---------- */
  async function fetchChunk(lat: number, lon: number, newOffset = offset) {
    setBusy(true); setError(null);
    try {
      const { start, end } = windowForOffset(newOffset);
      const url =
        `${process.env.NEXT_PUBLIC_WEATHER_API_URL}/api/weather/${lat}/${lon}/${ymd(start)}/${ymd(end)}`;
      const r = await fetch(url);
      if (!r.ok) throw new Error();
      setCoords({ lat, lon });
      setData(await r.json());
      setOffset(newOffset);
    } catch { setError('Weather API error'); }
    finally { setBusy(false); }
  }

  /* ---------- submit handlers ---------- */
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (inputsValid) fetchChunk(latNum, lonNum);
  }

  function useMyLocation() {
    if (!navigator.geolocation) { setError('Geolocation not supported'); return; }
    setBusy(true); setError(null);
    navigator.geolocation.getCurrentPosition(
      p => {
        const lat = +p.coords.latitude.toFixed(4);
        const lon = +p.coords.longitude.toFixed(4);
        setLatInput(String(lat)); setLonInput(String(lon));
        fetchChunk(lat, lon);
      },
      () => { setBusy(false); setError('Permission denied'); }
    );
  }

  /* ---------- paging ---------- */
  const canNext = coords && offset < MAX_OFFSET;
  const canPrev = coords && offset > 0;

  /* ---------- render ---------- */
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 to-indigo-100 p-4">
      <main className="w-full max-w-5xl space-y-8">

        {/* --- coordinate / param card --- */}
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl bg-white/60 backdrop-blur-md shadow-2xl ring-1 ring-white/40 p-6 space-y-6"
        >
          <h1 className="text-2xl font-bold text-center">7-Day Weather Explorer</h1>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Lat */}
            <label className="space-y-1">
              <span className="block text-sm font-medium">Latitude</span>
              <input
                type="number" step="any" value={latInput}
                onChange={e => setLatInput(e.target.value)}
                className={clsx(
                  'w-full rounded-xl border p-3 outline-none',
                  latErr ? 'border-red-500' : 'border-gray-300 focus:ring-2 focus:ring-indigo-400'
                )}
              />
              {latErr && <span className="text-xs text-red-600">Latitude should be between −90 (South Pole) and 90 (North Pole)</span>}
            </label>
            {/* Lon */}
            <label className="space-y-1">
              <span className="block text-sm font-medium">Longitude</span>
              <input
                type="number" step="any" value={lonInput}
                onChange={e => setLonInput(e.target.value)}
                className={clsx(
                  'w-full rounded-xl border p-3 outline-none',
                  lonErr ? 'border-red-500' : 'border-gray-300 focus:ring-2 focus:ring-indigo-400'
                )}
              />
              {lonErr && <span className="text-xs text-red-600">Longitude should be between −180 (West) and 180 (East)</span>}
            </label>
            {/* Solar power */}
            <label className="space-y-1">
              <span className="block text-sm font-medium">Installation kW</span>
              <input
                type="number" step="any" value={solarPower}
                onChange={e => setSolarPower(Number(e.target.value))}
                className="w-full rounded-xl border border-gray-300 p-3 focus:ring-2 focus:ring-indigo-400 outline-none"
              />
            </label>
            {/* Effectivity */}
            <label className="space-y-1">
              <span className="block text-sm font-medium">Effectivity (0–1)</span>
              <input
                type="number" step="any" value={solarEff}
                onChange={e => setSolarEff(Number(e.target.value))}
                className={clsx(
                  'w-full rounded-xl border p-3 outline-none',
                  effErr ? 'border-red-500' : 'border-gray-300 focus:ring-2 focus:ring-indigo-400'
                )}
              />
              {effErr && <span className="text-xs text-red-600">0 … 1</span>}
            </label>
          </div>

          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <button
              type="submit"
              disabled={busy || !inputsValid}
              className="rounded-xl bg-indigo-600 px-6 py-2 font-medium text-white shadow-md
                         hover:bg-indigo-700 active:scale-95 transition disabled:opacity-40"
            >
              {busy ? 'Fetching…' : 'Fetch weather'}
            </button>

            <button
              type="button"
              onClick={useMyLocation}
              disabled={busy}
              className="rounded-xl px-4 py-2 font-medium text-indigo-700
                         hover:bg-indigo-50 active:scale-95 transition disabled:opacity-40"
            >
              Use my location
            </button>
          </div>

          {error && <p className="text-red-600 text-center">{error}</p>}
        </form>

        {/* --- weather + solar cards --- */}
        {data && (
          <>
            {/* weather table card */}
            <section className="rounded-3xl bg-white/70 backdrop-blur-md shadow-2xl ring-1 ring-white/40 p-6 space-y-4">
              <div className="flex justify-between items-center">
                <button
                  title={!canPrev ? 'Earlier data unavailable' : undefined}
                  onClick={() => coords && fetchChunk(coords.lat, coords.lon, offset - 1)}
                  disabled={!canPrev || busy}
                  className={clsx(
                    'rounded-xl bg-gray-200 px-4 py-1 font-medium shadow hover:bg-gray-300 active:scale-95 transition',
                    (!canPrev || busy) && 'opacity-40 cursor-not-allowed'
                  )}
                >◀ Prev</button>

                <span className="font-semibold tracking-wide">
                  {data.daily.time[0]} – {data.daily.time[6]}
                </span>

                <button
                  title={!canNext ? 'Later data unavailable' : undefined}
                  onClick={() => coords && fetchChunk(coords.lat, coords.lon, offset + 1)}
                  disabled={!canNext || busy}
                  className={clsx(
                    'rounded-xl bg-gray-200 px-4 py-1 font-medium shadow hover:bg-gray-300 active:scale-95 transition',
                    (!canNext || busy) && 'opacity-40 cursor-not-allowed'
                  )}
                >Next ▶</button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-center border-separate border-spacing-x-0.5">
                  <thead>
                    <tr className="bg-indigo-50/90 rounded-xl">
                      {data.daily.time.map((iso, i) => (
                        <th key={i} className="p-3 rounded-xl">
                          <div className="font-medium">{weekday(iso)}</div>
                          <div className="text-xs text-gray-600">{iso}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {[
                      /* icons */
                      data.daily.weather_code.map((c, i) =>
                        <td key={i} className="py-4 text-3xl">{codeToIcon[c] ?? <FaCloud />}</td>
                      ),
                      /* sunshine hours */
                      data.daily.sunshine_duration.map((v, i) => {
                        const unit = data.daily_units.sunshine_duration;
                        const val  = unit === 's' ? (v / 3600).toFixed(2) : v;
                        return <td key={i}>{val} {unit === 's' ? 'h' : unit}</td>;
                      }),
                      /* max temps */
                      data.daily.temperature_2m_max.map((v, i) =>
                        <td key={i} className="font-semibold text-red-600">
                          {v} {data.daily_units.temperature_2m_max}
                        </td>
                      ),
                      /* min temps */
                      data.daily.temperature_2m_min.map((v, i) =>
                        <td key={i} className="text-blue-700">
                          {v} {data.daily_units.temperature_2m_min}
                        </td>
                      ),
                    ].map((row, r) => (
                      <tr
                        key={r}
                        className={clsx(
                          r % 2 === 0 ? 'bg-white/60' : 'bg-gray-50/60',
                          '[&>td:hover]:bg-indigo-100/60 transition-colors'
                        )}
                      >{row}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* solar estimation card */}
            <section className="rounded-3xl bg-white/70 backdrop-blur-md shadow-2xl ring-1 ring-white/40 p-6 space-y-6">
              <h2 className="text-xl font-semibold">Solar-Power Estimation</h2>

              <p className="text-gray-700">
                Based on sunshine hours × installation kW × effectivity.
              </p>

              <div className="space-y-4">
                {data.daily.sunshine_duration.map((seconds, i) => {
                  const hours = seconds / 3600;
                  const kWh   = (hours * solarPower * solarEff).toFixed(2);
                  return (
                    <div key={i} className="flex justify-between border-b pb-1">
                      <span>{data.daily.time[i]}</span>
                      <span className="font-medium">{kWh} kWh</span>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
