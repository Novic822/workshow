import { useEffect, useState } from 'react';
import { supabase, Profile } from '../lib/supabase';
import { showToast } from '../lib/toast';
import { useAuth } from '../contexts/AuthContext';

export function useUserSuggestions(debouncedQuery: string) {
  const { user } = useAuth();
  const [results, setResults] = useState<Partial<Profile>[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [creatingRequests, setCreatingRequests] = useState<Set<string>>(new Set());
  const [sentRequests, setSentRequests] = useState<Map<string, 'requested' | 'friends' | 'incoming'>>(new Map());
  const [incomingRequests, setIncomingRequests] = useState<Array<Partial<Profile> & { request_id: string }>>([]);
  const [friends, setFriends] = useState<Array<Partial<Profile>>>([]);

  useEffect(() => {
    const searchUsers = async () => {
      if (!debouncedQuery.trim()) {
        setResults([]);
        setIsFetching(false);
        return;
      }

      setIsFetching(true);
      try {
        let queryBuilder = supabase
          .from('profiles')
          .select('id, display_name, username, bio')
          .ilike('username', `${debouncedQuery}%`)
          .limit(5);

        if (user?.id) queryBuilder = queryBuilder.neq('id', user.id);

        const { data, error } = await queryBuilder;
        if (error) throw error;
        setResults(data ?? []);
      } catch (err) {
        console.error('Error searching users:', err);
        setResults([]);
      } finally {
        setIsFetching(false);
      }
    };

    searchUsers();
  }, [debouncedQuery, user?.id]);

  // preload outgoing requests and friendships for current user so UI shows correct status
  useEffect(() => {
    const preload = async () => {
      if (!user?.id) return;
      try {
        // outgoing friend requests (from current user)
        const { data: outgoing, error: outErr } = await supabase
          .from('friend_requests')
          .select('to_user_id,status')
          .eq('from_user_id', user.id);

        if (outErr) {
          console.error('Error loading outgoing requests:', outErr);
        } else if (outgoing) {
          setSentRequests(prev => {
            const next = new Map(prev);
            for (const row of outgoing) {
              next.set(row.to_user_id, 'requested');
            }
            return next;
          });
        }

        // incoming requests (others -> current user)
        const { data: incoming, error: inErr } = await supabase
          .from('friend_requests')
          .select('id,from_user_id,status')
          .eq('to_user_id', user.id);

        if (inErr) console.error('Error loading incoming requests:', inErr);
        else if (incoming) {
          // mark statuses
          setSentRequests(prev => {
            const next = new Map(prev);
            for (const row of incoming) {
              next.set(row.from_user_id, 'incoming');
            }
            return next;
          });

          // fetch sender profiles for display
          const fromIds = incoming.map((r: any) => r.from_user_id).filter(Boolean);
          if (fromIds.length > 0) {
            const { data: profiles, error: profErr } = await supabase
              .from('profiles')
              .select('id,display_name,username,bio')
              .in('id', fromIds);

            if (profErr) console.error('Error loading sender profiles:', profErr);
            else if (profiles) {
              const mapped = profiles.map((p: any) => {
                const req = incoming.find((ir: any) => ir.from_user_id === p.id);
                return { ...p, request_id: req?.id };
              });
              setIncomingRequests(mapped);
            }
          } else {
            setIncomingRequests([]);
          }
        }

        // friendships
        const { data: frData, error: frErr } = await supabase
          .from('friendships')
          .select('user_id_1,user_id_2')
          .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`);

        if (frErr) console.error('Error loading friendships:', frErr);
        else if (frData) {
          setSentRequests(prev => {
            const next = new Map(prev);
            for (const f of frData) {
              const other = f.user_id_1 === user.id ? f.user_id_2 : f.user_id_1;
              next.set(other, 'friends');
            }
            return next;
          });

          // fetch friend profiles for display
          const friendIds = frData.map((f: any) => (f.user_id_1 === user.id ? f.user_id_2 : f.user_id_1)).filter(Boolean);
          if (friendIds.length > 0) {
            const { data: friendProfiles, error: profErr } = await supabase
              .from('profiles')
              .select('id,display_name,username,bio')
              .in('id', friendIds);

            if (profErr) console.error('Error loading friend profiles:', profErr);
            else if (friendProfiles) {
              setFriends(friendProfiles as Partial<Profile>[]);
            }
          } else {
            setFriends([]);
          }
        }
      } catch (err) {
        console.error('Error preloading requests/friends:', err);
      }
    };
    preload();
  }, [user?.id]);

  const acceptFriendRequest = async (fromId: string) => {
    if (!user?.id) return;
    setCreatingRequests(prev => {
      const next = new Set(prev);
      next.add(fromId);
      return next;
    });

    try {
      // find the incoming friend request
      const { data: reqs, error: rErr } = await supabase
        .from('friend_requests')
        .select('id,from_user_id,to_user_id')
        .eq('from_user_id', fromId)
        .eq('to_user_id', user.id)
        .limit(1);

      if (rErr) {
        console.error('Error finding incoming request:', rErr);
        showToast('error', 'Failed to accept request');
        return;
      }

      const req = reqs && reqs[0];
      // insert friendship
      const { error: insErr } = await supabase
        .from('friendships')
        .insert([{ user_id_1: user.id, user_id_2: fromId }]);

      if (insErr) {
        console.error('Error creating friendship:', insErr);
        showToast('error', 'Failed to accept request');
        return;
      }

      // remove the friend_request row
      if (req && req.id) {
        await supabase.from('friend_requests').delete().eq('id', req.id);
      }

      setSentRequests(prev => {
        const next = new Map(prev);
        next.set(fromId, 'friends');
        return next;
      });
      // remove from incomingRequests list if present
      const removed = incomingRequests.find(item => String(item.id) === String(fromId));
      setIncomingRequests(prev => prev.filter(item => String(item.id) !== String(fromId)));
      // add to friends list if we have the profile cached
      if (removed) {
        setFriends(prev => {
          // avoid duplicates
          if (prev.find(p => String(p.id) === String(removed.id))) return prev;
          return [...prev, { id: removed.id, display_name: removed.display_name, username: removed.username, bio: removed.bio }];
        });
      }
      showToast('success', 'Friend request accepted');
    } catch (err) {
      console.error('Unexpected error accepting friend request:', err);
      showToast('error', 'Failed to accept request');
    } finally {
      setCreatingRequests(prev => {
        const next = new Set(prev);
        next.delete(fromId);
        return next;
      });
    }
  };

  const declineFriendRequest = async (requestId: string, fromId?: string) => {
    if (!user?.id) return;
    // determine fromId if not provided
    let senderId = fromId;
    if (!senderId) {
      const found = incomingRequests.find(ir => ir.request_id === requestId);
      senderId = found?.id as string | undefined;
    }

    if (!requestId) return;
    if (senderId) {
      setCreatingRequests(prev => {
        const next = new Set(prev);
        next.add(String(senderId));
        return next;
      });
    }

    try {
      const { error } = await supabase.from('friend_requests').delete().eq('id', requestId);
      if (error) {
        console.error('Error declining request:', error);
        showToast('error', 'Failed to decline request');
      } else {
        // remove local state
        if (senderId) {
          setSentRequests(prev => {
            const next = new Map(prev);
            next.delete(String(senderId));
            return next;
          });
        }
        setIncomingRequests(prev => prev.filter(ir => ir.request_id !== requestId));
        showToast('success', 'Friend request declined');
      }
    } catch (err) {
      console.error('Unexpected error declining request:', err);
      showToast('error', 'Failed to decline request');
    } finally {
      if (senderId) {
        setCreatingRequests(prev => {
          const next = new Set(prev);
          next.delete(String(senderId));
          return next;
        });
      }
    }
  };

  const sendFriendRequest = async (toId: string) => {
    if (!user?.id) {
      console.error('User not signed in');
      return;
    }

    setCreatingRequests(prev => {
      const next = new Set(prev);
      next.add(toId);
      return next;
    });

    try {
      const { data: existingReq, error: reqError } = await supabase
        .from('friend_requests')
        .select('id,status,from_user_id')
        .or(
          `and(from_user_id.eq.${user.id},to_user_id.eq.${toId}),and(from_user_id.eq.${toId},to_user_id.eq.${user.id})`
        )
        .limit(1);

      if (reqError) {
        console.error('Error checking existing friend requests:', reqError);
      }

      if (existingReq && existingReq.length > 0) {
        const er = existingReq[0];
        if (er.from_user_id === user.id) {
          // outgoing already exists
          setSentRequests(prev => {
            const next = new Map(prev);
            next.set(toId, 'requested');
            return next;
          });
        } else {
          // incoming request exists — show accept state
          setSentRequests(prev => {
            const next = new Map(prev);
            next.set(toId, 'incoming');
            return next;
          });
        }
        return;
      }

      const { data: existingFriend, error: friendError } = await supabase
        .from('friendships')
        .select('id')
        .or(
          `and(user_id_1.eq.${user.id},user_id_2.eq.${toId}),and(user_id_1.eq.${toId},user_id_2.eq.${user.id})`
        )
        .limit(1);

      if (friendError) console.error('Error checking friendships:', friendError);

      if (existingFriend && existingFriend.length > 0) {
        setSentRequests(prev => {
          const next = new Map(prev);
          next.set(toId, 'friends');
          return next;
        });
        return;
      }

      const { error } = await supabase
        .from('friend_requests')
        .insert([{ from_user_id: user.id, to_user_id: toId, status: 'pending' }]);

      if (error) {
        console.error('Error creating friend request:', error);
        showToast('error', 'Failed to send friend request');
      } else {
        setSentRequests(prev => {
          const next = new Map(prev);
          next.set(toId, 'requested');
          return next;
        });
        showToast('success', 'Friend request sent');
      }
    } catch (err) {
      console.error('Unexpected error creating friend request:', err);
    } finally {
      setCreatingRequests(prev => {
        const next = new Set(prev);
        next.delete(toId);
        return next;
      });
    }
  };

  return {
    results,
    isFetching,
    creatingRequests,
    sentRequests,
    incomingRequests,
    friends,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
  } as const;
}

export default useUserSuggestions;
