"use client";

import "ol/ol.css";
import { Map, View } from "ol";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import { fromLonLat, toLonLat } from "ol/proj";
import { useEffect, useRef } from "react";

interface OLMapPickerProps {
  value: [number, number];
  onChange: (coords: [number, number]) => void;
}

export default function OLMapPicker({ value, onChange }: OLMapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      view: new View({
        center: fromLonLat(value),
        zoom: 13,
      }),
    });

    map.on("click", (event) => {
      const coords = toLonLat(event.coordinate) as [number, number];
      onChange(coords);
    });

    return () => map.setTarget(undefined);
  }, [value, onChange]);

  return <div ref={mapRef} style={{ width: "100%", height: "300px", borderRadius: "0.75rem" }} />;
}
