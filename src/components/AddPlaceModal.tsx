import { useState } from 'react';
import { X, MapPin, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface AddPlaceModalProps {
  onClose: () => void;
  onPlaceAdded: () => void;
}

interface LocationSuggestion {
  display_name: string;
  lat: string;
  lon: string;
  address: {
    country?: string;
  };
}

export default function AddPlaceModal({ onClose, onPlaceAdded }: AddPlaceModalProps) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const searchLocation = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          searchQuery
        )}&format=json&addressdetails=1&limit=5`
      );
      const data = await response.json();
      setSuggestions(data);
    } catch (err) {
      console.error('Error searching location:', err);
    } finally {
      setSearching(false);
    }
  };

  const selectLocation = (location: LocationSuggestion) => {
    setName(searchQuery);
    setCountry(location.address.country || '');
    setLatitude(location.lat);
    setLongitude(location.lon);
    setSuggestions([]);
    setSearchQuery('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Ensure auto-filled fields are present (name, country, latitude, longitude)
    if (!name.trim() || !country.trim() || !latitude.toString().trim() || !longitude.toString().trim()) {
      setError('Please select a location from the search suggestions to autofill Place Name, Country, Latitude and Longitude.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const { error: insertError } = await supabase.from('places').insert([
        {
          user_id: user.id,
          name,
          country,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          description,
          photo_url: photoUrl || null,
        },
      ]);

      if (insertError) throw insertError;

      onPlaceAdded();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add place');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div className="flex items-center">
            <MapPin className="w-6 h-6 text-teal-500 mr-3" />
            <h2 className="text-2xl font-bold text-gray-800">Add Place</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Location
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchLocation())}
                placeholder="Search for a place..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
              />
              <button
                type="button"
                onClick={searchLocation}
                disabled={searching}
                className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition disabled:opacity-50"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
            {suggestions.length > 0 && (
              <div className="mt-2 border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => selectLocation(suggestion)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b last:border-b-0 text-sm"
                  >
                    {suggestion.display_name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Place Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled
              required
              placeholder="e.g., Taghazout"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Country *
            </label>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              disabled
              required
              placeholder="e.g., Morocco"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Latitude *
              </label>
              <input
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                disabled
                required
                placeholder="30.5369"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Longitude *
              </label>
              <input
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                disabled
                required
                placeholder="-9.7686"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Photo URL
            </label>
            <input
              type="url"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://example.com/photo.jpg"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Share your memories about this place..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none resize-none"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim() || !country.trim() || !latitude.toString().trim() || !longitude.toString().trim()}
              className="flex-1 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition font-medium disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Place'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
