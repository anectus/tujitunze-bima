"use client";

import { useState } from "react";

export interface FAQItem {
  question: string;
  answer: string;
}

interface FAQAccordionProps {
  items: FAQItem[];
}

export default function FAQAccordion({ items }: FAQAccordionProps) {

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (

    <div className="space-y-4">

      {items.map((item, index) => {

        const isOpen = openIndex === index;

        return (

          <div
            key={item.question}
            className="
              bg-white
              rounded-2xl
              border
              border-gray-100
              shadow-md
            "
          >

            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              aria-expanded={isOpen}
              className="
                w-full
                flex
                items-center
                justify-between
                gap-4
                text-left
                px-6
                py-5
              "
            >

              <span className="text-lg font-semibold text-gray-900">
                {item.question}
              </span>

              <span
                className={`
                  shrink-0
                  text-2xl
                  text-blue-700
                  transition-transform
                  duration-300
                  ${isOpen ? "rotate-45" : ""}
                `}
              >
                +
              </span>

            </button>

            {isOpen && (

              <p className="px-6 pb-5 text-gray-600 leading-relaxed">
                {item.answer}
              </p>

            )}

          </div>

        );

      })}

    </div>

  );
}
