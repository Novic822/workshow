import Nav from "./Nav.tsx";
import { useDebounce } from "../hooks/useDebounce";
import { useState } from "react";
import useUserSuggestions from "../hooks/useUserSuggestions";
import SuggestionList from "./SuggestionList";
import WorldMap from "./WorldMap";
import { supabase, Place, Person } from "../lib/supabase";

export default function FriendPage() {

    const [query, setQuery] = useState("");
    const debouncedQuery = useDebounce(query, 400);
    const { results, isFetching, creatingRequests, sentRequests, incomingRequests, friends, sendFriendRequest, acceptFriendRequest, declineFriendRequest } = useUserSuggestions(debouncedQuery);

    const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
    const [mapPlaces, setMapPlaces] = useState<Place[]>([]);
    const [mapPeople, setMapPeople] = useState<Person[]>([]);
    const [isLoadingMap, setIsLoadingMap] = useState(false);

    const loadFriendMap = async (friendId: string | null) => {
        if (!friendId) {
            setMapPlaces([]);
            setMapPeople([]);
            setIsLoadingMap(false);
            return;
        }

        setIsLoadingMap(true);
        try {
            const { data: places, error: pErr } = await supabase
                .from('places')
                .select('id,user_id,name,country,latitude,longitude,description,photo_url')
                .eq('user_id', friendId);

            if (pErr) {
                console.error('Error loading places for friend:', pErr);
                setMapPlaces([]);
            } else {
                setMapPlaces((places ?? []) as Place[]);
            }

            // load people for friend and include their place (if any)
            const { data: ppl, error: pe } = await supabase
                .from('people')
                .select('id,user_id,place_id,name,home_country,home_latitude,home_longitude,description,instagram_handle,photo_url,created_at,updated_at, place:places(id,name,country,latitude,longitude,photo_url,description)')
                .eq('user_id', friendId);

            if (pe) {
                console.error('Error loading people for friend:', pe);
                setMapPeople([]);
            } else {
                const mapped = (ppl ?? []).map((p: any) => {
                    const rawPlace = Array.isArray(p.place) ? p.place[0] : p.place;
                    const placeObj = rawPlace
                        ? {
                              id: rawPlace.id,
                              user_id: rawPlace.user_id ?? '',
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
                        user_id: p.user_id,
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
                });
                setMapPeople(mapped);
            }
        } catch (err) {
            console.error('Unexpected error loading friend map data:', err);
            setMapPlaces([]);
            setMapPeople([]);
        } finally {
            setIsLoadingMap(false);
        }
    };

    const selectFriend = (friendId: string) => {
        if (selectedFriendId === friendId) {
            // toggle off
            setSelectedFriendId(null);
            loadFriendMap(null);
            return;
        }
        setSelectedFriendId(friendId);
        loadFriendMap(friendId);
    };

    // Suggestions logic handled by useUserSuggestions hook

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-cyan-50">
            <Nav></Nav>
            <div className="p-6 flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* LEFT SIDE */}
                <div className="flex-1 space-y-6">

                    {/* Find a Mate */}
                    <div className="bg-white p-5 rounded-xl shadow-sm">
                        <h2 className="text-gray-800 font-semibold mb-3">Find a Mate</h2>
                        <div className="relative">
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search by username..."
                                className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                            />
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              🔍
            </span>
                        </div>
                    </div>

                    {/* Map for selected friend (under search input) */}
                    <div className="mt-4">
                        {selectedFriendId && query.trim() === '' ? (
                            <div className="bg-white p-3 rounded-xl shadow-sm h-64 sm:h-80 lg:h-96">
                                {isLoadingMap ? (
                                    <div className="flex items-center justify-center h-full">Loading map…</div>
                                ) : (
                                    <WorldMap places={mapPlaces} people={mapPeople} />
                                )}
                            </div>
                        ) : null}
                    </div>

                    {/* Friend Suggestions */}
                    <SuggestionList
                        query={query}
                        results={results}
                        isFetching={isFetching}
                        creatingRequests={creatingRequests}
                        sentRequests={sentRequests}
                        sendFriendRequest={sendFriendRequest}
                        acceptFriendRequest={acceptFriendRequest}
                    />
                </div>

                {/* RIGHT SIDE - My Mates */}
                <div className="w-full lg:w-80">
                    <div className="w-full bg-white p-5 rounded-xl shadow-sm mb-4">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <h2 className="text-gray-800 font-semibold">My Mates</h2>
                                <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {friends.length}
                  </span>
                            </div>
                            <div className="space-y-4">
                                {friends.length === 0 ? (
                                    <div className="text-sm text-gray-500">You have no mates yet</div>
                                ) : (
                                    friends.map((f) => {
                                        const id = String(f.id ?? f.username ?? '');
                                        const active = selectedFriendId === id;
                                        return (
                                            <div
                                                key={id}
                                                onClick={() => selectFriend(id)}
                                                className={`flex items-center gap-3 cursor-pointer p-2 rounded ${active ? 'ring-2 ring-teal-300 bg-teal-50' : 'hover:bg-gray-50'}`}
                                            >
                                                <img
                                                    src={`https://api.dicebear.com/6.x/identicon/svg?seed=${id}`}
                                                    className="w-10 h-10 rounded-full object-cover"
                                                    alt=""
                                                />
                                                <div>
                                                    <p className="font-semibold text-gray-800">{f.display_name ?? f.username}</p>
                                                    <p className="text-xs text-gray-500">{f.bio ? f.bio : 'Friend'}</p>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="w-full bg-white p-5 rounded-xl shadow-sm">
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <h2 className="text-gray-800 font-semibold">Friend Requests</h2>
                                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {incomingRequests.length}
                </span>
                            </div>
                            <div className="space-y-4">
                                {incomingRequests.length === 0 ? (
                                    <div className="text-sm text-gray-500">No incoming requests</div>
                                ) : (
                                    incomingRequests.map((req) => {
                                        const key = String(req.request_id ?? req.id ?? req.username ?? '');
                                        const senderId = String(req.id ?? '');
                                        const isCreating = creatingRequests.has(senderId);
                                        return (
                                            <div key={key} className="bg-blue-50 flex items-center justify-between rounded-xl p-4">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={`https://api.dicebear.com/6.x/identicon/svg?seed=${senderId}`}
                                                        className="w-12 h-12 rounded-full object-cover"
                                                        alt="avatar"
                                                    />
                                                    <div>
                                                        <p className="font-semibold text-gray-800">{req.display_name ?? req.username}</p>
                                                        <p className="text-xs text-gray-500">{req.bio ?? ''}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={() => acceptFriendRequest(senderId)}
                                                        disabled={isCreating}
                                                        className="bg-green-500 hover:bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-60"
                                                        title="Accept"
                                                    >
                                                        {isCreating ? '…' : '✓'}
                                                    </button>
                                                    <button
                                                        onClick={() => declineFriendRequest(String(req.request_id), senderId)}
                                                        disabled={isCreating}
                                                        className="bg-red-500 hover:bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-60"
                                                        title="Decline"
                                                    >
                                                        {isCreating ? '…' : '✕'}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}