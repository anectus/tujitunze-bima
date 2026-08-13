import Header from "@/components/common/Header";
import Services from "@/components/home/Services";
import FAQSection from "@/components/common/FAQSection";
import Footer from "@/components/common/Footer";
import { servicesFaqs } from "@/constants/faqs";

export default function ServicesPage() {
  return (
    <>
      <Header />
      <Services />
      <FAQSection
        title="Service Questions"
        description="More detail on how each Tujitunze service works."
        items={servicesFaqs}
      />
      <Footer />
    </>
  );
}
