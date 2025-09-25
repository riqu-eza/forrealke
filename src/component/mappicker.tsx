"use client";

import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { useState } from "react";
import L from "leaflet";

interface MapPickerProps {
  value: [number, number]; // [lng, lat]
  onChange: (coords: [number, number]) => void;
}

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function MapPicker({ value, onChange }: MapPickerProps) {
  const [position, setPosition] = useState<[number, number]>(value);

  function LocationMarker() {
    useMapEvents({
      click(e) {
        const coords: [number, number] = [e.latlng.lng, e.latlng.lat];
        setPosition(coords);
        onChange(coords);
      },
    });
    return position ? <Marker position={[position[1], position[0]]} icon={markerIcon} /> : null;
  }

  return (
    <MapContainer
      center={[value[1], value[0]]}
      zoom={13}
      style={{ height: "300px", width: "100%", borderRadius: "0.75rem" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <LocationMarker />
    </MapContainer>
  );
}
