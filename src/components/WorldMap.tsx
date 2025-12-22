import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon, LatLngExpression } from 'leaflet';
import { useEffect, useState } from 'react';
import HeatmapLayer from './HeatmapLayer';
import 'leaflet/dist/leaflet.css';
import { Place, Person } from '../lib/supabase';
import { MapPin, User } from 'lucide-react';

interface WorldMapProps {
  places: Place[];
  people: Person[];
  onPlaceClick?: (place: Place) => void;
  onPersonClick?: (person: Person) => void;
}

function MapUpdater({ center, zoom }: { center: LatLngExpression; zoom: number }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);

  return null;
}

const createCustomIcon = (color: string, iconHtml: string) => {
  return new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
        <path fill="${color}" d="M16 0C7.163 0 0 7.163 0 16c0 8.836 14.5 24 16 26 1.5-2 16-17.164 16-26C32 7.163 24.837 0 16 0z"/>
        <circle cx="16" cy="16" r="8" fill="white"/>
        ${iconHtml}
      </svg>
    `)}`,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -42],
  });
};

const placeIcon = createCustomIcon('#14b8a6', '<circle cx="16" cy="16" r="4" fill="#14b8a6"/>');
const personIcon = createCustomIcon('#3b82f6', '<circle cx="16" cy="16" r="4" fill="#3b82f6"/>');

export default function WorldMap({ places, people, onPlaceClick, onPersonClick }: WorldMapProps) {
  const center: LatLngExpression = [20, 0];
  const zoom = 2;

  // When multiple people share the exact same coordinates, offset their markers
  // slightly so they don't overlap. We compute a small circular offset (in meters)
  // and convert to degrees. This keeps markers visible while keeping them near
  // the original point.
  const computePersonPositions = () => {
    const groups: Record<string, Person[]> = {};

    people.forEach((p) => {
      if (!p.home_latitude || !p.home_longitude) return;
      const key = `${p.home_latitude}_${p.home_longitude}`;
      groups[key] = groups[key] || [];
      groups[key].push(p);
    });

    const positions: Record<string, [number, number]> = {};

    for (const key of Object.keys(groups)) {
      const group = groups[key];
      if (group.length === 1) {
        const p = group[0];
        positions[p.id] = [Number(p.home_latitude), Number(p.home_longitude)];
        continue;
      }

      // multiple people at same spot -> spread them around a small circle
      const radiusMeters = 100; // spread radius in meters (was 25)
      group.forEach((p, idx) => {
        const angle = (idx / group.length) * Math.PI * 2;
        const dy = Math.sin(angle) * radiusMeters; // north-south meters
        const dx = Math.cos(angle) * radiusMeters; // east-west meters

        const lat = Number(p.home_latitude);
        const lon = Number(p.home_longitude);

        // approximate conversion: 1 deg latitude ~ 111320 meters
        const deltaLat = dy / 111320;
        // longitude degree length depends on latitude
        const deltaLon = dx / (111320 * Math.cos((lat * Math.PI) / 180) || 1);

        positions[p.id] = [lat + deltaLat, lon + deltaLon];
      });
    }

    return positions;
  };

  const personPositions = computePersonPositions();
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);

  const heatPoints = places
    .filter((p) => p.latitude != null && p.longitude != null)
    .map((p) => [Number(p.latitude), Number(p.longitude), 1] as [number, number, number]);

  return (
    <div className="w-full h-full rounded-lg overflow-hidden shadow-lg">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        {/* Heatmap toggle button - simple overlay */}
        <div className="absolute top-3 right-3 z-20">
          <button
            onClick={() => setShowHeatmap((s) => !s)}
            className="bg-white/90 backdrop-blur px-3 py-1 rounded-md border border-gray-200 shadow-sm text-sm"
            title="Toggle heatmap"
          >
            {showHeatmap ? 'Hide heatmap' : 'Show heatmap'}
          </button>
        </div>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater center={center} zoom={zoom} />

        {showHeatmap && heatPoints.length > 0 && (
          <HeatmapLayer points={heatPoints} options={{ radius: 30, blur: 20 }} />
        )}

        {places.map((place) => (
          <Marker
            key={place.id}
            position={[place.latitude, place.longitude]}
            icon={placeIcon}
          >
            <Popup>
              <div className="p-2">
                <div className="flex items-center mb-2">
                  <MapPin className="w-4 h-4 text-teal-500 mr-2" />
                  <h3 className="font-semibold text-gray-800">{place.name}</h3>
                </div>
                <p className="text-sm text-gray-600 mb-2">{place.country}</p>
                {place.photo_url && (
                  <img
                    src={place.photo_url}
                    alt={place.name}
                    className="w-full h-32 object-cover rounded mb-2"
                  />
                )}
                {place.description && (
                  <p className="text-sm text-gray-700 mb-3">{place.description}</p>
                )}
                <button
                  onClick={() => onPlaceClick?.(place)}
                  className="text-teal-600 hover:text-teal-700 text-sm font-medium"
                >
                  View details
                </button>
              </div>
            </Popup>
          </Marker>
        ))}

        {people.map((person) => {
          if (!person.home_latitude || !person.home_longitude) return null;

          const adjusted = personPositions[person.id] || [Number(person.home_latitude), Number(person.home_longitude)];

          return (
            <Marker
              key={person.id}
              position={adjusted}
              icon={personIcon}
            >
              <Popup>
                <div className="p-2">
                  <div className="flex items-center mb-2">
                    <User className="w-4 h-4 text-blue-500 mr-2" />
                    <h3 className="font-semibold text-gray-800">{person.name}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">From: {person.home_country}</p>
                  {person.place?.name && (
                    <p className="text-sm text-gray-600 mb-2">Met in: {person.place.name}</p>
                  )}
                  {person.photo_url && (
                    <img
                      src={person.photo_url}
                      alt={person.name}
                      className="w-full h-32 object-cover rounded mb-2"
                    />
                  )}
                  <button
                    onClick={() => {
                      setSelectedPerson(person);
                      onPersonClick?.(person);
                    }}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    View details
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {selectedPerson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setSelectedPerson(null)} />
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full z-10 overflow-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">{selectedPerson.name}</h3>
              <button className="text-gray-500" onClick={() => setSelectedPerson(null)}>Close</button>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-sm text-gray-600">From: {selectedPerson.home_country}</p>
              {selectedPerson.photo_url && (
                <img src={selectedPerson.photo_url} alt={selectedPerson.name} className="w-full h-48 object-cover rounded" />
              )}
              {selectedPerson.description ? (
                <p className="text-sm text-gray-700">{selectedPerson.description}</p>
              ) : (
                <p className="text-sm text-gray-500">No description provided.</p>
              )}
              {selectedPerson.place?.name && (
                <p className="text-sm text-gray-600">Met in: {selectedPerson.place.name}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
