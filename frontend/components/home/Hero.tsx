import Link from "next/link";

export default function Hero() {
  return (
    <section className="pt-32 pb-20 bg-gradient-to-br from-blue-50 via-white to-blue-100 px-12">

      <div className="max-w-7xl mx-auto px-6">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">


          {/* Left Side - Main Content */}
          <div>

            <span className="inline-block bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-5">
              Health Savings & Insurance Management System
            </span>


            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">

              Secure Your
              <span className="text-blue-700">
                {" "}Healthcare Future
              </span>

            </h1>


            <p className="mt-6 text-lg text-gray-600 leading-relaxed">

              Tujitunze is a digital healthcare financial platform that enables
              members to save healthcare funds, contribute through telecom
              networks, verify membership status, and access healthcare
              services securely.

            </p>


            {/* Buttons */}
            <div className="mt-8 flex flex-wrap gap-4">


              <Link
                href="/register"
                className="
                bg-blue-700
                text-white
                px-8
                py-3
                rounded-lg
                font-semibold
                hover:bg-blue-800
                transition"
              >
              Sign Up
              </Link>


              <Link
                href="/login"
                className="
                border-2
                border-blue-700
                text-blue-700
                px-8
                py-3
                rounded-lg
                font-semibold
                hover:bg-blue-700
                hover:text-white
                transition"
              >
                Login
              </Link>


            </div>


          </div>



          {/* Right Side - System Features Card */}
          <div className="relative">


            <div className="
              bg-white
              shadow-xl
              rounded-2xl
              p-8
              border
              border-gray-100
            ">


              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Why Choose Tujitunze?
              </h2>


              <div className="space-y-5">


                {/* Feature 1 */}
                <div className="flex items-start gap-4">

                  <div className="
                    bg-blue-100
                    text-blue-700
                    rounded-full
                    p-3
                  ">
                    💳
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Health Wallet
                    </h3>

                    <p className="text-gray-600 text-sm">
                      Save small amounts daily via mobile money — no bank
                      account needed. Built for the mtu wa kawaida.
                    </p>
                  </div>

                </div>



                {/* Feature 2 */}
                <div className="flex items-start gap-4">

                  <div className="
                    bg-blue-100
                    text-blue-700
                    rounded-full
                    p-3
                  ">
                    📱
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Telecom Contributions
                    </h3>

                    <p className="text-gray-600 text-sm">
                      Supports contributions through mobile networks.
                    </p>
                  </div>

                </div>




                {/* Feature 3 */}
                <div className="flex items-start gap-4">

                  <div className="
                    bg-blue-100
                    text-blue-700
                    rounded-full
                    p-3
                  ">
                    🏥
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Healthcare Verification
                    </h3>

                    <p className="text-gray-600 text-sm">
                      Hospitals verify active members before services.
                    </p>
                  </div>

                </div>




                {/* Feature 4 */}
                <div className="flex items-start gap-4">

                  <div className="
                    bg-blue-100
                    text-blue-700
                    rounded-full
                    p-3
                  ">
                    🏦
                  </div>

                  <div>

                    <h3 className="font-semibold text-gray-900">
                      Bank Integration
                    </h3>

                    <p className="text-gray-600 text-sm">
                      Connects securely with financial institutions.
                    </p>

                  </div>

                </div>



              </div>


            </div>


          </div>


        </div>

      </div>

    </section>
  );
}
