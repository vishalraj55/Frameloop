"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { useTheme, THEME_COLORS } from "@/context/ThemeContext";

export default function LoginPage() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const c = THEME_COLORS[resolvedTheme];

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin() {
    setLoading(true);
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/feed");
    } catch (err: unknown) {
      const firebaseError = err as { code?: string };
      if (
        firebaseError.code === "auth/user-not-found" ||
        firebaseError.code === "auth/wrong-password" ||
        firebaseError.code === "auth/invalid-credential"
      ) {
        setError("Invalid email or password");
      } else {
        setError("Something went wrong. Please try again.");
      }
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !loading) {
      handleLogin();
    }
  }

  return (
    <main
      className="mx-auto h-full flex items-center justify-center px-4 py-70"
      style={{ background: c.bg, color: c.text }}
    >
      <div className="relative w-full max-w-88">
        <div className="text-center mb-10">
          <h1
            className="font-serif text-[2.25rem] leading-none"
            style={{ color: c.text }}
          >
            Frameloop
          </h1>
          <p className="text-sm mt-3" style={{ color: c.textMuted }}>
            Welcome back
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!loading) handleLogin();
          }}
          noValidate
        >
          <div className="mb-5">
            <label
              htmlFor="email"
              className="block text-xs mb-1.5"
              style={{ color: c.textMuted }}
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent border-b text-sm px-0.5 py-2.5 outline-none transition-colors"
              style={{ borderColor: c.border, color: c.text }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#C9A876")}
              onBlur={(e) => (e.currentTarget.style.borderColor = c.border)}
            />
          </div>

          <div className="mb-2">
            <label
              htmlFor="password"
              className="block text-xs mb-1.5"
              style={{ color: c.textMuted }}
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full bg-transparent border-b text-sm px-0.5 py-2.5 pr-8 outline-none transition-colors"
                style={{ borderColor: c.border, color: c.text }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#C9A876")}
                onBlur={(e) => (e.currentTarget.style.borderColor = c.border)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-0 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: c.textMuted }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#C9A876")}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = c.textMuted)
                }
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

          <div className="text-right mb-6">
            <Link
              href="/forgot-password"
              className="text-xs transition-colors"
              style={{ color: c.textMuted }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#C9A876")}
              onMouseLeave={(e) => (e.currentTarget.style.color = c.textMuted)}
            >
              Forgot password?
            </Link>
          </div>

          {error && (
            <p
              role="alert"
              className="text-xs mb-4"
              style={{ color: "#D9705A" }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#C9A876] hover:bg-[#D8BA8C] text-sm font-semibold py-2.5 mb-6 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <div className="text-center text-xs" style={{ color: c.textMuted }}>
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="text-[#C9A876] hover:text-[#D8BA8C] transition-colors"
          >
            Sign up
          </Link>
        </div>
      </div>
    </main>
  );
}