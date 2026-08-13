import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import FAQAccordion from "@/components/common/FAQAccordion";
import { helpFaqCategories } from "@/constants/faqs";

export default function HelpPage() {
  return (
    <>
      <Header />

      <section className="bg-white py-20 px-6">

        <div className="max-w-3xl mx-auto">

          <div className="text-center max-w-2xl mx-auto">

            <h1 className="text-4xl font-bold text-gray-900">
              Help Center
            </h1>

            <p className="mt-4 text-gray-600 text-lg">
              Find answers to common questions about your Tujitunze
              account, organized by topic.
            </p>

          </div>

          <div className="mt-16 space-y-16">

            {helpFaqCategories.map((category) => (

              <div key={category.category}>

                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  {category.category}
                </h2>

                <FAQAccordion items={category.items} />

              </div>

            ))}

          </div>

        </div>

      </section>

      <Footer />
    </>
  );
}
