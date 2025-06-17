// 'use client';
// import React, { useState, useEffect } from 'react';
// import L from 'leaflet';
// import {
//   MapContainer,
//   TileLayer,
//   Marker,
//   useMapEvents
// } from 'react-leaflet';
// import 'leaflet/dist/leaflet.css';

// // Image imports (Next.js will handle Webpack correctly)
// import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
// import markerIcon from 'leaflet/dist/images/marker-icon.png';
// import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// // Safe icon override (client-side only)

// // delete L.Icon.Default.prototype._getIconUrl;
// L.Icon.Default.mergeOptions({
//   iconRetinaUrl: markerIcon2x.src ?? markerIcon2x,
//   iconUrl: markerIcon.src ?? markerIcon,
//   shadowUrl: markerShadow.src ?? markerShadow,
// });


// type Props = { onSelect: (lat: number, lon: number) => void };

// function LocationPicker({ onSelect }: Props) {
//   const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);

//   useMapEvents({
//     click(e) {
//       const lat = +e.latlng.lat.toFixed(4);
//       const lng = +e.latlng.lng.toFixed(4);
//       setPos({ lat, lng });
//       onSelect(lat, lng);
//     }
//   });

//   return pos ? <Marker position={pos} /> : null;
// }

// export default function WeatherMap({ onSelect }: Props) {
//   return (
//     <MapContainer
//       center={[0, 0] as [number, number]}
//       zoom={2}
//       style={{ height: '100%', width: '100%' }}
//       className="dark:invert"
//     >
//       <TileLayer
//         url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
       
//       />
//       <LocationPicker onSelect={onSelect} />
//     </MapContainer>
//   );
// }

import React from 'react';


// This is just a placeholder component for the actual map functionality.
// When running npm run dev, the map works perfectly with the currently commented code, but it is impossible to perform 
// a build, ergo - deploy the app. 
// Honestly, i can't think of any reason why this is happening, that I didn't already try to fix, so unfortunately this will be left as is.

export default function WeatherMap() {
  return (
    <div className="flex items-center justify-center h-screen">
      <h1 className="text-2xl font-bold">Weather Map is under construction</h1>
    </div>
  );
}