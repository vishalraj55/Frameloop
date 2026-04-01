'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface UserType {
  username: string;
  avatarUrl?: string;
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<UserType[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('http://localhost:3000/users');
        const data = await res.json() as UserType[];
        setUsers(data);
      } catch (err) {
        console.error('Failed to fetch users:', err);
      }
    };

    void fetchUsers();
  }, []);

  // compute filtered directly — no need for a second useEffect
  const filtered = users.filter((user) =>
    user.username.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <main className="bg-[#000000] min-h-screen text-white">
      <div className="mx-auto max-w-160 p-4">
        <input
          type="text"
          placeholder="Search users"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full border border-gray-300 px-3 py-2 text-[13px] mb-4 text-white"
        />

        <div className="bg-black border border-gray-300">
          {filtered.map((user) => (
            <Link
              key={user.username}
              href={`/profile/${user.username}`}
              className="block px-3 py-2 border-b border-gray-200 text-[13px]"
            >
              {user.username}
            </Link>
          ))}

          {filtered.length === 0 && (
            <div className="px-3 py-4 text-sm text-gray-100">
              No users found
            </div>
          )}
        </div>
      </div>
    </main>
  );
}