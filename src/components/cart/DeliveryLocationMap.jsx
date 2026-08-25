import React, { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const pinIcon = L.divIcon({
  className: '',
  html: '<div aria-hidden="true" style="width:38px;height:38px;border-radius:50% 50% 50% 0;background:#17130f;border:4px solid white;box-shadow:0 4px 16px rgba(0,0,0,.35);transform:rotate(-45deg);display:flex;align-items:center;justify-content:center"><span style="width:10px;height:10px;border-radius:50%;background:white;display:block"></span></div>',
  iconSize: [38, 38],
  iconAnchor: [19, 38]
});

const KeepMapCentered = ({ position }) => {
  const map = useMap();
  const previousPosition = useRef(position);

  useEffect(() => {
    if (previousPosition.current[0] !== position[0] || previousPosition.current[1] !== position[1]) {
      map.setView(position, 18, { animate: true });
      previousPosition.current = position;
    }
  }, [map, position]);

  return null;
};

const MovablePin = ({ position, onPinChange }) => {
  const markerRef = useRef(null);
  const eventHandlers = useMemo(() => ({
    dragend() {
      const marker = markerRef.current;
      if (!marker) return;
      const point = marker.getLatLng();
      onPinChange(point.lat, point.lng);
    }
  }), [onPinChange]);

  useMapEvents({
    click(event) {
      onPinChange(event.latlng.lat, event.latlng.lng);
    }
  });

  return (
    <Marker
      ref={markerRef}
      position={position}
      icon={pinIcon}
      draggable
      eventHandlers={eventHandlers}
      title="Drag this pin to your exact delivery location"
    />
  );
};

const DeliveryLocationMap = ({ latitude, longitude, onPinChange }) => {
  const position = useMemo(() => [Number(latitude), Number(longitude)], [latitude, longitude]);

  return (
    <div className="relative">
      <MapContainer
        center={position}
        zoom={18}
        scrollWheelZoom={false}
        className="h-64 w-full bg-stone-100"
        aria-label="Move the delivery location pin"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <KeepMapCentered position={position} />
        <MovablePin position={position} onPinChange={onPinChange} />
      </MapContainer>
      <div className="pointer-events-none absolute left-3 right-3 top-3 z-[500] rounded-lg bg-white/95 px-3 py-2 text-center text-[11px] font-bold text-primary shadow-md">
        Drag the black pin or tap the exact house
      </div>
    </div>
  );
};

export default DeliveryLocationMap;
