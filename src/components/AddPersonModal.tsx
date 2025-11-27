import { useState, useEffect } from 'react';
import { X, User, Search } from 'lucide-react';
import { supabase, Place } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface AddPersonModalProps {
  onClose: () => void;
  onPersonAdded: () => void;
}

interface LocationSuggestion {
  display_name: string;
  lat: string;
  lon: string;
  address: {
    country?: string;
  };
}

export default function AddPersonModal({ onClose, onPersonAdded }: AddPersonModalProps) {
  const { user } = useAuth();
  const [places, setPlaces] = useState<Place[]>([]);
  const [name, setName] = useState('');
  const [placeId, setPlaceId] = useState('');
  const [homeCountry, setHomeCountry] = useState('');
  const [homeLatitude, setHomeLatitude] = useState('');
  const [homeLongitude, setHomeLongitude] = useState('');
  const [description, setDescription] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPlaces();
  }, [user]);

  const loadPlaces = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('places')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading places:', error);
    } else {
      setPlaces(data || []);
    }
  };

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
    setHomeCountry(location.address.country || searchQuery);
    setHomeLatitude(location.lat);
    setHomeLongitude(location.lon);
    setSuggestions([]);
    setSearchQuery('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Ensure required fields are present
    if (!name.trim() || !placeId.trim() || !homeCountry.trim() || !homeLatitude.toString().trim() || !homeLongitude.toString().trim()) {
      setError('Please fill all required fields (Name, Where did you meet?, and select a home country from suggestions to autofill Latitude/Longitude).');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const { error: insertError } = await supabase.from('people').insert([
        {
          user_id: user.id,
          place_id: placeId,
          name,
          home_country: homeCountry,
          home_latitude: homeLatitude ? parseFloat(homeLatitude) : null,
          home_longitude: homeLongitude ? parseFloat(homeLongitude) : null,
          description,
          instagram_handle: instagramHandle || null,
          photo_url: photoUrl || null,
        },
      ]);

      if (insertError) throw insertError;

      onPersonAdded();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add person');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div className="flex items-center">
            <User className="w-6 h-6 text-blue-500 mr-3" />
            <h2 className="text-2xl font-bold text-gray-800">Add Person</h2>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g., Leo"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Where did you meet? *
            </label>
            <select
              value={placeId}
              onChange={(e) => setPlaceId(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">Select a place...</option>
              {places.map((place) => (
                <option key={place.id} value={place.id}>
                  {place.name}, {place.country}
                </option>
              ))}
            </select>
            {places.length === 0 && (
              <p className="text-sm text-gray-500 mt-1">
                You need to add a place first!
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Home Country
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchLocation())}
                placeholder="Search for their home country..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              <button
                type="button"
                onClick={searchLocation}
                disabled={searching}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
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
              Home Country *
            </label>
            <input
              type="text"
              value={homeCountry}
              onChange={(e) => setHomeCountry(e.target.value)}
              required
              disabled
              placeholder="e.g., France"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 disabled:opacity-90"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Home Latitude *
              </label>
              <input
                type="number"
                step="any"
                value={homeLatitude}
                onChange={(e) => setHomeLatitude(e.target.value)}
                disabled
                placeholder="48.8566"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 disabled:opacity-90"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Home Longitude *
              </label>
              <input
                type="number"
                step="any"
                value={homeLongitude}
                onChange={(e) => setHomeLongitude(e.target.value)}
                disabled
                placeholder="2.3522"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 disabled:opacity-90"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Instagram Handle
            </label>
            <input
              type="text"
              value={instagramHandle}
              onChange={(e) => setInstagramHandle(e.target.value)}
              placeholder="@username"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description / Notes
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="How did you meet? Share your story..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
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
              disabled={
                loading ||
                places.length === 0 ||
                !name.trim() ||
                !placeId.trim() ||
                !homeCountry.trim() ||
                !homeLatitude.toString().trim() ||
                !homeLongitude.toString().trim()
              }
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Person'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
