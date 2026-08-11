
"use client";

import { useState } from "react";
import Link from "next/link";

export default function RegisterForm() {
  const [formData, setFormData] = useState({
    firstName: "",
    secondName: "",
    surname: "",
    phoneNumber: "",
    nidaNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    // Check password
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // Check password length
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:3002/members/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            firstName: formData.firstName,
            secondName: formData.secondName || undefined,
            surname: formData.surname,
            phoneNumber: formData.phoneNumber,
            nidaNumber: formData.nidaNumber,
            email: formData.email || undefined,
            password: formData.password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Registration failed."
        );
      }

      setSuccess(
        "Registration successful. Your Tujitunze account has been created."
      );

      setFormData({
        firstName: "",
        secondName: "",
        surname: "",
        phoneNumber: "",
        nidaNumber: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">

      <div className="max-w-2xl mx-auto">

        {/* Back to Home */}
        <div className="mb-6">
          <Link
            href="/"
            className="text-green-700 font-medium hover:text-green-800"
          >
            ← Back to Home
          </Link>
        </div>

        {/* Registration Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 md:p-10">

          {/* Header */}
          <div className="text-center mb-8">

            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <span className="text-3xl">🏥</span>
            </div>

            <h1 className="text-3xl font-bold text-gray-900">
              Become a Member
            </h1>

            <p className="mt-2 text-gray-600">
              Create your Tujitunze healthcare account
            </p>

          </div>

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

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >

            {/* First Name */}
            <div>
              <label
                htmlFor="firstName"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                First Name
              </label>

              <input
                id="firstName"
                name="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Enter your first name"
                required
                autoComplete="given-name"
                className="w-full rounded-lg border border-gray-300 px-4 py-3
                text-gray-900 outline-none transition
                focus:border-green-700 focus:ring-2 focus:ring-green-200"
              />
            </div>

            {/* Second Name */}
            <div>
              <label
                htmlFor="secondName"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Second Name
                <span className="ml-2 text-xs font-normal text-gray-500">
                  (Optional)
                </span>
              </label>

              <input
                id="secondName"
                name="secondName"
                type="text"
                value={formData.secondName}
                onChange={handleChange}
                placeholder="Enter your second name"
                autoComplete="additional-name"
                className="w-full rounded-lg border border-gray-300 px-4 py-3
                text-gray-900 outline-none transition
                focus:border-green-700 focus:ring-2 focus:ring-green-200"
              />
            </div>

            {/* Surname */}
            <div>
              <label
                htmlFor="surname"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Surname
              </label>

              <input
                id="surname"
                name="surname"
                type="text"
                value={formData.surname}
                onChange={handleChange}
                placeholder="Enter your surname"
                required
                autoComplete="family-name"
                className="w-full rounded-lg border border-gray-300 px-4 py-3
                text-gray-900 outline-none transition
                focus:border-green-700 focus:ring-2 focus:ring-green-200"
              />
            </div>

            {/* Phone */}
            <div>
              <label
                htmlFor="phoneNumber"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Phone Number
              </label>

              <input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="0626881149"
                required
                autoComplete="tel"
                className="w-full rounded-lg border border-gray-300 px-4 py-3
                text-gray-900 outline-none transition
                focus:border-green-700 focus:ring-2 focus:ring-green-200"
              />
            </div>

            {/* NIDA */}
            <div>
              <label
                htmlFor="nidaNumber"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                NIDA Number
              </label>

              <input
                id="nidaNumber"
                name="nidaNumber"
                type="text"
                value={formData.nidaNumber}
                onChange={handleChange}
                placeholder="Enter your NIDA number"
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3
                text-gray-900 outline-none transition
                focus:border-green-700 focus:ring-2 focus:ring-green-200"
              />

              <p className="mt-1 text-xs text-gray-500">
                Used to verify your identity.
              </p>
            </div>

            {/* Email - Optional */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Email Address
                <span className="ml-2 text-xs font-normal text-gray-500">
                  (Optional)
                </span>
              </label>

              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="example@email.com"
                autoComplete="email"
                className="w-full rounded-lg border border-gray-300 px-4 py-3
                text-gray-900 outline-none transition
                focus:border-green-700 focus:ring-2 focus:ring-green-200"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Password
              </label>

              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password"
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full rounded-lg border border-gray-300 px-4 py-3
                text-gray-900 outline-none transition
                focus:border-green-700 focus:ring-2 focus:ring-green-200"
              />

              <p className="mt-1 text-xs text-gray-500">
                Minimum 8 characters.
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Confirm Password
              </label>

              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full rounded-lg border border-gray-300 px-4 py-3
                text-gray-900 outline-none transition
                focus:border-green-700 focus:ring-2 focus:ring-green-200"
              />
            </div>

            {/* Terms */}
            <div className="flex items-start gap-3">

              <input
                id="terms"
                type="checkbox"
                required
                className="mt-1 h-4 w-4 rounded border-gray-300
                text-green-700 focus:ring-green-600"
              />

              <label
                htmlFor="terms"
                className="text-sm leading-5 text-gray-600"
              >
                I agree to the Tujitunze terms and conditions and confirm
                that the information provided is accurate.
              </label>

            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-green-700 px-6 py-3.5
              text-lg font-semibold text-white transition
              hover:bg-green-800 disabled:cursor-not-allowed
              disabled:opacity-60"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>

          </form>

          {/* Login */}
          <div className="mt-8 text-center">

            <p className="text-sm text-gray-600">
              Already have an account?{" "}

              <Link
                href="/login"
                className="font-semibold text-green-700
                hover:text-green-800 hover:underline"
              >
                Login
              </Link>

            </p>

          </div>

        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          © 2026 Tujitunze. Health Savings & Insurance Management System.
        </p>

      </div>

    </div>
  );
}

