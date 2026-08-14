interface StatisticCardProps {
  label: string;
  value: string | number;
  hint?: string;
}

export default function StatisticCard({ label, value, hint }: StatisticCardProps) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md">

      <p className="text-sm font-medium text-gray-500">{label}</p>

      <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>

      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}

    </div>
  );
}
