'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface UserType {
  username: string;
  avatarUrl?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function Avatar({ user }: { user: UserType }) {
  return (
    <div className="relative w-11 h-11 rounded-full overflow-hidden shrink-0">
      {user.avatarUrl ? (
        <Image
          src={user.avatarUrl}
          alt=""
          fill
          className="object-cover"
        />
      ) : (
        <div className="w-full h-full bg-linear-to-br from-neutral-700 to-neutral-600 flex items-center justify-center text-white text-sm font-semibold">
          {user.username[0]?.toUpperCase()}
        </div>
      )}
    </div>
  );
}

function UserRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 animate-pulse">
      <div className="w-11 h-11 rounded-full bg-neutral-800 shrink-0" />
      <div className="flex flex-col gap-1.5">
        <div className="h-3 w-28 rounded bg-neutral-800" />
        <div className="h-2.5 w-20 rounded bg-neutral-800" />
      </div>
    </div>
  );
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/users`);
        const data = (await res.json()) as UserType[];
        setUsers(data);
      } catch (err) {
        console.error('Failed to fetch users:', err);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const filtered = query.trim()
    ? users.filter((u) =>
        u.username.toLowerCase().includes(query.toLowerCase())
      )
    : users;

  const handleClear = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  return (
    <main className="bg-black min-h-screen text-white">
      <div className="max-w-lg mx-auto">

        {/* Search bar */}
        <div className="sticky top-0 z-10 bg-black px-4 pt-4 pb-3 border-b border-neutral-900">
          <div
            className={`flex items-center gap-2 bg-neutral-900 rounded-xl px-3 py-2.5 transition-all duration-200 ${
              focused ? 'ring-1 ring-neutral-600' : ''
            }`}
          >
            <svg className="w-4 h-4 text-neutral-500 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              placeholder="Search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              className="flex-1 bg-transparent text-white text-sm placeholder:text-neutral-500 outline-none"
            />
            {query && (
              <button onClick={handleClear} className="text-neutral-500 hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="pt-1">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <UserRowSkeleton key={i} />)
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-16 h-16 rounded-full border-2 border-neutral-800 flex items-center justify-center">
                <svg className="w-7 h-7 text-neutral-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75l-2.489-2.489m0 0a3.375 3.375 0 10-4.773-4.773 3.375 3.375 0 004.773 4.773zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-white text-sm font-semibold">No results for &quot;{query}&quot;</p>
              <p className="text-neutral-500 text-xs">Try searching for a different username</p>
            </div>
          ) : (
            filtered.map((user) => (
              <Link
                key={user.username}
                href={`/profile/${user.username}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-900/60 active:bg-neutral-900 transition-colors"
              >
                <Avatar user={user} />
                <div className="flex flex-col min-w-0">
                  <span className="text-white text-sm font-semibold truncate">
                    {user.username}
                  </span>
                  <span className="text-neutral-500 text-xs truncate">
                    {user.username}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>

      </div>
    </main>
  );
}