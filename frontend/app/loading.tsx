export default function Loading() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

        <h2 className="text-xl font-semibold text-gray-800">
          Loading HSIMS...
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          Please wait a moment.
        </p>
      </div>
    </main>
  );
}
