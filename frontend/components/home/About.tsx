export default function About() {
  return (
    <section className="bg-white pt-36 pb-20 px-12">
      <div className="max-w-7xl mx-auto px-6">

        {/* Hero */}
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900">
            About Tujitunze
          </h1>

          <p className="mt-6 text-lg leading-8 text-gray-600">
            Health Savings and Insurance Management System (Tujitunze) is
            an integrated digital platform that enables individuals to
            save money for healthcare services while securely connecting
            members, healthcare providers, banks, and telecommunication
            operators into one trusted ecosystem.
          </p>
        </div>

        {/* What is Tujitunze */}
        <div className="mt-20 bg-white rounded-2xl shadow-lg p-10">
          <h2 className="text-3xl font-bold text-blue-700">
            What is Tujitunze?
          </h2>

          <p className="mt-6 text-gray-600 leading-8">
            Tujitunze is designed to improve access to healthcare by providing
            a secure Health Savings Wallet where members accumulate funds
            that can later be used for medical services.

            The platform supports multiple stakeholders including
            healthcare providers, telecommunication operators,
            financial institutions, and government authorities,
            ensuring transparency, accountability, and secure
            healthcare financing.
          </p>
        </div>

        {/* Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-8 mt-12">

          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-5xl mb-5">
              🎯
            </div>

            <h2 className="text-2xl font-bold text-blue-700">
              Our Mission
            </h2>

            <p className="mt-5 text-gray-600 leading-8">
              To provide a secure, reliable and innovative healthcare
              savings platform that empowers individuals to access
              affordable healthcare services through digital financial
              technology.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-5xl mb-5">
              🌍
            </div>

            <h2 className="text-2xl font-bold text-blue-700">
              Our Vision
            </h2>

            <p className="mt-5 text-gray-600 leading-8">
              To become the leading digital healthcare savings and
              insurance management platform in Africa, ensuring every
              citizen has easy access to quality healthcare services.
            </p>
          </div>

        </div>

        {/* Objectives */}
        <div className="mt-16 bg-white rounded-2xl shadow-lg p-10">
          <h2 className="text-3xl font-bold text-blue-700">
            System Objectives
          </h2>

          <div className="grid md:grid-cols-2 gap-8 mt-8">

            <ul className="space-y-4 text-gray-700">
              <li>✔ Provide secure healthcare savings.</li>
              <li>✔ Support member registration using NIDA (National ID).</li>
              <li>✔ Verify active members before treatment.</li>
              <li>✔ Integrate banks for financial services.</li>
              <li>✔ Connect multiple telecommunication operators.</li>
            </ul>

            <ul className="space-y-4 text-gray-700">
              <li>✔ Improve transparency.</li>
              <li>✔ Enhance healthcare accessibility.</li>
              <li>✔ Reduce healthcare payment delays.</li>
              <li>✔ Ensure secure digital transactions.</li>
              <li>✔ Protect member information.</li>
            </ul>

          </div>
        </div>

        {/* Core Values */}
        <div className="mt-16">

          <h2 className="text-3xl font-bold text-center text-blue-700">
            Our Core Values
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">

            {/* Security */}
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="text-5xl">
                🔒
              </div>

              <h3 className="mt-4 text-xl font-bold">
                Security
              </h3>

              <p className="mt-3 text-gray-600">
                Protecting healthcare and financial information.
              </p>
            </div>

            {/* Trust */}
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="text-5xl">
                🤝
              </div>

              <h3 className="mt-4 text-xl font-bold">
                Trust
              </h3>

              <p className="mt-3 text-gray-600">
                Building confidence among all stakeholders.
              </p>
            </div>

            {/* Innovation */}
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="text-5xl">
                💡
              </div>

              <h3 className="mt-4 text-xl font-bold">
                Innovation
              </h3>

              <p className="mt-3 text-gray-600">
                Using technology to transform healthcare financing.
              </p>
            </div>

          </div>
        </div>

        {/* Closing */}
        <div className="mt-20 bg-blue-700 rounded-3xl p-12 text-center text-white">

          <h2 className="text-4xl font-bold">
            Building the Future of Digital Healthcare
          </h2>

          <p className="mt-6 text-lg leading-8 max-w-3xl mx-auto">
            Tujitunze combines secure technology, healthcare innovation,
            financial services, and telecommunication infrastructure
            to create a modern healthcare savings ecosystem that is
            accessible, transparent, and sustainable.
          </p>

        </div>

      </div>
    </section>
  );
}
