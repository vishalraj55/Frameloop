"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/firebase";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    setLoading(true);
    setError("");

    try {
      const { user } = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password,
      );

      await updateProfile(user, { displayName: form.username });

      const token = await user.getIdToken();

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/create-profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: user.uid,
          username: form.username,
          email: form.email,
        }),
      });

      if (!res.ok) {
        await user.delete();
        setError("Username may already be taken.");
        setLoading(false);
        return;
      }

      router.push("/feed");
    } catch (err) {
      if (err instanceof Error && "code" in err) {
        const code = (err as Error & { code: string }).code;
        if (code === "auth/email-already-in-use") {
          setError("Email already in use.");
        } else if (code === "auth/weak-password") {
          setError("Password must be at least 6 characters.");
        } else {
          setError("Something went wrong. Please try again.");
        }
      } else {
        setError("Something went wrong. Please try again.");
      }
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