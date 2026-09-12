import ScrollHero from "@/components/ScrollHero";
import ProductStage from "@/components/ProductStage";
import Ingredients from "@/components/Ingredients";
import Faq from "@/components/Faq";
import BlogSection from "@/components/BlogSection";

export default function Home() {
  return (
    <main id="main-content">
      <ScrollHero />
      <div className="page-sections">
        <ProductStage />
        <Ingredients />
        <BlogSection />
        <Faq />
      </div>
    </main>
  );
}
