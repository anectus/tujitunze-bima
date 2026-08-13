import Link from "next/link";

import StatusBadge from "@/components/common/StatusBadge";
import { CLAIM_STATUS, COVERAGE_STATUS } from "@/constants/statuses";

type ClaimStatusKey = keyof typeof CLAIM_STATUS;
type CoverageStatusKey = keyof typeof COVERAGE_STATUS;

interface InsuranceClaim {
  id: string;
  date: string;
  hospital: string;
  amount: number;
  status: ClaimStatusKey;
}

// Sample data — backend/src/modules/{healthcare-verifications,policies}
// are still empty stubs with no real endpoints. Swap this for a fetch
// against the live claims endpoint once it exists; the status column
// already reads from the same CLAIM_STATUS reference the API will use.
const SAMPLE_CLAIMS: InsuranceClaim[] = [
  {
    id: "CLM-3021",
    date: "2026-08-09",
    hospital: "Muhimbili National Hospital",
    amount: 120000,
    status: "approved",
  },
  {
    id: "CLM-3019",
    date: "2026-08-06",
    hospital: "Aga Khan Hospital",
    amount: 85000,
    status: "under_review",
  },
  {
    id: "CLM-3014",
    date: "2026-07-29",
    hospital: "Regency Medical Centre",
    amount: 45000,
    status: "submitted",
  },
  {
    id: "CLM-3008",
    date: "2026-07-20",
    hospital: "Mbeya Zonal Referral Hospital",
    amount: 62000,
    status: "rejected",
  },
];

const SAMPLE_COVERAGE_STATUS: CoverageStatusKey = "active";

function formatTsh(amount: number) {
  return `TSh ${amount.toLocaleString("en-TZ")}`;
}

export default function InsuranceClaimsPage() {
  return (
    <div className="min-h-screen bg-white py-12 px-4">

      <div className="max-w-4xl mx-auto">

        <Link
          href="/dashboard"
          className="text-sm font-medium text-blue-700 hover:text-blue-800"
        >
          ← Back to Dashboard
        </Link>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">

          <h1 className="text-3xl font-bold text-gray-900">
            Insurance Claims
          </h1>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            Coverage:
            <StatusBadge domain="coverage" status={SAMPLE_COVERAGE_STATUS} />
          </div>

        </div>

        <p className="mt-2 text-sm text-gray-500">
          Showing sample data — live claims will appear here once the
          claims service is connected.
        </p>

        <div className="mt-8 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-md">

          <table className="w-full text-left text-sm">

            <thead className="bg-white text-xs uppercase text-gray-500">
              <tr>
                <th className="px-6 py-3 font-semibold">Date</th>
                <th className="px-6 py-3 font-semibold">Hospital</th>
                <th className="px-6 py-3 font-semibold">Amount</th>
                <th className="px-6 py-3 font-semibold">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">

              {SAMPLE_CLAIMS.map((claim) => (

                <tr key={claim.id}>

                  <td className="px-6 py-4 text-gray-600">
                    {claim.date}
                  </td>

                  <td className="px-6 py-4 text-gray-900">
                    {claim.hospital}
                  </td>

                  <td className="px-6 py-4 font-semibold text-gray-900">
                    {formatTsh(claim.amount)}
                  </td>

                  <td className="px-6 py-4">
                    <StatusBadge domain="claim" status={claim.status} />
                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}
