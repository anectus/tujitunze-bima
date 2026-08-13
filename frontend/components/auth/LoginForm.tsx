
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ACCESS_TOKEN_STORAGE_KEY } from "@/lib/utils/permissions";

export default function LoginForm() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:3002/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            identifier: formData.identifier,
            password: formData.password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Invalid NIDA number, email, or password."
        );
      }

      setSuccess("Login successful.");

      localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, data.accessToken);

      router.push("/onboarding/mobile-money");

    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Unable to login. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center bg-white px-6 py-12">

      <div className="w-full max-w-md">

        {/* Minimal logo + title (no marketing navbar on the auth page) */}
        <div className="text-center mb-8">

          <Link
            href="/"
            className="text-2xl font-bold text-blue-700 tracking-tight"
          >
            Tujitunze
          </Link>

          <h1 className="mt-6 text-3xl font-bold text-gray-900">
            Login
          </h1>

          <p className="mt-2 text-sm text-gray-600">
            Enter your credentials to access your account
          </p>

        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">

          {/* Error */}
          {error && (
            <div className="mb-6 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="mb-6 rounded-lg bg-blue-100 px-4 py-3 text-sm text-blue-700">
              {success}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >

            {/* NIDA Number or Email */}
            <div>

              <label
                htmlFor="identifier"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Username
              </label>

              <input
                id="identifier"
                name="identifier"
                type="text"
                value={formData.identifier}
                onChange={handleChange}
                placeholder="Enter your NIDA number or email"
                autoComplete="username"
                required
                className="
                  w-full
                  px-4
                  py-3
                  border
                  border-gray-300
                  rounded-lg
                  text-gray-900
                  focus:outline-none
                  focus:ring-2
                  focus:ring-blue-600
                  focus:border-blue-600
                  transition
                "
              />

              <p className="mt-1 text-xs text-gray-500">
                Log in with your NIDA number or email address.
              </p>

            </div>

            {/* Password */}
            <div>

              <div className="flex items-center justify-between mb-2">

                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-gray-700"
                >
                  Password
                </label>

                <Link
                  href="/forgot-password"
                  className="text-sm text-blue-700 hover:text-blue-800 hover:underline"
                >
                  Forgot password?
                </Link>

              </div>

              <div className="relative">

                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  className="
                    w-full
                    px-4
                    py-3
                    pr-11
                    border
                    border-gray-300
                    rounded-lg
                    text-gray-900
                    focus:outline-none
                    focus:ring-2
                    focus:ring-blue-600
                    focus:border-blue-600
                    transition
                  "
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="
                    absolute
                    inset-y-0
                    right-0
                    flex
                    items-center
                    pr-3
                    text-gray-400
                    hover:text-gray-600
                    transition
                  "
                >

                  {showPassword ? (

                    // Eye-off icon
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
                      className="h-5 w-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
                      />
                    </svg>

                  ) : (

                    // Eye icon
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
                      className="h-5 w-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                      />
                    </svg>

                  )}

                </button>

              </div>

            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-3">

              <input
                id="rememberMe"
                type="checkbox"
                className="
                  h-4
                  w-4
                  rounded
                  border-gray-300
                  text-blue-700
                  focus:ring-blue-600
                "
              />

              <label
                htmlFor="rememberMe"
                className="text-sm text-gray-600"
              >
                Remember me
              </label>

            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="
                w-full
                bg-blue-700
                text-white
                py-3
                rounded-lg
                font-semibold
                hover:bg-blue-800
                transition
                focus:outline-none
                focus:ring-2
                focus:ring-blue-600
                focus:ring-offset-2
                disabled:opacity-60
                disabled:cursor-not-allowed
              "
            >
              {loading ? "Logging in..." : "Login"}
            </button>

          </form>

          {/* Sign Up */}
          <div className="mt-8 text-center">

            <p className="text-sm text-gray-600">

              Don&apos;t have an account?{" "}

              <Link
                href="/register"
                className="font-semibold text-blue-700 hover:text-blue-800 hover:underline"
              >
                Sign Up
              </Link>

            </p>

          </div>

        </div>

      </div>

    </section>
  );
}
