import { useState, useEffect } from 'react';
import { MapPin, Users, Globe, Plus, User as UserIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Place, Person } from '../lib/supabase';
import WorldMap from './WorldMap';
import AddPlaceModal from './AddPlaceModal';
import AddPersonModal from './AddPersonModal';
import Nav from './Nav.tsx'

export default function Dashboard() {
  const { user } = useAuth();
  const [places, setPlaces] = useState<Place[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [showAddPlace, setShowAddPlace] = useState(false);
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    setLoading(true);

    try {
      const [placesResult, peopleResult] = await Promise.all([
        supabase
            .from('places')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false }),

        supabase
            .from('people')
            .select('*, place:places(*)')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false }),
      ]);

      if (placesResult.error) throw placesResult.error;
      if (peopleResult.error) throw peopleResult.error;

      setPlaces(placesResult.data || []);
      setPeople(peopleResult.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };
  const uniqueCountries = new Set([ ...places.map((p) => p.country), ...people.map((p) => p.home_country), ]).size;

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-cyan-50">
      <Nav></Nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Places Visited</p>
                <p className="text-3xl font-bold text-teal-600 mt-2">{places.length}</p>
              </div>
              <div className="bg-teal-100 p-3 rounded-full">
                <MapPin className="w-8 h-8 text-teal-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">People Met</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{people.length}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Countries Covered</p>
                <p className="text-3xl font-bold text-cyan-600 mt-2">{uniqueCountries}</p>
              </div>
              <div className="bg-cyan-100 p-3 rounded-full">
                <Globe className="w-8 h-8 text-cyan-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setShowAddPlace(true)}
            className="flex items-center gap-2 px-6 py-3 bg-teal-500 text-white rounded-lg font-semibold hover:bg-teal-600 transition shadow-md hover:shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Add Place
          </button>
          <button
            onClick={() => setShowAddPerson(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition shadow-md hover:shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Add Person
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="h-[600px]">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto"></div>
                  <p className="text-gray-600 mt-4">Loading your map...</p>
                </div>
              </div>
            ) : places.length === 0 && people.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center max-w-md">
                  <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    Start Your Travel Journey
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Add your first place or person to begin visualizing your travel connections
                    on the map.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => setShowAddPlace(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg font-medium hover:bg-teal-600 transition"
                    >
                      <Plus className="w-4 h-4" />
                      Add Place
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <WorldMap places={places} people={people} />
            )}
          </div>
        </div>

        {(places.length > 0 || people.length > 0) && (
          <div className="grid md:grid-cols-2 gap-6 mt-8">
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <MapPin className="w-5 h-5 text-teal-500 mr-2" />
                Recent Places
              </h3>
              <div className="space-y-3">
                {places.slice(0, 5).map((place) => (
                  <div
                    key={place.id}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                  >
                    {place.photo_url ? (
                      <img
                        src={place.photo_url}
                        alt={place.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-teal-600" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 truncate">{place.name}</p>
                      <p className="text-sm text-gray-600">{place.country}</p>
                    </div>
                  </div>
                ))}
                {places.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No places yet</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <UserIcon className="w-5 h-5 text-blue-500 mr-2" />
                Recent Connections
              </h3>
              <div className="space-y-3">
                {people.slice(0, 5).map((person) => (
                  <div
                    key={person.id}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                  >
                    {person.photo_url ? (
                      <img
                        src={person.photo_url}
                        alt={person.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <UserIcon className="w-6 h-6 text-blue-600" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 truncate">{person.name}</p>
                      <p className="text-sm text-gray-600">From {person.home_country}</p>
                      {person.place && (
                        <p className="text-xs text-gray-500">Met in {person.place.name}</p>
                      )}
                    </div>
                  </div>
                ))}
                {people.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No connections yet</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {showAddPlace && (
        <AddPlaceModal
          onClose={() => setShowAddPlace(false)}
          onPlaceAdded={() => {
            loadData();
            setShowAddPlace(false);
          }}
        />
      )}

      {showAddPerson && (
        <AddPersonModal
          onClose={() => setShowAddPerson(false)}
          onPersonAdded={() => {
            loadData();
            setShowAddPerson(false);
          }}
        />
      )}
    </div>
  );
}
