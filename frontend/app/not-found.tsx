import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-md text-center">
        <p className="text-6xl font-bold text-blue-600">404</p>

        <h1 className="mt-4 text-3xl font-bold text-gray-900">
          Page Not Found
        </h1>

        <p className="mt-3 text-gray-600">
          Sorry, the page you are looking for does not exist.
        </p>

        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
        >
          Go Home
        </Link>
      </div>
    </main>
  );
}
