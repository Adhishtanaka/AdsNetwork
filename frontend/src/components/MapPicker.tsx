import { useState, useRef, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
  initialCoords?: { lat: number; lng: number } | null; // optional initial coordinates
}

const LocationMarker = ({ position }: { position: [number, number] | null }) => {
  return position === null ? null : <Marker position={position}></Marker>;
};

export default function LocationPicker({ onLocationSelect, initialCoords }: LocationPickerProps) {
  const defaultCenter: [number, number] = [7.8731, 80.7718]; // Sri Lanka default
  const [mapCenter, setMapCenter] = useState<[number, number]>(
    initialCoords ? [initialCoords.lat, initialCoords.lng] : defaultCenter
  );
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(
    initialCoords ? [initialCoords.lat, initialCoords.lng] : null
  );
  const mapRef = useRef(null);

  useEffect(() => {
    if (initialCoords) {
      setMapCenter([initialCoords.lat, initialCoords.lng]);
      setMarkerPosition([initialCoords.lat, initialCoords.lng]);
    }
  }, [initialCoords]);

  const MapEvents = () => {
    useMapEvents({
      click(e) {
        setMarkerPosition([e.latlng.lat, e.latlng.lng]);
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      },
    });
    return null;
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setMapCenter([latitude, longitude]);
        setMarkerPosition([latitude, longitude]);
        onLocationSelect(latitude, longitude);
        if (mapRef.current && (mapRef.current as any).flyTo) {
          (mapRef.current as any).flyTo([latitude, longitude], 15, { animate: true, duration: 1.5 });
        }
      },
      () => alert("Unable to get your location")
    );
  };

  return (
    <div className="w-full h-80 rounded-lg overflow-hidden border border-gray-600 relative" style={{ minHeight: 320 }}>
      <MapContainer
        center={mapCenter}
        zoom={7}
        scrollWheelZoom
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
        ref={mapRef}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        <MapEvents />
        <LocationMarker position={markerPosition} />
      </MapContainer>
      <button
        type="button"
        onClick={useMyLocation}
        className="absolute top-3 right-3 px-4 py-2 bg-gray-700 text-gray-100 rounded-lg hover:bg-gray-600 transition duration-200 shadow-lg"
        style={{
          pointerEvents: "auto",
          zIndex: 1000
        }}
      >
        Use Your Location
      </button>
    </div>
  );
}
