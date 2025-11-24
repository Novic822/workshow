import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon, LatLngExpression } from 'leaflet';
import { useEffect } from 'react';
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

  return (
    <div className="w-full h-full rounded-lg overflow-hidden shadow-lg">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater center={center} zoom={zoom} />

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

          return (
            <Marker
              key={person.id}
              position={[person.home_latitude, person.home_longitude]}
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
                  {person.description && (
                    <p className="text-sm text-gray-700 mb-3">{person.description}</p>
                  )}
                  <button
                    onClick={() => onPersonClick?.(person)}
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
    </div>
  );
}
