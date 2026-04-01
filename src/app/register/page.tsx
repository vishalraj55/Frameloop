"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:3000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      console.log("Status:", res.status);
      const data = await res.json();
      console.log("Response:", data);

      if (!res.ok) {
        setError("Registration failed. Username or email may already exist.");
        setLoading(false);
        return;
      }

      router.push("/login");
    } catch (err) {
      console.error("Error:", err);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-sm border border-gray-800 bg-black p-10">
        <h1 className="text-white text-center text-3xl font-bold mb-8 tracking-wider">
          Frameloop
        </h1>

        <input
          type="text"
          placeholder="Username"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          className="w-full bg-gray-900 border border-gray-700 text-white text-sm px-3 py-2 mb-2 outline-none"
        />

        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full bg-gray-900 border border-gray-700 text-white text-sm px-3 py-2 mb-2 outline-none"
        />

        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full bg-gray-900 border border-gray-700 text-white text-sm px-3 py-2 mb-4 outline-none"
        />

        {error && (
          <p className="text-red-500 text-xs mb-3 text-center">{error}</p>
        )}

        <button
          onClick={handleRegister}
          disabled={loading}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold py-2 mb-4 disabled:opacity-50"
        >
          {loading ? "Signing up..." : "Sign up"}
        </button>

        <div className="text-center text-gray-500 text-xs">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-400">
            Log in
          </Link>
        </div>
      </div>
    </main>
  );
}