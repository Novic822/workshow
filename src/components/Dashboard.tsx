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
            .from('user_people')
            .select('person:people(*, place:places(*))')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false }),
      ]);

      if (placesResult.error) throw placesResult.error;
      if (peopleResult.error) throw peopleResult.error;

      setPlaces(placesResult.data || []);

      const mappedPeople = (peopleResult.data || [])
        .map((row: any) => {
          const p = row.person;
          if (!p) return null;
          const rawPlace = Array.isArray(p.place) ? p.place[0] : p.place;
          const placeObj = rawPlace
            ? {
                id: rawPlace.id,
                user_id: rawPlace.user_id ?? user.id,
                name: rawPlace.name,
                country: rawPlace.country,
                latitude: rawPlace.latitude,
                longitude: rawPlace.longitude,
                description: rawPlace.description,
                photo_url: rawPlace.photo_url ?? null,
                created_at: rawPlace.created_at ?? '',
                updated_at: rawPlace.updated_at ?? '',
              }
            : undefined;

          return {
            id: p.id,
            user_id: user.id,
            place_id: p.place_id,
            name: p.name,
            home_country: p.home_country,
            home_latitude: p.home_latitude,
            home_longitude: p.home_longitude,
            description: p.description,
            instagram_handle: p.instagram_handle,
            photo_url: p.photo_url ?? null,
            created_at: p.created_at,
            updated_at: p.updated_at,
            place: placeObj,
          } as Person;
        })
        .filter(Boolean) as Person[];

      // Build "met with" names from encounters/participants (any encounter you are in)
      let metWithMap: Record<string, string[]> = {};
      const personIds = mappedPeople.map((p) => p.id);

      if (personIds.length > 0) {
        // Encounters you created
        const { data: createdEncounters, error: createdErr } = await supabase
          .from('encounters')
          .select('id, person_id')
          .in('person_id', personIds)
          .eq('created_by_user_id', user.id);

        // Encounters where you are a participant (even if not creator)
        const { data: participation, error: partFetchErr } = await supabase
          .from('encounter_participants')
          .select('encounter_id')
          .eq('user_id', user.id);

        const participantEncounterIds = participation?.map((p) => p.encounter_id) || [];

        const { data: participantEncounters, error: participantEncErr } = participantEncounterIds.length
          ? await supabase
              .from('encounters')
              .select('id, person_id')
              .in('person_id', personIds)
              .in('id', participantEncounterIds)
          : { data: [], error: null };

        if (!createdErr && !participantEncErr) {
          const encounters = [...(createdEncounters || []), ...(participantEncounters || [])];
          const encounterIds = encounters.map((e) => e.id);

          const { data: participants, error: partErr } = encounterIds.length
            ? await supabase
                .from('encounter_participants')
                .select('encounter_id, user_id')
                .in('encounter_id', encounterIds)
            : { data: [], error: null };

          if (!partErr && participants) {
            const participantUserIds = Array.from(new Set(participants.map((p) => p.user_id)));
            const { data: profiles, error: profErr } = participantUserIds.length
              ? await supabase
                  .from('profiles')
                  .select('id, display_name, username')
                  .in('id', participantUserIds)
              : { data: [], error: null };

            const profileMap = new Map<string, string>();
            if (!profErr && profiles) {
              profiles.forEach((pr: any) => {
                profileMap.set(pr.id, pr.display_name || pr.username || pr.id);
              });
            }

            encounters.forEach((enc) => {
              const names = participants
                .filter((p) => p.encounter_id === enc.id && p.user_id !== user.id)
                .map((p) => profileMap.get(p.user_id) || p.user_id);
              const uniqueNames = Array.from(new Set(names)).filter(Boolean) as string[];
              if (uniqueNames.length > 0) {
                metWithMap[enc.person_id] = uniqueNames;
              }
            });
          }
        }
      }

      const peopleWithMet = mappedPeople.map((p) => ({
        ...p,
        metWith: metWithMap[p.id] || [],
      }));

      setPeople(peopleWithMet as Person[]);
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
              <div className="space-y-3 max-h-[468px] overflow-y-auto">
                {places.map((place) => (
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
              <div className="space-y-3 max-h-[468px] overflow-y-auto">
                {people.map((person: Person & { metWith?: string[] }) => (
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
                      {person.description && (
                        <p className="text-sm text-gray-700 mt-1">{person.description}</p>
                      )}
                      {person.metWith && person.metWith.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1">Met with: {person.metWith.join(', ')}</p>
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
