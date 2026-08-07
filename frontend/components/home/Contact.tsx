export default function Contact() {
  return (
    <section className="bg-gray-50 pt-36 pb-20 px-12">

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

            <h3 className="text-2xl font-bold text-green-700">
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

            <h3 className="text-2xl font-bold text-green-700">
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

            <h3 className="text-2xl font-bold text-green-700">
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

            <h2 className="text-3xl font-bold text-green-700 mb-8">
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

            <h2 className="text-3xl font-bold text-green-700 mb-8">
              Send Us a Message
            </h2>

            <p className="text-gray-600 mb-8">
              Complete the form below and the appropriate Tujitunze team
              will respond as soon as possible.
            </p>

            <form className="space-y-6">

              <input
                type="text"
                placeholder="Full Name *"
                className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-600 outline-none"
              />

              <input
                type="text"
                placeholder="National ID (Optional)"
                className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-600 outline-none"
              />

              <input
                type="email"
                placeholder="Email Address *"
                className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-600 outline-none"
              />

              <input
                type="tel"
                placeholder="Phone Number *"
                className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-600 outline-none"
              />

              <select
                className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-600 outline-none"
              >
                <option>Select Enquiry Category</option>
                <option>General Enquiry</option>
                <option>Member Registration</option>
                <option>Health Wallet</option>
                <option>Hospital Verification</option>
                <option>Telecom Contributions</option>
                <option>Bank Integration</option>
                <option>Technical Support</option>
                <option>Complaint</option>
                <option>Partnership</option>
              </select>

              <input
                type="text"
                placeholder="Subject *"
                className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-600 outline-none"
              />

              <textarea
                rows={6}
                placeholder="Describe your enquiry..."
                className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-600 outline-none"
              />

              <button
                type="submit"
                className="w-full bg-green-700 hover:bg-green-800 text-white py-4 rounded-lg font-semibold transition duration-300"
              >
                Submit Enquiry
              </button>

            </form>

          </div>

        </div>

      </div>

    </section>
  );
}
