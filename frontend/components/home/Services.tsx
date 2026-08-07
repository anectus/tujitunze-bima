import Link from "next/link";


const services = [
  {
    title: "Health Savings Wallet",
    description:
      "A secure digital wallet that stores individual healthcare savings and allows members to monitor their available health funds.",
    icon: "💳",
    link: "/wallet",
  },

  {
    title: "Telecom Contributions",
    description:
      "Enables members to contribute through mobile networks such as Vodacom, Airtel, Tigo, Halotel, and TTCL.",
    icon: "📱",
    link: "/contributions",
  },

  {
    title: "Hospital Verification",
    description:
      "Healthcare providers can verify active members before providing healthcare services.",
    icon: "🏥",
    link: "/healthcare",
  },

  {
    title: "Bank Integration",
    description:
      "Provides secure connection with bank accounts for healthcare financial transactions.",
    icon: "🏦",
    link: "/banks",
  },

  {
    title: "Member Management",
    description:
      "Manages member registration, NIDA identification, phone numbers, profiles, and account status.",
    icon: "👥",
    link: "/members",
  },

  {
    title: "Secure Healthcare Access",
    description:
      "Provides trusted access control using authentication, authorization, and member verification.",
    icon: "🔐",
    link: "/security",
  },
];


export default function Services() {

  return (

    <section className="bg-white py-20 px-12">


      <div className="max-w-7xl mx-auto px-6">


        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto">


          <h2 className="
            text-4xl
            font-bold
            text-gray-900
            mt-15
          ">
            Our Services
          </h2>


          <p className="
            mt-4
            text-gray-600
            text-lg
          ">
            HSIMS provides a complete healthcare financial
            ecosystem connecting members, telecom operators,
            banks, and healthcare providers.
          </p>


        </div>





        {/* Service Cards */}

        <div className="
          mt-12
          grid
          grid-cols-1
          md:grid-cols-2
          lg:grid-cols-3
          gap-8
        ">


          {services.map((service, index) => (

            <div
              key={index}
              className="
                group
                bg-white
                rounded-2xl
                p-8
                shadow-md
                border
                border-gray-100
                hover:shadow-xl
                hover:-translate-y-2
                transition
                duration-300
              "
            >


              {/* Icon */}

              <div className="
                w-16
                h-16
                flex
                items-center
                justify-center
                rounded-xl
                bg-green-100
                text-3xl
                mb-6
              ">

                {service.icon}

              </div>




              {/* Title */}

              <h3 className="
                text-xl
                font-bold
                text-gray-900
                group-hover:text-green-700
                transition
              ">

                {service.title}

              </h3>




              {/* Description */}

              <p className="
                mt-4
                text-gray-600
                leading-relaxed
              ">

                {service.description}

              </p>




              {/* Learn More */}

              <Link
                href={service.link}
                className="
                  inline-block
                  mt-6
                  text-green-700
                  font-semibold
                  hover:text-green-900
                "
              >

                Learn More →

              </Link>


            </div>

          ))}


        </div>


      </div>


    </section>

  );
}
