import Link from "next/link";

import Header from "@/components/home/Header";
import Footer from "@/components/home/Footer";

export default function AccessDeniedPage() {
  return (
    <>
      <Header />

      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-md mx-auto text-center">

          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <span className="text-3xl">🚫</span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900">
            Access Denied
          </h1>

          <p className="mt-2 text-gray-600">
            Your account does not have permission to view this page.
          </p>

          <Link
            href="/login"
            className="mt-8 inline-block rounded-lg bg-green-700 px-6 py-3
            font-semibold text-white transition hover:bg-green-800"
          >
            Back to Login
          </Link>

        </div>
      </div>

      <Footer />
    </>
  );
}
