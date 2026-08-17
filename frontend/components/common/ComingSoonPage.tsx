import Link from "next/link";

interface ComingSoonPageProps {
  title: string;
  description: string;
  backHref?: string;
  backLabel?: string;
}

// Shared placeholder for member route-group folders that exist (see the
// route-group table in CLAUDE.md) but have no backend behind them yet —
// same honestly-labeled, not-pretending-to-be-live pattern already used by
// wallet/transactions and insurance/claims, just factored out since this
// page now covers a dozen folders instead of two.
export default function ComingSoonPage({
  title,
  description,
  backHref = "/dashboard",
  backLabel = "Back to Dashboard",
}: ComingSoonPageProps) {
  return (
    <div className="min-h-screen bg-white py-12 px-4">

      <div className="max-w-2xl mx-auto">

        <Link
          href={backHref}
          className="text-sm font-medium text-blue-700 hover:text-blue-800"
        >
          ← {backLabel}
        </Link>

        <h1 className="mt-4 text-3xl font-bold text-gray-900">
          {title}
        </h1>

        <div className="mt-8 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-10 text-center">

          <p className="text-gray-600">
            {description}
          </p>

          <p className="mt-3 text-sm font-semibold text-gray-400">
            Coming soon.
          </p>

        </div>

      </div>

    </div>
  );
}
