import Link from "next/link";

import StatusBadge from "@/components/common/StatusBadge";
import { TRANSACTION_STATUS } from "@/constants/statuses";

type TransactionStatusKey = keyof typeof TRANSACTION_STATUS;

interface WalletTransaction {
  id: string;
  date: string;
  description: string;
  type: "Deposit" | "Withdrawal" | "Transfer";
  amount: number;
  status: TransactionStatusKey;
}

// Sample data — backend/src/modules/wallet-transactions is still an empty
// stub with no real endpoint. Swap this for a fetch against the live
// endpoint once it exists; the status column already reads from the same
// TRANSACTION_STATUS reference the API values will use.
const SAMPLE_TRANSACTIONS: WalletTransaction[] = [
  {
    id: "TXN-10245",
    date: "2026-08-10",
    description: "Vodacom M-Pesa top up",
    type: "Deposit",
    amount: 50000,
    status: "completed",
  },
  {
    id: "TXN-10241",
    date: "2026-08-08",
    description: "Hospital co-payment — Muhimbili",
    type: "Withdrawal",
    amount: 15000,
    status: "pending",
  },
  {
    id: "TXN-10236",
    date: "2026-08-05",
    description: "Transfer to bank account",
    type: "Transfer",
    amount: 30000,
    status: "failed",
  },
  {
    id: "TXN-10229",
    date: "2026-08-01",
    description: "CRDB Bank top up",
    type: "Deposit",
    amount: 100000,
    status: "reversed",
  },
];

function formatTsh(amount: number) {
  return `TSh ${amount.toLocaleString("en-TZ")}`;
}

export default function WalletTransactionsPage() {
  return (
    <div className="min-h-screen bg-white py-12 px-4">

      <div className="max-w-4xl mx-auto">

        <Link
          href="/dashboard"
          className="text-sm font-medium text-blue-700 hover:text-blue-800"
        >
          ← Back to Dashboard
        </Link>

        <div className="mt-4 flex items-center justify-between">

          <h1 className="text-3xl font-bold text-gray-900">
            Wallet Transactions
          </h1>

        </div>

        <p className="mt-2 text-sm text-gray-500">
          Showing sample data — live transaction history will appear here
          once the wallet service is connected.
        </p>

        <div className="mt-8 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-md">

          <table className="w-full text-left text-sm">

            <thead className="bg-white text-xs uppercase text-gray-500">
              <tr>
                <th className="px-6 py-3 font-semibold">Date</th>
                <th className="px-6 py-3 font-semibold">Description</th>
                <th className="px-6 py-3 font-semibold">Type</th>
                <th className="px-6 py-3 font-semibold">Amount</th>
                <th className="px-6 py-3 font-semibold">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">

              {SAMPLE_TRANSACTIONS.map((transaction) => (

                <tr key={transaction.id}>

                  <td className="px-6 py-4 text-gray-600">
                    {transaction.date}
                  </td>

                  <td className="px-6 py-4 text-gray-900">
                    {transaction.description}
                  </td>

                  <td className="px-6 py-4 text-gray-600">
                    {transaction.type}
                  </td>

                  <td className="px-6 py-4 font-semibold text-gray-900">
                    {formatTsh(transaction.amount)}
                  </td>

                  <td className="px-6 py-4">
                    <StatusBadge domain="transaction" status={transaction.status} />
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
