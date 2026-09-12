"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
export function getAttribution() {
  try {
    const stored = sessionStorage.getItem("sukoona-attribution");
    if (stored) return JSON.parse(stored);
    const p = new URLSearchParams(location.search),
      a = {
        source: p.get("utm_source") || "direct",
        medium: p.get("utm_medium") || "",
        campaign: p.get("utm_campaign") || "",
        referrer: document.referrer,
        landing_page: location.pathname,
      };
    sessionStorage.setItem("sukoona-attribution", JSON.stringify(a));
    return a;
  } catch {
    return {};
  }
}
export function track(event: string) {
  try {
    let session = sessionStorage.getItem("sukoona-session");
    if (!session) {
      session = crypto.randomUUID();
      sessionStorage.setItem("sukoona-session", session);
    }
    void fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: crypto.randomUUID(),
        session_id: session,
        event,
        page: location.pathname,
        attribution: getAttribution(),
        device: innerWidth < 768 ? "mobile" : "desktop",
      }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* Enquiries also work without browser storage. */
  }
}
export function LeadForm({
  source = "enquiry",
  whatsapp = false,
  manual = false,
  initialPack = "not_sure",
}: {
  source?: string;
  whatsapp?: boolean;
  manual?: boolean;
  initialPack?: string;
}) {
  const lastSubmission = useRef<{ fingerprint: string; id: string } | null>(
    null,
  );
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [done, setDone] = useState(false),
    [wa, setWa] = useState(""),
    [request, setRequest] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const fingerprint = JSON.stringify(data);
    const id =
      lastSubmission.current?.fingerprint === fingerprint
        ? lastSubmission.current.id
        : crypto.randomUUID();
    lastSubmission.current = { fingerprint, id };
    setRequest(id);
    try {
      const r = await fetch(manual ? "/api/admin/leads" : "/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          consent: data.consent === "on",
          source,
          request_id: id,
          attribution: { ...getAttribution(), page: location.pathname },
        }),
      });
      const result = await r.json();
      if (!r.ok) throw Error(result.error || "Please try again.");
      setDone(true);
      track("lead_submitted");
      if (whatsapp) {
        try {
          const s = await fetch("/api/settings").then((r) => r.json());
          if (s.whatsapp_number)
            setWa(
              "https://wa.me/" +
                s.whatsapp_number +
                "?text=" +
                encodeURIComponent(
                  "Hello Sukoona, I’m " +
                    data.name +
                    ". I have an enquiry about " +
                    data.inquiry +
                    ".",
                ),
            );
        } catch {
          /* Saved enquiry remains visible to the team. */
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  if (done)
    return (
      <div className="enquiry-success" role="status">
        <span className="eyebrow">THANK YOU</span>
        <h2>A conversation starts here.</h2>
        <p>
          Your enquiry has been saved. The Sukoona team can now follow up with
          you.
        </p>
        {wa && (
          <a
            className="button button-primary"
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track("whatsapp_click")}
          >
            Continue on WhatsApp ↗
          </a>
        )}
      </div>
    );
  return (
    <form
      className="enquiry-form"
      onSubmit={submit}
      onFocus={() => {
        if (!request) {
          setRequest(crypto.randomUUID());
          track("form_open");
        }
      }}
    >
      <div className="form-grid">
        <label>
          Your name
          <input name="name" required maxLength={120} autoComplete="name" />
        </label>
        <label>
          Phone number
          <input
            name="phone"
            type="tel"
            required
            maxLength={30}
            autoComplete="tel"
            placeholder="+91"
          />
        </label>
        <label>
          Email <small>(optional)</small>
          <input
            name="email"
            type="email"
            maxLength={254}
            autoComplete="email"
          />
        </label>
        <label>
          City <small>(optional)</small>
          <input name="city" maxLength={100} autoComplete="address-level2" />
        </label>
        <label>
          I’m interested in
          <select name="inquiry" defaultValue="product">
            <option value="product">Product enquiry</option>
            <option value="bulk">Bulk enquiry</option>
            <option value="partnership">Partnership</option>
            <option value="callback">A callback</option>
            <option value="privacy">My data / privacy</option>
          </select>
        </label>
        <label>
          Pack preference
          <select name="pack" defaultValue={initialPack}>
            <option value="not_sure">Not sure yet</option>
            <option value="5">5 gummies</option>
            <option value="10">10 gummies</option>
          </select>
        </label>
      </div>
      <label>
        Your message <small>(optional)</small>
        <textarea
          name="message"
          maxLength={2000}
          rows={3}
          placeholder="Tell us how we can help. Please don’t include medical or payment details."
        />
      </label>
      <div className="honey" aria-hidden="true">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <label className="consent">
        <input name="consent" type="checkbox" required />
        <span>
          I agree that Sukoona may contact me by phone, email or WhatsApp about
          this enquiry. <Link href="/privacy">Privacy notice</Link>
        </span>
      </label>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button className="button button-primary" disabled={busy}>
        {busy
          ? "Saving your enquiry…"
          : whatsapp
            ? "Save & continue to WhatsApp"
            : "Send enquiry"}{" "}
        <span aria-hidden="true">↗</span>
      </button>
      <p className="form-note">
        An enquiry is not an order. Product details are being finalised.
      </p>
    </form>
  );
}
export default function LeadCapture() {
  const path = usePathname();
  useEffect(() => {
    if (!path.startsWith("/admin")) track("page_view");
  }, [path]);
  if (path.startsWith("/admin") || path === "/contact") return null;
  return (
    <Link
      className="floating-enquiry"
      href="/contact?via=whatsapp"
      aria-label="Enquire with Sukoona"
    >
      Let’s talk <span aria-hidden="true">↗</span>
    </Link>
  );
}
