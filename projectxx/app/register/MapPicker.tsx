"use client";
import React from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default icon path for Next.js
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/marker-icon-2x.png',
  iconUrl: '/marker-icon.png',
  shadowUrl: '/marker-shadow.png',
});

interface MapPickerProps {
  lat: number | null;
  lng: number | null;
  setLat: (lat: number) => void;
  setLng: (lng: number) => void;
}

function LocationMarker({ lat, lng, setLat, setLng }: MapPickerProps) {
  useMapEvents({
    click(e: L.LeafletMouseEvent) {
      setLat(e.latlng.lat);
      setLng(e.latlng.lng);
    },
  });
  return lat !== null && lng !== null ? <Marker position={[lat, lng]} /> : null;
}

const MapPicker: React.FC<MapPickerProps> = ({ lat, lng, setLat, setLng }) => (
  <div className="h-64 w-full rounded overflow-hidden border">
    <MapContainer center={[28.6139, 77.209] as [number, number]} zoom={5} style={{ height: '100%', width: '100%' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <LocationMarker lat={lat} lng={lng} setLat={setLat} setLng={setLng} />
    </MapContainer>
  </div>
);

export default MapPicker; 