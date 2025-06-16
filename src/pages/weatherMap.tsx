'use client';
import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

type Props = { onSelect: (lat: number, lon: number) => void; };

function LocationPicker({ onSelect }: Props) {
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);

  useMapEvents({
    click(e) {
      const lat = +e.latlng.lat.toFixed(4);
      const lng = +e.latlng.lng.toFixed(4);
      setPos({ lat, lng });
      onSelect(lat, lng);
    }
  });

  return pos ? <Marker position={pos} /> : null;
}

export default function WeatherMap({ onSelect }: Props) {
  return (
    <MapContainer
      center={[0, 0]}
      zoom={2}
      style={{ height: '100%', width: '100%' }}
      className="dark:invert"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="© OpenStreetMap contributors"
      />
      <LocationPicker onSelect={onSelect} />
    </MapContainer>
  );
}
