import React from 'react';
// ToastContainer moved to App-level for global usage
// import ToastContainer from './ToastContainer';
import { Profile } from '../lib/supabase';

interface Props {
  query: string;
  results: Partial<Profile>[];
  isFetching: boolean;
  creatingRequests: Set<string>;
  sentRequests: Map<string, 'requested' | 'friends' | 'incoming'>;
  sendFriendRequest: (toId: string) => Promise<void>;
  acceptFriendRequest: (fromId: string) => Promise<void>;
}

export default function SuggestionList({ query, results, isFetching, creatingRequests, sentRequests, sendFriendRequest, acceptFriendRequest, }: Props) {
  if (query.trim() === '') return null;

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-gray-800 font-semibold">Users</h2>
      </div>

      {results.length === 0 ? (
        !isFetching ? (
          <div className="text-sm text-gray-500">No users found</div>
        ) : null
      ) : (
        <div className="space-y-3">
          {results.map((r) => {
            const idKey = String(r.id ?? r.username ?? '');
            const isCreating = creatingRequests.has(idKey);
            const status = sentRequests.get(idKey);
            const disabled = isCreating || !!status;

            return (
              <div key={idKey} className="bg-blue-50 flex items-center justify-between rounded-xl p-4">
              <div className="flex items-center gap-3">
                <img
                  src={`https://api.dicebear.com/6.x/identicon/svg?seed=${idKey}`}
                  className="w-12 h-12 rounded-full object-cover"
                  alt="avatar"
                />
                <div>
                  <p className="font-semibold text-gray-800">{r.display_name ?? r.username}</p>
                  <p className="text-xs text-gray-500">{r.bio ?? ''}</p>
                </div>
              </div>

              <div className="flex items-center">
                {status === 'incoming' ? (
                  <button
                    onClick={() => acceptFriendRequest(idKey)}
                    disabled={isCreating}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full font-medium text-sm disabled:opacity-60 flex items-center gap-2"
                  >
                    {isCreating ? (
                      <svg className="animate-spin h-4 w-4 text-white inline-block mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                      </svg>
                    ) : null}
                    <span>{isCreating ? 'Accepting...' : 'Accept'}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => sendFriendRequest(idKey)}
                    disabled={disabled}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full font-medium text-sm disabled:opacity-60 flex items-center gap-2"
                  >
                    {isCreating ? (
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                      </svg>
                    ) : null}
                    <span>{isCreating ? 'Sending...' : 'Add'}</span>
                  </button>
                )}
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
