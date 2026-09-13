import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Privacy notice",
  alternates: { canonical: "/privacy" },
};
export default function Privacy() {
  return (
    <main id="main-content" className="privacy-page">
      <span className="eyebrow">YOUR INFORMATION</span>
      <h1>Privacy notice</h1>
      <p>Updated 12 September 2026</p>
      <h2>When you get in touch</h2>
      <p>
        We save the name, phone number, optional email and city, preferences and
        message you submit so the Sukoona team can respond to your enquiry and
        manage follow-ups. Your consent and the source of the enquiry are
        recorded with it. Please do not send medical information, card numbers
        or passwords.
      </p>
      <h2>How it is stored</h2>
      <p>
        Our website runs on Vercel and our customer and enquiry records are
        stored in Supabase. Authorised team members can access these records in
        a protected dashboard. We retain enquiries while they are needed for
        follow-up and business records; you can ask us to delete or correct
        them.
      </p>
      <h2>Website activity</h2>
      <p>
        We use a random session identifier stored in your browser’s session
        storage to count page visits, enquiry interactions and WhatsApp clicks.
        We record the page, referring website and campaign information when
        available. We do not use advertising trackers. Your IP address is used
        to generate a temporary, hashed rate-limit identifier to protect forms
        from abuse.
      </p>
      <h2>WhatsApp and your choices</h2>
      <p>
        WhatsApp opens only when you choose to continue there and is subject to
        WhatsApp’s own privacy terms. You can withdraw contact permission,
        request access, correction or deletion, or ask a privacy question
        through our <a href="/contact">contact form</a> by choosing “My data /
        privacy”. The team will verify your request before changing records.
      </p>
      <h2>Admin access</h2>
      <p>
        Admin sign-in uses an essential, secure session cookie that expires
        after 12 hours. Public visitors do not need an account.
      </p>
    </main>
  );
}
