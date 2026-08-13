
"use client";

import { useState } from "react";

import { useAuth } from "@/lib/hooks/useAuth";
import { getAccessToken } from "@/lib/utils/permissions";

const CATEGORY_OPTIONS = [
  "General Enquiry",
  "Member Registration",
  "Health Wallet",
  "Hospital Verification",
  "Telecom Contributions",
  "Bank Integration",
  "Technical Support",
  "Complaint",
  "Partnership",
];

const inputClass =
  "w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-600 outline-none";

export default function Contact() {
  const { isAuthenticated, firstName } = useAuth();

  // Only relevant for a guest sender — a logged-in member's name/email
  // are resolved server-side from their verified account, they only
  // need to type the message itself.
  const [guestDetails, setGuestDetails] = useState({
    name: "",
    email: "",
    phone: "",
    nidaNumber: "",
  });

  const [form, setForm] = useState({
    category: "",
    subject: "",
    message: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGuestChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setGuestDetails((previous) => ({ ...previous, [name]: value }));
    setError("");
    setSuccess("");
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!isAuthenticated && (!guestDetails.name.trim() || !guestDetails.email.trim())) {
      setError("Name and email are required.");
      return;
    }

    try {
      setLoading(true);

      const token = getAccessToken();

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch("http://localhost:3002/contact", {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: isAuthenticated ? undefined : guestDetails.name,
          email: isAuthenticated ? undefined : guestDetails.email,
          phone: isAuthenticated ? undefined : guestDetails.phone || undefined,
          nidaNumber: isAuthenticated
            ? undefined
            : guestDetails.nidaNumber || undefined,
          category: form.category,
          subject: form.subject,
          message: form.message,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to send your message.");
      }

      setSuccess(data.message || "Your message has been sent.");
      setForm({ category: "", subject: "", message: "" });
      setGuestDetails({ name: "", email: "", phone: "", nidaNumber: "" });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to send your message."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-white pt-36 pb-20 px-12">

      <div className="max-w-7xl mx-auto px-6">

        {/* Page Heading */}
        <div className="text-center max-w-4xl mx-auto">

          <h1 className="text-5xl font-bold text-gray-900">
            Contact Tujitunze
          </h1>

          <p className="mt-6 text-lg text-gray-600 leading-8">
            Whether you are a member seeking healthcare support, a hospital
            verifying patient eligibility, a telecom operator integrating
            contribution services, a financial institution, or a development
            partner, the Health Savings and Insurance Management System (Tujitunze)
            team is ready to assist you.
          </p>

        </div>

        {/* Information Cards */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">

          <div className="bg-white rounded-2xl shadow-lg p-8">

            <div className="text-4xl mb-4">
              📍
            </div>

            <h3 className="text-2xl font-bold text-blue-700">
              Headquarters
            </h3>

            <p className="mt-4 text-gray-600 leading-7">
              Health Savings and Insurance Management System
              <br />
              Dar es Salaam
              <br />
              Tanzania
            </p>

          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8">

            <div className="text-4xl mb-4">
              🕒
            </div>

            <h3 className="text-2xl font-bold text-blue-700">
              Office Hours
            </h3>

            <p className="mt-4 text-gray-600">
              Monday – Friday
              <br />
              08:00 AM – 05:00 PM (EAT)
            </p>

            <p className="mt-4 text-gray-600">
              Emergency technical incidents are handled
              according to system support procedures.
            </p>

          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8">

            <div className="text-4xl mb-4">
              ⚡
            </div>

            <h3 className="text-2xl font-bold text-blue-700">
              Response Time
            </h3>

            <p className="mt-4 text-gray-600">
              General enquiries:
              <strong> 1–2 Business Days</strong>
            </p>

            <p className="mt-3 text-gray-600">
              Technical issues affecting healthcare services
              receive priority support.
            </p>

          </div>

        </div>

        {/* Main Content */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-20">

          {/* Contact Details */}

          <div className="bg-white rounded-2xl shadow-lg p-8">

            <h2 className="text-3xl font-bold text-blue-700 mb-8">
              Contact Information
            </h2>

            <div className="space-y-8">

              <div>

                <h3 className="font-semibold text-xl">
                  Address
                </h3>

                <p className="mt-2 text-gray-600">
                  Health Savings and Insurance Management System
                  <br />
                  Dar es Salaam
                  <br />
                  Tanzania
                </p>

              </div>

              <div>

                <h3 className="font-semibold text-xl">
                  General Support
                </h3>

                <p className="mt-2 text-gray-600">
                  support@Tujitunze.co.tz
                </p>

              </div>

              <div>

                <h3 className="font-semibold text-xl">
                  Technical Support
                </h3>

                <p className="mt-2 text-gray-600">
                  techsupport@Tujitunze.co.tz
                </p>

              </div>

              <div>

                <h3 className="font-semibold text-xl">
                  Healthcare Support
                </h3>

                <p className="mt-2 text-gray-600">
                  healthcare@Tujitunze.co.tz
                </p>

              </div>

              <div>

                <h3 className="font-semibold text-xl">
                  Telephone
                </h3>

                <p className="mt-2 text-gray-600">
                  +255 XXX XXX XXX
                </p>

              </div>

              <div>

                <h3 className="font-semibold text-xl">
                  We Support
                </h3>

                <ul className="mt-3 space-y-2 text-gray-600 list-disc list-inside">

                  <li>Member Registration</li>

                  <li>Health Wallet Assistance</li>

                  <li>Hospital Verification</li>

                  <li>Telecom Integration</li>

                  <li>Bank Integration</li>

                  <li>System Administration</li>

                  <li>Partnership & Collaboration</li>

                </ul>

              </div>

            </div>

          </div>

          {/* Contact Form */}

          <div className="bg-white rounded-2xl shadow-lg p-8">

            <h2 className="text-3xl font-bold text-blue-700 mb-8">
              Send Us a Message
            </h2>

            <p className="text-gray-600 mb-8">
              Complete the form below and the appropriate Tujitunze team
              will respond as soon as possible.
            </p>

            {isAuthenticated && (
              <div className="mb-6 rounded-lg bg-blue-100 px-4 py-3 text-sm text-blue-700">
                Sending as {firstName || "your account"} — we&apos;ll use the
                contact details already on your account, so you only need
                to write your message below.
              </div>
            )}

            {error && (
              <div className="mb-6 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-6 rounded-lg bg-blue-100 px-4 py-3 text-sm text-blue-700">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">

              {!isAuthenticated && (
                <>
                  <input
                    type="text"
                    name="name"
                    value={guestDetails.name}
                    onChange={handleGuestChange}
                    placeholder="Full Name *"
                    required
                    className={inputClass}
                  />

                  <input
                    type="text"
                    name="nidaNumber"
                    value={guestDetails.nidaNumber}
                    onChange={handleGuestChange}
                    placeholder="National ID (Optional)"
                    className={inputClass}
                  />

                  <input
                    type="email"
                    name="email"
                    value={guestDetails.email}
                    onChange={handleGuestChange}
                    placeholder="Email Address *"
                    required
                    className={inputClass}
                  />

                  <input
                    type="tel"
                    name="phone"
                    value={guestDetails.phone}
                    onChange={handleGuestChange}
                    placeholder="Phone Number (Optional)"
                    className={inputClass}
                  />
                </>
              )}

              <select
                name="category"
                value={form.category}
                onChange={handleFormChange}
                required
                className={inputClass}
              >
                <option value="" disabled>
                  Select Enquiry Category
                </option>
                {CATEGORY_OPTIONS.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              <input
                type="text"
                name="subject"
                value={form.subject}
                onChange={handleFormChange}
                placeholder="Subject *"
                required
                className={inputClass}
              />

              <textarea
                name="message"
                value={form.message}
                onChange={handleFormChange}
                rows={6}
                placeholder="Describe your enquiry..."
                required
                className={inputClass}
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-700 hover:bg-blue-800 text-white py-4 rounded-lg font-semibold transition duration-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Sending..." : "Submit Enquiry"}
              </button>

            </form>

          </div>

        </div>

      </div>

    </section>
  );
}
