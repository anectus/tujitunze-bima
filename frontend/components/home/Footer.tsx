import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-gray-300 px-9">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand Section */}
          <div>
            <Link href="/" className="text-3xl font-bold text-white">
              Tujitunze
            </Link>

            <p className="mt-4 text-sm leading-7 text-gray-400">
              Health Savings and Insurance Management System. A secure digital
              platform connecting members, healthcare providers, telecom
              networks, and financial institutions.
            </p>

            <div className="mt-6 flex gap-4">
              <span
                className="
                h-10 w-10
                rounded-full
                bg-green-700
                flex items-center justify-center
                text-white
                cursor-pointer
              "
              >
                f
              </span>

              <span
                className="
                h-10 w-10
                rounded-full
                bg-green-700
                flex items-center justify-center
                text-white
                cursor-pointer
              "
              >
                X
              </span>

              <span
                className="
                h-10 w-10
                rounded-full
                bg-green-700
                flex items-center justify-center
                text-white
                cursor-pointer
              "
              >
                in
              </span>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3
              className="
              text-white
              font-semibold
              text-lg
              mb-5
            "
            >
              Navigation
            </h3>

            <ul className="space-y-3">
              <li>
                <Link href="home" className="hover:text-green-400 transition">
                  Home
                </Link>
              </li>

              <li>
                <Link href="/about" className="hover:text-green-400 transition">
                  About Us
                </Link>
              </li>

              <li>
                <Link
                  href="/services"
                  className="hover:text-green-400 transition"
                >
                  Services
                </Link>
              </li>

              <li>
                <Link
                  href="/contact"
                  className="hover:text-green-400 transition"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Tujitunze Services */}
          <div>
            <h3
              className="
              text-white
              font-semibold
              text-lg
              mb-5
            "
            >
              Our Services
            </h3>

            <ul className="space-y-3 text-sm">
              <li>Health Savings Wallet</li>

              <li>Telecom Contributions</li>

              <li>NIDA Member Verification</li>

              <li>Hospital Authentication</li>

              <li>Bank Account Integration</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3
              className="
              text-white
              font-semibold
              text-lg
              mb-5
            "
            >
              Contact Information
            </h3>

            <ul className="space-y-4 text-sm">
              <li className="flex gap-3">
                <span>📧</span>

                <span>support@Tujitunze.com</span>
              </li>

              <li className="flex gap-3">
                <span>📞</span>

                <span>+255 XXX XXX XXX</span>
              </li>

              <li className="flex gap-3">
                <span>📍</span>

                <span>Tanzania</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div
        className="
        border-tr
        border-gray-800
      "
      >
        <div
          className="
          max-w-7xl
          mx-auto
          px-6
          py-5
          flex
          flex-col
          md:flex-row
          justify-between
          items-center
          gap-4
        "
        >
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Tujitunze. All rights reserved.
          </p>

          <div className="flex gap-6 text-sm">
            <Link href="/privacy-policy" className="hover:text-green-400">
              Privacy Policy
            </Link>

            <Link href="/terms" className="hover:text-green-400">
              Terms & Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
