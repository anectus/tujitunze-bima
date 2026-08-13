
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { formatNidaNumber, NIDA_FORMATTED_LENGTH } from "@/lib/utils/nida";

const inputClass =
  "w-full rounded-lg border border-gray-300 px-4 py-3 " +
  "text-gray-900 outline-none transition " +
  "focus:border-blue-700 focus:ring-2 focus:ring-blue-200";

export default function RegisterForm() {
  const router = useRouter();

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

  // NIDA number — the user only types digits; the dashes (8-5-5-2) are
  // inserted automatically as they type.
  const handleNidaChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((previousData) => ({
      ...previousData,
      nidaNumber: formatNidaNumber(e.target.value),
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

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

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
          data.message || "Sign up failed."
        );
      }

      setSuccess(
        "Account created. Redirecting you to login..."
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

      setTimeout(() => {
        router.push("/login");
      }, 1500);
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
    <div className="min-h-screen bg-white px-4 py-12">

      <div className="max-w-2xl mx-auto">

        {/* Minimal logo + title (no marketing navbar on the auth page) */}
        <div className="text-center mb-8">

          <Link
            href="/"
            className="text-2xl font-bold text-blue-700 tracking-tight"
          >
            Tujitunze
          </Link>

          <h1 className="mt-6 text-3xl font-bold text-gray-900">
            Sign Up
          </h1>

          <p className="mt-2 text-sm text-gray-600">
            Create your Tujitunze healthcare account
          </p>

        </div>

        {/* Sign Up Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 md:p-10">

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
                className={inputClass}
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
                className={inputClass}
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
                className={inputClass}
              />
            </div>

            {/* Phone Number — registration collects exactly one. Add more
                from your profile after signing up. */}
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
                className={inputClass}
              />

              <p className="mt-1 text-xs text-gray-500">
                You can add more phone numbers later from your profile.
              </p>
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
                inputMode="numeric"
                value={formData.nidaNumber}
                onChange={handleNidaChange}
                placeholder="20030707-35805-00002-26"
                maxLength={NIDA_FORMATTED_LENGTH}
                required
                className={inputClass}
              />

              <p className="mt-1 text-xs text-gray-500">
                Type only the digits — the dashes are added automatically.
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
                className={inputClass}
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
                className={inputClass}
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
                className={inputClass}
              />
            </div>

            {/* Terms */}
            <div className="flex items-start gap-3">

              <input
                id="terms"
                type="checkbox"
                required
                className="mt-1 h-4 w-4 rounded border-gray-300
                text-blue-700 focus:ring-blue-600"
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
              className="w-full rounded-lg bg-blue-700 px-6 py-3.5
              text-lg font-semibold text-white transition
              hover:bg-blue-800 disabled:cursor-not-allowed
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
                className="font-semibold text-blue-700
                hover:text-blue-800 hover:underline"
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
