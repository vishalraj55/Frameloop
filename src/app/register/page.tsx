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
  const [showPassword, setShowPassword] = useState(false);

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

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/create-profile`,
        {
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
        },
      );

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

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !loading) {
      handleRegister();
    }
  }

  return (
    <main className="py-40 flex mx-auto">
      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <div className="mb-10 lg:hidden text-center">
            <h1 className="font-serif text-[2.25rem] text-[#F2EFE9]">
              Frameloop
            </h1>
          </div>

          <h2 className="text-[#F2EFE9] text-xl font-medium mb-1">
            Create your account
          </h2>
          <p className="text-[#6B6862] text-sm mb-8">
            Start building your loop.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!loading) handleRegister();
            }}
            noValidate
          >
            <div className="mb-5">
              <label
                htmlFor="username"
                className="block text-xs text-[#8A867D] mb-1.5"
              >
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                placeholder="yourname"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                onKeyDown={handleKeyDown}
                className="w-full bg-transparent border-b border-[#2A2A2A] text-[#F2EFE9] placeholder:text-[#4A4842] text-sm px-0.5 py-2.5 outline-none transition-colors focus:border-[#C9A876]"
              />
            </div>

            <div className="mb-5">
              <label
                htmlFor="email"
                className="block text-xs text-[#8A867D] mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                onKeyDown={handleKeyDown}
                className="w-full bg-transparent border-b border-[#2A2A2A] text-[#F2EFE9] placeholder:text-[#4A4842] text-sm px-0.5 py-2.5 outline-none transition-colors focus:border-[#C9A876]"
              />
            </div>

            <div className="mb-7">
              <label
                htmlFor="password"
                className="block text-xs text-[#8A867D] mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="At least 6 characters"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  onKeyDown={handleKeyDown}
                  className="w-full bg-transparent border-b border-[#2A2A2A] text-[#F2EFE9] placeholder:text-[#4A4842] text-sm px-0.5 py-2.5 pr-8 outline-none transition-colors focus:border-[#C9A876]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-[#6B6862] hover:text-[#C9A876] transition-colors"
                >
                  {showPassword ? (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path d="M3 3l18 18" strokeLinecap="round" />
                      <path
                        d="M10.6 10.6a2 2 0 002.8 2.8"
                        strokeLinecap="round"
                      />
                      <path
                        d="M9.5 5.2A10.6 10.6 0 0112 5c5 0 9 4 10 7-.4 1.1-1.1 2.3-2.1 3.4M6.2 6.6C4.3 8 3 9.9 2 12c1 3 5 7 10 7 1.3 0 2.5-.2 3.6-.7"
                        strokeLinecap="round"
                      />
                    </svg>
                  ) : (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path
                        d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p role="alert" className="text-[#D9705A] text-xs mb-4">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#D4AF6A] hover:bg-[#E2BF7D] text-[#d4bba3] text-sm font-semibold py-2.5 mb-6 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? "Signing up..." : "Sign up"}
            </button>
          </form>

          <div className="text-[#6B6862] text-xs">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-[#C9A876] hover:text-[#D8BA8C] transition-colors"
            >
              Log in
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}