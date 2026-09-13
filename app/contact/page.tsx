import { LeadForm } from "@/components/LeadCapture";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Contact",
  description:
    "Talk to Sukoona about product enquiries, bulk enquiries or partnerships.",
  alternates: { canonical: "/contact" },
};
export default async function Contact({
  searchParams,
}: {
  searchParams: Promise<{ via?: string; pack?: string }>;
}) {
  const { via, pack } = await searchParams;
  return (
    <main id="main-content" className="contact-page">
      <div>
        <span className="eyebrow">WE’RE LISTENING</span>
        <h1>
          Let’s make
          <br />
          <em>a little connection.</em>
        </h1>
        <p>
          Curious about the jar? Looking to collaborate? Leave a few details and
          we’ll take it from here.
        </p>
        <p className="contact-aside">
          For product enquiries, partnerships
          <br />
          and everything in between.
        </p>
      </div>
      <div className="contact-card">
        <LeadForm
          source={
            ["whatsapp", "product", "journal"].includes(via || "")
              ? via
              : "enquiry"
          }
          initialPack={pack === "5" || pack === "10" ? pack : "not_sure"}
          whatsapp={via === "whatsapp"}
        />
      </div>
    </main>
  );
}
