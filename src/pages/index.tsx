'use client';
import React, { useState, JSX } from 'react';
import {
  FaSun, FaCloud, FaCloudSun, FaCloudShowersHeavy,
  FaSnowflake, FaSmog, FaCloudRain, FaBolt
} from 'react-icons/fa';
import clsx from 'clsx';

const codeToIcon: Record<number, JSX.Element> = {
  0: <FaSun />,
  1: <FaCloudSun />, 2: <FaCloudSun />, 3: <FaCloud />,
  45: <FaSmog />, 48: <FaSmog />,
  51: <FaCloudShowersHeavy />, 53: <FaCloudShowersHeavy />, 55: <FaCloudShowersHeavy />,
  61: <FaCloudShowersHeavy />, 63: <FaCloudShowersHeavy />, 65: <FaCloudShowersHeavy />,
  80: <FaCloudRain />, 81: <FaCloudRain />, 82: <FaCloudRain />,
  71: <FaSnowflake />, 73: <FaSnowflake />, 75: <FaSnowflake />,
  85: <FaSnowflake />, 86: <FaSnowflake />,
  95: <FaBolt />, 96: <FaBolt />, 99: <FaBolt />,
};

const DAY_MS = 86_400_000;
const today = new Date();
const EARLIEST = new Date(today.getTime() - 70 * DAY_MS);
const LATEST   = new Date(today.getTime() + 16 * DAY_MS);

const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

const weekday = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { weekday: 'short' });

function windowForOffset(o: number) {
  let start = new Date(EARLIEST.getTime() + o*7*DAY_MS);
  let end   = new Date(start.getTime() + 6*DAY_MS);
  if (end > LATEST) { end = new Date(LATEST); start = new Date(end.getTime() - 6*DAY_MS); }
  if (start < EARLIEST) { start = new Date(EARLIEST); end = new Date(start.getTime() + 6*DAY_MS); }
  return { start, end };
}

const MAX_OFFSET = Math.floor((LATEST.getTime() - EARLIEST.getTime() - 6*DAY_MS) / (7*DAY_MS));
const INITIAL_OFFSET = Math.min(
  Math.floor((today.getTime() - EARLIEST.getTime()) / (7*DAY_MS)),
  MAX_OFFSET
);

type Daily = {
  time: string[];
  weather_code: number[];
  sunshine_duration: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
};
type Units = {
  sunshine_duration: string;
  temperature_2m_max: string;
  temperature_2m_min: string;
};
type WeatherData = { daily: Daily; daily_units: Units; };
type WeeklyStats = {
  avg_pressure_hPa: number | null;
  weekly_max_temp: number | null;
  weekly_min_temp: number | null;
  avg_sunshine_hours: number | null;
  most_frequent_weather_code: number | null;
  start_date: string;
  end_date: string;
};

export default function WeatherExplorer() {
  const [latInput, setLatInput] = useState('');
  const [lonInput, setLonInput] = useState('');
  const [solarPower, setSolarPower] = useState(2.5);
  const [solarEff, setSolarEff]     = useState(0.2);

  const [coords, setCoords] = useState<{lat:number,lon:number}|null>(null);
  const [offset, setOffset] = useState(INITIAL_OFFSET);
  const [data, setData]     = useState<WeatherData|null>(null);
  const [weekly, setWeekly] = useState<WeeklyStats|null>(null);
  const [busy, setBusy]     = useState(false);
  const [error, setError]   = useState<string|null>(null);

  const latNum = parseFloat(latInput), lonNum = parseFloat(lonInput);
  const latErr = latInput && (isNaN(latNum) || latNum < -90 || latNum > 90);
  const lonErr = lonInput && (isNaN(lonNum) || lonNum < -180 || lonNum > 180);
  const effErr = solarEff < 0 || solarEff > 1;
  const inputsValid = !latErr && !lonErr && !effErr && latInput && lonInput;

  async function fetchChunk(lat: number, lon: number, newOffset = offset) {
    setBusy(true); setError(null);
    try {
      const { start, end } = windowForOffset(newOffset);
      const base = process.env.NEXT_PUBLIC_WEATHER_API_URL;
      // daily
      const dRes = await fetch(`${base}/api/weather/${lat}/${lon}/${ymd(start)}/${ymd(end)}`);
      if (!dRes.ok) throw new Error();
      const dJson = await dRes.json() as WeatherData;
      setCoords({ lat, lon });
      setData(dJson);
      setOffset(newOffset);
      // weekly
      const wRes = await fetch(`${base}/api/weekly/${lat}/${lon}/${ymd(start)}/${ymd(end)}`);
      if (!wRes.ok) throw new Error();
      setWeekly(await wRes.json() as WeeklyStats);
    } catch {
      setError('Weather API error');
    } finally {
      setBusy(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (inputsValid) fetchChunk(latNum, lonNum);
  }

  function useMyLocation() {
    if (!navigator.geolocation) return setError('Geolocation not supported');
    setBusy(true); setError(null);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = +pos.coords.latitude.toFixed(4);
        const lon = +pos.coords.longitude.toFixed(4);
        setLatInput(String(lat));
        setLonInput(String(lon));
        fetchChunk(lat, lon);
      },
      () => { setBusy(false); setError('Permission denied'); }
    );
  }

  const canPrev = !!coords && offset > 0;
  const canNext = !!coords && offset < MAX_OFFSET;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 to-indigo-100 p-4">
      <main className="w-full max-w-5xl space-y-8">

        <form onSubmit={handleSubmit}
          className="rounded-3xl bg-white/60 backdrop-blur-md shadow-2xl ring-1 ring-white/40 p-6 space-y-6">
          <h1 className="text-2xl font-bold text-center">7-Day Weather Explorer</h1>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1">
              <span className="block text-sm font-medium">Latitude</span>
              <input type="number" step="any" value={latInput}
                     onChange={e => setLatInput(e.target.value)}
                     className={clsx('w-full rounded-xl border p-3 outline-none',
                       latErr ? 'border-red-500' : 'border-gray-300 focus:ring-2 focus:ring-indigo-400')} />
              {latErr && <span className="text-xs text-red-600">
                Latitude must be between −90 and 90
              </span>}
            </label>

            <label className="space-y-1">
              <span className="block text-sm font-medium">Longitude</span>
              <input type="number" step="any" value={lonInput}
                     onChange={e => setLonInput(e.target.value)}
                     className={clsx('w-full rounded-xl border p-3 outline-none',
                       lonErr ? 'border-red-500' : 'border-gray-300 focus:ring-2 focus:ring-indigo-400')} />
              {lonErr && <span className="text-xs text-red-600">
                Longitude must be between −180 and 180
              </span>}
            </label>

            <label className="space-y-1">
              <span className="block text-sm font-medium">Installation kW</span>
              <input type="number" step="any" value={solarPower}
                     onChange={e => setSolarPower(+e.target.value)}
                     className="w-full rounded-xl border border-gray-300 p-3 focus:ring-2 focus:ring-indigo-400 outline-none" />
            </label>

            <label className="space-y-1">
              <span className="block text-sm font-medium">Effectivity (0–1)</span>
              <input type="number" step="any" value={solarEff}
                     onChange={e => setSolarEff(+e.target.value)}
                     className={clsx('w-full rounded-xl border p-3 outline-none',
                       effErr ? 'border-red-500' : 'border-gray-300 focus:ring-2 focus:ring-indigo-400')} />
              {effErr && <span className="text-xs text-red-600">0 … 1</span>}
            </label>
          </div>

          <div className="flex justify-center gap-4 pt-2">
            <button type="submit" disabled={busy || !inputsValid}
              className="rounded-xl bg-indigo-600 px-6 py-2 text-white hover:bg-indigo-700 active:scale-95 transition disabled:opacity-40">
              {busy ? 'Fetching…' : 'Fetch weather'}
            </button>
            <button type="button" onClick={useMyLocation} disabled={busy}
              className="rounded-xl px-4 py-2 text-indigo-700 hover:bg-indigo-50 active:scale-95 transition disabled:opacity-40">
              Use my location
            </button>
          </div>
          {error && <p className="text-red-600 text-center">{error}</p>}
        </form>

        {data && (
          <>
            {/* daily table */}
            <section className="rounded-3xl bg-white/70 p-6 space-y-4 shadow-2xl ring-1 ring-white/40">
              <div className="flex justify-between items-center">
                <button onClick={() => coords && fetchChunk(coords.lat, coords.lon, offset-1)}
                        disabled={!canPrev || busy}
                        className={clsx('rounded-xl px-4 py-1', (!canPrev||busy)&&'opacity-40')}>
                  ◀ Prev
                </button>
                <span className="font-semibold">
                  {data.daily.time[0]} – {data.daily.time[6]}
                </span>
                <button onClick={() => coords && fetchChunk(coords.lat, coords.lon, offset+1)}
                        disabled={!canNext || busy}
                        className={clsx('rounded-xl px-4 py-1', (!canNext||busy)&&'opacity-40')}>
                  Next ▶
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-center border-separate border-spacing-x-0.5">
                  <thead>
                    <tr className="bg-indigo-50/90">
                      {data.daily.time.map((iso,i) => (
                        <th key={i} className="p-3">
                          <div className="font-medium">{weekday(iso)}</div>
                          <div className="text-xs text-gray-600">{iso}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      // icon row
                      data.daily.weather_code.map((c,i)=>
                        <td key={i} className="py-4 text-3xl">
                          {codeToIcon[c] ?? <FaCloud />}
                        </td>
                      ),
                      // sunshine
                      data.daily.sunshine_duration.map((v,i)=>{
                        const unit = data.daily_units.sunshine_duration;
                        const val  = unit==='s' ? (v/3600).toFixed(2) : v;
                        return <td key={i}>{val} {unit==='s'?'h':unit}</td>;
                      }),
                      // max temp
                      data.daily.temperature_2m_max.map((v,i)=>
                        <td key={i} className="font-semibold text-red-600">
                          {v} {data.daily_units.temperature_2m_max}
                        </td>
                      ),
                      // min temp
                      data.daily.temperature_2m_min.map((v,i)=>
                        <td key={i} className="text-blue-700">
                          {v} {data.daily_units.temperature_2m_min}
                        </td>
                      ),
                      // solar estimate
                      data.daily.sunshine_duration.map((sec,i)=>{
                        const kWh = ((sec/3600)*solarPower*solarEff).toFixed(2);
                        return <td key={i}>{kWh} kWh</td>;
                      })
                    ].map((row,ri)=>(
                      <tr key={ri} className={ri%2===0?'bg-white/60':'bg-gray-50/60'}>
                        {row}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* weekly stats */}
            {weekly && (
              <section className="rounded-3xl bg-white/70 p-6 space-y-4 shadow-2xl ring-1 ring-white/40">
                <h2 className="text-xl font-semibold">Weekly Statistics</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div><strong>Period:</strong> {weekly.start_date} – {weekly.end_date}</div>
                  <div><strong>Avg Pressure:</strong> {weekly.avg_pressure_hPa ?? 'N/A'} hPa</div>
                  <div><strong>Max Temp:</strong> {weekly.weekly_max_temp ?? 'N/A'}{data.daily_units.temperature_2m_max}</div>
                  <div><strong>Min Temp:</strong> {weekly.weekly_min_temp ?? 'N/A'}{data.daily_units.temperature_2m_min}</div>
                  <div><strong>Avg Sunshine:</strong> {weekly.avg_sunshine_hours ?? 'N/A'} h</div>
                  <div className="flex items-center">
                    <strong>Most Frequent:</strong>
                    <span className="ml-2 text-2xl">{codeToIcon[weekly.most_frequent_weather_code!]}</span>
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
