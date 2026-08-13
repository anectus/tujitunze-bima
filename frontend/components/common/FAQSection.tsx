import FAQAccordion, { FAQItem } from "./FAQAccordion";

interface FAQSectionProps {
  title: string;
  description?: string;
  items: FAQItem[];
}

export default function FAQSection({ title, description, items }: FAQSectionProps) {

  return (

    <section className="bg-gray-50 py-20 px-6">

      <div className="max-w-3xl mx-auto">

        <div className="text-center max-w-2xl mx-auto">

          <h2 className="text-4xl font-bold text-gray-900">
            {title}
          </h2>

          {description && (
            <p className="mt-4 text-gray-600 text-lg">
              {description}
            </p>
          )}

        </div>

        <div className="mt-12">
          <FAQAccordion items={items} />
        </div>

      </div>

    </section>

  );
}
