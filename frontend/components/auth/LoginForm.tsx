
"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginForm() {
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });

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

      console.log("Login response:", data);

      // Later we will redirect the user to the dashboard here.
      // Example:
      // window.location.href = "/dashboard";

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
    <section className="min-h-screen bg-gray-50 py-25 px-6">

      <div className="max-w-md mx-auto">

        {/* Header */}
        <div className="text-center mb-8">

          <span className="inline-block bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
            Tujitunze
          </span>

          <h1 className="text-4xl font-bold text-gray-900">
            Welcome Back
          </h1>

          <p className="mt-3 text-gray-600">
            Login to your Tujitunze account
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
            <div className="mb-6 rounded-lg bg-green-100 px-4 py-3 text-sm text-green-700">
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
                  focus:ring-green-600
                  focus:border-green-600
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
                  className="text-sm text-green-700 hover:text-green-800 hover:underline"
                >
                  Forgot password?
                </Link>

              </div>

              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                autoComplete="current-password"
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
                  focus:ring-green-600
                  focus:border-green-600
                  transition
                "
              />

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
                  text-green-700
                  focus:ring-green-600
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
                bg-green-700
                text-white
                py-3
                rounded-lg
                font-semibold
                hover:bg-green-800
                transition
                focus:outline-none
                focus:ring-2
                focus:ring-green-600
                focus:ring-offset-2
                disabled:opacity-60
                disabled:cursor-not-allowed
              "
            >
              {loading ? "Logging in..." : "Login"}
            </button>

          </form>

          {/* Register */}
          <div className="mt-8 text-center">

            <p className="text-sm text-gray-600">

              Don&apos;t have an account?{" "}

              <Link
                href="/register"
                className="font-semibold text-green-700 hover:text-green-800 hover:underline"
              >
                Become a member
              </Link>

            </p>

          </div>

        </div>

      </div>

    </section>
  );
}

