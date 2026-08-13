import Header from "@/components/common/Header";
import Hero from "@/components/home/Hero";
import Services from "@/components/home/Services";
import FAQSection from "@/components/common/FAQSection";
import Footer from "@/components/common/Footer";
import { homeFaqs } from "@/constants/faqs";


export default function Home(){

  return(
    <>
      <Header />

      <Hero />

      <Services />

      <FAQSection
        title="Frequently Asked Questions"
        description="Answers to common questions about saving, contributing, and using Tujitunze."
        items={homeFaqs}
      />

      <Footer />
    </>
  );

}
